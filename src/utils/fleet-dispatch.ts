// Fleet distribution (v0.9.0): one mission fans out into a parallel
// pipeline — a ComfyUI video stem (local golden lane) plus OpenUSD stage
// renders across the tri-modal lanes. Every lane plans against the SAME
// content-hashed stage; lane dispatches spawn concurrently and the comfy
// stem runs alongside them; a parent receipt links the whole fan-out.
// Fail-closed per lane: a missing comfy env seals an honest not_configured,
// never a fake stem.
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { composeUnifiedStage, type UsdScene, type HeroRef } from './usd-compiler.js';
import { createPlan, dispatchPlan, armPlan, type DispatchPlan } from './dispatch.js';
import { runComfyGolden } from './comfy-adapter.js';
import { appendReceipt } from './receipts.js';

export interface FleetLaneResult { lane: string; ok: boolean; plan_id?: string; session?: string; note?: string }
export interface FleetResult {
  ok: boolean;
  stage_sha256?: string;
  lanes: FleetLaneResult[];
  comfy?: { ok: boolean; error_class?: string; output_sha256?: string; receipt?: string };
  parent_receipt?: string;
  note?: string;
}

const LANES = ['houdini-mcp', 'unreal-mcp', 'webcontainers'];

const lanePlan = (lane: string, stagePath: string, stageSha: string): DispatchPlan => ({
  schema_version: 'dispatch/0.1', objective: `fleet render · ${lane}`, deliverables: ['stage-render'],
  acceptance_tests: ['true'], harnesses: [lane],
  model_policy: { requested: 'local/qwen', allow_paid: false, max_spend_usd: 0 },
  copies: 1, cadence: { mode: 'parallel', depends_on: [] },
  context_manifest: [{ path: stagePath, sha256: stageSha }],
  repo_ref: 'main', workspace: { kind: 'host-ephemeral' },
  permissions: { filesystem: 'rw-ephemeral', network: false, tools: [], secrets: [] },
  limits: { cost_usd: 0, wall_ms: 60000 }, retry_limit: 1,
  approval: { required: true, mode: 'manual' }, expected_artifacts: ['render.md'],
  telemetry: { redact: true, events: true }
});

export async function runFleetMission(o: {
  scene: UsdScene; hero?: HeroRef; workflow?: string; dir?: string; comfy?: boolean;
  /** operator authority: mint an arm token per plan hash (unidirectional authority stays external) */
  armToken?: (planId: string, planHash: string) => string | null;
}): Promise<FleetResult> {
  const dir = o.dir ?? process.cwd();
  const stage = composeUnifiedStage(o.scene, o.hero ? { hero: o.hero } : undefined);
  if (!stage.ok) return { ok: false, lanes: [], note: stage.note };
  // manifest paths are repo-relative and seeded from the GOVERNING repo
  // (establishIsolation pins repoRoot to cwd) — the stage lives there even
  // when the plan store dir differs
  const stageRel = join('.timmy', 'fleet', `${o.scene.name}.usda`);
  const stageAbs = join(process.cwd(), stageRel);
  mkdirSync(dirname(stageAbs), { recursive: true });
  writeFileSync(stageAbs, stage.usda!);

  const lanes: FleetLaneResult[] = [];
  for (const lane of LANES) {
    const c = createPlan(lanePlan(lane, stageRel, stage.sha256!), dir);
    if (!c.ok) return { ok: false, stage_sha256: stage.sha256, lanes, note: c.note };
    if (o.armToken) {
      const token = o.armToken(c.id!, c.plan_hash!);
      const armed = token ? armPlan(c.id!, token, dir) : { ok: false as const, note: 'no arm token' };
      if (!armed.ok) return { ok: false, stage_sha256: stage.sha256, lanes, note: `arm failed for ${lane}: ${armed.note}` };
    }
    lanes.push({ lane, ok: true, plan_id: c.id });
  }

  // concurrent pipeline: lane dispatches spawn now (tmux sessions run in
  // parallel), the comfy stem executes alongside them
  for (const l of lanes) {
    const d = dispatchPlan(l.plan_id!, dir);
    l.ok = d.ok;
    l.session = d.session;
    if (!d.ok) l.note = d.note ?? d.blocked?.note;
  }
  let comfy: FleetResult['comfy'];
  if (o.comfy) {
    if (!o.workflow) {
      comfy = { ok: false, error_class: 'missing_source' };
    } else {
      const g = await runComfyGolden({ workflow: o.workflow, wall_ms: 300000, dir });
      comfy = { ok: g.ok, error_class: g.error_class, output_sha256: g.output_sha256, receipt: g.receipt };
    }
  }

  const lanesOk = lanes.every(l => l.ok);
  const allOk = lanesOk && (!comfy || comfy.ok);
  const parent = appendReceipt('runs', {
    kind: 'run',
    subject: `fleet mission · stage ${stage.sha256!.slice(0, 16)}… · ${LANES.length} lanes${comfy ? ' + comfy stem' : ''}`,
    policy: 'human-gated', status: allOk ? 'ok' : 'failed',
    output_sha256: stage.sha256,
    child_receipts: comfy?.receipt ? [comfy.receipt] : [],
    sources: [{ stage_sha256: stage.sha256, plan_ids: lanes.map(l => l.plan_id), lanes: lanes.map(l => l.lane), comfy_ok: comfy?.ok ?? null }],
    discrepancies: allOk ? [] : [...lanes.filter(l => !l.ok).map(l => `${l.lane}: ${l.note}`), ...(comfy && !comfy.ok ? [`comfy: ${comfy.error_class}`] : [])],
    spans: [{ name: 'multi-lane fleet fan-out (comfy stem + USD renders)', kind: 'invoke_agent' }],
    artifacts: []
  }, dir);
  return { ok: allOk, stage_sha256: stage.sha256, lanes, comfy, parent_receipt: parent.hash, note: allOk ? undefined : 'one or more fleet lanes failed closed' };
}

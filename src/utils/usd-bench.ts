// V-02 graduation benchmark (v0.8.0): the register criterion, measured —
// (1) a mission compiles a capsule per lane against the SAME stage artifact
// (one sha256 in three manifests), and (2) a replay of the USD handoff
// byte-compares. Determinism across fresh compiles is the third leg.
// Every outcome is receiptable by the caller; no lane execution is claimed.
import { writeFileSync, readFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import crypto from 'crypto';
import { composeUnifiedStage, type UsdScene, type HeroRef } from './usd-compiler.js';
import { createPlan, type DispatchPlan } from './dispatch.js';

export interface UsdBenchResult {
  ok: boolean;
  graduated: boolean;
  stage_sha256?: string;
  lanes?: string[];
  plan_ids?: string[];
  replay_byte_compare?: boolean;
  note?: string;
}

// tri-modal per the register: Houdini (hython), Unreal, browser-native preview
const LANES = ['houdini-mcp', 'unreal-mcp', 'webcontainers'];

const basePlan = (lane: string, manifest: { path: string; sha256: string }[]): DispatchPlan => ({
  schema_version: 'dispatch/0.1', objective: `V-02 bench capsule · ${lane}`, deliverables: ['stage-review'],
  acceptance_tests: ['true'], harnesses: [lane],
  model_policy: { requested: 'local/qwen', allow_paid: false, max_spend_usd: 0 },
  copies: 1, cadence: { mode: 'parallel', depends_on: [] }, context_manifest: manifest,
  repo_ref: 'main', workspace: { kind: 'host-ephemeral' },
  permissions: { filesystem: 'rw-ephemeral', network: false, tools: [], secrets: [] },
  limits: { cost_usd: 0, wall_ms: 60000 }, retry_limit: 1,
  approval: { required: true, mode: 'manual' }, expected_artifacts: ['review.md'],
  telemetry: { redact: true, events: true }
});

export function runUsdBench(): UsdBenchResult {
  const dir = mkdtempSync(join(tmpdir(), 'timmy-usd-bench-'));
  const heroBytes = Buffer.from('bench-hero-glb');
  const heroPath = join(dir, 'hero.glb');
  writeFileSync(heroPath, heroBytes);
  const hero: HeroRef = {
    source: 'neural', format: 'glb', path: heroPath,
    sha256: crypto.createHash('sha256').update(heroBytes).digest('hex'),
    size_bytes: heroBytes.length, prim_path: '/World/HeroMesh'
  };
  const scene: UsdScene = {
    schema_version: 'usd/0.1', name: 'grad-stage', meters_per_unit: 0.01, up_axis: 'Z',
    prims: [
      { id: 'base', kind: 'cube', size: [4, 4, 1], material: { diffuse: [0.2, 0.6, 0.9], roughness: 0.4 } },
      { id: 'cut', kind: 'cube', op: 'difference', children: [{ id: 'outer', kind: 'cube', size: [2, 2, 2] }, { id: 'tool', kind: 'sphere', radius: 1.2 }] }
    ]
  };
  const a = composeUnifiedStage(scene, { hero });
  const b = composeUnifiedStage(scene, { hero });
  if (!a.ok || !b.ok) return { ok: false, graduated: false, note: a.note ?? b.note };
  const deterministic = a.sha256 === b.sha256 && a.usda === b.usda;

  // handoff replay: write the stage, read it back, byte-compare
  const stagePath = join(dir, 'grad-stage.usda');
  writeFileSync(stagePath, a.usda!);
  const replay = readFileSync(stagePath, 'utf8') === a.usda;

  // tri-lane: one sha256 in three manifests
  const planIds: string[] = [];
  for (const lane of LANES) {
    const c = createPlan(basePlan(lane, [{ path: stagePath, sha256: a.sha256! }]), dir);
    if (!c.ok) return { ok: false, graduated: false, note: c.note };
    planIds.push(c.id!);
  }
  return {
    ok: true,
    graduated: deterministic && replay && planIds.length === LANES.length,
    stage_sha256: a.sha256,
    lanes: LANES,
    plan_ids: planIds,
    replay_byte_compare: replay,
    note: deterministic && replay ? undefined : 'determinism/replay criteria not met'
  };
}

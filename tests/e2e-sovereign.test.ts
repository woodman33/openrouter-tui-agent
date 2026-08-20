import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import crypto from 'crypto';
import { compileMissionMap } from '../src/utils/slate-compiler.js';
import { createPlan, armPlan, dispatchContainerized } from '../src/utils/dispatch.js';
import { issueApproval } from '../src/utils/approvals.js';
import { composeUnifiedStage, type UsdScene, type HeroRef } from '../src/utils/usd-compiler.js';
import { comfyPreflight, runComfyGolden } from '../src/utils/comfy-adapter.js';
import { armEscrow, lockEscrow, drawEscrow, judgeEscrow, settleEscrow, verifyEscrow } from '../src/utils/escrow-engine.js';
import { buildAgentPass } from '../src/utils/agent-pass.js';
import { appendReceipt, verifyChain } from '../src/utils/receipts.js';
import type { ContextCone } from '../src/utils/context-cone.js';

// End-to-end sovereign golden run (v1.0.0-rc1): slate tldraw map → context
// cone indexing → operator-armed containerized dispatch → USD stage +
// (live, honest) ComfyUI stem → escrow payout settlement. The containerized
// leg runs under DRYRUN mechanics; the comfy leg runs against the real
// server when configured and seals not_configured otherwise. No fakes.
let dir = '';
beforeAll(() => {
  process.env.TIMMY_DISPATCH_DRYRUN = '1';
  dir = mkdtempSync(join(tmpdir(), 'timmy-sovereign-'));
});
afterAll(() => {
  delete process.env.TIMMY_DISPATCH_DRYRUN;
  rmSync(dir, { recursive: true, force: true });
});

const DOC = {
  nodes: [
    { id: 'cap', kind: 'capsule', objective: 'sovereign e2e capsule' },
    { id: 'h', kind: 'harness', harness: 'openhands', workspace: 'docker' }
  ],
  edges: [{ from: 'h', to: 'cap', kind: 'harness' }]
};

const cone: ContextCone = {
  schema_version: 'cone/0.1',
  budget_tokens: 100000,
  tiers: {
    L0: [{ id: 'apex', tier: 'L0', kind: 'manifest', summary: 'apex', tokens: 100, path: 'package.json' }],
    L1: [{ id: 'skel', tier: 'L1', kind: 'skeleton', summary: 'schema', tokens: 200, path: 'schemas/dispatch.cue' }],
    L2: [{ id: 'log', tier: 'L2', kind: 'trace', summary: 'changelog', tokens: 300, path: 'CHANGELOG.md', recency: 1 }]
  }
};

describe('sovereign golden run (v1.0.0-rc1)', () => {
  it('slate → cone → armed containerized dispatch → USD+comfy → escrow settle', async () => {
    // 1 · slate mission map compiles to a CUE-valid plan
    const compiled = compileMissionMap(DOC as never);
    expect(compiled.ok).toBe(true);
    const plan = (compiled as { plans: { plan: never }[] }).plans[0].plan;

    // 2 · context cone indexes the capsule (tier-tagged manifest)
    const created = createPlan(plan as never, dir, cone);
    expect(created.ok).toBe(true);

    // 3 · operator authority arms; containerized dispatch runs (dryrun mechanics)
    const arm = armPlan(created.id!, issueApproval(created.plan_hash!).token, dir);
    expect(arm.ok).toBe(true);
    const disp = await dispatchContainerized(created.id!, dir);
    expect(disp.ok).toBe(true);
    expect(disp.container).toBe(true);

    // 4 · USD stage with hero reference, content-hashed
    const heroBytes = Buffer.from('sovereign-hero');
    const heroPath = join(dir, 'hero.glb');
    writeFileSync(heroPath, heroBytes);
    const hero: HeroRef = {
      source: 'neural', format: 'glb', path: heroPath,
      sha256: crypto.createHash('sha256').update(heroBytes).digest('hex'),
      size_bytes: heroBytes.length, prim_path: '/World/HeroMesh'
    };
    const scene: UsdScene = {
      schema_version: 'usd/0.1', name: 'sovereign', meters_per_unit: 0.01, up_axis: 'Z',
      prims: [{ id: 'base', kind: 'cube', size: [2, 2, 1], material: { roughness: 0.5 } }]
    };
    const stage = composeUnifiedStage(scene, { hero });
    expect(stage.ok).toBe(true);

    // 5 · live ComfyUI stem when configured; honest skip otherwise
    let comfyReceipt: string | undefined;
    if (comfyPreflight().ok) {
      const g = await runComfyGolden({ workflow: join(process.cwd(), 'scripts', 'comfy-golden-5s.json'), wall_ms: 300000, dir });
      if (g.ok) comfyReceipt = g.receipt;
    }

    // 6 · escrow settlement: draw, judge on a pass bundling the stage hash
    // (+ the comfy stem receipt when live), settle, refund invariant
    const esc = armEscrow({ plan_hash: created.plan_hash!, ceiling_usd: 1, qa_threshold: 0.5, dir });
    expect(esc.ok).toBe(true);
    lockEscrow(esc.escrow!.escrow_id, dir);
    drawEscrow(esc.escrow!.escrow_id, 0.25, dir);
    const parent = appendReceipt('runs', {
      kind: 'run', subject: 'sovereign e2e · pipeline parent', policy: 'human-gated', status: 'ok',
      output_sha256: stage.sha256,
      child_receipts: comfyReceipt ? [comfyReceipt] : [],
      spans: [{ name: 'slate→cone→dispatch→usd/comfy→escrow', kind: 'invoke_agent' }], artifacts: []
    }, dir).hash;
    const pass = buildAgentPass({
      parent_receipt: parent,
      bundles: [{ id: 'sovereign-stage', sha256: stage.sha256! }],
      qa_scores: [{ model: 'roboflow/detection', metric: 'mean_confidence', value: 0.9 }],
      dir
    }).pass!;
    const j = judgeEscrow(esc.escrow!.escrow_id, { pass, qa_value: 0.9, dir });
    expect(j.escrow!.state).toBe('judged');
    const s = settleEscrow(esc.escrow!.escrow_id, dir);
    expect(s.escrow!.refund_usd).toBe(0.75);
    expect(verifyEscrow(esc.escrow!.escrow_id, dir)).toEqual({ ok: true });
    expect(verifyChain('runs', dir).ok).toBe(true);
  }, 420000);
});

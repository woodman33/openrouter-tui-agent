import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { compileMissionMap, type MissionMapDoc } from '../src/utils/slate-compiler.js';
import { createPlan } from '../src/utils/dispatch.js';
import { edlToOtio } from '../src/utils/otio.js';
import { appendReceipt, verifyChain } from '../src/utils/receipts.js';
import { theatreStateFromSequence, type TheatreSequence } from '../src/utils/motion.js';
import { saveTheatreState, loadTheatreState, sampleSequence, sampleTrack, theatreCoreProject } from '../src/utils/theatre-runtime.js';
import type { Edl } from '../src/utils/edl.js';

// End-to-end mission verification (v0.7.3): multi-stage Slate Mission Map →
// CUE DispatchPlans (controller store) → OTIO timeline → native Theatre state
// in the compiled folder → signed parent/child receipt chain verifies clean.
describe('mission e2e: map → plans → OTIO → receipts', () => {
  const doc: MissionMapDoc = {
    nodes: [
      { id: 'sting', kind: 'capsule', objective: 'render the 5s sting', copies: 1 },
      { id: 'stingHarness', kind: 'harness', harness: 'hyperframes' },
      { id: 'fix', kind: 'capsule', objective: 'sandboxed patch pass' },
      { id: 'fixHarness', kind: 'harness', harness: 'openhands', workspace: 'docker' },
      { id: 'fixGate', kind: 'gate', approval: 'manual', acceptance: ['npm test'] },
      { id: 'stingOut', kind: 'artifact', path: 'package.json' },
      { id: 'stingResult', kind: 'result' }
    ],
    edges: [
      { from: 'stingHarness', to: 'sting', kind: 'harness' },
      { from: 'fixHarness', to: 'fix', kind: 'harness' },
      { from: 'fixGate', to: 'fix', kind: 'gate' },
      { from: 'stingOut', to: 'fix', kind: 'artifact' },
      { from: 'sting', to: 'fix', kind: 'depends' },
      { from: 'fix', to: 'stingResult', kind: 'result' }
    ]
  };

  it('compiles, stores, timelines, plays back and seals a clean chain', () => {
    const dir = mkdtempSync(join(tmpdir(), 'timmy-e2e-'));

    // 1. map → typed CUE plans, dependency-ordered
    const compiled = compileMissionMap(doc, { repoRoot: process.cwd() });
    expect(compiled.ok).toBe(true);
    expect(compiled.plans.map(p => p.node_id)).toEqual(['sting', 'fix']);
    expect(compiled.plans[1].plan.cadence.depends_on).toEqual(['sting']);
    expect(compiled.plans[1].plan.context_manifest[0].sha256).toMatch(/^[0-9a-f]{64}$/);

    // 2. plans enter the controller store (plan ids + immutable hashes)
    const stored = compiled.plans.map(p => createPlan(p.plan, dir));
    for (const s of stored) {
      expect(s.ok).toBe(true);
      expect(s.plan_hash).toMatch(/^[0-9a-f]{16,}$/);
    }

    // 3. the mission's media spine compiles to a sanitized multi-track OTIO
    const edl: Edl = {
      edl_version: 1, output: 'sting.mp4', timebase: 30,
      clips: [{ src: 'studio/timmy-sting-5s/index.html#t=0,5' }],
      audio_stems: [{ src: 'studio/vo.flac#t=0,5', kind: 'vo', duck_db: -12 }]
    };
    const otio = edlToOtio(edl, { env_lock_hash: 'e2e' }, { sanitize: true }) as any;
    expect(otio.global_start_time.rate).toBe(30);
    expect(otio.tracks.children.map((t: any) => t.kind)).toEqual(['Video', 'Audio']);

    // 4. native Theatre state round-trips through the compiled folder and
    //    plays back deterministically (bézier midpoint of symmetric handles)
    const seq: TheatreSequence = {
      name: 'sting-motion', duration: 5,
      tracks: [{ target: 'clip-0', prop: 'scale', keyframes: [{ t: 0, value: 1 }, { t: 2, value: 2 }] }]
    };
    saveTheatreState(dir, theatreStateFromSequence(seq));
    const state = loadTheatreState(dir);
    expect(sampleTrack(state, 'sting-motion', 'clip-0.scale', 0)).toBe(1);
    expect(sampleTrack(state, 'sting-motion', 'clip-0.scale', 2)).toBe(2);
    expect(sampleSequence(state, 'sting-motion', 1)['clip-0.scale']).toBeCloseTo(1.5, 5);

    // 5. signed parent/child receipt chain verifies clean
    const child = appendReceipt('runs', {
      kind: 'run', subject: 'mission e2e · sting render', policy: 'human-gated', status: 'ok',
      plan_hash: stored[0].plan_hash!, spans: [{ name: 'hyperframes render', kind: 'invoke_agent' }], artifacts: []
    }, dir);
    const parent = appendReceipt('runs', {
      kind: 'verify', subject: 'mission e2e · acceptance', policy: 'human-gated', status: 'ok',
      plan_hash: stored[1].plan_hash!, output_sha256: compiled.plans[1].plan.context_manifest[0].sha256,
      child_receipts: [child.hash], spans: [{ name: 'acceptance', kind: 'execute_tool' }], artifacts: []
    }, dir);
    const v = verifyChain('runs', dir);
    expect(v.ok).toBe(true);
    expect(v.count).toBe(2);
    expect(parent.hash).toMatch(/^sha256_/);
  });

  it('studio playback path: @theatre/core ingests the identical state', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'timmy-theatre-'));
    const seq: TheatreSequence = {
      name: 'ugc-motion', duration: 3,
      tracks: [{ target: 'card', prop: 'y', keyframes: [{ t: 0, value: 0 }, { t: 3, value: -40, handles: [0.16, 1, 0.3, 1] as [number, number, number, number] }] }]
    };
    saveTheatreState(dir, theatreStateFromSequence(seq));
    const state = loadTheatreState(dir);
    const proj = await theatreCoreProject(state, 'mission-e2e-studio') as { sheet?: (id: string) => unknown };
    expect(proj).toBeTruthy();
    expect(typeof proj.sheet).toBe('function');
  });
});

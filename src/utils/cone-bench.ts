// V-01 graduation benchmark (v0.7.7): cone-budgeted capsule vs unconstrained
// raw-repo dump, plus a mantle-ablation delta. Accuracy proxy = retrieval
// recall of mission-critical facts inside the capsule (honest, deterministic
// — no LLM accuracy claims); tokens = bytes/4 estimator. Graduates only when
// the cone loses no facts, spends strictly fewer tokens, and the ablation
// shows a measurable delta. Every outcome is receiptable by the caller.
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { coneToContextManifest, createPlan, type DispatchPlan } from './dispatch.js';
import type { ContextCone, ConeEntry } from './context-cone.js';

export const estTokens = (abs: string): number => Math.ceil(readFileSync(abs).length / 4);

// mission facts: one marker per tier the capsule must carry
const FACTS = [
  { tier: 'L0' as const, file: 'package.json', marker: '"name": "timmy-tui"', recency: 0 },
  { tier: 'L1' as const, file: 'schemas/dispatch.cue', marker: 'context_cone?:', recency: 0 },
  { tier: 'L2' as const, file: 'CHANGELOG.md', marker: 'V-04 GRADUATION', recency: 100 }
];
// unconstrained raw dump adds heavy filler the cone should forage past
const RAW_EXTRA = ['src/utils/dispatch.ts', 'src/utils/logserver.ts'];

export interface ConeBenchResult {
  ok: boolean;
  graduated: boolean;
  tokens_raw: number;
  tokens_cone: number;
  tokens_ablation: number;
  recall_raw: number;
  recall_cone: number;
  recall_ablation: number;
  tier_tokens: { L0: number; L1: number; L2: number };
  reduction_pct: number;
  plan_id?: string;
  note?: string;
}

const entryFor = (f: (typeof FACTS)[number]): Omit<ConeEntry, 'tokens'> => ({
  id: f.file.replace(/[^a-z0-9]+/gi, '-'), tier: f.tier,
  kind: f.tier === 'L0' ? 'manifest' : f.tier === 'L1' ? 'skeleton' : 'trace',
  summary: `${f.tier} ${f.file}`, path: f.file, recency: f.recency
});

function coneWith(tiers: { L0?: boolean; L1?: boolean; L2?: boolean }, budget: number, root: string): ContextCone {
  const t = (f: (typeof FACTS)[number]): ConeEntry => ({ ...entryFor(f), tokens: estTokens(join(root, f.file)) });
  const filler = RAW_EXTRA.map((p, i) => ({
    id: p.replace(/[^a-z0-9]+/gi, '-'), tier: 'L2' as const, kind: 'trace' as const,
    summary: `filler ${p}`, tokens: estTokens(join(root, p)), path: p, recency: 50 - i
  }));
  return {
    schema_version: 'cone/0.1',
    budget_tokens: budget,
    tiers: {
      L0: tiers.L0 === false ? [] : [t(FACTS[0])],
      L1: tiers.L1 === false ? [] : [t(FACTS[1])],
      L2: (tiers.L2 === false ? [] : [t(FACTS[2])]).concat(filler)
    }
  };
}

const recallOf = (manifest: { path: string }[], root: string): number => {
  const have = new Set(manifest.map(m => m.path));
  const hit = FACTS.filter(f => have.has(f.file) && readFileSync(join(root, f.file), 'utf8').includes(f.marker));
  return hit.length / FACTS.length;
};

export function runConeBench(opts?: { repoRoot?: string }): ConeBenchResult {
  const root = resolve(opts?.repoRoot ?? process.cwd());
  const factTokens = FACTS.reduce((a, f) => a + estTokens(join(root, f.file)), 0);
  const tokensRaw = factTokens + RAW_EXTRA.reduce((a, p) => a + estTokens(join(root, p)), 0);

  const cone = coneWith({}, factTokens, root);
  const cc = coneToContextManifest(cone, { repoRoot: root });
  if (!cc.ok) return { ok: false, graduated: false, tokens_raw: tokensRaw, tokens_cone: 0, tokens_ablation: 0, recall_raw: 1, recall_cone: 0, recall_ablation: 0, tier_tokens: { L0: 0, L1: 0, L2: 0 }, reduction_pct: 0, note: cc.note ?? cc.error_class };

  const abl = coneToContextManifest(coneWith({ L1: false }, factTokens, root), { repoRoot: root });
  const tokensAbl = abl.ok ? abl.selection!.tokens : 0;
  const recallAbl = abl.ok ? recallOf(abl.manifest!, root) : 0;

  const recallRaw = recallOf([...FACTS.map(f => ({ path: f.file })), ...RAW_EXTRA.map(p => ({ path: p }))], root);
  const recallCone = recallOf(cc.manifest!, root);
  const tierTokens = { L0: 0, L1: 0, L2: 0 };
  for (const e of cc.selection!.entries) tierTokens[e.tier] += e.tokens;

  // the dispatched plan must carry the tier-tagged manifest (register law)
  const plan: DispatchPlan = {
    schema_version: 'dispatch/0.1', objective: 'V-01 bench capsule', deliverables: ['report'],
    acceptance_tests: ['true'], harnesses: ['pi'],
    model_policy: { requested: 'local/qwen', allow_paid: false, max_spend_usd: 0 },
    copies: 1, cadence: { mode: 'parallel', depends_on: [] }, context_manifest: [],
    repo_ref: 'main', workspace: { kind: 'host-ephemeral' },
    permissions: { filesystem: 'rw-ephemeral', network: false, tools: [], secrets: [] },
    limits: { cost_usd: 0, wall_ms: 60000 }, retry_limit: 1,
    approval: { required: true, mode: 'manual' }, expected_artifacts: ['report.md'],
    telemetry: { redact: true, events: true }
  };
  const cp = createPlan(plan, mkdtempSync(join(tmpdir(), 'timmy-bench-')), cone);

  const graduated = cp.ok && recallCone === recallRaw && cc.selection!.tokens < tokensRaw && recallAbl < recallCone;
  return {
    ok: true,
    graduated,
    tokens_raw: tokensRaw,
    tokens_cone: cc.selection!.tokens,
    tokens_ablation: tokensAbl,
    recall_raw: recallRaw,
    recall_cone: recallCone,
    recall_ablation: recallAbl,
    tier_tokens: tierTokens,
    reduction_pct: Math.round(100 * (tokensRaw - cc.selection!.tokens) / tokensRaw),
    plan_id: cp.id,
    note: graduated ? undefined : (cp.ok ? 'graduation criteria not met' : cp.note)
  };
}

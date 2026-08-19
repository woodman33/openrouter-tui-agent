// Context Cone (V-01 rung 1, v0.7.5): 3-tier context indexing for information
// foraging under strict token budgeting. L0 = apex manifest (hot tip; always
// inlined, non-negotiable), L1 = structural skeleton (warm), L2 = deep
// diffs/traces (cold; selected under budget, recency-ordered). Targets are
// not receipts: the cone indexes; materialized content still rides sha256-
// pinned manifests when it enters a plan.
import { spawnSync } from 'child_process';
import { writeFileSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';

export type ConeTier = 'L0' | 'L1' | 'L2';

export interface ConeEntry {
  id: string;
  tier: ConeTier;
  kind: 'manifest' | 'skeleton' | 'trace' | 'diff' | 'receipt' | 'doc';
  summary: string;
  tokens: number;
  path?: string;
  sha256?: string;
  recency?: number;
}

export interface ContextCone {
  schema_version: 'cone/0.1';
  budget_tokens: number;
  tiers: { L0: ConeEntry[]; L1: ConeEntry[]; L2: ConeEntry[] };
}

export interface ConeSelection {
  ok: boolean;
  error_class?: 'budget_exceeded';
  note?: string;
  entries: ConeEntry[];
  tokens: number;
}

export function validateConeCue(cone: unknown, dir?: string): { ok: boolean; note?: string; error_class?: string } {
  const cueBin = spawnSync('cue', ['version'], { encoding: 'utf8' });
  if (cueBin.status !== 0) return { ok: false, error_class: 'not_configured', note: 'cue binary missing (brew install cue)' };
  const schema = fileURLToPath(new URL('../../schemas/context-cone.cue', import.meta.url));
  const tmp = join(mkdtempSync(join(tmpdir(), 'timmy-cue-')), 'cone.json');
  writeFileSync(tmp, JSON.stringify(cone));
  const r = spawnSync('cue', ['vet', '-d', '#Cone', schema, tmp], { encoding: 'utf8' });
  if (r.status !== 0) return { ok: false, error_class: 'schema', note: (r.stderr || r.stdout || 'cue vet failed').slice(0, 400) };
  return { ok: true };
}

export function buildCone(input: { budget_tokens: number; entries: ConeEntry[] }): { ok: boolean; cone?: ContextCone; errors: string[] } {
  const errors: string[] = [];
  if (!(input.budget_tokens > 0)) errors.push('budget_tokens must be > 0');
  const tiers: ContextCone['tiers'] = { L0: [], L1: [], L2: [] };
  for (const e of input.entries) {
    if (!tiers[e.tier]) { errors.push(`entry ${e.id}: bad tier ${e.tier}`); continue; }
    tiers[e.tier].push(e);
  }
  if (tiers.L0.length === 0) errors.push('cone requires an L0 apex manifest');
  const cone: ContextCone = { schema_version: 'cone/0.1', budget_tokens: input.budget_tokens, tiers };
  if (errors.length) return { ok: false, errors };
  const v = validateConeCue(cone);
  if (!v.ok) return { ok: false, errors: [`cue: ${v.note}`] };
  return { ok: true, cone, errors: [] };
}

// Selection policy: L0 always (apex is non-negotiable — if it alone exceeds
// the budget the selection FAILS CLOSED rather than trimming the manifest),
// then L1 in declared order, then L2 recency-desc, each while room remains.
export function selectFromCone(cone: ContextCone, budgetOverride?: number): ConeSelection {
  const budget = budgetOverride ?? cone.budget_tokens;
  const picked: ConeEntry[] = [];
  let tokens = 0;
  for (const e of cone.tiers.L0) {
    if (tokens + e.tokens > budget) {
      return { ok: false, error_class: 'budget_exceeded', note: `L0 apex alone exceeds budget (${tokens + e.tokens} > ${budget})`, entries: [], tokens: 0 };
    }
    picked.push(e); tokens += e.tokens;
  }
  for (const e of cone.tiers.L1) {
    if (tokens + e.tokens > budget) break;
    picked.push(e); tokens += e.tokens;
  }
  const l2 = [...cone.tiers.L2].sort((a, b) => (b.recency ?? 0) - (a.recency ?? 0));
  for (const e of l2) {
    if (tokens + e.tokens > budget) continue; // skip oversized, keep foraging
    picked.push(e); tokens += e.tokens;
  }
  return { ok: true, entries: picked, tokens };
}

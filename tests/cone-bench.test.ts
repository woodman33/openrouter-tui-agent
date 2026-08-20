import { describe, it, expect } from 'vitest';
import { runConeBench } from '../src/utils/cone-bench.js';

describe('V-01 graduation benchmark (cone vs raw-repo + ablation)', () => {
  it('cone preserves fact recall at strictly lower token cost; ablation shows the delta', () => {
    const r = runConeBench({ repoRoot: process.cwd() });
    expect(r.ok).toBe(true);
    expect(r.recall_raw).toBe(1);
    expect(r.recall_cone).toBe(1);
    expect(r.recall_cone).toBe(r.recall_raw);
    expect(r.tokens_cone).toBeLessThan(r.tokens_raw);
    expect(r.recall_ablation).toBeLessThan(r.recall_cone);
    expect(r.reduction_pct).toBeGreaterThan(0);
    expect(r.plan_id).toBeTruthy(); // dispatched plan carries the tier-tagged manifest
    expect(r.tier_tokens.L0).toBeGreaterThan(0);
    expect(r.tier_tokens.L1).toBeGreaterThan(0);
    expect(r.tier_tokens.L2).toBeGreaterThan(0);
  });
});

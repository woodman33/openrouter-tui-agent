import { describe, it, expect } from 'vitest';
import { buildCone, selectFromCone, validateConeCue, type ConeEntry, type ContextCone } from '../src/utils/context-cone.js';

const entry = (over: Partial<ConeEntry>): ConeEntry => ({
  id: over.id ?? 'e', tier: over.tier ?? 'L0', kind: over.kind ?? 'manifest',
  summary: over.summary ?? 's', tokens: over.tokens ?? 10, ...over
});

describe('context cone (V-01 rung 1)', () => {
  it('builds a CUE-valid 3-tier cone', () => {
    const r = buildCone({
      budget_tokens: 1000,
      entries: [
        entry({ id: 'apex', tier: 'L0', kind: 'manifest', tokens: 100 }),
        entry({ id: 'skel', tier: 'L1', kind: 'skeleton', tokens: 200 }),
        entry({ id: 'trc', tier: 'L2', kind: 'trace', tokens: 300, recency: 1 })
      ]
    });
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.cone?.tiers.L0).toHaveLength(1);
  });

  it('requires an L0 apex manifest', () => {
    const r = buildCone({ budget_tokens: 100, entries: [entry({ id: 'x', tier: 'L1', kind: 'skeleton' })] });
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toContain('L0 apex');
  });

  it('CUE rejects tier-field/bucket mismatch and non-positive tokens', () => {
    const badTier: ContextCone = {
      schema_version: 'cone/0.1', budget_tokens: 100,
      tiers: { L0: [{ id: 'x', tier: 'L1', kind: 'manifest', summary: 's', tokens: 10 } as ConeEntry], L1: [], L2: [] }
    };
    expect(validateConeCue(badTier).ok).toBe(false);
    const badTokens: ContextCone = {
      schema_version: 'cone/0.1', budget_tokens: 100,
      tiers: { L0: [{ id: 'x', tier: 'L0', kind: 'manifest', summary: 's', tokens: 0 } as ConeEntry], L1: [], L2: [] }
    };
    expect(validateConeCue(badTokens).ok).toBe(false);
  });

  it('selection: L0 non-negotiable, L1 in order, L2 recency-desc under budget', () => {
    const r = buildCone({
      budget_tokens: 500,
      entries: [
        entry({ id: 'apex', tier: 'L0', tokens: 100 }),
        entry({ id: 'l1a', tier: 'L1', tokens: 150 }),
        entry({ id: 'l1b', tier: 'L1', tokens: 150 }),
        entry({ id: 'old', tier: 'L2', kind: 'diff', tokens: 100, recency: 1 }),
        entry({ id: 'new', tier: 'L2', kind: 'diff', tokens: 100, recency: 9 })
      ]
    });
    expect(r.ok).toBe(true);
    const sel = selectFromCone(r.cone!);
    expect(sel.ok).toBe(true);
    // 100 (L0) + 150 + 150 (L1) = 400; newest L2 fits (500), oldest doesn't
    expect(sel.entries.map(e => e.id)).toEqual(['apex', 'l1a', 'l1b', 'new']);
    expect(sel.tokens).toBe(500);
  });

  it('fails closed when the apex alone exceeds the budget', () => {
    const r = buildCone({ budget_tokens: 50, entries: [entry({ id: 'apex', tier: 'L0', tokens: 100 })] });
    expect(r.ok).toBe(true); // structure is fine; selection is the budget gate
    const sel = selectFromCone(r.cone!);
    expect(sel.ok).toBe(false);
    expect(sel.error_class).toBe('budget_exceeded');
    expect(sel.entries).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { appendCustodyReceipt, genesisOf, verifyCustodyChain, type CustodyReceipt } from '../src/lib/chain.js';

describe('custody receipt chain', () => {
  it('links prev → this from a per-subject genesis and verifies', async () => {
    const chain: CustodyReceipt[] = [];
    const a = await appendCustodyReceipt(chain, { kind: 'custody.commit', subject: 'VC0007', data: { contents_hash: '9f3a7c1e' } });
    const b = await appendCustodyReceipt(chain, { kind: 'custody.seal', subject: 'VC0007', data: { tag_uid: '04de5f1eacc040', counter: 1 } });
    expect(a.prev_hash).toBe(await genesisOf('VC0007'));
    expect(b.prev_hash).toBe(a.hash);
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
    const v = await verifyCustodyChain(chain);
    expect(v).toEqual({ ok: true, count: 2, head: b.hash });
  });

  it('detects a rewritten receipt', async () => {
    const chain: CustodyReceipt[] = [];
    await appendCustodyReceipt(chain, { kind: 'custody.commit', subject: 'VC0001', data: { n: 1 } });
    await appendCustodyReceipt(chain, { kind: 'custody.sell', subject: 'VC0001', data: { price: 1 } });
    (chain[0].data as { n: number }).n = 2;
    const v = await verifyCustodyChain(chain);
    expect(v.ok).toBe(false);
    expect(v.brokenAt).toBe(0);
  });

  it('refuses to mix subjects in one chain', async () => {
    const chain: CustodyReceipt[] = [];
    await appendCustodyReceipt(chain, { kind: 'custody.commit', subject: 'VC0001', data: {} });
    await expect(appendCustodyReceipt(chain, { kind: 'custody.commit', subject: 'VC0002', data: {} })).rejects.toThrow(/subject mismatch/);
  });

  it('is deterministic for fixed id + ts', async () => {
    const mk = async () => {
      const c: CustodyReceipt[] = [];
      return appendCustodyReceipt(c, { id: 'vc_fixed', ts: '2026-09-12T09:02:11-07:00', kind: 'custody.commit', subject: 'VC0007', data: { a: 1, b: [1, 2] } });
    };
    expect((await mk()).hash).toBe((await mk()).hash);
  });
});

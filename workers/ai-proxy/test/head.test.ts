import { describe, expect, it } from 'vitest';
import { appendEdgeReceipt, type EdgeReceipt } from '../src/chain.js';
import { computeDailyHead, readLatestHead, writeDailyHead, type KVLike } from '../src/head.js';

function fakeKv(seed: Record<string, string> = {}): KVLike & { store: Map<string, string> } {
  const store = new Map(Object.entries(seed));
  return {
    store,
    async get(k) {
      return store.get(k) ?? null;
    },
    async put(k, v) {
      store.set(k, v);
    },
    async list({ prefix }) {
      return { keys: [...store.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    }
  };
}

async function chainOf(subject: string, n: number): Promise<EdgeReceipt[]> {
  const c: EdgeReceipt[] = [];
  for (let i = 0; i < n; i++) await appendEdgeReceipt(c, { kind: 'custody.tap', subject, data: { i } });
  return c;
}

describe('daily head', () => {
  it('walks every chain, verifies, and seals one combined sha256 per day', async () => {
    const kv = fakeKv({
      'chain:VC0007': JSON.stringify(await chainOf('VC0007', 3)),
      'chain:VC0001': JSON.stringify(await chainOf('VC0001', 1)),
      'chain:code': JSON.stringify(await chainOf('run_1', 2)),
      'ctr:04de5f1eacc040': '61'
    });
    const head = await computeDailyHead(kv, new Date('2026-09-06T09:05:00Z'));
    expect(head.date).toBe('2026-09-06');
    expect(head.subjects).toBe(3);
    expect(head.receipts).toBe(6);
    expect(head.heads.map((h) => h.subject)).toEqual(['VC0001', 'VC0007', 'code']);
    expect(head.heads.every((h) => h.ok)).toBe(true);
    expect(head.prev_combined_sha256).toBeNull();
    expect(head.combined_sha256).toMatch(/^[0-9a-f]{64}$/);
    await writeDailyHead(kv, head);
    expect(kv.store.has('head:2026-09-06')).toBe(true);
    expect((await readLatestHead(kv))?.combined_sha256).toBe(head.combined_sha256);
  });

  it("links tomorrow's head to today's, and re-running today does not self-link", async () => {
    const kv = fakeKv({ 'chain:VC0007': JSON.stringify(await chainOf('VC0007', 1)) });
    const day1 = await computeDailyHead(kv, new Date('2026-09-06T09:05:00Z'));
    await writeDailyHead(kv, day1);
    const day1again = await computeDailyHead(kv, new Date('2026-09-06T12:00:00Z'));
    expect(day1again.prev_combined_sha256).toBeNull();
    const day2 = await computeDailyHead(kv, new Date('2026-09-07T09:05:00Z'));
    expect(day2.prev_combined_sha256).toBe(day1.combined_sha256);
  });

  it('flags a tampered chain but still publishes its head', async () => {
    const c = await chainOf('VC0003', 2);
    (c[0].data as { i: number }).i = 99;
    const kv = fakeKv({ 'chain:VC0003': JSON.stringify(c) });
    const head = await computeDailyHead(kv);
    expect(head.heads[0]).toMatchObject({ subject: 'VC0003', ok: false, count: 2 });
  });
});

// Daily chain head. The cron walks every chain in CUSTODY_KV (custody units
// under chain:<serial>, the Code Mode chain under chain:code), records each
// head, and seals one combined sha256 for the day: head:<YYYY-MM-DD> and
// head:latest. That head is public (GET /head here, GET /api/head on the
// custody site) and is what the local anchor job seals into the root chain —
// the edge never writes to the root chain; the root chain pulls the head.
import { sha256Hex, verifyEdgeChain, type EdgeReceipt } from './chain.js';

export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  list(opts: { prefix: string; cursor?: string }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
}

export interface SubjectHead {
  subject: string;
  count: number;
  head: string;
  ok: boolean;
}

export interface DailyHead {
  v: 1;
  date: string;
  generated_at: string;
  subjects: number;
  receipts: number;
  heads: SubjectHead[];
  prev_combined_sha256: string | null;
  combined_sha256: string;
}

export const dateKey = (d: Date = new Date()): string => d.toISOString().slice(0, 10);

export async function listChainKeys(kv: KVLike): Promise<string[]> {
  const out: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: 'chain:', cursor });
    for (const k of page.keys) out.push(k.name);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return out.sort();
}

export async function computeDailyHead(kv: KVLike, now: Date = new Date()): Promise<DailyHead> {
  const keys = await listChainKeys(kv);
  const heads: SubjectHead[] = [];
  let receipts = 0;
  for (const key of keys) {
    const raw = await kv.get(key);
    if (!raw) continue;
    let chain: EdgeReceipt[];
    try {
      chain = JSON.parse(raw) as EdgeReceipt[];
    } catch {
      continue;
    }
    if (!chain.length) continue;
    const v = await verifyEdgeChain(chain);
    heads.push({ subject: key.slice('chain:'.length), count: chain.length, head: chain[chain.length - 1].hash, ok: v.ok });
    receipts += chain.length;
  }
  const date = dateKey(now);
  const prevRaw = await kv.get('head:latest');
  let prev: DailyHead | null = null;
  try {
    prev = prevRaw ? (JSON.parse(prevRaw) as DailyHead) : null;
  } catch {
    prev = null;
  }
  const prev_combined_sha256 = prev && prev.date !== date ? prev.combined_sha256 : (prev?.prev_combined_sha256 ?? null);
  const body = { v: 1 as const, date, subjects: heads.length, receipts, heads, prev_combined_sha256 };
  const combined_sha256 = await sha256Hex(JSON.stringify(body));
  return { ...body, generated_at: now.toISOString(), combined_sha256 };
}

export async function writeDailyHead(kv: KVLike, head: DailyHead): Promise<void> {
  const json = JSON.stringify(head);
  await kv.put(`head:${head.date}`, json);
  await kv.put('head:latest', json);
}

export async function readLatestHead(kv: KVLike): Promise<DailyHead | null> {
  const raw = await kv.get('head:latest');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DailyHead;
  } catch {
    return null;
  }
}

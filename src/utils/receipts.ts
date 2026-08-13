import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import crypto from 'crypto';

// TIMMY receipt chain v1 — the spine. Every effect appends a hash-chained,
// tamper-evident receipt: plan → policy → effect → artifacts → cost → prev_hash.
// One schema, append-only, queryable from week 1. cosign checkpoints come
// after the chain is queried weekly (chain first, crypto after).

export interface Receipt {
  v: 1;
  id: string;
  stream: string;
  ts: string;
  kind: string; // generation | refinement | run | export
  subject: string;
  prompt_hash?: string;
  artifacts?: string[];
  cost_usd?: number;
  policy: string; // human-gated | auto
  // receipt v2 (research rulings): OTel-style span tree + PDP decisions ride
  // inside the sealed body, so the receipt is evidence structure, not just
  // integrity.
  spans?: { name: string; kind: 'root' | 'chat' | 'execute_tool' | 'deny' }[];
  decisions?: { decision: string; effect: string; tier: string; reason: string }[];
  prev_hash: string;
  hash: string;
}

export type ReceiptInput = Omit<Receipt, 'v' | 'id' | 'ts' | 'stream' | 'prev_hash' | 'hash'>;

const canon = (o: Record<string, unknown>): string =>
  JSON.stringify(
    Object.keys(o)
      .sort()
      .reduce((acc, k) => ({ ...acc, [k]: (o as Record<string, unknown>)[k] }), {})
  );

const hashOf = (o: Record<string, unknown>): string =>
  'sha256_' + crypto.createHash('sha256').update(canon(o)).digest('hex');

export function receiptsDir(dir: string = process.cwd()): string {
  return join(dir, '.timmy', 'receipts');
}

export function receiptsPath(stream: string, dir?: string): string {
  return join(receiptsDir(dir), `${stream}.jsonl`);
}

export function readChain(stream: string, dir?: string): Receipt[] {
  const p = receiptsPath(stream, dir);
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(l => {
      try {
        return JSON.parse(l) as Receipt;
      } catch {
        return null;
      }
    })
    .filter((r): r is Receipt => Boolean(r && typeof r.hash === 'string'));
}

export function lastReceipt(stream: string, dir?: string): Receipt | null {
  const chain = readChain(stream, dir);
  return chain[chain.length - 1] || null;
}

export function appendReceipt(stream: string, input: ReceiptInput, dir?: string): Receipt {
  const prev = lastReceipt(stream, dir);
  const base = {
    v: 1 as const,
    id: `rc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    stream,
    ts: new Date().toISOString(),
    ...input,
    prev_hash: prev?.hash ?? 'genesis'
  };
  const rec: Receipt = { ...base, hash: hashOf({ ...base, hash: '' }) };
  const p = receiptsPath(stream, dir);
  mkdirSync(dirname(p), { recursive: true });
  appendFileSync(p, JSON.stringify(rec) + '\n', 'utf8');
  return rec;
}

export interface VerifyResult {
  ok: boolean;
  count: number;
  brokenAt?: string;
  reason?: string;
}

export function verifyChain(stream: string, dir?: string): VerifyResult {
  const chain = readChain(stream, dir);
  let prev = 'genesis';
  for (const r of chain) {
    if (r.prev_hash !== prev) {
      return { ok: false, count: chain.length, brokenAt: r.id, reason: `prev_hash mismatch (chain link broken before ${r.id})` };
    }
    const { hash, ...rest } = r;
    if (hashOf({ ...rest, hash: '' }) !== hash) {
      return { ok: false, count: chain.length, brokenAt: r.id, reason: `body hash mismatch (receipt ${r.id} was tampered with)` };
    }
    prev = r.hash;
  }
  return { ok: true, count: chain.length };
}

// Operator approvals: single-use, expiring, bound to an exact plan hash.
// A calling model cannot self-approve with a bare boolean — a token must be
// minted at the operator surface (`timmy approve <planHash>`, or the TUI
// approval key) and is consumed on first use.
import { createHash, randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export interface Approval {
  token: string;
  planHash: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
  usedAt?: number;
}

const storePath = (): string => join(process.cwd(), '.timmy', 'approvals.json');
const read = (): Approval[] => {
  try { return existsSync(storePath()) ? (JSON.parse(readFileSync(storePath(), 'utf8')) as Approval[]) : []; }
  catch { return []; }
};
const write = (list: Approval[]) => {
  mkdirSync(dirname(storePath()), { recursive: true });
  writeFileSync(storePath(), JSON.stringify(list, null, 2));
};

// Stable stringify so the same plan always hashes the same.
const stable = (v: unknown): string => {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v as Record<string, unknown>).sort()
      .map(k => JSON.stringify(k) + ':' + stable((v as Record<string, unknown>)[k])).join(',') + '}';
  }
  return JSON.stringify(v) ?? 'null';
};

export const planHashOf = (plan: unknown): string =>
  createHash('sha256').update(stable(plan)).digest('hex').slice(0, 32);

export const APPROVAL_TTL_MS = 5 * 60 * 1000;

export function issueApproval(planHash: string, ttlMs: number = APPROVAL_TTL_MS): Approval {
  const a: Approval = {
    token: randomBytes(16).toString('hex'),
    planHash,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
    used: false
  };
  const list = read().filter(x => x.expiresAt > Date.now() || x.used);
  list.push(a);
  write(list);
  return a;
}

export function consumeApproval(token: string, planHash: string): { ok: boolean; note?: string } {
  const list = read();
  const a = list.find(x => x.token === token);
  if (!a) return { ok: false, note: 'unknown approval token' };
  if (a.used) return { ok: false, note: 'approval already used (single-use; replay denied)' };
  if (Date.now() > a.expiresAt) return { ok: false, note: 'approval expired' };
  if (a.planHash !== planHash) return { ok: false, note: 'approval bound to a different plan hash' };
  a.used = true;
  a.usedAt = Date.now();
  write(list);
  return { ok: true };
}

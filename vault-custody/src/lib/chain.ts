// Edge receipt chain for custody events. Mirrors the canon + sha256 shape of
// timmy-tui/src/utils/receipts.ts (sorted-key JSON, hash over the body with
// hash:'' ) so a custody receipt can be re-hashed by the same verifier. No
// ed25519 at the edge yet: these are T0-grade until the head is anchored by
// the root chain (custody.head receipts sealed from the repo root).

export interface CustodyReceipt {
  v: 1;
  id: string;
  ts: string;
  /** custody.commit | custody.seal | custody.sell | custody.claim | custody.open | custody.pack | custody.attach | custody.transfer | custody.verify | custody.tap | chain.head */
  kind: string;
  /** The unit this receipt belongs to: a box serial, a card id, a series id. */
  subject: string;
  data: Record<string, unknown>;
  prev_hash: string;
  hash: string;
}

export type CustodyReceiptInput = Pick<CustodyReceipt, 'kind' | 'subject' | 'data'> & { ts?: string; id?: string };

const canon = (o: Record<string, unknown>): string =>
  JSON.stringify(
    Object.keys(o)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = o[k];
        return acc;
      }, {})
  );

export async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const d = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes as BufferSource));
  let s = '';
  for (const x of d) s += x.toString(16).padStart(2, '0');
  return s;
}

export async function hashOf(o: Record<string, unknown>): Promise<string> {
  return sha256Hex(canon(o));
}

export async function genesisOf(subject: string): Promise<string> {
  return sha256Hex(`vault-custody:genesis:${subject}`);
}

const newId = (): string => `vc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

/** Append one receipt to a chain (array in memory; the caller persists it). */
export async function appendCustodyReceipt(chain: CustodyReceipt[], input: CustodyReceiptInput): Promise<CustodyReceipt> {
  const prev = chain.length ? chain[chain.length - 1] : null;
  if (prev && prev.subject !== input.subject) {
    throw new Error(`chain subject mismatch: ${prev.subject} vs ${input.subject}`);
  }
  const base = {
    v: 1 as const,
    id: input.id ?? newId(),
    ts: input.ts ?? new Date().toISOString(),
    kind: input.kind,
    subject: input.subject,
    data: input.data,
    prev_hash: prev ? prev.hash : await genesisOf(input.subject)
  };
  const rec: CustodyReceipt = { ...base, hash: await hashOf({ ...base, hash: '' }) };
  chain.push(rec);
  return rec;
}

export interface ChainVerify {
  ok: boolean;
  count: number;
  brokenAt?: number;
  reason?: string;
  head?: string;
}

/** Walk a chain: every hash recomputes, every prev_hash links. */
export async function verifyCustodyChain(chain: CustodyReceipt[]): Promise<ChainVerify> {
  if (!chain.length) return { ok: true, count: 0 };
  let expectPrev = await genesisOf(chain[0].subject);
  for (let i = 0; i < chain.length; i++) {
    const r = chain[i];
    if (r.prev_hash !== expectPrev) return { ok: false, count: chain.length, brokenAt: i, reason: 'prev_hash mismatch' };
    const { hash, ...body } = r;
    const h = await hashOf({ ...body, hash: '' });
    if (h !== hash) return { ok: false, count: chain.length, brokenAt: i, reason: 'hash mismatch' };
    expectPrev = hash;
  }
  return { ok: true, count: chain.length, head: chain[chain.length - 1].hash };
}

/** Short display form used on the pages: first 8 hex chars. */
export const short = (h: string): string => h.slice(0, 8);

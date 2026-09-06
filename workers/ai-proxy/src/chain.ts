// Edge receipt chain (same canon + sha256 shape as timmy-tui/src/utils/receipts.ts
// and vault-custody/src/lib/chain.ts). T0-grade at the edge: no ed25519 yet;
// the head is anchored by the root chain when the owner seals code.head.

export interface EdgeReceipt {
  v: 1;
  id: string;
  ts: string;
  kind: string;
  subject: string;
  data: Record<string, unknown>;
  prev_hash: string;
  hash: string;
}

export type EdgeReceiptInput = Pick<EdgeReceipt, 'kind' | 'subject' | 'data'> & { ts?: string; id?: string };

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
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as BufferSource));
  let s = '';
  for (const x of d) s += x.toString(16).padStart(2, '0');
  return s;
}

export const hashOf = (o: Record<string, unknown>): Promise<string> => sha256Hex(canon(o));
export const genesisOf = (subject: string): Promise<string> => sha256Hex(`vault-custody:genesis:${subject}`);

const newId = (): string => `ec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export async function appendEdgeReceipt(chain: EdgeReceipt[], input: EdgeReceiptInput): Promise<EdgeReceipt> {
  const prev = chain.length ? chain[chain.length - 1] : null;
  if (prev && prev.subject !== input.subject) throw new Error(`chain subject mismatch: ${prev.subject} vs ${input.subject}`);
  const base = {
    v: 1 as const,
    id: input.id ?? newId(),
    ts: input.ts ?? new Date().toISOString(),
    kind: input.kind,
    subject: input.subject,
    data: input.data,
    prev_hash: prev ? prev.hash : await genesisOf(input.subject)
  };
  const rec: EdgeReceipt = { ...base, hash: await hashOf({ ...base, hash: '' }) };
  chain.push(rec);
  return rec;
}

export async function verifyEdgeChain(chain: EdgeReceipt[]): Promise<{ ok: boolean; count: number; brokenAt?: number; head?: string }> {
  if (!chain.length) return { ok: true, count: 0 };
  let expect = await genesisOf(chain[0].subject);
  for (let i = 0; i < chain.length; i++) {
    const { hash, ...body } = chain[i];
    if (chain[i].prev_hash !== expect) return { ok: false, count: chain.length, brokenAt: i };
    if ((await hashOf({ ...body, hash: '' })) !== hash) return { ok: false, count: chain.length, brokenAt: i };
    expect = hash;
  }
  return { ok: true, count: chain.length, head: chain[chain.length - 1].hash };
}

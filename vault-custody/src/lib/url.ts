// The Vault Custody URL scheme. "The URL is the product": every seal points at
// one address we own, and the address itself proves the tag is real and the
// tap is new. One scheme, two mirror modes, all on the /t path.
//
//   Encrypted mirror (production tags):
//     /t?e=<PICCData 32 hex>&c=<SDMMAC 16 hex>[&d=<SDMENCFileData hex>][&tt=<TT status 2 chars>]
//   Plaintext mirror (fallback / bench tags):
//     /t?u=<UID 14 hex>&n=<SDMReadCtr 6 hex, MSB first>&c=<SDMMAC 16 hex>[&tt=..]
//
// The CMAC parameter is `c`; that name is part of the MAC input when file
// data is mirrored (see sun.ts macParam), so renaming it breaks every tag.

import { hex, SunError, type SunKeys, type SunResult, verifyEncryptedSun, verifyPlainSun } from './sun.js';

export const CMAC_PARAM = 'c';

export type TapParams =
  | { mode: 'encrypted'; e: string; c: string; d?: string; tt?: string }
  | { mode: 'plain'; u: string; n: string; c: string; tt?: string };

export function parseTapParams(search: URLSearchParams): TapParams {
  const c = search.get(CMAC_PARAM);
  if (!c) throw new SunError('missing_param', 'c (SDMMAC) is required');
  const e = search.get('e');
  if (e) {
    return { mode: 'encrypted', e, c, d: search.get('d') ?? undefined, tt: search.get('tt') ?? undefined };
  }
  const u = search.get('u');
  const n = search.get('n');
  if (u && n) return { mode: 'plain', u, n, c, tt: search.get('tt') ?? undefined };
  throw new SunError('missing_param', 'need e (encrypted) or u+n (plain)');
}

/** Verify a tap from its query string. Never throws on bad input; returns SunFail. */
export async function verifyTap(search: URLSearchParams, keys: SunKeys): Promise<SunResult & { params?: TapParams }> {
  let p: TapParams;
  try {
    p = parseTapParams(search);
  } catch (e) {
    if (e instanceof SunError) return { ok: false, reason: e.code, detail: e.message };
    throw e;
  }
  try {
    if (p.mode === 'encrypted') {
      const r = await verifyEncryptedSun(keys, {
        piccEnc: hex.from(p.e),
        cmac: hex.from(p.c),
        encFileData: p.d ? hex.from(p.d) : undefined,
        macParam: CMAC_PARAM,
        tagTamper: p.tt
      });
      return { ...r, params: p };
    }
    if (!/^[0-9a-fA-F]{6}$/.test(p.n)) return { ok: false, reason: 'bad_length', detail: 'n must be 6 hex chars', params: p };
    const r = await verifyPlainSun(keys.fileReadKey, {
      uid: hex.from(p.u),
      readCounter: parseInt(p.n, 16),
      cmac: hex.from(p.c),
      tagTamper: p.tt
    });
    return { ...r, params: p };
  } catch (e) {
    if (e instanceof SunError) return { ok: false, reason: e.code, detail: e.message, params: p };
    throw e;
  }
}

/** Build a tap URL (used by tests and the bench tag writer). */
export function tapUrl(base: string, p: TapParams): string {
  const u = new URL('/t', base);
  if (p.mode === 'encrypted') {
    u.searchParams.set('e', p.e.toUpperCase());
    u.searchParams.set(CMAC_PARAM, p.c.toUpperCase());
    if (p.d) u.searchParams.set('d', p.d.toUpperCase());
  } else {
    u.searchParams.set('u', p.u.toUpperCase());
    u.searchParams.set('n', p.n.toUpperCase());
    u.searchParams.set(CMAC_PARAM, p.c.toUpperCase());
  }
  if (p.tt) u.searchParams.set('tt', p.tt.toUpperCase());
  return u.toString();
}

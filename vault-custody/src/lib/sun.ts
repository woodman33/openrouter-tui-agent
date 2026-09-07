// NTAG 424 DNA Secure Unique NFC (SUN) verifier — Secure Dynamic Messaging in
// AES mode, per NXP AN12196 ("NTAG 424 DNA and NTAG 424 DNA TagTamper features
// and hints"). Verified against the AN12196 vectors in ../../test/sun.test.ts.
//
// WebCrypto only (Cloudflare Pages Functions, Workers, Node 20+). No deps.
// WebCrypto has AES-CBC but not AES-ECB or AES-CMAC; both are derived here
// from AES-CBC with two well-known tricks (see aesEncryptBlock and
// aesCbcDecryptNoPad). Every primitive is exported so the tests can pin it.
//
// Trust boundary: this module proves (a) the PICC data was produced by a tag
// holding the SDM meta-read key, (b) the CMAC was produced by a tag holding
// the SDM file-read key for this UID + counter, and (c) nothing else. Replay
// (same counter twice) is the caller's job — see replay.ts.

export type SunFailure =
  | 'bad_hex'
  | 'bad_length'
  | 'bad_tag'
  | 'bad_cmac'
  | 'missing_param';

export class SunError extends Error {
  constructor(public readonly code: SunFailure, message?: string) {
    super(message ?? code);
    this.name = 'SunError';
  }
}

export interface SunKeys {
  /** SDM meta-read key (K_SDMMetaRead): decrypts the PICC data. 16 bytes. */
  metaReadKey: Uint8Array;
  /** SDM file-read key (K_SDMFileRead): derives the session MAC + ENC keys. 16 bytes. */
  fileReadKey: Uint8Array;
}

export interface TagTamperStatus {
  /** Raw two-character mirror as it appeared on the wire. */
  raw: string;
  /** Permanent status: has the loop EVER been broken. Stored on chip forever. */
  permanent: 'closed' | 'open' | 'invalid';
  /** Current status at this power-up. */
  current: 'closed' | 'open' | 'invalid';
}

export interface SunOk {
  ok: true;
  mode: 'encrypted' | 'plain';
  /** 7-byte UID, lowercase hex (14 chars). */
  uid: string;
  /** SDMReadCtr as an integer (0..16777215). */
  readCounter: number;
  /** PICCData tag byte (encrypted mode) — 0xC7 = UID + counter mirrored, UID len 7. */
  tag?: number;
  /** Decrypted SDMENCFileData, when the URL carried it. */
  fileData?: Uint8Array;
  tagTamper?: TagTamperStatus;
}

export interface SunFail {
  ok: false;
  reason: SunFailure;
  detail?: string;
}

export type SunResult = SunOk | SunFail;

// ---------------------------------------------------------------- bytes

export const hex = {
  to(b: Uint8Array): string {
    let s = '';
    for (const x of b) s += x.toString(16).padStart(2, '0');
    return s;
  },
  from(s: string): Uint8Array {
    const c = s.trim();
    if (!/^[0-9a-fA-F]*$/.test(c) || c.length % 2 !== 0) throw new SunError('bad_hex', `not hex: ${s.slice(0, 8)}…`);
    const out = new Uint8Array(c.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(c.slice(i * 2, i * 2 + 2), 16);
    return out;
  }
};

const ZERO16 = new Uint8Array(16);
const ascii = (s: string): Uint8Array => new TextEncoder().encode(s);

export function concat(...parts: Uint8Array[]): Uint8Array {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function xor(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
  return out;
}

/** Constant-time equality. */
export function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

// ---------------------------------------------------------------- AES primitives (WebCrypto)

const subtle = (): SubtleCrypto => {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new Error('WebCrypto subtle not available');
  return s;
};

async function aesKey(raw: Uint8Array, usages: KeyUsage[]): Promise<CryptoKey> {
  if (raw.length !== 16) throw new SunError('bad_length', `AES-128 key must be 16 bytes, got ${raw.length}`);
  return subtle().importKey('raw', raw as BufferSource, { name: 'AES-CBC' }, false, usages);
}

/**
 * AES-128 single-block encryption (ECB of one block) via AES-CBC with a zero IV:
 * CBC(iv=0, block) = E(block) || E(pad ^ E(block)); keep the first 16 bytes.
 */
export async function aesEncryptBlock(key: Uint8Array, block: Uint8Array): Promise<Uint8Array> {
  if (block.length !== 16) throw new SunError('bad_length', 'block must be 16 bytes');
  const k = await aesKey(key, ['encrypt']);
  const ct = new Uint8Array(await subtle().encrypt({ name: 'AES-CBC', iv: ZERO16 }, k, block as BufferSource));
  return ct.slice(0, 16);
}

/**
 * AES-128-CBC decryption without padding. WebCrypto insists on PKCS#7, so we
 * append one block that decrypts to a valid full padding block:
 *   P_pad = E_K(C_last ^ 0x10*16)  (CBC-encrypt of an empty message with iv=C_last)
 * Decrypting C || P_pad under (iv) then yields exactly len(C) plaintext bytes.
 */
export async function aesCbcDecryptNoPad(key: Uint8Array, iv: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  if (data.length === 0 || data.length % 16 !== 0) throw new SunError('bad_length', `ciphertext must be a non-empty multiple of 16 bytes, got ${data.length}`);
  if (iv.length !== 16) throw new SunError('bad_length', 'iv must be 16 bytes');
  const k = await aesKey(key, ['encrypt', 'decrypt']);
  const last = data.slice(data.length - 16);
  const padBlock = new Uint8Array(await subtle().encrypt({ name: 'AES-CBC', iv: last as BufferSource }, k, new Uint8Array(0)));
  const pt = new Uint8Array(await subtle().decrypt({ name: 'AES-CBC', iv: iv as BufferSource }, k, concat(data, padBlock) as BufferSource));
  if (pt.length !== data.length) throw new SunError('bad_length', 'unexpected plaintext length');
  return pt;
}

// ---------------------------------------------------------------- AES-CMAC (RFC 4493)

function shiftLeft(b: Uint8Array): Uint8Array {
  const out = new Uint8Array(16);
  let carry = 0;
  for (let i = 15; i >= 0; i--) {
    out[i] = ((b[i] << 1) & 0xff) | carry;
    carry = b[i] >> 7;
  }
  return out;
}

async function cmacSubkeys(key: Uint8Array): Promise<{ K1: Uint8Array; K2: Uint8Array }> {
  const L = await aesEncryptBlock(key, ZERO16);
  const K1 = shiftLeft(L);
  if (L[0] & 0x80) K1[15] ^= 0x87;
  const K2 = shiftLeft(K1);
  if (K1[0] & 0x80) K2[15] ^= 0x87;
  return { K1, K2 };
}

/** Full 16-byte AES-CMAC. */
export async function aesCmac(key: Uint8Array, msg: Uint8Array): Promise<Uint8Array> {
  const { K1, K2 } = await cmacSubkeys(key);
  const n = msg.length === 0 ? 1 : Math.ceil(msg.length / 16);
  const complete = msg.length > 0 && msg.length % 16 === 0;
  const head = msg.slice(0, (n - 1) * 16);
  const tail = msg.slice((n - 1) * 16);
  let last: Uint8Array;
  if (complete) {
    last = xor(tail, K1);
  } else {
    const p = new Uint8Array(16);
    p.set(tail);
    p[tail.length] = 0x80;
    last = xor(p, K2);
  }
  let X: Uint8Array = ZERO16;
  if (n > 1) {
    // CBC-MAC of the first n-1 blocks: the (n-2)th ciphertext block of a
    // zero-IV CBC encryption is exactly the chaining value X.
    const k = await aesKey(key, ['encrypt']);
    const ct = new Uint8Array(await subtle().encrypt({ name: 'AES-CBC', iv: ZERO16 }, k, head as BufferSource));
    X = ct.slice((n - 2) * 16, (n - 1) * 16);
  }
  return aesEncryptBlock(key, xor(X, last));
}

/** SDMMAC truncation: keep the odd-indexed bytes → 8 bytes (AN12196 §4.3). */
export function truncateMac(full16: Uint8Array): Uint8Array {
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i++) out[i] = full16[2 * i + 1];
  return out;
}

// ---------------------------------------------------------------- session keys (AN12196 §4.2)

const SV2_MAC = new Uint8Array([0x3c, 0xc3, 0x00, 0x01, 0x00, 0x80]);
const SV1_ENC = new Uint8Array([0xc3, 0x3c, 0x00, 0x01, 0x00, 0x80]);

/** 3-byte little-endian read counter, as the tag stores it. */
export function counterLE(n: number): Uint8Array {
  if (!Number.isInteger(n) || n < 0 || n > 0xffffff) throw new SunError('bad_length', 'read counter out of range');
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff]);
}
export function counterFromLE(b: Uint8Array): number {
  return b[0] | (b[1] << 8) | (b[2] << 16);
}

function sv(prefix: Uint8Array, uid: Uint8Array, ctrLE: Uint8Array): Uint8Array {
  if (uid.length !== 7) throw new SunError('bad_tag', 'UID must be 7 bytes');
  if (ctrLE.length !== 3) throw new SunError('bad_length', 'counter must be 3 bytes');
  return concat(prefix, uid, ctrLE); // 6 + 7 + 3 = 16
}

export async function sessionMacKey(fileReadKey: Uint8Array, uid: Uint8Array, ctrLE: Uint8Array): Promise<Uint8Array> {
  return aesCmac(fileReadKey, sv(SV2_MAC, uid, ctrLE));
}
export async function sessionEncKey(fileReadKey: Uint8Array, uid: Uint8Array, ctrLE: Uint8Array): Promise<Uint8Array> {
  return aesCmac(fileReadKey, sv(SV1_ENC, uid, ctrLE));
}

/** SDMMAC over `input` under a session MAC key (truncated to 8 bytes). */
export async function computeSdmMac(sessionKey: Uint8Array, input: Uint8Array): Promise<Uint8Array> {
  return truncateMac(await aesCmac(sessionKey, input));
}

// ---------------------------------------------------------------- PICC data + file data

export interface PiccData {
  tag: number;
  uid?: Uint8Array;
  ctrLE?: Uint8Array;
}

/** Decrypt the 16-byte encrypted PICCData (tag byte, UID, counter, random pad). */
export async function decryptPiccData(metaReadKey: Uint8Array, piccEnc: Uint8Array): Promise<PiccData> {
  if (piccEnc.length !== 16) throw new SunError('bad_length', `PICCData must be 16 bytes, got ${piccEnc.length}`);
  const pt = await aesCbcDecryptNoPad(metaReadKey, ZERO16, piccEnc);
  const tag = pt[0];
  let off = 1;
  const out: PiccData = { tag };
  if (tag & 0x80) {
    const len = tag & 0x0f;
    if (len !== 7) throw new SunError('bad_tag', `unsupported UID length ${len}`);
    out.uid = pt.slice(off, off + 7);
    off += 7;
  }
  if (tag & 0x40) {
    out.ctrLE = pt.slice(off, off + 3);
    off += 3;
  }
  return out;
}

export async function decryptFileData(fileReadKey: Uint8Array, uid: Uint8Array, ctrLE: Uint8Array, enc: Uint8Array): Promise<Uint8Array> {
  const kEnc = await sessionEncKey(fileReadKey, uid, ctrLE);
  const iv = await aesEncryptBlock(kEnc, concat(ctrLE, new Uint8Array(13)));
  return aesCbcDecryptNoPad(kEnc, iv, enc);
}

// ---------------------------------------------------------------- TagTamper

const TT_CHAR: Record<string, TagTamperStatus['current']> = { C: 'closed', O: 'open', I: 'invalid' };

/**
 * TagTamper status mirror: two ASCII characters, permanent then current
 * (NTAG 424 DNA TagTamper GetTTStatus order). 'C' closed, 'O' open, 'I' invalid.
 * A reclosed loop reads "OC": permanently recorded open, currently closed —
 * that is the resealed-box case the deck describes.
 */
export function parseTagTamper(raw: string | null | undefined): TagTamperStatus | undefined {
  if (!raw) return undefined;
  const r = raw.trim().toUpperCase();
  if (r.length !== 2) throw new SunError('bad_length', 'tt must be 2 chars');
  const p = TT_CHAR[r[0]];
  const c = TT_CHAR[r[1]];
  if (!p || !c) throw new SunError('bad_tag', `unknown tt status ${r}`);
  return { raw: r, permanent: p, current: c };
}

// ---------------------------------------------------------------- verifiers

export interface EncryptedSunInput {
  piccEnc: Uint8Array;
  cmac: Uint8Array;
  /** SDMENCFileData, when mirrored. */
  encFileData?: Uint8Array;
  /**
   * The name of the CMAC query parameter as it appears on the wire. When
   * encFileData is present the MAC input is the uppercase hex of the file
   * data followed by `&<macParam>=` (AN12196 §4.3, separated parameters).
   * Empty string means "no separator" (SDMMACInputOffset == SDMMACOffset).
   */
  macParam?: string;
  tagTamper?: string | null;
}

export async function verifyEncryptedSun(keys: SunKeys, input: EncryptedSunInput): Promise<SunResult> {
  try {
    const picc = await decryptPiccData(keys.metaReadKey, input.piccEnc);
    if (!picc.uid || !picc.ctrLE) return { ok: false, reason: 'bad_tag', detail: `tag 0x${picc.tag.toString(16)} lacks UID or counter` };
    if (input.cmac.length !== 8) return { ok: false, reason: 'bad_length', detail: 'cmac must be 8 bytes' };
    const kMac = await sessionMacKey(keys.fileReadKey, picc.uid, picc.ctrLE);
    let macInput = new Uint8Array(0);
    if (input.encFileData && input.encFileData.length) {
      const param = input.macParam ?? '';
      macInput = ascii(hex.to(input.encFileData).toUpperCase() + (param ? `&${param}=` : ''));
    }
    const calc = await computeSdmMac(kMac, macInput);
    if (!equalBytes(calc, input.cmac)) return { ok: false, reason: 'bad_cmac' };
    const out: SunOk = {
      ok: true,
      mode: 'encrypted',
      uid: hex.to(picc.uid),
      readCounter: counterFromLE(picc.ctrLE),
      tag: picc.tag
    };
    if (input.encFileData && input.encFileData.length) {
      out.fileData = await decryptFileData(keys.fileReadKey, picc.uid, picc.ctrLE, input.encFileData);
    }
    const tt = parseTagTamper(input.tagTamper);
    if (tt) out.tagTamper = tt;
    return out;
  } catch (e) {
    if (e instanceof SunError) return { ok: false, reason: e.code, detail: e.message };
    throw e;
  }
}

export interface PlainSunInput {
  uid: Uint8Array;
  /** Read counter as the tag mirrors it: 6 hex chars, most-significant first. */
  readCounter: number;
  cmac: Uint8Array;
  tagTamper?: string | null;
}

/** Plaintext mirror (UID + counter in the clear, CMAC over an empty input). */
export async function verifyPlainSun(fileReadKey: Uint8Array, input: PlainSunInput): Promise<SunResult> {
  try {
    if (input.uid.length !== 7) return { ok: false, reason: 'bad_tag', detail: 'UID must be 7 bytes' };
    if (input.cmac.length !== 8) return { ok: false, reason: 'bad_length', detail: 'cmac must be 8 bytes' };
    const ctrLE = counterLE(input.readCounter);
    const kMac = await sessionMacKey(fileReadKey, input.uid, ctrLE);
    const calc = await computeSdmMac(kMac, new Uint8Array(0));
    if (!equalBytes(calc, input.cmac)) return { ok: false, reason: 'bad_cmac' };
    const out: SunOk = { ok: true, mode: 'plain', uid: hex.to(input.uid), readCounter: input.readCounter };
    const tt = parseTagTamper(input.tagTamper);
    if (tt) out.tagTamper = tt;
    return out;
  } catch (e) {
    if (e instanceof SunError) return { ok: false, reason: e.code, detail: e.message };
    throw e;
  }
}

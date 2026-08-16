import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import crypto from 'crypto';

// Per-instance ed25519 identity (specs/edl-v1.md §3). The private key never
// leaves .timmy/keys (0600); receipts embed the public SPKI PEM as `signer`.
// Unsigned receipts are T0-grade and must not be built upon.

export interface KeyPairRef { privatePem: string; publicPem: string }

export function keysPath(dir: string = process.cwd()): string {
  return join(dir, '.timmy', 'keys', 'ed25519.pem');
}

const cache = new Map<string, KeyPairRef>();

export function loadOrCreateKeys(dir?: string): KeyPairRef {
  const d = dir ?? process.cwd();
  const hit = cache.get(d);
  if (hit) return hit;
  const p = keysPath(d);
  let ref: KeyPairRef;
  if (existsSync(p)) {
    const privatePem = readFileSync(p, 'utf8');
    const publicPem = crypto.createPublicKey(crypto.createPrivateKey(privatePem))
      .export({ type: 'spki', format: 'pem' }).toString();
    ref = { privatePem, publicPem };
  } else {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, privatePem);
    try { chmodSync(p, 0o600); } catch { /* best effort */ }
    ref = { privatePem, publicPem };
  }
  cache.set(d, ref);
  return ref;
}

// Canonical body = recursive key-sorted JSON, excluding hash/prev_hash/signature.
export function canonicalBody(o: Record<string, unknown>): string {
  const deep = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(deep);
    if (v && typeof v === 'object') {
      return Object.keys(v as object).sort().reduce(
        (acc, k) => ({ ...acc, [k]: deep((v as Record<string, unknown>)[k]) }), {});
    }
    return v;
  };
  const { hash, prev_hash, signature, ...rest } = o;
  return JSON.stringify(deep(rest));
}

export function signBody(body: Record<string, unknown>, dir?: string): { signer: string; signature: string } {
  const kp = loadOrCreateKeys(dir);
  // signer rides inside the signed payload (verifier needs it; canonicalBody
  // strips hash/prev_hash/signature but keeps signer).
  const sig = crypto.sign(null, Buffer.from(canonicalBody({ ...body, signer: kp.publicPem })), crypto.createPrivateKey(kp.privatePem));
  return { signer: kp.publicPem, signature: sig.toString('base64') };
}

export function verifyBody(body: Record<string, unknown>): boolean {
  const { signer, signature } = body as { signer?: string; signature?: string };
  if (!signer || !signature) return false;
  try {
    return crypto.verify(null, Buffer.from(canonicalBody(body)),
      crypto.createPublicKey(signer), Buffer.from(signature, 'base64'));
  } catch {
    return false;
  }
}

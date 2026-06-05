import {
  type JWK,
  type KeyLike,
  SignJWT,
  calculateJwkThumbprint,
  exportJWK,
  generateKeyPair,
  importJWK,
} from "jose";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { config } from "./config.js";

const ALG = "ES256";

type KeyState = {
  privateKey: KeyLike;
  publicJwk: JWK;
  kid: string;
};

let state: KeyState | null = null;

async function loadFromDisk(): Promise<JWK | null> {
  try {
    const raw = await readFile(config.keyPath, "utf8");
    return JSON.parse(raw) as JWK;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function persist(privateJwk: JWK): Promise<void> {
  await mkdir(dirname(config.keyPath), { recursive: true });
  await writeFile(config.keyPath, JSON.stringify(privateJwk, null, 2), {
    mode: 0o600,
  });
}

export async function initKeys(): Promise<void> {
  let privateJwk = await loadFromDisk();
  if (!privateJwk) {
    const { privateKey } = await generateKeyPair(ALG, { extractable: true });
    privateJwk = await exportJWK(privateKey);
    privateJwk.alg = ALG;
    privateJwk.use = "sig";
    await persist(privateJwk);
  }

  const privateKey = (await importJWK(privateJwk, ALG)) as KeyLike;
  const publicJwk: JWK = {
    kty: privateJwk.kty,
    crv: privateJwk.crv,
    x: privateJwk.x,
    y: privateJwk.y,
    alg: ALG,
    use: "sig",
  };
  const kid = await calculateJwkThumbprint(publicJwk);
  publicJwk.kid = kid;

  state = { privateKey, publicJwk, kid };
  console.log(`[keys] loaded ES256 signing key, kid=${kid}`);
}

function requireState(): KeyState {
  if (!state) throw new Error("keys not initialized — call initKeys() first");
  return state;
}

export function getPublicJwk(): JWK {
  return requireState().publicJwk;
}

export function getKid(): string {
  return requireState().kid;
}

export async function sign(
  payload: Record<string, unknown>,
  typ: string,
  expSeconds?: number,
): Promise<string> {
  const { privateKey, kid } = requireState();
  const builder = new SignJWT(payload)
    .setProtectedHeader({ alg: ALG, kid, typ })
    .setIssuedAt();
  if (expSeconds !== undefined) builder.setExpirationTime(`${expSeconds}s`);
  return builder.sign(privateKey);
}

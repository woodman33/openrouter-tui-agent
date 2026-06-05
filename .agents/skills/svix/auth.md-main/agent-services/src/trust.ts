import { createRemoteJWKSet } from "jose";
import { config } from "./config.js";

type Jwks = ReturnType<typeof createRemoteJWKSet>;

const jwksCache = new Map<string, Jwks>();

export function isTrustedIssuer(iss: string): boolean {
  return config.trustedIssuers.includes(iss);
}

export function getJwks(iss: string): Jwks {
  let jwks = jwksCache.get(iss);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${iss}/.well-known/jwks.json`));
    jwksCache.set(iss, jwks);
  }
  return jwks;
}

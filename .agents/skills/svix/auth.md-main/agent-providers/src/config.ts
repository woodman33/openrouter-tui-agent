import { ports } from "shared";

const issuer = `http://localhost:${ports.provider}`;
const consumerUrl = `http://localhost:${ports.consumer}`;

export const config = Object.freeze({
  port: ports.provider,
  issuer,
  consumerUrl,
  keyPath: ".keys/signing-key.json",
  sessionTtlSeconds: 86400,
  consentTtlSeconds: 86400,
  idJagTtlSeconds: 300,
  cimdUrl: `${issuer}/agent-auth.json`,
  jwksUrl: `${issuer}/.well-known/jwks.json`,
});

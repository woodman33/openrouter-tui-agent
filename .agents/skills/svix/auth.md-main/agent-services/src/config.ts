import { ports } from "shared";

const baseUrl = `http://localhost:${ports.consumer}`;
const providerUrl = `http://localhost:${ports.provider}`;

export const config = Object.freeze({
  port: ports.consumer,
  baseUrl,
  resource: `${baseUrl}/api/`,
  prmUrl: `${baseUrl}/.well-known/oauth-protected-resource`,
  trustedIssuers: [providerUrl],
  scopesSupported: ["api.read", "api.write"],
  preClaimScopes: ["api.read"],
  postClaimScopes: ["api.read", "api.write"],
  accessTokenTtlSeconds: 3600,
  anonymousTtlSeconds: 86400,
  claimViewTokenTtlSeconds: 600,
  otpTtlSeconds: 600,
  clockSkewSeconds: 60,
  corsOrigins: [providerUrl],
  mailDir: ".mail",
  mailUrlPath: "/mail",
});

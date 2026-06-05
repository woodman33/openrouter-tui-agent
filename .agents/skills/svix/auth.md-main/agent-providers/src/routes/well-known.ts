import { Router } from "express";
import { config } from "../config.js";
import { getPublicJwk } from "../keys.js";

export const wellKnownRouter = Router();

wellKnownRouter.get("/.well-known/jwks.json", (_req, res) => {
  res.set("Cache-Control", "public, max-age=300");
  res.json({ keys: [getPublicJwk()] });
});

wellKnownRouter.get("/agent-auth.json", (_req, res) => {
  res.set("Cache-Control", "public, max-age=300");
  res.json({
    client_id: config.cimdUrl,
    client_name: "Agent Auth Provider",
    client_uri: config.issuer,
    logo_uri: `${config.issuer}/logo.png`,
    tos_uri: `${config.issuer}/tos`,
    policy_uri: `${config.issuer}/privacy`,
    token_endpoint_auth_method: "private_key_jwt",
    jwks_uri: config.jwksUrl,
    scope: "openid email profile",
  });
});

import { Router } from "express";
import { requireSession } from "../auth.js";
import { mintIdJag } from "../jwts.js";
import { mintIdJagBody, parseBody } from "../schemas.js";
import { findGrantForAudience } from "../store.js";

export const tokenRouter = Router();

tokenRouter.post("/id-jag", requireSession, async (req, res) => {
  const parsed = parseBody(mintIdJagBody, req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: "invalid_request", message: parsed.message });
    return;
  }

  const { audience, resource, agent_platform, agent_context_id } = parsed.value;

  const user = req.user!;
  if (!user.email_verified && !user.phone_number_verified) {
    res.status(403).json({
      error: "missing_verified_email",
      message: "User has neither a verified email nor phone number.",
    });
    return;
  }

  const grant = findGrantForAudience(user.id, audience);
  if (!grant) {
    res.status(403).json({
      error: "consent_required",
      message: `No active grant for audience ${audience}. POST /grants first.`,
    });
    return;
  }

  const { jwt, expiresIn } = await mintIdJag({
    user,
    audience,
    resource,
    agentPlatform: agent_platform,
    agentContextId: agent_context_id,
  });

  if (grant.mode === "once") grant.consumed_at = new Date();

  res.json({
    assertion_type: "urn:ietf:params:oauth:token-type:id-jag",
    assertion: jwt,
    expires_in: expiresIn,
  });
});

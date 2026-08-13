# TIMMY SEALED RECEIPT — OPEN SPEC v2

*The "Stripe-of-receipts" play: the format and verifier are free; the portal is the paid tier.*

A receipt is a hash-chained, locally-signed bundle. Any backend can READ it;
only the TUI (or a TUI-delegated key) can SIGN it.

```jsonc
{
  "v": 1,
  "id": "rc_…",
  "stream": "gens | harness | runs | exports | context",
  "ts": "ISO-8601",
  "kind": "generation | refinement | run | export | recall",
  "subject": "run/gen/entry id",
  "prompt_hash": "sha256_…",                 // prompt never leaves the receipt in the clear
  "artifacts": ["content-addressed refs"],
  "cost_usd": 0.0213,
  "policy": "human-gated | auto",
  "spans": [                                 // v2: OTel-GenAI-shaped span tree
    { "name": "invoke_agent",        "kind": "root" },
    { "name": "chat <provider>",     "kind": "chat" },
    { "name": "execute_tool launch", "kind": "execute_tool" },
    { "name": "<denial reason>",     "kind": "deny" }
  ],
  "decisions": [                             // v2: PDP decisions ride inside
    { "decision": "allow|deny", "effect": "Generate<Media>", "tier": "T1", "reason": "…" }
  ],
  "prev_hash": "sha256_… | genesis",
  "hash": "sha256 over canon(body minus hash)"   // canon = key-sorted JSON
}
```

## Verification
`/verify` (TUI) or `scripts/timmy-mcp.mjs → timmy_verify` (any MCP client):
walk each stream, check `prev_hash` linkage and recompute `hash`. A bit-flip
anywhere breaks the chain at exactly the tampered receipt.

## Policy tiers (AgentPass)
T0 read-public · T1 workspace-write · T2 lane-spawn/delegate (TUI approval) ·
T3 spend/irreversible. Default-deny; denial-as-observation (the denial is a
structured result the agent replans around). Rollout: LOG_ONLY → ENFORCE
(`/agentpass enforce on`) only after dogfooding.

## What we deliberately did NOT build
transparency-log infrastructure, key-rotation SaaS, multi-signer federation.
Local chain, one signer, exportable verifier. Stop there.

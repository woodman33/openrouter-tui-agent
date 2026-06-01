# Modal, Mux, and Replay Pipeline

The replay pipeline separates orchestration, compute, and delivery so TIMMY can publish sanitized artifacts without weakening private runtime boundaries.

## Pipeline Roles

- Cloudflare is the control plane for run state, queues, Durable Objects, and receipts.
- Sparks are the private compute plane for sensitive rendering and artifact preparation.
- Modal is burst compute for external, short-lived jobs that do not require private data locality.
- Mux is replay and video delivery for sanitized artifacts.
- External media generators produce images, clips, and workflow artifacts when inputs are safe to send outside the private plane.

## Receipt Source

TIMMY receipts are the source of replay truth. They capture run ids, command events, output counters, and hosted receipt URLs.

Raw receipts are private by default. Before publishing a replay or video artifact, redact:

- local user and machine names
- private paths
- tunnel URLs
- provider keys
- Spark and NAS identifiers
- command arguments that reveal private infrastructure

## Modal Burst Path

Use Modal when a replay render or media transform needs temporary external compute and the input payload is already sanitized.

Modal should not receive raw `.env` files, private receipt indexes, NAS paths, or unredacted terminal captures.

## Mux Delivery Path

Use Mux for delivery after an artifact is safe to publish. The registry tracks Mux readiness through token variable names only.

Mux should receive rendered outputs or publishable replay assets, not the private working set used to generate them.

## External Artifact Generators

fal, RunComfy, ComfyDeploy, Kling, and Higgsfield are external artifact generators. Their outputs can become part of a replay package, but the inputs should be scoped and sanitized first.

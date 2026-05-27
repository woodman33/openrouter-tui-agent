# Receipts and Replay

TIMMY receipts make agent work auditable. A receipt stores the goal, run id, phase, risk level, command events, output line counts, and hosted receipt URL.

## Local Receipt Index

Local receipt metadata is written under:

```text
.timmy/receipts/index.json
```

This path is ignored by git because it can include local paths, commands, telemetry URLs, and other private run context.

## Event Fidelity

`scripts/timmy-test-run.ts` asserts that sent and finished commands match exactly. This protects replay quality by ensuring the hosted Durable Object event stream preserves the command text that was actually sent to tmux.

## Replay Boundaries

Receipts are safe to discuss at the schema level, but individual receipt files should be treated as private by default. Before sharing any receipt, inspect for:

- local machine usernames or hostnames
- internal URLs or tunnels
- provider keys or tokens
- database connection strings
- sensitive command arguments

## GitBook Rule

Do not publish raw receipts to GitBook. Publish architecture, schema, and replay guidance only.

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

## Local Agent Proof Task (`/agent-proof`)

The `/agent-proof` slash-command executes a safe local-first agent task. This task calculates dynamic hashes and emits standard run creation and receipt telemetry events to generate a sealed TIMMY receipt:

- **Activation**: Type `/agent-proof [prompt]` in the chat Brief prompt box.
- **Default Prompt**: `"Summarize this repository in 5 bullets and propose one safe next improvement."`
- **Output Bundle**: Generates a transportable bundle folder under `.runs/<run_id>.agentrun/manifest.json`.
- **Local Index Persistence**: Appends the run summary directly to the local receipt ledger located at `.timmy/receipts/index.json`.
- **Edge Telemetry Publishing**: Emitting local telemetry events that can be forwarded to configured edge systems.

## Replay Boundaries

Receipts are safe to discuss at the schema level, but individual receipt files should be treated as private by default. Before sharing any receipt, inspect for:

- local machine usernames or hostnames
- internal URLs or tunnels
- provider keys or tokens
- database connection strings
- sensitive command arguments

## GitBook Rule

Do not publish raw receipts to GitBook. Publish architecture, schema, and replay guidance only.

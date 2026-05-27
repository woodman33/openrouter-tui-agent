# Agent Runners

TIMMY has several runner surfaces. They are intentionally separate so documentation tooling does not interfere with agent execution.

## Interactive TUI

`npm start` runs `tsx cli.tsx`. This path starts the companion server unless disabled, builds an `AgentConfig`, then renders the Ink TUI.

## Headless Runner

`npm run start:headless` runs `tsx headless.ts`. Use this for terminal-only automation where stdout and stderr are easier to capture.

## Tmux Workspace Runner

`src/agent/core.ts` maintains background tmux sessions named `ortui-*`. Commands are sent through parameterized `tmux send-keys` calls, wrapped with a `TIMMY_EXIT_CODE` marker, and translated into `tmux.command.sent`, `tmux.output.line`, and `command.finished` events.

## TIMMY Scripts

- `npm run timmy:test-run` verifies receipt fidelity against the telemetry gateway.
- `npm run timmy:receipt-index` prints the local receipt index.
- `npm run timmy:snapshot` captures receipt state.
- `npm run timmy:generation:intent-pack` creates intent design pack artifacts.
- `npm run timmy:simulate:single` runs the single-simulation planning flow.

## Docs CLI

The docs surface is intentionally small:

- `timmy docs verify`
- `timmy docs preview`
- `timmy docs publish`

These commands delegate to `scripts/timmy-docs.ts` and avoid reading or printing provider secrets.

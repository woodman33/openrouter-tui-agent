# TIMMY Architecture

TIMMY has four practical layers in this repository: the terminal interface, the agent core, the runner and receipt layer, and the edge integration layer.

## Terminal Interface

The TUI starts from `cli.tsx` and renders through React Ink in `src/tui/`. It chooses a mode such as chat, code review, dashboard, model explorer, or workspace. Graphics are routed through `src/graphics/`, which supports terminal-native protocols and the browser companion fallback.

## Agent Core

`src/agent/core.ts` owns the OpenRouter SDK client, conversation history, tool execution, cost updates, and tmux workspace orchestration. It emits typed events from `src/agent/events.ts` so the TUI, dashboard, and receipt bridge can stay decoupled.

## Provider Registry

`src/agent/provider-registry.ts` records non-destructive provider metadata for OpenRouter and OpenAI. Current runtime behavior still uses OpenRouter by default. The registry adds a documented place for direct OpenAI API services and model families without replacing the existing `OPENROUTER_API_KEY` flow.

## Receipts and Runner State

The TIMMY scripts under `scripts/` create run receipt sessions, replay command events, snapshot receipt state, and keep a local receipt index under `.timmy/receipts/`. That directory is ignored because receipts can contain private machine paths and command context.

## Edge Integration

`wrangler.jsonc` and `src/companion/cloudflare-worker.ts` describe the Cloudflare Worker, Durable Object, D1, R2, Vectorize, Workers AI, queue, and Hyperdrive bindings. The repo keeps these definitions as source, with local-only passwords redacted.

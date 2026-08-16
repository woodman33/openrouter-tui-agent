# Hermes Additions for TIMMY TUI

## Executive Summary

TIMMY should not become another agent. Hermes should keep doing the work; TIMMY should become the control plane, receipt layer, cost and routing layer, and trust UI around Hermes and other local or agentic runtimes.

The strongest product line is:

> Hermes does the work. TIMMY proves what happened.

In practical terms, TIMMY should connect to Hermes through the Hermes TUI Gateway, mirror live run events, write local JSONL receipts, render a trustworthy run timeline, expose approvals and clarification requests, show model/provider/cost state, and export reviewed receipts. Cloudflare should remain optional and later: useful for hosted receipt archives, team dashboards, and searchable run indexes, but not required for the local MVP.

The leanest next engineering step is to build the Hermes TUI Gateway event mirror first.

## Current Repo Observations

This repo already has a strong foundation for a Hermes control-plane layer, but it does not yet contain a dedicated Hermes TUI Gateway JSON-RPC client or a Hermes-specific event timeline.

Observed structure:

- `package.json` defines the `timmy-tui`, `timmy`, and `openrouter-tui` bins, uses TypeScript/React/Ink, and includes scripts for build, test, companion, Cloudflare deploy, provider audit, receipt index, snapshots, and proof verification.
- `src/tui/app.tsx` is the main Ink app shell. It creates the agent with `createAgent(config)`, tracks active run/receipt state, wires `useTelemetryBridge`, `useCompanionSync`, `useModeAgentConfig`, and emits an initial `run.created` event.
- `src/tui/router.tsx` routes current modes to panels: `ChatPanel`, `FilesPanel`, `DashboardPanel`, `WorkspacePanel`, `CodeReviewPanel`, `ModelExplorerPanel`, `PorterPanel`, `OptionsPanel`, and `LogsPanel`.
- `src/tui/layout.tsx` already displays model, total cost, active run, telemetry status, navigation, and a trust inspector. This is the natural home for Hermes run state badges and quota/fallback warnings.
- `src/agent/core.ts` contains the current OpenRouter-backed `Agent`, an EventEmitter-based event surface, tmux session orchestration, command sending, approval gating through `classifyCommand`, command-finished detection through `TIMMY_EXIT_CODE:<id>:<code>`, model switching, model health checks, and cost/error handling.
- `src/agent/events.ts` defines the current event map, including chat, stream, tool, cost, model, tmux command/output, approval, model health, and simulation events.
- `src/tui/types/telemetry.ts` defines canonical telemetry event names such as `stream.delta`, `tool.call`, `tool.result`, `cost.update`, `model.switch`, `tmux.command.sent`, `command.finished`, `approval.required`, `approval.granted`, `run.created`, `receipt.generated`, and `agent.intent`.
- `src/tui/hooks/useTelemetryBridge.ts` already queues, prioritizes, redacts, sends, retries, and locally spools telemetry events to `.timmy/offline-telemetry.jsonl` when remote sync fails.
- `src/tui/hooks/useCompanionSync.ts` mirrors messages, tmux sessions, tmux output, commands, tool calls, and stream deltas to the browser companion.
- `src/companion/server.ts` exposes a local Express/WebSocket companion on port `3001`, serves the browser client, syncs state/history/tmux data, and exposes lightweight integration status.
- `src/companion/client/index.html` is the browser companion UI. It is already a potential surface for Hermes session mirrors and browser/CDP diagnostics, but it is not yet a Hermes run cockpit.
- `src/receipt/schema.ts` defines a small local receipt model and deterministic SHA-256 canonicalization. `tests/receipt.test.ts` verifies canonical hashes and CLI demo/proof receipt generation.
- `timmy.ts` provides local CLI commands for `demo`, `proof`, `doctor`, `docs`, and `providers`, and writes `.timmy` receipts/runs for demo and proof flows.
- `src/agent/provider-registry.ts`, `scripts/timmy-providers.ts`, and `docs/provider-registry.md` provide a provider metadata/readiness layer that checks env var names without printing secrets.
- `src/tui/panels/ChatPanel.tsx` includes OpenRouter model rail UI, live model fetching through `fetchModels`, model search, and chat/stream rendering.
- `src/tui/panels/PorterPanel.tsx` creates local MCP to CLI dry-run evidence folders under `mcp-cli/<slug>/`, including `README.md`, `cli-plan.md`, `generated-files.md`, `agentpass-visa.md`, `receipt-fields.md`, and `commands.txt`.
- `src/tui/panels/LogsPanel.tsx` reads bounded local logs from `logs/`, including `agent-events.log`, which is useful for a first Hermes event mirror.
- `src/tui/panels/DashboardPanel.tsx`, `FilesPanel.tsx`, and `WorkspacePanel.tsx` already use AgentPass, receipt, context, MCP, and swarm vocabulary. Some dashboard entries are aspirational; Hermes integration should turn the strongest parts into actual event-backed UI.
- `docs/receipts-and-replay.md`, `docs/timmy-porter.md`, `docs/cloudflare-deployment.md`, `docs/cloudflare-fit.md`, `docs/multimodal-runtime.md`, `docs/spark-runner.md`, and `docs/security-and-secrets.md` already establish local-first receipts, Cloudflare-later architecture, provider boundaries, and secret-handling rules.

Uncertain assumptions to verify before implementation:

- The exact Hermes TUI Gateway JSON-RPC method names and event schema are not present in this repo.
- Hermes event names such as `message.delta`, `tool.start`, `approval.request`, `secret.request`, and `sudo.request` should be treated as target contracts until verified against Hermes.
- The browser/CDP supervisor diagnostics contract is not present in this repo.
- Nous Portal, xAI/Grok OAuth, Bedrock, NVIDIA NIM, LM Studio, and Ollama routing support should be provider metadata first, runtime wiring later.

## Top 20 Hermes Additions for TIMMY

| Rank | Feature | Hermes primitive or system | TIMMY UI/product feature | User value | Difficulty | Phase | Notes |
|---:|---|---|---|---|---|---|---|
| 1 | TUI Gateway connector | Hermes TUI Gateway JSON-RPC | Local connector status, session create, prompt submit | Turns TIMMY into a real Hermes cockpit instead of a parallel agent | M | MVP | Build as an isolated client, not inside panel code |
| 2 | Live event timeline | Hermes event stream | `HermesRunTimeline` | Users see exactly what happened as it happens | M | MVP | Normalize Hermes events before UI rendering |
| 3 | Tool call stream | Tool runtime events | `HermesToolCallCard` and event stream rows | Makes tool use auditable and debuggable | M | MVP | Map `tool.start/progress/complete/error` |
| 4 | Approval inbox | Approval/clarify/sudo/secret requests | `HermesApprovalInbox` | Keeps dangerous or blocked actions visible and answerable | M | MVP | Include approve, reject, respond controls |
| 5 | Terminal/process receipts | Process command runtime | `HermesCommandReceiptCard` | Shows command, cwd, exit code, duration, output pointer | S | MVP | Reuse tmux command receipt concepts |
| 6 | File/patch/diff receipts | File patch runtime | `HermesDiffReceiptCard` | Lets users verify what changed before merge/publish | M | MVP | Start with paths and summaries; patch viewer later |
| 7 | Model/provider display | Provider runtime resolver | `HermesModelRouteBadge` | Makes model choice and provider status obvious | S | MVP | Fits existing layout header/model badge |
| 8 | Model hot-swap controls | Hermes model switch/runtime route update | Model route selector and swap receipt | Gives operator control mid-session | M | v1 | Must emit a receipt event |
| 9 | Usage/cost ledger | Usage accounting events | Per-run cost/usage ledger | Prevents runaway spend and builds trust | M | v1 | Extend existing `totalCost` concept |
| 10 | Quota Sentinel / 429 handling | Provider error detection | `HermesQuotaSentinel` | Detects exhausted quota and suggests fallback routes | M | v1 | Explicitly detect HTTP 429 quota exceeded |
| 11 | Fallback provider timeline | Provider route/fallback events | Fallback route timeline | Explains why the model/provider changed | M | v1 | Record failed route, chosen route, reason |
| 12 | Session status/history | Hermes sessions API | Session list and resume/open controls | Lets users return to prior runs | M | MVP/v1 | Local JSONL first, Hermes session API as source |
| 13 | Session branching/compression controls | Context/session lifecycle | Branch/compress controls | Prevents context drift and hidden compression surprises | L | v1 | Start with display/status before mutating |
| 14 | Context pack builder | `@file`, `@folder`, `@diff`, `@staged`, `@git`, `@url` references | `HermesContextPanel` | Lets users assemble controlled prompt context | L | v1 | Keep local-first; avoid context DAG engine for now |
| 15 | Prompt assembly receipt | Prompt builder/runtime resolver | `HermesPromptAssemblyReceipt` | Shows identity, repo context, memory, skills, overlays, model, provider | L | v1 | Critical trust surface, but not MVP blocker |
| 16 | Memory/session search view | Memory and session_search | Searchable run and memory panel | Finds past evidence and decisions | M | v1 | Local archive first |
| 17 | Skills / receipt-to-skill workflow | Skills system and curator | Skills lifecycle dashboard | Turns successful receipts into reusable skills | L | v2 | Avoid auto-writing skills without review |
| 18 | Cron/scheduled run dashboard | Hermes cron/automation blueprints | Scheduled runs dashboard | Supports monitoring and recurring research | L | v2 | Needs strong approval and secret boundaries |
| 19 | Trajectory export | ShareGPT-compatible JSONL export | `HermesTrajectoryExporter` | Creates eval/fine-tuning/review datasets | M | v2 | Separate successful vs failed run exports |
| 20 | Browser/CDP diagnostics | Browser automation/CDP supervisor | Browser event diagnostics cards | Makes click/type/snapshot/dialog/console/frame actions inspectable | L | v2 | Start as diagnostics, not browser automation SaaS |

Important related additions that should be tracked after the top 20:

- API Server / SSE support.
- ACP IDE bridge awareness.
- Delegation/subagent trees.
- Kanban multi-agent board.
- Nous Portal onboarding and Tool Gateway routing.
- xAI/Grok OAuth and direct media/search tool routing.
- Plugin provider packs for model, image, video, web, memory, and context engines.
- Agent routing policies, such as cheap scouting model and senior verifier model.
- Fable Pass / senior verifier pass over final diff, command log, approvals, tests, and receipts.
- Agent run health score and merge recommendation.

## MVP Cut

The smallest shippable Hermes-backed TIMMY version should do only this:

- Connect to the Hermes TUI Gateway.
- Create a Hermes session.
- Submit a prompt.
- Stream these events into TIMMY:
  - `message.delta`
  - `tool.start`
  - `tool.progress`
  - `tool.complete`
  - `approval.request`
  - `clarify.request`
  - `sudo.request`
  - `secret.request`
  - `message.complete`
- Write local `.timmy/hermes-events.jsonl`.
- Render a run timeline in the TUI.
- Add approve/reject/respond UI for request events.
- Show provider/model/status/usage.
- Generate one local receipt HTML or JSON artifact.

MVP non-goals:

- Full provider marketplace.
- Full hosted dashboard.
- Full memory provider.
- Full context DAG engine.
- Full browser automation UI.
- Multi-agent board.
- Cloudflare archive by default.

## V1 Roadmap

After the MVP proves event mirroring and local receipts, build:

- Model hot-swap controls.
- Fallback visualization.
- Quota Sentinel with HTTP 429 detection and fallback suggestions.
- Context pack builder for `@file`, `@folder`, `@diff`, `@staged`, `@git`, and `@url`.
- Prompt assembly receipt showing stable identity, repo context, memory, skills, ephemeral overlays, model, and provider.
- Session branch and compression controls.
- Searchable local receipt archive.

V1 should remain local-first. Cloudflare can be optional for users who explicitly configure it.

## V2 Roadmap

Once V1 has a reliable local archive and prompt/context controls, build:

- Skills dashboard.
- Receipt-to-skill generation workflow.
- Curator / skill lifecycle dashboard.
- Cron blueprint dashboard.
- Scheduled research and monitoring runs.
- Browser/CDP diagnostics.
- MCP tool marketplace view.
- Trajectory dataset export.
- Successful vs failed run dataset export.
- Multi-agent/subagent tree.
- Kanban board integration.
- API Server / SSE support.
- ACP IDE bridge awareness.

V2 should make TIMMY feel like a cockpit for many runtimes, but it should still treat receipts, approvals, model routes, and context as first-class local artifacts.

## Later / Park Explicitly

These are valuable, but they are scope creep for now:

- Full enterprise governance.
- Full marketplace.
- Custom memory provider.
- Context DAG engine.
- ACP IDE plugin.
- Full cloud SaaS dashboard.
- Browser automation SaaS.
- Multi-agent swarm orchestration.

Parking these keeps the near-term plan sharp: mirror Hermes events, prove work, and make receipts useful.

## Proposed Data Model

Keep these interfaces lightweight and local-first. The implementation can live under a future `src/hermes/` or `src/integrations/hermes/` folder.

```ts
export type HermesRunStatus =
  | 'created'
  | 'running'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface HermesRun {
  id: string;
  sessionId: string;
  status: HermesRunStatus;
  prompt?: string;
  createdAt: string;
  updatedAt: string;
  model?: string;
  provider?: string;
  usage?: HermesModelUsage;
  receiptPath?: string;
}

export type HermesEventType =
  | 'message.delta'
  | 'message.complete'
  | 'tool.start'
  | 'tool.progress'
  | 'tool.complete'
  | 'tool.error'
  | 'approval.request'
  | 'approval.response'
  | 'clarify.request'
  | 'clarify.response'
  | 'sudo.request'
  | 'sudo.response'
  | 'secret.request'
  | 'secret.response'
  | 'model.switch'
  | 'provider.route'
  | 'quota.warning'
  | 'run.error';

export interface HermesEvent {
  id: string;
  runId: string;
  sessionId: string;
  type: HermesEventType;
  timestamp: string;
  payload: Record<string, unknown>;
  severity?: 'info' | 'warning' | 'error';
}

export interface HermesToolCall {
  id: string;
  runId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  args?: Record<string, unknown>;
  resultSummary?: string;
  startedAt: string;
  completedAt?: string;
  receiptEventIds: string[];
}

export interface HermesApproval {
  id: string;
  runId: string;
  kind: 'approval' | 'clarify' | 'sudo' | 'secret';
  status: 'open' | 'approved' | 'rejected' | 'answered' | 'expired';
  title: string;
  message: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  requestedAt: string;
  respondedAt?: string;
  responseSummary?: string;
}

export interface HermesModelUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  latencyMs?: number;
}

export interface HermesProviderRoute {
  id: string;
  runId: string;
  provider: string;
  model: string;
  status: 'selected' | 'succeeded' | 'failed' | 'fallback';
  reason?: string;
  errorCode?: string;
  startedAt: string;
  completedAt?: string;
}

export interface HermesReceipt {
  schemaVersion: '0.1.0';
  runId: string;
  sessionId: string;
  createdAt: string;
  eventLogPath: string;
  eventCount: number;
  toolCallCount: number;
  approvalCount: number;
  modelRoutes: HermesProviderRoute[];
  usage?: HermesModelUsage;
  status: HermesRunStatus;
  receiptSha256: string;
}

export interface HermesContextSnapshot {
  id: string;
  runId: string;
  createdAt: string;
  sources: Array<{
    kind: 'file' | 'folder' | 'diff' | 'staged' | 'git' | 'url' | 'memory' | 'skill';
    ref: string;
    tokenEstimate?: number;
    sha256?: string;
  }>;
  notes?: string;
}

export interface HermesTrajectoryExport {
  runId: string;
  format: 'sharegpt-jsonl';
  createdAt: string;
  eventsPath: string;
  outputPath: string;
  outcome: 'success' | 'failure' | 'mixed';
  redaction: 'none' | 'basic' | 'strict';
}
```

## Suggested UI Components

- `HermesRunTimeline`: renders normalized events in run order with status, time, and severity.
- `HermesEventStream`: subscribes to the JSON-RPC/SSE event mirror and updates local state.
- `HermesApprovalInbox`: shows approval, clarify, sudo, and secret requests with approve/reject/respond actions.
- `HermesToolCallCard`: summarizes a tool call, args shape, progress, result summary, and failure state.
- `HermesCommandReceiptCard`: displays command, cwd, exit code, started/completed timestamps, and output pointer.
- `HermesDiffReceiptCard`: displays file/patch/diff summaries and links to local evidence.
- `HermesModelRouteBadge`: shows active provider, model, health, and fallback status.
- `HermesQuotaSentinel`: detects quota/rate-limit events and suggests configured fallback routes.
- `HermesContextPanel`: builds and previews context from references such as `@file`, `@folder`, `@diff`, `@staged`, `@git`, and `@url`.
- `HermesPromptAssemblyReceipt`: explains the final prompt assembly: identity, repo context, memory, skills, overlays, model, and provider.
- `HermesReceiptExporter`: writes and opens local receipt JSON/HTML.
- `HermesTrajectoryExporter`: exports ShareGPT-compatible JSONL and splits successful vs failed runs.
- `HermesSessionList`: lists local and Hermes-known sessions with status and last event.
- `HermesRunHealthScore`: summarizes warnings, failed tools, open approvals, test state, and merge recommendation.

## Integration Architecture

```text
TIMMY TUI
  -> Hermes TUI Gateway JSON-RPC
  -> AIAgent core
  -> provider runtime resolver
  -> tools/runtime/events
  -> local JSONL receipt
  -> optional Cloudflare Worker/D1/R2 receipt archive later
```

Recommended repo shape:

```text
src/hermes/
  client.ts              # JSON-RPC client and connection lifecycle
  events.ts              # Hermes event types and normalizer
  store.ts               # local in-memory run state reducer
  receipt-writer.ts      # .timmy/hermes-events.jsonl and receipt JSON/HTML
  approvals.ts           # approve/reject/respond request helpers

src/tui/panels/
  HermesPanel.tsx        # top-level run cockpit panel

src/tui/components/hermes/
  HermesRunTimeline.tsx
  HermesApprovalInbox.tsx
  HermesToolCallCard.tsx
  HermesModelRouteBadge.tsx
  HermesQuotaSentinel.tsx
```

The first implementation should avoid new dependencies unless the Hermes Gateway contract requires one. Node's built-in `fetch`, WebSocket support already present through `ws`, and existing `fs` JSONL writing are enough for a first pass.

## Implementation Phases

- [ ] **Phase 0: Repo audit**
  - Confirm exact Hermes TUI Gateway method names, event names, auth, and transport.
  - Confirm whether Gateway streams over JSON-RPC notifications, SSE, WebSocket, or another channel.
  - Confirm expected approval/clarify/sudo/secret response payloads.

- [ ] **Phase 1: JSON-RPC client**
  - Add an isolated Hermes client module.
  - Implement connection status.
  - Implement create session.
  - Implement submit prompt.
  - Keep all Hermes assumptions in one file.

- [ ] **Phase 2: Event capture**
  - Normalize Hermes Gateway events into `HermesEvent`.
  - Append normalized events to `.timmy/hermes-events.jsonl`.
  - Redact obvious secret-looking values before writing.
  - Keep the event writer local-only by default.

- [ ] **Phase 3: Timeline UI**
  - Add a Hermes panel or event timeline section.
  - Render message, tool, approval, model, provider, error, and receipt events.
  - Keep rendering bounded so large event streams do not break the TUI.

- [ ] **Phase 4: Approval UI**
  - Add `HermesApprovalInbox`.
  - Support approve, reject, and text response.
  - Record every response as a local receipt event.

- [ ] **Phase 5: Receipt writer**
  - Generate one local Hermes receipt JSON artifact.
  - Include run id, session id, event count, tool count, approval count, model route, usage, status, and hash.
  - Optionally generate a simple HTML view after JSON works.

- [ ] **Phase 6: Model/provider/cost display**
  - Show active provider and model in the layout or Hermes panel.
  - Show usage and cost when available.
  - Preserve the existing OpenRouter model rail until Hermes routing is real.

- [ ] **Phase 7: Quota/fallback handling**
  - Detect HTTP 429 and quota-exceeded strings.
  - Display `HermesQuotaSentinel` warnings.
  - Record failed route and fallback route events.

- [ ] **Phase 8: Context controls**
  - Display context compression status.
  - Add manual compression request only after status display works.
  - Build a minimal context pack preview from local refs.

- [ ] **Phase 9: Trajectory export**
  - Export a redacted ShareGPT-compatible JSONL file.
  - Split success and failure outcomes.
  - Store export metadata in the local receipt archive.

- [ ] **Phase 10: Launch/demo polish**
  - Add a demo script.
  - Add docs.
  - Add one screenshot/video path.
  - Verify the flow through `npm run timmy -- doctor`, `npm test`, and a manual TUI run.

## Acceptance Criteria

The first shippable MVP is done when:

- A Hermes session can be created from TIMMY.
- A prompt can be submitted from TIMMY.
- Streaming events appear in the UI.
- Tool calls are displayed.
- Approval requests can be responded to.
- Usage, model, provider, and status are visible.
- A local `.timmy/hermes-events.jsonl` file is written.
- One local receipt file is written.
- One receipt can be opened after the run.
- No secrets are printed into logs or receipt examples.
- The app still runs without Hermes configured, showing a clear disconnected state.

## Monetization Notes

Package this as a product ladder:

- **Free:** local run timeline and local JSONL capture.
- **LTD:** signed receipts, approval inbox, and local run search.
- **Pro monthly:** Cloudflare-hosted receipt archive, model cost ledger, quota sentinel, and searchable receipt index.
- **Team:** shared approvals, provider spend policies, trajectory/eval exports, and team receipt review.

The free version should prove the idea instantly. Paid tiers should sell trust, search, signatures, shared review, hosted archives, and spend control.

## Final Recommendation

Build the Hermes TUI Gateway event mirror first.

Do not start with a full dashboard, marketplace, browser automation product, or swarm orchestration system. The first valuable product is much smaller:

1. Connect to Hermes.
2. Start a session.
3. Submit a prompt.
4. Mirror events.
5. Write `.timmy/hermes-events.jsonl`.
6. Render the timeline.
7. Respond to approvals.
8. Export one local receipt.

That is the foundation for every larger TIMMY promise.

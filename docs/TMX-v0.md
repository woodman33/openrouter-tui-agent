# TMX v0 — TIMMY Markdown Extensions

Status: SPEC (not yet implemented) · Owner: will · Depends on: Streamdown, Cloudflare Agents SDK (P4), rmux SDK (P1)

## Thesis

Agents stream **capabilities, not screenshots**. TMX is a small, allowlisted set of
custom tags streamed inline with agent output. Tokens *place* components; the
Durable Object *animates* them (two-channel). Components are bidirectional: they
emit typed events back up the chain (DO → rmux `wait-for`), so forms become
command surfaces and approvals become chat messages.

Renderers (same stream, three surfaces):
- Companion web + carbonyl panes: Streamdown with full React components
- TUI ChatPanel: Ink mini-renderer (parity subset)
- Any AI-SDK client: UIMessageStream parts

## Security model (non-negotiable)

1. Tags are **allowlisted** per surface (`allowedTags`); unknown tags render as inert text.
2. Attributes are **schema-validated at parse** (JSON Schema per tag); bad attrs → inert.
3. Components are **pre-registered React/Ink code**. The model can choose and
   configure; it can never load plugins or execute JS.
4. Sandbox tier (`<sandbox-app sha>`, model-generated UI in an isolated iframe)
   is **v1**, not v0. V0 ships trusted components only.

## Tag set v0

| Tag | Attrs (schema) | Channel-2 state | Back-event |
|---|---|---|---|
| `<receipt>` | `id, sha256, lane, cmd, cost?, ts` | verify-status (SEALED→VERIFIED) | `verify.request` |
| `<approval>` | `lane, cmd, risk: low\|med\|high` | ring state | `approval.grant` / `approval.deny` |
| `<cost>` | `lane, usd` | live gauge (OpenRouter usage via DO) | — |
| `<lane-attention>` | `lane` | ring on/off (attention model) | — |
| `<signal>` | `name` | — | rmux `wait-for -S <name>` (cross-lane rendezvous) |
| `<sceneforge>` | `template, node, params?` | exec progress/preview from MCP | `sceneforge.exec` (validated against CUE contract) |

## Back-event wire format

```json
{ "type": "tmx.event", "tag": "approval", "action": "grant",
  "attrs": { "lane": "3", "cmd": "rm -rf dist" },
  "ts": "2026-08-05T00:00:00Z", "runId": "run_x", "receiptSha": "a3f9…" }
```

DO routes events: approval → lane gate release; signal → rmux wait-for;
sceneforge → MCP tool call (houdini-gen-mcp :9876) after CUE validation.

## Packs (dynamic capability surface)

- Packs = signed npm bundles exporting `{ allowedTags, components }`
  (e.g. `@timmy/receipt-pack`, `@timmy/sceneforge-pack`).
- Surfaces **negotiate** at session start: carbonyl pane = full packs;
  phone/lite = receipts + attention only. Same stream, different capability.
- Registry + third-party packs: v1.

## Phases (agreed build order)

- **P0** TS7 dev loop + OpenRouter cost column in ModelExplorer
- **P1** RmuxManager → `@rmux/sdk`; normalized event bus with command boundaries
- **P2** Emit UIMessageStream; companion consumes via `useChat` (kills polling)
- **P3** Streamdown in companion + carbonyl; TMX tags live; Ink parity renderer
- **P4** Agents SDK DO per run; Queue ingestion; WebSocket sync; hibernation
- **P5** Rust receipt core → napi/Worker-WASM/browser-WASM; public verify; publish spec

## Approval events = training data

Every `approval.grant|deny` is a labeled example (command class × risk × project).
Receipts provide the audit trail. Over time the attention model becomes a
per-project trust model. This dataset is the moat; seal it from day one.

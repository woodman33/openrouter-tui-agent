# TIMMY Roadmap

Public now/next. TIMMY = the Agent Trust OS: every agent run gets a signed,
hash-chained receipt; trust the receipt, not the model.

## Now (shipped, v0.5.x)

- **Receipts**: sha256 hash-chained, ed25519-signed run records; prompt/response
  hashes; usage, cost, latency, error class; failed and denied runs seal too.
- **Environment lock**: OS/arch/tool build-hashes (not version strings) bound to
  every receipt; replay refuses drifted environments.
- **Replay**: EDL cut-lists replay clips from the manifest alone; portable
  `.agentrun` bundles (EDL + manifest + sources + hashes + receipts) with OTIO
  interchange.
- **Approvals & spend**: operator tokens bound to the complete immutable plan
  hash (single-use, expiring); paid routes default-deny; per-plan spend caps.
- **Judge loops**: local-first multi-model fan-out with confidence-gated
  frontier escalation; child + parent receipts per loop.
- **Command Post**: typed DispatchPlan (CUE-validated) with lifecycle; six
  delegation tools; J-BANG dispatch rail in the TUI; browser companion survey
  surface.
- **Harness lanes**: OpenHands (disposable-sandbox-or-nothing), OpenCode, Pi,
  jcode, minds + tmux/zellij/rmux multiplexing.
- **MCP surface**: 23 tools for any MCP-speaking agent; composed `timmy-agent`
  server; client-exec bridge.
- **API lanes**: OpenAPI invoker (any digestible spec → receipted tools),
  3minapi, Apify, Allyson, Roboflow observer (key-gated, honest
  not_configured until keys are set).
- **CLI**: `timmy` / `timmy-tui` / `timmy-agentops` + verbs: demo, proof, clip,
  export otio|agentrun, events (--otlp), mcp serve, logs, approve, epoch, q
  (dasel across json/yaml/toml/xml/csv).

## Next

- **Receipt browser**: timeline web UI over the receipt chain with verify
  buttons (the companion becomes the viewer).
- **Mission Map**: tldraw canvas compiling into the DispatchPlan controller —
  Task Capsule, harness-slide, gate, dependency, artifact-handoff and
  result/receipt nodes; rendered in-terminal via carbonyl.
- **OpenHands deeper**: SDK-bridge structured events with usage/cost on
  receipts; TIMMY registered as an MCP server inside openhands.
- **Roboflow MCP entry** + observer evidence attached to demos automatically.
- **Film workflows**: OpenTimelineIO + HyperFrames + Remotion editing spine;
  OpenEdit joins that spine.
- **3D workflows**: Cocos 4 CLI, Defold, Godot, Blender, Unity CLI, Unreal MCP,
  Houdini MCP as receipted lanes; Cloudflare Code-Mode 2-call surface over big
  tool catalogs.
- **More API lanes**: stored-key integrations (WebContainers, Retool,
  AnythingLLM, LangSmith, Abacus) and OpenRouter SDK / agents SDK + bodybuilder
  fan-out + fusion as first-class lanes.

## Later

- Hosted receipt portal (verify links for outsiders).
- Agent labor exchange demo (receipts as the trust substrate).
- T2 config layer: `timmy.yaml`, config sync, generated shell integration,
  capture-time redaction, first shell-command receipt.

Honesty clause: anything unavailable reports `not_configured | blocked` and
seals a receipt saying so. No fabricated passes, ever.

---

## Appendix: early milestone history (v0.1–v0.3 framing, superseded)

- v0.1 Local Receipts MVP — shipped (demo receipts, proof stubs, replay.md,
  `timmy` CLI, CI/release workflows).
- v0.2 Real-World Execution — delivered through other surfaces: command
  capture via lanes + event bus; provider metrics on receipts; CF worker
  deployments remain owner-gated.
- v0.3 Sealed Distributed Trust — local TUI viewer shipped (8 tabs + LOGS);
  signed receipts shipped (ed25519); hosted vault + team audit remain in
  "Later" above.

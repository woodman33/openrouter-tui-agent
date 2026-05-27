# OpenHands Research Alignment

Founder Terminal aligns with OpenHands V1 as an application/control-plane layer, not as a replacement agent framework.

## Confirmed OpenHands V1 primitives

- Event-sourced state model
- Typed Action → Execution → Observation tool system
- MCP integration
- LocalConversation for local execution
- RemoteConversation through Agent Server
- Docker/remote workspace support
- REST/WebSocket event streaming
- Multi-LLM routing through LiteLLM-compatible providers
- Security analyzer and confirmation policies
- Context condensation and persistence
- Secrets management with masking

## Founder Terminal mapping

- Textual/Rich cockpit → user-facing application layer
- Custom visualizer/event bus → OpenHands event stream consumer
- `.runs` and `.agentrun` → replay/audit layer
- X-CMD shell adapter → portable tool substrate
- abtop → external Claude/Codex/OpenCode sidecar monitor
- tmux/x tmux → repeatable operator workspace
- Starship → optional Claude Code statusline telemetry
- hooks → local safety gates and host mutation controls

## Risk policy

Headless OpenHands is marked HIGH RISK because official docs state it always runs in always-approve mode.
Docker or isolated-copy execution is required before using headless mode for write-capable jobs.

## Next implementation targets

1. Rename fallback concepts to execution modes.
2. Add OpenHands Mode Matrix to TUI.
3. Add headless risk warning.
4. Stub Local Agent Server mode.
5. Stub DockerWorkspace mode.
6. Preserve local SDK mode as default V1 path.

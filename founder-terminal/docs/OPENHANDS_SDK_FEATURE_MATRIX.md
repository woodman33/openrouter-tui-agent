# OpenHands SDK Feature Matrix for Founder Terminal

Founder Terminal is an application/control-plane layer over OpenHands V1.

## Core alignment

| OpenHands SDK capability | Founder Terminal implementation | Status |
|---|---|---|
| Event-sourced state | .runs/<run_id>/normalized_events.jsonl | partial |
| Custom visualizer | founder_terminal.openhands_integration.visualizer | implemented |
| LocalConversation | local SDK runner | partial |
| RemoteConversation | Local Agent Server adapter | parked |
| DockerWorkspace | Docker isolated execution mode | parked |
| REST/WebSocket Agent Server | remote/server execution mode | parked |
| Typed tools | RepoMapTool, ShipabilityScoreTool, XCmdTool | partial |
| MCP tools | MCP Manager screen | parked |
| Security analyzer | Risk policy + hooks | partial |
| Confirmation policy | user approval gates | partial |
| Secrets masking | log redaction layer | missing |
| Static context files | .openhands/skills and AGENTS.md | partial |
| Context condensation | long-run condenser awareness | parked |
| Pause/resume | run controls | parked |
| ask_agent() sidebar | Ask Agent telemetry panel | partial |
| Stuck detection | agent health card | missing |
| Auto titles | run title generator | missing |
| Metrics/cost tracking | cost meter | partial |
| Persistence/restore | .agentrun replay bundles | partial |
| QA suite | py_compile + dry-run tests | partial |

## Immediate V1.1 priorities

1. Add secret redaction to all run logs.
2. Add OpenHands Readiness screen.
3. Add run title generation.
4. Add execution mode matrix.
5. Add Local Agent Server stub.
6. Add DockerWorkspace stub.
7. Add QA command: founder-terminal doctor.

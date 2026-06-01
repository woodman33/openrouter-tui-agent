# RMUX Workspace Evidence

RMUX is an optional installed capability for TIMMY. It is treated as TIMMY's future Workspace Evidence Backend, not as a replacement for the current tmux runner.

TIMMY launch behavior remains tmux-first. The current app must start and run without RMUX installed.

## Launch Boundary

- RMUX is optional.
- RMUX is not required for app startup.
- TIMMY does not execute live RMUX sessions yet.
- TIMMY does not replace tmux with RMUX.
- TIMMY does not add `ratatui-rmux` to the React Ink UI.
- TIMMY does not change receipt schemas for RMUX in this pass.

The only safe runtime check in this release is detection:

```bash
command -v rmux
rmux --version
```

If `rmux --version` is not supported by the local install, TIMMY may use a version-only fallback such as `rmux -V`. It must not create panes, attach sessions, run commands, or capture private terminal state during detection.

Version detection should use a short timeout and must not start the daemon, create sessions, inspect panes, or attach to any existing terminal state.

## Doctor Output

`timmy doctor` reports RMUX readiness without requiring RMUX:

```text
RMUX Installed: YES
RMUX Version: rmux 0.3.1
Required for launch: NO
Role: optional Workspace Evidence Backend
```

No secrets, local credentials, terminal captures, private paths, or session payloads should be printed by the doctor check.

If RMUX is not installed, the doctor check must report Installed: NO and continue successfully. Missing RMUX is not a launch failure.

## Future Evidence Capabilities

RMUX can become the workspace evidence backend when TIMMY is ready to record richer proof around agent workspaces.

Future capabilities include:

- visible terminal locators
- visible assertions
- quiet-state waits
- pane screenshots and captures
- JSONL terminal traces
- PaneSet orchestration
- OwnedSession cleanup
- detached sessions

Future command names:

- `timmy rmux doctor`
- `timmy rmux capture`
- `timmy rmux trace`
- `timmy rmux paneset-preview`

These commands remain disabled or documentation-only until explicit user-triggered capture and redaction are implemented.

These capabilities map naturally to TIMMY's governance principle: proof that agents behaved.

## Relationship to Tmux

Tmux remains the active launch runner. It owns current pane orchestration, command dispatch, local capture, and receipt event translation.

RMUX should be introduced later as an evidence layer beside tmux, not as a breaking replacement. A future integration can compare tmux command events with RMUX-visible assertions and terminal traces.

## Receipt Strategy

This pass does not change the receipt schema.

Future RMUX evidence should use an extension-safe optional block if receipt integration becomes necessary. That block should be additive, nullable, and ignored by older readers.

Potential future fields:

```json
{
  "workspace_evidence": {
    "backend": "rmux",
    "trace_ref": "optional-jsonl-trace-id",
    "pane_set_ref": "optional-pane-set-id",
    "assertion_count": 0,
    "capture_count": 0
  }
}
```

Do not write this block until the receipt reader and redaction flow explicitly support it.

## Safety Rules

- Do not capture private terminal panes without explicit user action.
- Do not publish JSONL traces by default.
- Do not include raw command output in public docs.
- Do not print local paths, hostnames, tunnels, or credentials.
- Do not require RMUX for local TIMMY usage.
- Do not let RMUX alter provider routing, AgentPass policy, context registry behavior, Cloudflare bindings, or app startup.

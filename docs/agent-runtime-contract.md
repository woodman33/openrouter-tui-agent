# Agent runtime contract

TIMMY uses one runtime contract for local CLI agents, in-process SDKs, and remote agent services. Vendor adapters must not bypass this layer to launch commands or mutate a workspace.

## Lifecycle

1. `detect()` reports installation, configuration, and version readiness without executing a task.
2. `plan()` resolves the workspace, risk class, command arguments, and approval requirement.
3. TIMMY obtains explicit operator approval when `approvalRequired` is true.
4. `execute()` emits normalized events and returns a transport-neutral result.
5. TIMMY translates events and results into the `.agentrun` receipt rather than asking each vendor adapter to invent a receipt format.

The initial transports are `spawn`, `sdk`, and `remote`. Spawn uses argument arrays with `shell: false`. SDK and remote integrations use the callback adapter so their native streaming and cancellation APIs can be normalized without pretending they are local processes.

## Initial runtime scope

- Pi and OpenHands are executable spawn profiles.
- OpenRouter Agents is an SDK profile awaiting binding to the existing TIMMY Agent client.
- Kimi Code and OpenCode are thin spawn profiles, not independent subsystems.
- Hermes, Qwen Code, Kilo Code, Cline, Cursor, KimiClaw, Genspark Claw, Crush, and Devin are capability-aware profiles. Remote and SDK profiles intentionally fail closed until configured.

Profiles marked `planned` are discovery metadata, not claims that a vendor integration is complete. Command arguments must be verified against the installed vendor version before a planned spawn profile is promoted to `mvp`.

## Safety boundary

All write-mode requests require approval. A runtime with a mutating risk classification also requires approval even when the request is not explicitly marked write-capable. The transport rejects unapproved plans before creating a process or making an SDK/remote call.

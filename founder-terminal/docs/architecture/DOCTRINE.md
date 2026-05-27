# TIMMY AgentOps TUI — Architecture Doctrine

Welcome, operator / agent. This document establishes the absolute architectural source of truth for **TIMMY: The Agent Ops Console / Founder Terminal**. Any coding agent or developer mutating this repository is strictly bound by these rules to prevent code drift and architectural regression.

---

## Product Thesis
TIMMY is an interactive **AgentOps Control Plane and TUI Cockpit**, not a flashy ANSI art toy. It is built to organize, supervise, audit, and safely run AI coding agents. Its primary value is the high-density process orchestration layer: enabling developers to run multiple autonomous agents, check cost telemetry, approve high-risk shell actions, and inspect run replays without leaving the terminal.

---

## Five-Layer Boundary Rules
Terminal operations are strictly partitioned into five ascending layers to separate concerns:
1. **Layer 0 (x-cmd)**: The underlying shell command vocabulary substrate (POSIX/AWK). Refuses Ratatui/Bubble Tea replacement roles. Exposes tools natively.
2. **Layer 1 (tmux + Ghostty)**: Multiplexing and session persistence. Handles terminal pixel rendering and remote session resilience.
3. **Layer 2 (Core TUI Tools)**: Developer toolkit (Neovim/LazyVim, lazygit, Helix, fzf, delta, btop++, lnav, k9s, atuin, zoxide, starship).
4. **Layer 3 (AI Agents)**: Autonomous worker intelligence (OpenHands, Claude Code).
5. **Layer 4 (Edge Compute)**: Global edge worker state orchestration (Cloudflare Workers, OpenRouter models mesh).

---

## Safety Rules
* **Zero Silent Mutating**: The TUI must never modify host files silently. Any mutation (such as Starship statusline or x tmux setups) requires explicit operator approvals.
* **Mandatory Backups**: Every write to host configuration files or project `.env` files must strictly create a timestamped backup first (e.g. `.env.backup-YYYYMMDD_HHMMSS`).
* **Secret Redaction**: High-security keys (such as `OPENROUTER_API_KEY`) must never be written to plaintext log manifests. They must be recursively redacted as `sk-or-v1-...LAST4`.
* **Owner Permissions Only**: Project `.env` files must be locked to `chmod 600` (read/write for owner only) when modified by our writer modules.

---

## Agent Runtime Rules
* AI agents (OpenHands CodeActAgent) execute tasks autonomously inside isolated workspaces.
* Background execution uses headless runs (`openhands --headless -t "task"`), which default to always-approve mode. This requires strict process sandboxing and tool-use filters.
* Foreground interaction is managed by Claude Code paired with local shell adapters.
* Observability is maintained via `abtop` processes monitoring and append-only event log streaming.

---

## Model Routing Rules
* All LLM inference routes through **OpenRouter**'s gateway (300+ models, 60+ providers) using the `@openrouter/agent` SDK or OpenAI-compatible wrappers.
* **Auto Exacto**: Adaptive routing is enabled by default to optimize tool calling quality.
* **Dynamic Budgeting**: Real-time spent cost tracking restricts premium loops. Crossing the limit shifts routing to cheap coder models (`qwen/qwen-2.5-coder-32b`) or emergency low-cost flash targets (`google/gemini-2.5-flash`).
* **Caching**: Context caching (`X-OpenRouter-Cache`) is enforced on large prompt templates to keep billing extremely low.

---

## Edge Rules
* **Cloudflare Workers** act as the global execution fabric.
* STATE is handled natively by edge Durable Objects (DOs) utilizing sequential SQLite storage and WebSocket hibernation APIs.
* Episodic memories persist in D1 serverless DBs with global replicas, while semantic memories are indexed using Vectorize vector indices.
* Remote tools connect over the Model Context Protocol (stateless createMcpHandler, stateful McpAgent, or raw streamable transport).

---

## Completion Rules
* We focus exclusively on the **2-week MVP** of the local AgentOps Policy Console.
* The localTextual cockpit dashboard, OpenRouter fallback, and local sandbox event stream are delivered as complete features before any complex remote edges are wired up.

---

## Anti-Scope-Creep Rules
* **Reject Backend Swamp**: Do not build Cloudflare memory synchronization, vector RAG indexers, or complex team authentications during local sprints.
* Maintain a highly constrained, local-only focus. The MVP must remain fast, standalone, and completely testable under local macOS virtual environments.

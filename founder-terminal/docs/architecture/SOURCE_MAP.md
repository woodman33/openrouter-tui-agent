# TIMMY Architecture — Source Map

This document establishes the verified source map mapping our technical claims and 5-layer components directly to their official documentation, repositories, and specifications.

---

## Layer 0: x-cmd Shell Substrate
* **Claim**: AWK + Shell-based environment with 385+ modules, 597+ packages, and an on-demand `x agent` under 2MB.
* **Sources**:
  * Official Modules Index: https://www.x-cmd.com/mod/
  * x-cmd GitHub Repository (4.4K+ Stars, Apache-2.0): https://github.com/x-cmd/x-cmd
  * `x agent` specifications and prompts: https://x-cmd.com/mod/agent/
  * AWS/Aliyun modules status: https://x-cmd.com/mod/aws/ | https://x-cmd.com/mod/ali/

---

## Layer 1 & 2: tmux & Zellij Workspace
* **Claim**: Persistent tmux window persistence (`tmux-resurrect`, `tmux-continuum`), Ghostty GPU-acceleration, and zellij WASM layouts.
* **Sources**:
  * Ghostty Terminal Specs & Mitchell Hashimoto release: https://ghostty.org/docs/features | https://github.com/mitchellh/ghostty
  * Zellij KDL layouts & WASM plugins: https://zellij.dev/documentation/layouts.html | https://github.com/zellij-org/zellij
  * Sesh fuzzy session switcher: https://github.com/joshmedeski/sesh
  * Tmux Plugin Manager (TPM): https://github.com/tmux-plugins/tpm
  * Tmux Resurrect session persistence: https://github.com/tmux-plugins/tmux-resurrect

---

## Layer 3: AI Agents & OpenHands
* **Claim**: OpenHands autonomous coding loops (~77% on SWE-Bench Verified), headless CLI runner, and event-sourced event log architecture.
* **Sources**:
  * OpenHands GitHub Repository (69K+ Stars, MIT): https://github.com/AllHandsAI/OpenHands
  * OpenHands V1 SDK Paper (arXiv 2511.03690): https://arxiv.org/abs/2511.03690
  * OpenHands CLI & Headless specs: https://docs.openhands.dev/openhands/usage/cli/headless
  * MCP server add commands: https://docs.openhands.dev/openhands/usage/cli/mcp-servers

---

## Layer 4: Edge compute & OpenRouter
* **Claim**: OpenRouter model routing (300+ models, 60+ providers), `@openrouter/agent` callModel SDK, Auto Exacto routing, and Durable Objects state.
* **Sources**:
  * OpenRouter Models Catalog: https://openrouter.ai/models
  * OpenRouter Agent SDK callModel specs: https://openrouter.ai/docs/sdks/typescript/call-model/overview
  * Auto Exacto Adaptive Quality Routing: https://openrouter.ai/announcements/auto-exacto
  * Cloudflare Agents SDK v0.1.0: https://developers.cloudflare.com/agents/
  * Cloudflare Durable Objects WebSocket hibernation: https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  * Cloudflare D1 Database & Vectorize specs: https://developers.cloudflare.com/d1/ | https://developers.cloudflare.com/vectorize/

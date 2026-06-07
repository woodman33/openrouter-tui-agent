## Learned User Preferences

- When implementing an attached plan: follow it as written; do not edit the plan file; complete linked todos without stopping midway.
- Extend the codebase additively—preserve existing TIMMY, founder-terminal, governance, and receipts behavior when adding TUI, Rive, or Cloudflare work.
- Ship a polished OpenRouter + Rive experience (companion/web window, terminal image protocols, ANSI text fallback); plain ASCII-only terminal UI is not the target.
- Integrate Cloudflare platform features (Workers, wrangler, Agents SDK, Sandboxes, MCP, Pages, email) when they materially improve the CLI/TUI.
- Use attached skills (`create-agent-tui`, `benchmark-sandbox`, Cloudflare build/MCP skills) when scaffolding agents, running remote evals, or extending Workers/MCP.
- Validate UI and agent flows in isolated sandboxes (Vercel Sandbox and/or Cloudflare Sandbox) with comparable prompts before claiming readiness.

## Learned Workspace Facts

- `/Users/williammeldman/Desktop/openrouter-tui` is the primary repo for **TIMMY TUI** (terminal-first Agent Trust OS), not a greenfield scaffold.
- Git remote: `https://github.com/woodman33/openrouter-tui-agent.git`; common active branch: `antigravity/polish-tui-v2`.
- Antigravity is the IDE; all project source lives in this repo—no separate Antigravity-only codebase.
- Core stack: Ink TUI + `@openrouter/agent`, with Rive graphics, companion web UI, and headless-browser capture as major product axes.
- Monorepo includes `founder-terminal/`, Cloudflare wrangler companion worker, product doctrine docs, and `.runs/run_proof_*.agentrun/` proof manifests.
- Published CLIs: `timmy` and `openrouter-tui` (see root `package.json`).

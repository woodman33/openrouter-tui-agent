TERMINAL 100 — The 100 Most Powerful Terminal TUIs, CLIs & Software
Compiled for the Timmy TUI project — an advanced multi-agent TUI (Node/TS, 8 agent lanes, receipts, Cloudflare D1/R2, OpenRouter, Ollama fallback) running on a fleet of: macOS M5 Max · Linux RTX 5090/4090/5080 · 3× NVIDIA DGX Spark (GB10, 128GB unified) · Raspberry Pi 5s.
Methodology
This catalog was compiled by a 6-agent research swarm (C1–C6), each agent owning one domain, with findings merged, de-duplicated, and re-ranked by the catalog compiler:
C1 — Terminal core: emulators, multiplexers, TUI frameworks, terminal-in-browser
C2 — AI coding agents & LLM CLIs (terminal-native)
C3 — Multi-agent orchestration, MCP tooling, agent communication
C4 — Prompt engineering, evals & self-learning/optimization
C5 — AI media generation CLIs + model-training/data tooling
C6 — Logs/observability, modern shell, data, git, network power tools
Star counts are approximate, verified "as of 2026-08" via the GitHub REST API (queried 2026-08-13/14) unless otherwise noted; figures drift daily. ★ n/a means no verified count exists (non-GitHub canonical repo or closed source). Register-table figures marked ~ are estimates from secondary indices.
Labels: [PROVEN] verified active/popular · [ASPIRATIONAL] real but young/pre-1.0/niche · [SPECULATIVE] weak or conflicting evidence · [DEAD/SUNSET] archived, retired, or superseded · ⚠️ slowing cadence.
How to read this catalog
The 100 numbered blocks are the spine. Each block: one-line power statement, then a metadata line (install | ★ stars | status | repo URL), then 1–2 sentences on why it matters plus a Timmy/fleet integration note (which machine, lane, or pane it belongs to).
Each section opens with a summary table and closes (where useful) with a register table of evaluated-but-not-ranked tools — dead tools stay visible so you never build on a corpse.
Numbering is continuous 1–100 across the eight sections. Ranks reflect power for a builder of a multi-agent terminal TUI on this specific fleet, not raw popularity.
Every "dead/sunset" callout is deliberate and verified: gemini-cli→Antigravity, mods→crush, exa→eza, piper→piper1-gpl, MinIO→SeaweedFS, Swarm→Agents SDK, MCP reference-server archives, and the LiteLLM supply-chain breach (pin ≥1.83.0).
SECTION 1 — TERMINAL EMULATORS & MULTIPLEXERS (12)
Table

# Tool Kind Stars (2026-08) Status

1 Ghostty emulator ~59.6k [PROVEN]
2 kitty emulator ~34.4k [PROVEN]
3 Alacritty emulator ~65.4k [PROVEN]
4 WezTerm emulator+mux ~28.3k [PROVEN, stable stale]
5 cmux agent terminal ~26.0k [PROVEN]
6 tmux multiplexer ~48.6k [PROVEN]
7 zellij multiplexer ~34.9k [PROVEN]
8 rmux agent mux ~2.6k [ASPIRATIONAL]
9 vtm TUI desktop ~3.4k [PROVEN]
10 term.everything GUI→TUI ~8.1k ⚠️ cooling
11 foot Wayland emulator ~2.1k (Codeberg) [PROVEN]
12 rio emulator ~7.3k [PROVEN]

1. Ghostty — Mitchell Hashimoto's GPU-native Zig terminal; libghostty is becoming an embeddable rendering engine (cmux is built on it)
brew / snap / binary | ★ ~59.6k | [PROVEN] v1.3.1 tag 2026-03-13, commits daily | <https://github.com/ghostty-org/ghostty>
Now under Hack Club 501(c)(3) governance; releases ship via tags/site, not GitHub Releases. libghostty embedding makes it infrastructure, not just an app. Timmy: primary dev terminal on the M5 Max; its rendering conformance is the bar Timmy's panes must clear.
2. kitty — the GPU terminal that defined the kitty graphics protocol + kittens (icat, ssh, diff) — the image protocol every serious TUI targets
brew / curl installer | ★ ~34.4k | [PROVEN] v0.48.2 (2026-07-30), very active | <https://github.com/kovidgoyal/kitty>
Single-author risk (Kovid Goyal) but near-daily commits; Ghostty/WezTerm/Konsole all implement its graphics protocol. Timmy: implement kitty-protocol image output for media previews in lanes; test on M5 Max and Linux fleet.
3. Alacritty — the minimal OpenGL reference terminal; its alacritty_terminal core is reused as a PTY-emulation crate by other apps
brew / cargo | ★ ~65.4k | [PROVEN] v0.17.0 (2026-04-06), active | <https://github.com/alacritty/alacritty>
Deliberately no tabs/splits — for a TUI builder it is the conformance baseline. Timmy: escape-sequence CI target; if Timmy renders clean in Alacritty, it renders clean anywhere.
4. WezTerm — Lua-scriptable GPU terminal with a built-in multiplexer (incl. remote SSH domains) — a mux and emulator in one
brew / cargo | ★ ~28.3k | [PROVEN] stable stale (20240203); nightlies active, repo pushed 2026-08 | <https://github.com/wezterm/wezterm>
The only terminal supporting all three image protocols (kitty, sixel, iTerm2). The stable-release drought since 2024-02 is a real planning risk — track nightlies. Timmy: its remote SSH domains are a model for driving DGX Spark panes from the M5 Max.
5. cmux — Ghostty-based macOS terminal purpose-built for AI agents: vertical tabs, socket API, read-screen, notifications
brew tap manaflow-ai/cmux | ★ ~26.0k (in ~6 months) | [PROVEN] launched 2026-02 (#2 on HN), pushed 2026-08-14, AGPL-3.0, macOS-only | <https://github.com/manaflow-ai/cmux>
Verdict (C1): REAL. Its socket API (read-screen, send, workspaces) is directly relevant to multi-agent orchestration. Community clones (limux, seemux, wmux) are wire-compatible for Linux. Timmy: study/steal the socket-API design for lane control; run agent sessions in cmux workspaces on the M5 Max.
6. tmux — the terminal multiplexer standard since 2007; the client-server detach model every agent harness assumes
brew / apt | ★ ~48.6k | [PROVEN] 3.7b (2026-07-01), pushed 2026-08-12 | <https://github.com/tmux/tmux>
Control mode (tmux -C) is the programmatic interface agent tools should use — Claude Code teams, terminal-bench, and amux all build on it. Timmy: the default lane substrate on Linux boxes; 8 lanes = 8 tmux panes/windows with control-mode supervision.
7. zellij — batteries-included Rust mux: layouts-as-KDL, WASM plugin system — plugins are a distribution channel for agent tooling
brew / cargo | ★ ~34.9k | [PROVEN] v0.44.3 (2026-05-13), active | <https://github.com/zellij-org/zellij>
The WASM plugin sandbox is a safe third-party extension model worth copying. Timmy: KDL layout files can declaratively spawn the 8-lane grid; a Timmy zellij plugin could render receipts in a sidebar.
8. rmux — Rust tmux-compatible (90+ commands) mux engine with typed SDKs (Rust/Python/TS), ratatui widget, E2E web share — designed explicitly for multi-agent orchestration
cargo / npm @rmux/sdk / pip librmux | ★ ~2.6k (423★ in week 1) | [ASPIRATIONAL] v0.2.0 public preview (2026-05-18), repo created May 2026, pushed Aug 2026 | <https://github.com/Helvesec/rmux>
Verdict (C1): PREVIEW — real but pre-1.0, "bugs expected". The typed TS SDK (@rmux/sdk) is exactly the agent-facing surface a Node/TS TUI wants. Timmy: evaluate as tmux replacement for lanes; do not bet production on it yet.
9. vtm (Monotty/desktopio) — a text-based desktop environment: a multiplexer that renders a full windowing TUI desktop, shareable over sockets
brew / cargo / binary | ★ ~3.4k | [PROVEN] v2026.07.30, active | <https://github.com/directvt/vtm>
Niche but conceptually unique: a TUI desktop with multi-user sessions over sockets — a whole session model for agent fleets, under-explored for agent dashboards. Timmy: design study for multi-pane tiling + session sharing; prototype on a Linux RTX box.
10. term.everything — Wayland compositor that renders GUI apps into the terminal (even over SSH) — run Firefox/Doom in a TUI via chafa + image protocols
AppImage binary | ★ ~8.1k | ⚠️ beta 0.5.x (Sep 2025); last push 2026-03 — cooling/stale; rewritten TS/Bun → Go+C; AGPL-3.0 | <https://github.com/mmulet/term.everything>
Verdict (C1): real, impressive, but development is slowing — treat as stale-beta. macOS usage requires a Linux VM/SSH target. Timmy: renders a browser pane inside the TUI on Linux fleet boxes for visual verification of agent-built web apps.
11. foot — the fast, minimal Wayland-native terminal with sixel support; de-facto standard for Linux Wayland fleets
dnf / apt / AUR | ★ ~2.1k (Codeberg, not GitHub) | [PROVEN] updated 2026-08-11 | <https://codeberg.org/dnkl/foot>
Wayland-only; irrelevant on macOS but the Linux-fleet default. Timmy: standard emulator on the RTX 5090/4090/5080 workstations under Wayland.
12. rio — Rust terminal built on its own Sugarloaf renderer; fast-moving, WASM ambitions
brew / cargo | ★ ~7.3k | [PROVEN] v0.5.24 (2026-08-13), very active | <https://github.com/raphamorim/rio>
Ships weekly; APIs churn — ship fast or break. Timmy: watch as a future embeddable renderer; too volatile as a dependency today.
Register (evaluated, not ranked): st (suckless, ★ n/a, ~5k LOC minimal VT reference — design study only) · GNU screen (★ n/a, 5.0.1 2025, use for compatibility not features) · byobu (~1.7k, status-bar layer over tmux/screen) · dvtm+abduco (~1k each, dormant 2023-24, minimalist design study) · tmate (~6.1k, instant tmux sharing; code active, tag stale) · mosh (~14.3k, UDP roaming shell, slow cadence) · Eternal Terminal (~3.8k, v7.0.0 2026-07 — reconnecting SSH with scrollback; pairs with tmux for long-lived agent sessions on the fleet).
SECTION 2 — TUI FRAMEWORKS & RENDERING DEPENDENCIES (12)
Table

# Tool Lang Stars (2026-08) Status

13 OpenTUI TS/Zig ~13.0k [PROVEN] pre-1.0
14 Ink TS/React ~39.6k [PROVEN]
15 ratatui Rust ~22.2k [PROVEN]
16 bubbletea Go ~44.4k [PROVEN]
17 textual Python ~36.9k [PROVEN]
18 xterm.js TS ~21.1k [PROVEN]
19 node-pty / bun-pty TS ~2.0k / ~74 [PROVEN] / [ASPIRATIONAL]
20 tcell Go ~5.2k [PROVEN]
21 notcurses C ~4.7k [PROVEN]
22 chafa / viu / timg C/Rust ~5.1k/~3.3k/~2.7k [PROVEN]
23 asciinema Rust ~17.7k [PROVEN]
24 vhs Go ~20.6k [PROVEN]
13. OpenTUI — Zig-core + TS-React TUI framework from the SST/OpenCode team; powers OpenCode's TUI — the most relevant Node/TS-native modern stack
npm i @opentui/core @opentui/react | ★ ~13.0k | [PROVEN] v0.5.3 (2026-08-13), extremely active; pre-1.0 API churn | <https://github.com/anomalyco/opentui>
Repo moved sst/opentui → anomalyco/opentui. The strongest direct competitor to Ink for a Node/TS builder, battle-tested by the most-starred agent TUI in existence. Timmy: the lead candidate for Timmy's own 8-lane renderer.
14. Ink — React renderer for CLI — the incumbent standard for TS TUIs (used by Claude Code, Gemini CLI)
npm i ink | ★ ~39.6k | [PROVEN] v7.1.1 (2026-07-16), active | <https://github.com/vadimdemedes/ink>
Powers the big AI CLIs; v7 line current. Safe default with the largest hiring/docs surface. Timmy: fallback if OpenTUI's churn bites; many Timmy components will be Ink-portable React anyway.
15. ratatui — the Rust immediate-mode TUI library; successor to the ARCHIVED tui-rs
cargo add ratatui | ★ ~22.2k (tui-rs ~10.9k, archived 2023) | [PROVEN] v0.30.2 (2026-06-19), active | <https://github.com/ratatui/ratatui>
The canonical "dead upstream, community fork won" story (tui-rs archived). Timmy: use for Rust sidecar tools (lane monitors, log widgets like rmux's ratatui widget) on the Linux fleet.
16. bubbletea — Elm-architecture Go TUI framework; the charm ecosystem (lipgloss, bubbles) is the polish benchmark
go get | ★ ~44.4k | [PROVEN] v2.0.8 (2026-07-03), active | <https://github.com/charmbracelet/bubbletea>
v2.x stable line; lipgloss styling is the aesthetic bar every TUI is judged against. Timmy: reference for Timmy's visual design language; Go helper CLIs (receipt viewers) built with it.
17. textual — Python TUI framework with CSS styling + web export (textual-web) — closest to "TUI as a web app"
pip install textual | ★ ~36.9k | [PROVEN] v8.2.8 (2026-06-30), active | <https://github.com/Textualize/textual>
textual-web/cloud export makes TUIs shareable via URL — relevant to terminal-in-browser ambitions. Timmy: Python-side fleet tools (FiftyOne-adjacent curation UIs, harlequin) and a model for publishing Timmy sessions as URLs.
18. xterm.js + @xterm/headless — the browser terminal (VS Code's); the headless addon gives full VT parsing in Node without a DOM
npm i @xterm/xterm @xterm/headless | ★ ~21.1k | [PROVEN] 6.0.0 (2025-12-22), active | <https://github.com/xtermjs/xterm.js>
v6.0 modernized addons under the @xterm scope; @xterm/headless runs the parser in Node — key for snapshot-testing a Node/TS TUI. Timmy: server-side VT parsing for lane screen-state capture + the web-companion view of Timmy sessions.
19. node-pty / bun-pty — spawn real PTYs from JS/TS — the primitive every terminal-in-browser app and agent harness needs
npm i node-pty / bun-pty | ★ node-pty ~2.0k; bun-pty ~74 | node-pty [PROVEN] pushed 2026-08-13; bun-pty [ASPIRATIONAL] v0.4.10 | <https://github.com/microsoft/node-pty> · <https://github.com/sursaone/bun-pty>
node-pty is very actively maintained; bun-pty is young but the only Bun-native option. Timmy: the syscall-level foundation of every agent lane — each lane is a node-pty-spawned PTY piped into the TUI grid.
20. tcell — Go cell-based terminal handling (underpins rivo/tview) — robust portability layer
go get | ★ ~5.2k | [PROVEN] v3.4.1 (2026-07-19), active | <https://github.com/gdamore/tcell>
Quiet, dependable, semver-stable. Timmy: the portability reference when debugging weird escape-sequence behavior across the fleet's mixed terminals.
21. notcurses — C library for maximal terminal graphics (sixel/kitty/unicode blitters) — "character graphics' most vivid output"
dnf / brew / source | ★ ~4.7k | [PROVEN] v3.0.17 (2025-10-28), maintained | <https://github.com/dankamongmen/notcurses>
The outer limit of what a terminal can draw. Timmy: inspiration for the media-preview pane; its blitter abstraction maps directly to kitty/sixel/iTerm2 fallbacks.
22. chafa / viu / timg (+ kitty icat) — the image-to-terminal stack: chafa is the library others embed; viu/timg CLI viewers; icat kitten sets the protocol bar
brew / cargo | ★ chafa ~5.1k (1.18.2, 2026-04); viu ~3.3k (⚠️ last push 2025-12); timg ~2.7k (pushed 2026-08) | [PROVEN] | <https://github.com/hpjansson/chafa> · <https://github.com/atanunq/viu> · <https://github.com/hzeller/timg>
chafa is embedded by term.everything; timg pushes sixel/kitty/iTerm2 coverage; viu maintenance is thin. Timmy: inline image/video-frame previews in lane panes (ComfyUI output thumbnails) via chafa or kitty protocol.
23. asciinema — terminal session recording in a text format (asciicast v3, Rust rewrite) — record/replay agent sessions for debugging + demos
brew / cargo / pip | ★ ~17.7k | [PROVEN] v3.2.1 (2026-06-16), active | <https://github.com/asciinema/asciinema>
The asciicast format is a de-facto interchange for terminal recordings. Timmy: the receipts backbone — record every lane session as asciicast v3, store in R2, replay in a Timmy pane.
24. vhs — declarative "terminal GIF as code": tape files drive a headless terminal to produce demo videos
brew / go install | ★ ~20.6k | [PROVEN] v0.11.0 (2026-03-10), active | <https://github.com/charmbracelet/vhs>
Requires ffmpeg + ttyd under the hood; tape files double as TUI integration tests. Timmy: CI-driven visual regression tests of the Timmy TUI itself, plus marketing demos — tapes live in the repo, render on the 5080 utility box.
Register: blessed/neo-blessed (~11.9k, effectively dead — blessed last push 2024-03, neo-blessed npm frozen 2018; do not build on, historical reference only) · terminal-bench (harness — see #63) · elia (2.5k, dormant Textual LLM TUI).
SECTION 3 — AI CODING AGENTS & MODEL CLIs (18)
Table

# Tool Stars (2026-08) MCP Headless OpenRouter Status

25 OpenCode ~190k ✅ ✅ run/server ✅ [PROVEN]
26 Claude Code ~140k ✅ ✅ -p ❌ [PROVEN]
27 Codex CLI ~104k ✅ ✅ exec ⚙️ [PROVEN]
28 Gemini CLI ~106k frozen — — — [DEAD/SUNSET]
29 Goose ~52.5k ✅ ✅ run ✅ [PROVEN]
30 Aider ~46k ❌ ✅ ✅ [PROVEN]
31 Crush ~26.6k ✅ ✅ run ✅ [PROVEN]
32 Qwen Code ~26.3k ✅ ✅ -p ⚙️ [PROVEN]
33 Pi ~26k ❌ (by design) ✅ -p --json ✅ [PROVEN]
34 OpenHands CLI ~84k ✅ ✅ SDK ✅ [PROVEN]
35 Kilo Code CLI ~25.9k ✅ ✅ ✅ [PROVEN]
36 Kimi Code ~6.4k ✅ ✅ ⚙️ [ASPIRATIONAL]
37 llm ~12.2k ⚙️ ✅ ⚙️ [PROVEN]
38 aichat ~10.3k ✅ ✅ ✅ [PROVEN]
39 Fabric ~43.4k ❌ ✅ pipes ✅ [PROVEN]
40 GitHub Copilot CLI ~11k ✅ ✅ ❌ [ASPIRATIONAL]
41 Cursor Agent CLI proprietary ✅ ✅ routed [PROVEN]
42 Amp proprietary ✅ ✅ ❌ [PROVEN]
25. OpenCode — the most-starred open-source terminal agent; model-agnostic (75+ providers) with TUI + client-server sessions
npm i -g opencode-ai | ★ ~190k | [PROVEN] daily releases (v1.18.x), MIT, 900+ contributors | <https://github.com/anomalyco/opencode>
Headless opencode run, server-mode HTTP API, 44 lifecycle plugin hooks, MCP client, OpenRouter via Models.dev, sessions survive SSH drops. Timmy: the strongest lane-fleet substrate — the default agent process for most of the 8 lanes; its OpenTUI front-end is also Timmy's rendering reference (see #13).
26. Claude Code — Anthropic's reference agent; best-in-class code quality, hooks/subagents/skills ecosystem
npm i -g @anthropic-ai/claude-code | ★ ~140k | [PROVEN] multiple releases/week, v2.1.220, proprietary (source-visible) | <https://github.com/anthropics/claude-code>
Headless claude -p (+ Agent SDK), native MCP, hooks, subagents; Claude-only models, OAuth locked to first-party since Apr 2026. Timmy: reserve one premium lane for Claude Code on hard refactors; supervise via JSON output + hooks into the receipts log.
27. Codex CLI — OpenAI's Rust-rewritten terminal agent with sandboxing and ChatGPT-plan auth
npm i -g @openai/codex | ★ ~104k | [PROVEN] 900+ releases, Apache-2.0 | <https://github.com/openai/codex>
Headless codex exec, MCP, custom providers via config.toml (wire_api="responses"; wire_api="chat" removed Feb 2026), strong Seatbelt/Landlock sandbox. Timmy: the sandbox makes it the safest choice for unattended lanes — run it in the "untrusted task" lane on the Linux fleet.
28. Gemini CLI — Google's 1M-context agent — RETIRED 2026-06-18; successor is the closed-source Antigravity CLI
(was) npm i -g @google/gemini-cli | ★ ~106k frozen | [DEAD/SUNSET] Apache-2.0; free/Pro/Ultra access ended; enterprise Code Assist still works | <https://github.com/google-gemini/gemini-cli>
Sunset callout (verified): historic baseline only. Antigravity CLI is a closed Go binary — do not build 8-lane automation on it. Timmy: keep the repo as a free 1M-context-agent design reference; zero lanes.
29. Goose — Block's Rust agent with YAML recipes, now Linux-Foundation-governed (AAIF), MCP-native and general-purpose beyond code
brew install block-goose-cli | ★ ~52.5k | [PROVEN] v1.45.0, 500+ contributors, Apache-2.0 | <https://github.com/aaif-goose/goose>
70+ MCP extensions, ACP server (drive it from Zed/JetBrains), can itself orchestrate Claude Code/Codex via ACP, headless goose run, recipes = lane playbooks. Timmy: recipes map 1:1 to lane definitions; candidate "meta-lane" that drives other agents via ACP.
30. Aider — the original AI pair programmer; polyglot benchmark leader, mature git-native edits
uv tool install aider-chat | ★ ~46k | [PROVEN] Apache-2.0; ⚠️ slower cadence (last push 2026-05-22), docs lag 2026 models | <https://github.com/Aider-AI/aider>
Fully scriptable (--message, --yes, watch-files mode), any model incl. OpenRouter/Ollama. Timmy: the cheap, reliable lane for mechanical edits — point it at Ollama on a DGX Spark for zero-cost grunt work.
31. Crush — Charm's gorgeous Go TUI agent — continuation of the original Go opencode; LSP + MCP + Agent Skills
npm i -g @charmland/crush / brew | ★ ~26.6k | [PROVEN] v0.85.0, active; FSL-1.1-MIT (converts to MIT after 2 yrs) | <https://github.com/charmbracelet/crush>
Sunset callout: mods (charmbracelet, 4.5k★) was archived 2026-03-09 — "focus our efforts on Crush"; its non-interactive role moved to crush run. Mid-session model switch, OpenRouter supported, MCP stdio/http/sse. Timmy: a beautiful alternate lane agent; its Agent Skills format is worth adopting for lane playbooks.
32. Qwen Code — Alibaba's agent framework forked from Gemini CLI, now multi-protocol (OpenAI/Anthropic/Gemini/Vertex/local)
npm i -g @qwen-code/qwen-code | ★ ~26.3k | [PROVEN] weekly releases, Apache-2.0, last commit 2026-07-23 | <https://github.com/QwenLM/qwen-code>
Headless qwen -p, SubAgents/Agent Teams, MCP, OpenRouter-compatible custom providers; free OAuth tier ended 2026-04-15. Timmy: pairs naturally with Qwen MoE models served by vLLM/SGLang on the DGX Spark cluster.
33. Pi — Mario Zechner's minimalist, fully observable agent harness — self-extensible, zero feature bloat
npm i -g @earendil-works/pi-coding-agent | ★ ~26k+ | [PROVEN] MIT, active (moved org May 2026, v0.74+) | <https://github.com/earendil-works/pi>
Headless pi -p + --json JSONL, session persistence/resume, extension API; deliberately no MCP/subagents (design stance). Timmy: the open-core harness to build custom lanes on — its JSONL stream is the cleanest lane-supervision feed in the catalog.
34. OpenHands CLI — self-hostable Devin-class autonomous SWE; June 2026 "Agent Canvas" drives other agents
pip install openhands-ai / Docker | ★ ~84k | [PROVEN] MIT, very active ($18.8M Series A) | https://github.com/All-Hands-AI/OpenHands
CLI + Python SDK for scripted lanes, Docker sandbox per task, MCP client, ACP hub that can drive Claude Code/Codex/Gemini from one control plane. Timmy: alternative control plane — run its Agent Canvas headless on a DGX Spark for fully autonomous long-horizon lanes.
35. Kilo Code CLI — OpenCode-based CLI from the Roo Code fork family; 0%-markup gateway, 500+ models
npm i -g @kilocode/cli | ★ ~25.9k | [PROVEN] v7.3.x, MIT, very active | https://github.com/Kilo-Org/kilocode
Memory Bank across sessions, per-task specialized agents, Kilo Gateway/OpenRouter routing; inherits OpenCode's headless+server architecture. Timmy: a second OpenCode-compatible lane agent — useful for A/B model-routing cost tests against lane 25.
36. Kimi Code CLI — Moonshot's TypeScript terminal agent for Kimi K2.5; subagents + lifecycle hooks + video input
npm i -g @moonshotai/kimi-code | ★ ~6.4k (successor to kimi-cli ~11k) | [ASPIRATIONAL] MIT, weekly cadence | https://github.com/MoonshotAI/kimi-code
Built-in coder/explore/plan subagents, lifecycle hooks gate tool calls, ACP support, Agent Swarm up to 100 parallel sub-agents at ~1/10 Claude cost. Timmy: the budget-swarm experiment lane — test 100-subagent bursts against Timmy's 8-lane model.
37. llm — Simon Willison's plugin-architecture LLM CLI; v0.32 adds reasoning traces + server-side tools
pip install -U llm | ★ ~12.2k | [PROVEN] Apache-2.0, v0.32 stable 2026-08-04 | https://github.com/simonw/llm
The Unix-philosophy glue: fragments, tool chains, llm.PauseChain human hand-off, hash-keyed SQLite logs. Timmy: the scripted-lane primitive — one-liner model calls inside lane shell pipelines; its SQLite log format is a receipts-design reference.
38. aichat — all-in-one Rust LLM Swiss-army knife: REPL, RAG, agents, function-calling, OpenAI-compatible server
cargo install aichat / brew | ★ ~10.3k | [PROVEN] Apache-2.0, maintained | https://github.com/sigoden/aichat
Headless by design (pipe-friendly), 20+ providers incl. OpenRouter; the built-in proxy server can front a whole lane fleet with one endpoint. Timmy: lightweight model-router sidecar for lanes that only need chat/RAG, not a full coding agent.
39. Fabric — crowdsourced pattern library (extract_wisdom, analyze_*) as composable prompt pipelines
go install github.com/danielmiessler/fabric@latest | ★ ~43.4k | [PROVEN] MIT, Go, active | https://github.com/danielmiessler/fabric
Pattern-as-pipeline design, multi-provider incl. OpenRouter, stdin/stdout-native. Timmy: perfect for specialized non-coding lanes — a "summarize" lane and a "security review" lane running Fabric patterns against OpenRouter.
40. GitHub Copilot CLI — the Copilot coding agent in the terminal; issue-to-merge agent pipeline
bundled w/ Copilot sub / npm i -g @github/copilot | ★ ~11k | [ASPIRATIONAL] Microsoft-backed, active | https://github.com/github/copilot-cli
Deep GitHub integration (issues→PRs), MCP. Timmy: the lane that owns GitHub chores (triage, PR shepherding) while the other seven lanes code.
41. Cursor Agent CLI — Cursor's Composer agent headless — same agent in terminal/CI, with cloud handoff
curl https://cursor.com/install -fsS | bash → agent | ★ n/a (proprietary binary, weekly updates) | [PROVEN] closed | https://cursor.com/docs/cli
Headless CI mode, MCP, /plan /ask modes, routes any model via a Cursor subscription ($20–200). Timmy: worth a lane only if the org already pays for Cursor; otherwise skip.
42. Amp — Sourcegraph spin-out's frontier agent; zero-markup token passthrough, rebuilt "Neo" CLI with a TypeScript plugin API
npm i -g @ampcode/cli | ★ n/a (proprietary; SOC 2; 4.5★/91 G2 reviews) | [PROVEN] closed, weekly cadence | <https://ampcode.com>
MCP client, TS plugin API (events/tools/policy/custom agents), remote agents in cloud "Orbs" ($1.66/hr), subagents; no MCP server, no self-host. Timmy: its TS plugin API is the closest commercial analog to Timmy's lane architecture — study it; use as an overflow lane.
Register (evaluated, not ranked): ShellGPT/sgpt (~12.2k, cheapest NL→shell lane, Ollama-friendly) · Repomix (~26.9k — packs any repo into one AI-friendly file; MCP server; the context-packing layer for every lane; pairs with simonw/files-to-prompt ~3k) · Continue CLI cn (~34k repo-wide, headless BYOK) · Cline CLI (~65k repo-wide, mostly the VS Code extension) · Hermes Agent (NousResearch; claimed 175–224k★ but sources conflict — treat [SPECULATIVE]) · Grok Build ([SPECULATIVE] closed beta, ~$299/mo — design ideas only). Dead/do-not-build: mods ☠️ archived→Crush · Plandex ☠️ dormant/cloud-dead (pin cli/v2.2.1 if ever needed) · Mentat ☠️ archived · elia dormant · community grok-cli superseded.
SECTION 4 — MULTI-AGENT ORCHESTRATION & MCP (14)
Table

# Tool Kind Stars (2026-08) Status

43 ACP (Agent Client Protocol) wire protocol spec ~4.0k [PROVEN]
44 tmux-bridge-mcp pane comms ~95 [ASPIRATIONAL]
45 mcporter MCP→CLI ~4.9k [PROVEN]
46 mcpc MCP client ~750 [PROVEN]
47 mcp-proxy transport bridge ~2.7k [PROVEN]
48 MCP reference servers baseline toolset ~89.6k (repo) ⚠️ mostly archived
49 github-mcp-server MCP server ~32.2k [PROVEN]
50 playwright-mcp MCP server ~36.1k [PROVEN]
51 LangGraph CLI orchestration ~39.6k (repo) [PROVEN]
52 CrewAI orchestration ~57.1k [PROVEN]
53 OpenAI Agents SDK (ex-Swarm) handoffs ~28.6k [PROVEN]
54 Temporal CLI durable exec ~22.3k (server) [PROVEN]
55 mem0 shared memory ~63.2k [PROVEN]
56 amux agent mux ~350 (fragmented) [SPECULATIVE]
43. ACP — Agent Client Protocol — "LSP for agents" (Zed): JSON-RPC over stdio so any client drives any of 30+ agents uniformly
npx @agentclientprotocol/claude-agent-acp (v0.67.0) | ★ spec ~4.0k; claude-agent-acp ~2.4k | [PROVEN] pushed 2026-08-14; ⚠️ zed-industries/codex-acp deprecated → agentclientprotocol/codex-acp (TS) | <https://github.com/agentclientprotocol/agent-client-protocol>
Claude Agent, Codex, Gemini CLI, OpenCode (opencode acp) all speak it; Goose and OpenHands act as ACP hubs. Timmy: the wire protocol for the 8 lanes — spawn each lane agent as an ACP subprocess for uniform sessions, modes, streaming, cancellation.
44. tmux-bridge-mcp — MCP server for cross-pane agent communication: agents read/type/message other tmux panes with an enforced read-act-read guard
npx tmux-bridge-mcp | ★ ~95 | [ASPIRATIONAL] pushed 2026-07-19, active but tiny | <https://github.com/howardpen9/tmux-bridge-mcp>
The most on-pattern entry in this entire catalog: Claude Code, Codex, Gemini CLI, Kimi in tmux panes can literally message each other. Timmy: prototype lane-to-lane messaging here first, then re-implement natively over ACP.
45. mcporter — turns any MCP server into a scriptable CLI/TS API — list, call, and compose MCP tools from the shell; can package MCPs as CLIs
npm i -g mcporter | ★ ~4.9k | [PROVEN] pushed 2026-08-13 (renamed steipete→openclaw); npm 0.13.5 | <https://github.com/openclaw/mcporter>
The canonical MCP→CLI bridge: lane agents without native MCP support (aider, pi) can still invoke any MCP tool via plain shell commands. Timmy: equalizes MCP access across all 8 lanes regardless of each agent's native support.
46. mcpc — Apify's universal MCP CLI client: persistent sessions, progressive tool discovery, OAuth 2.1 + OS keychain, JSON output for jq/xargs pipelines
npm i -g @apify/mcpc (v0.6.0) | ★ ~750 | [PROVEN] pushed 2026-08-12 | <https://github.com/apify/mcpc>
Designed explicitly so agents get full MCP through one Bash tool — token-efficient for lane workers. Timmy: the low-context lane option; JSON output pipes straight into receipts.
47. mcp-proxy — bidirectional transport bridge (stdio⇄StreamableHTTP) with OAuth client-credentials, named multi-server config, Docker image
uv tool install mcp-proxy (PyPI 0.12.0) | ★ ~2.7k | [PROVEN] pushed 2026-07-20 | <https://github.com/sparfenyuk/mcp-proxy>
Aggregates many lane MCP servers behind one endpoint; more actively maintained in 2026 than supergateway (~2.8k★, ⚠️ last push 2025-10), which remains the one-command stdio⇄SSE alternative. Timmy: expose each fleet machine's local stdio MCP servers as network endpoints the central TUI can reach.
48. MCP reference servers (modelcontextprotocol/servers) — canonical stdio servers: filesystem, fetch, memory, sequential-thinking, git, time, everything
npx -y @modelcontextprotocol/server-filesystem etc. | ★ repo ~89.6k, pushed 2026-08-10 | ⚠️ most first-party servers archived to servers-archived (2025) — sqlite/postgres/puppeteer/slack ☠️; only the curated core set remains | <https://github.com/modelcontextprotocol/servers>
Archive callout (verified): check per-server status before committing; named successors exist (playwright-mcp, github-mcp-server, redis/mcp-redis, crystaldba/postgres-mcp). Timmy: the baseline toolset every lane gets for free — files, memory, stepwise reasoning.
49. github-mcp-server — official GitHub MCP (Go): repos, issues, PRs, Actions, code search; remote hosted endpoint available
go install github.com/github/github-mcp-server@latest or hosted URL | ★ ~32.2k | [PROVEN] pushed 2026-08-12 | <https://github.com/github/github-mcp-server>
The standard issue/PR bus: lanes coordinate via GitHub as the shared work queue. Timmy: combined with gh (#89) and Copilot CLI (#40), this is Timmy's external source-of-truth lane plumbing.
50. playwright-mcp — Microsoft's browser-automation MCP: accessibility-tree snapshots (no screenshots needed), multi-browser
npx @playwright/mcp@latest | ★ ~36.1k | [PROVEN] pushed 2026-08-12 | <https://github.com/microsoft/playwright-mcp>
Gives any lane agent browser tooling from the terminal; successor to the ☠️ archived puppeteer reference server. Timmy: the "verify the web app the lane just built" tool; pair with term.everything (#10) to watch it happen in-terminal.
51. LangGraph CLI — langgraph dev/up/build/new: scaffold + run stateful agent graphs locally with checkpointing, hot reload, LangSmith traces
pip install langgraph-cli (0.4.31, "inmem" mode needs no Docker) | ★ repo ~39.6k | [PROVEN] pushed 2026-08-14, very active | <https://github.com/langchain-ai/langgraph>
Production-grade orchestration brains: durable, resumable, human-in-the-loop graph runs. Timmy: the per-lane state machine when a lane outgrows a single agent loop — checkpoint state to D1.
52. CrewAI — role-based crews/flows; crewai create/run/train/test CLI; AMP suite for deploy + observability
pip install crewai | ★ ~57.1k | [PROVEN] pushed 2026-08-14, very active | <https://github.com/crewAIInc/crewAI>
Fastest way to give each lane a declarative role/goal/backstory agent team runnable from the terminal. Timmy: lane persona definitions (researcher/builder/reviewer) with a one-command local run loop.
53. OpenAI Agents SDK (née Swarm) — Swarm's handoff model productionized: agents, guardrails, tracing, MCP support
pip install openai-agents | ★ agents-sdk ~28.6k, pushed 2026-08-14; openai/swarm ~21.9k ☠️ DEPRECATED (README redirects) | [PROVEN] | <https://github.com/openai/openai-agents-python>
Sunset callout (verified): do not build new work on Swarm — the Agents SDK is the sanctioned successor. Timmy: lightweight handoff graphs for lane delegation; its tracing model informs Timmy's receipts schema.
54. Temporal CLI — full workflow-orchestration control from the terminal: temporal workflow start/list/signal, dev server with UI
brew install temporal | ★ cli ~0.4k; server repo ~22.3k, pushed 2026-08-14 | [PROVEN] very active | <https://github.com/temporalio/cli>
Crash-proof long-running agent tasks with signals/queries — the orchestrator survives TUI restarts. Timmy: durable backbone for multi-hour lane jobs (training runs, big refactors); dev server on DGX Spark #1.
55. mem0 — universal memory layer for agents: extract/store/retrieve user+session memories, graph-memory variant, MCP server available
pip install mem0ai | ★ ~63.2k | [PROVEN] pushed 2026-08-13, very active | <https://github.com/mem0ai/mem0>
Plug one memory backend into all lane agents so knowledge transfers between panes. Timmy: shared cross-lane memory — lane 3 instantly knows what lane 7 learned; back it with D1/R2 + a DGX-hosted embedding model.
56. amux — single-file Python "agent multiplexer": run dozens of Claude Code sessions with a self-healing watchdog + shared kanban, web/mobile dashboard
curl installer / cloud.amux.io | ★ ~350 (mixpeek/amux) | [SPECULATIVE] as a category; pushed 2026-08-14, MIT+Commons Clause | <https://github.com/mixpeek/amux>
Verdict (C1): FRAGMENTED namespace, no proven winner — three unrelated "amux" repos (mixpeek ~350★ Python control plane; daveowenatl Rust GUI mux; prettysmartdev Rust TUI for containerized agents, needs Rust 1.94), all small/new (2025-26). Timmy: mine mixpeek/amux for watchdog + kanban ideas; do not depend on any of them.
Register: mcp-cli (IBM/mcp-cli, ~2.0k, interactive MCP debugging client) · supergateway (~2.8k, ⚠️ slowing — stdio⇄SSE bridge) · Cloudflare Code Mode pattern (docs 2026-06; community jx-codes/codemode-mcp — expose only search+execute, "an entire API in 1,000 tokens"; blueprint for lane agents facing huge tool catalogs) · Google ADK (~21.1k, adk run/web/eval/deploy, ADK 2.0 GA) · AutoGen/AG2 (autogen ~60.4k ⚠️ last push 2026-04; ag2 ~4.9k active — prefer AG2 for maintained code) · Letta + Letta Code CLI (~24.2k/~3.0k, self-editing memory lane workers; lettabot ☠️ archived) · Zep/Graphiti (~4.8k/~29.9k, temporal knowledge-graph memory) · Dagger CLI (~16.2k, containerized per-lane sandboxes) · Hatchet (~7.7k), Restate (~4.3k), Trigger.dev (~16.0k), Prefect (~23.6k), Inngest (~5.7k), DBOS (~1.5k) — durable-execution alternatives to Temporal · NATS/natscli (~0.8k), redis-cli (~76.0k), Mosquitto (~11.1k) — lane message-bus options · Speakeasy (~0.4k, generates MCP servers + CLIs from OpenAPI). ☠️ MinIO (61.4k) ARCHIVED 2026-04 → use SeaweedFS (~34.1k, active) weed CLI for S3-compatible lane artifact storage (or Cloudflare R2, which Timmy already has). MCP-TUIKit: not found anywhere — treat as unverified. HTTP+SSE MCP transport ☠️ — use Streamable HTTP.
SECTION 5 — PROMPT ENGINEERING, EVALS & SELF-LEARNING (12)
Table

# Tool Stars (2026-08) License Status

57 DSPy 37.2k MIT [PROVEN]
58 GEPA 6.1k MIT [PROVEN]
59 promptfoo 24.2k MIT [PROVEN] (OpenAI acq.)
60 Langfuse 33.1k MIT core [PROVEN] (ClickHouse acq.)
61 Opik 21.4k Apache-2.0 [PROVEN]
62 DeepEval 17.6k Apache-2.0 [PROVEN]
63 Terminal-Bench / Harbor 2.5k / 4.2k MIT-ish [PROVEN]
64 Outlines 15.6k Apache-2.0 [PROVEN]
65 Instructor 13.7k MIT [PROVEN]
66 LiteLLM proxy 56.3k MIT [PROVEN] ⚠️ pin ≥1.83.0
67 Phoenix 11.0k ELv2 [PROVEN]
68 RAGAS 15.3k Apache-2.0 [PROVEN] ⚠️ slower
57. DSPy — the canonical "self-learning" prompt framework: typed signatures, optimizers (MIPROv2, BootstrapFewShot, GEPA) compile prompts as learnable parameters
pip install dspy | ★ 37,181 | [PROVEN] pushed 2026-08-14, MIT, Stanford NLP | <https://github.com/stanfordnlp/dspy>
Strongest research pedigree (Khattab/Zaharia); dspy.GEPA is now the default optimizer; runs against Ollama/vLLM for fully local loops. Timmy: the self-improvement engine — optimize lane prompts nightly against receipts-scored outcomes on the DGX Spark cluster.
58. GEPA — reflective prompt evolution: the LLM reads full execution traces, mutates text params, Pareto-selects — beats RL (GRPO) at 35× fewer evals
pip install gepa | ★ 6,115 | [PROVEN] pushed 2026-08-14, MIT | <https://github.com/gepa-ai/gepa>
The 2025-26 self-learning breakout (paper 2507.19457); production at Shopify/Databricks/Dropbox; standalone or via dspy.GEPA/Opik/MLflow. Timmy: feed lane receipts (traces) into GEPA to evolve each lane's system prompt — the core "Timmy learns" loop.
59. promptfoo — de-facto OSS CLI for LLM eval + red-teaming: declarative YAML suites, 50+ providers incl. Ollama, 155 red-team plugins (OWASP/NIST/EU-AI-Act)
npm i -g promptfoo | ★ 24,221 | [PROVEN] pushed 2026-08-14, MIT; ⚠️ acquired by OpenAI (ann. 2026-03-09) — license unchanged, governance open question | <https://github.com/promptfoo/promptfoo>
Highest-starred eval tool, CI-native, built-in OTLP trace viewer. Timmy: gate every lane-prompt change with a promptfoo suite in CI; red-team the whole 8-lane config before deploys.
60. Langfuse — self-host-first LLM engineering platform: tracing, prompt versioning, datasets, LLM-as-judge — Docker Compose up in minutes
docker compose up / pip install langfuse | ★ 33,076 | [PROVEN] pushed 2026-08-14, MIT (ee/ gated); acquired by ClickHouse 2026-01-16, MIT + self-host path committed | <https://github.com/langfuse/langfuse>
Most-adopted OSS LLM observability. Timmy: self-host on DGX Spark #3 as the central trace store; every lane emits spans, receipts link to Langfuse trace URLs.
61. Opik (Comet) — full-platform LLM tracing + eval + built-in Agent Optimizer (7 prompt-optimization algorithms incl. GEPA/evolutionary)
pip install opik (+ opik configure) | ★ 21,367 | [PROVEN] pushed 2026-08-14, Apache-2.0, near-daily releases | <https://github.com/comet-ml/opik>
The only platform pairing observability with automated prompt optimization out of the box; cleanest license in the category, free self-host. Timmy: the Langfuse alternative when you want tracing and tuning in one container.
62. DeepEval — "pytest for LLMs": 50+ research-backed metrics (G-Eval, DAG, hallucination, RAG), tests live next to unit tests, CI gating
pip install deepeval | ★ 17,583 | [PROVEN] pushed 2026-08-13, Apache-2.0, v4.0.0 (May 2026), 30M+ PyPI downloads | <https://github.com/confident-ai/deepeval>
Best Python-native eval UX for devs already in pytest. Timmy: unit-test lane behaviors (deepeval test run) alongside Timmy's vitest suite.
63. Terminal-Bench / Harbor — THE benchmark+harness for terminal agents: containerized CLI tasks with verifiable outcomes; Harbor powers the tbench.ai leaderboard
pip install terminal-bench / clone harbor | ★ terminal-bench-1: 2,533; harbor: 4,217 | [PROVEN] harbor pushed 2026-08-13; Stanford/Laude lineage (renamed laude-institute → harbor-framework) | <https://github.com/harbor-framework/terminal-bench-1>
Ranks #2 on the Agentic Benchmark Checklist for rigor (arXiv 2601.11868); its tmux + asciinema-style logging harness is a blueprint for evaluating agent terminal competence. Timmy: the scoreboard — run lane agents through tbench tasks weekly to prove Timmy's orchestration actually helps.
64. Outlines — guaranteed structured generation via constrained decoding (regex, JSON schema, CFGs) — compile-time guarantees, zero prompt retries
pip install outlines | ★ 15,597 | [PROVEN] pushed 2026-08-12, Apache-2.0 | <https://github.com/dottxt-ai/outlines>
The "make the model unable to emit invalid JSON" primitive; outlines-core is embedded in vLLM/SGLang. Timmy: receipts schema enforcement — lane JSON outputs can never be malformed when served via vLLM/SGLang on the Sparks.
65. Instructor — structured outputs as Pydantic models with automatic validation + retry across every provider — the most-copied API pattern in the ecosystem
pip install instructor | ★ 13,728 | [PROVEN] pushed 2026-08-09, MIT (moved jxnl → 567-labs) | <https://github.com/567-labs/instructor>
Lightest-weight typed LLM output; Python/TS/Go/Rust/Elixir ports. Timmy: TS port for the Node core — typed receipts from OpenRouter calls without a local model.
66. LiteLLM (proxy) — one OpenAI-compatible proxy/gateway for 100+ providers: virtual keys, budgets, fallbacks, spend tracking
pip install 'litellm[proxy]' — PIN EXACT VERSION | ★ 56,297 | [PROVEN with security caveat] pushed 2026-08-14, MIT | <https://github.com/BerriAI/litellm>
⚠️ Breach callout (verified): 2026-03-24 PyPI supply-chain attack (TeamPCP via poisoned Trivy action) backdoored v1.82.7/1.82.8 — .pth malware, ~40k downloads; follow-up reporting attributes 2,500+ orgs / 434k pipelines exposed (Hudson Rock, 2026-08-12). Plus CVE-2026-42208 pre-auth SQLi (CISA KEV, May 2026). Clean since v1.83.0 (CI/CD v2 + Trusted Publishers). Timmy: still the most powerful local routing fabric between lanes, OpenRouter, and Ollama — but pin ≥1.83.0 and hash-verify.
67. Phoenix (Arize) — zero-friction local LLM tracing+eval: px.launch_app() gives a full OTel/OpenInference UI on localhost
pip install arize-phoenix | ★ 11,041 | [PROVEN] pushed 2026-08-13, Elastic License 2.0 (source-available, not OSI; fine for self-use, blocks resale) | <https://github.com/Arize-ai/phoenix>
Fastest local eval loop — no account, no key; evaluators write scores back onto spans; 3M+ downloads/mo. Timmy: the laptop eval loop on the M5 Max when you don't want the Langfuse container running.
68. RAGAS — the reference RAG evaluation library: faithfulness, context precision/recall, answer relevance + synthetic test-set generation
pip install ragas | ★ 15,306 | [PROVEN] ⚠️ slower cadence (pushed 2026-02-24), Apache-2.0 (moved from explodinggradients) | <https://github.com/vibrantlabsai/ragas>
De-facto standard RAG metric set; pairs with Langfuse/Phoenix for storage. Timmy: score the shared-memory lane (mem0, #55) retrieval quality; watch maintenance velocity.
Register: tiktoken (18,987★, canonical offline token counting) · Inspect AI (2,538★, UK AISI's government-grade agentic/safety evals — low stars ≠ low power) · Guidance (21,712★, ⚠️ slower; many uses absorbed by Outlines) · LLMLingua (6,555★, up-to-20× prompt compression — cheapest API-bill cut) · OpenLLMetry (7,378★, vendor-neutral OTel GenAI plumbing; Traceloop now part of ServiceNow) · SWE-bench harness (5,635★, industry-standard agentic-coding eval) · Guardrails AI (7,283★, 70+ validators with auto-retry) · Portkey gateway (12,711★, LiteLLM-proxy competitor with a cleaner 2026 security record) · Helicone (6,065★, one-line base-URL-swap request logging) · Mirascope (1,521★, typed-prompt anti-framework) · ttok (399★, tiny token counter filter). Dead/sunset: PromptBench ☠️ archived (use promptfoo red-team/garak) · RouteLLM ☠️ dormant 2 yrs · LMQL & ell ~15 months dormant · jsonformer ☠️ (superseded by Outlines) · OpenAI Evals maintenance-mode (use Inspect AI) · TextGrad quiet since 2025-07 · ACE pattern: no canonical repo yet.
SECTION 6 — AI MEDIA GENERATION (10)
Table

# Tool Stars (2026-08) Best machine Status

69 yt-dlp ~150k (est.) M5 Max ✅
70 FFmpeg ~50k (est.) 5090 (NVENC) ✅
71 whisper.cpp ~52.5k DGX Spark ✅
72 comfy-cli (ComfyUI) ~2k (ComfyUI 110k) 5090 / Spark ✅
73 stable-diffusion.cpp ~6.7k 5080/4090/Spark ✅
74 LTX-Video / LTX-2 10.8k / 7.6k 5090 (FP8) ✅
75 Kokoro TTS ~7.9k CPU / Spark #3 ✅
76 Fish-Speech ~31k 4090/5090 ✅ (license watch)
77 Chatterbox ~25.9k 4090 ✅
78 Real-ESRGAN ~35.9k 4090/5080 ⚠️ finished/dormant
69. yt-dlp — the dataset-acquisition workhorse: rips video/audio from 1,000+ sites; every training corpus starts here
pip install yt-dlp / brew | ★ ~150k (est., top-10 Python repo) | ✅ monthly releases — v2026.07.04 fixed CVE-2026-55404 command injection | <https://github.com/yt-dlp/yt-dlp>
Feeds every pipeline in this section; patch promptly (command-injection CVE fixed 2026-07). Timmy/fleet: park it on the M5 Max as the ingestion box; a "research" lane can shell out to it for source material.
70. FFmpeg — the universal transcode/encode/mux engine; NVENC/NVDEC on Blackwell makes it the glue of all video-gen I/O
apt / brew install ffmpeg | ★ ~50k (est.) | ✅ continuous git activity | <https://github.com/FFmpeg/FFmpeg>
Pre/post-processing for Wan/LTX clips, frame extraction for training datasets. Fleet: NVENC batch jobs on the 5090; also powers vhs (#24) demo rendering on the 5080.
71. whisper.cpp — zero-dependency C/C++ ASR; whisper-cli/whisper-server transcribe anywhere incl. CPU-only and Vulkan
cmake build; whisper-cli -m ggml-large-v3.bin -f in.wav | ★ ~52.5k (repo badge 2026-01) | ✅ v1.8.5 (2026-05-30), ggml syncs weekly | <https://github.com/ggml-org/whisper.cpp>
Offline subtitling/transcription of scraped media. Fleet: a DGX Spark as a 24/7 low-power transcription node; M5 Max via Metal. Timmy: voice-note→prompt input path for hands-free lane control.
72. comfy-cli — the official terminal control plane for ComfyUI (110k★, top-100 repo): install, launch, snapshot, model download, run API workflows headless
pip install comfy-cli / brew | ★ comfy-cli ~2k (est.); ComfyUI itself 110k (#76 global) | ✅ issues active 2026-08-07 | <https://github.com/Comfy-Org/comfy-cli>
The scriptable hub for ALL image/video diffusion: comfy run executes saved API workflows with zero GUI. Fleet: 5090 = primary; a DGX Spark's 128GB runs big Wan/LTX video workflows headless in queue. Timmy: a "media" lane dispatches comfy workflows and previews frames in-pane via chafa (#22).
73. stable-diffusion.cpp — pure C/C++ diffusion inference (SD/SDXL/FLUX.1+2/Qwen-Image/Wan2.1-2.2 video) with a sd CLI — day-1 support for new models
cmake build; ./sd -m flux.safetensors -p "…" | ★ ~6.7k | ✅ last updated 2026-08-11, commits near-daily | <https://github.com/leejet/stable-diffusion.cpp>
Fastest quantized FLUX/Wan on consumer cards with no Python anywhere. Fleet: 5080/4090 = interactive generation; DGX Spark for quantized batch rendering.
74. LTX-Video / LTX-2 — the fastest open video model; LTX-2 ships an official CLI + LoRA trainer, distilled 8-step pipeline, native audio sync, up to 4K
pip install ltx-video / ltx2 CLI | ★ LTX-Video 10.8k (updated 2026-08-10); LTX-2 7.6k | ✅ | <https://github.com/Lightricks/LTX-Video> · <https://github.com/Lightricks/LTX-2>
6–10s 1080p clips on 24GB. Fleet: 5090 with --quantization fp8-cast = hero; DGX Spark 128GB fits Pro/full-res; LoRA-train on the 4090.
75. Kokoro TTS — an 82M-param Apache-2.0 TTS that beats paid APIs; 54 voices / 9 languages, runs on plain CPU
pip install kokoro (or thewh1teagle/kokoro-onnx ~2.6k for no-torch CPU) | ★ ~7.9k | ✅ model repo, code stable | <https://github.com/hexgrad/kokoro>
Voiceover for generated video at ~zero cost. Fleet: CPU service on DGX Spark #3 as a shared TTS microservice; Pi 5s can even run the ONNX build.
76. Fish-Speech — SOTA open multilingual TTS + 10-second voice cloning with emotion tags ([laugh], [whispers])
git clone … && pip install -e . | ★ ~31k | ✅ last push 2026-04, CI+releases present — ⚠️ Fish Audio Research License; S1-mini weights CC-BY-NC | <https://github.com/fishaudio/fish-speech>
Highest-quality open voice cloning; check the license before commercial output. Fleet: GPU inference + fine-tune on the 4090/5090.
77. Chatterbox — the best zero-shot English TTS with emotion control; MIT-licensed
pip install chatterbox-tts | ★ ~25.9k | ✅ | <https://github.com/resemble-ai/chatterbox>
The MIT alternative voice engine when Fish-Speech's research license is a problem. Fleet: 4090; Timmy: candidate voice for lane-status audio alerts.
78. Real-ESRGAN — the standard CLI upscaler (realesrgan-ncnn-vulkan binary: no Python, any GPU) for 2–4× image/video restoration
portable binary or pip install realesrgan | ★ ~35.9k | ⚠️ dormant/finished (0 pushes/wk) — but the binary is eternal; Upscayl CLI and ComfyUI nodes wrap it | <https://github.com/xinntao/Real-ESRGAN>
Final-pass upscale of all generated stills/frames. Fleet: batch on the 4090/5080; the Vulkan binary runs on DGX Spark too.
Register: faster-whisper (~22.7k, ⚠️ slowing — best GPU Whisper when whisper.cpp's model coverage lags; 4090) · Wan2.2 + Wan2GP (~8k est./7.9k — best open cinematic video; A14B needs a Spark's 128GB, Wan2GP fits 24GB cards) · rembg (~20k est. — one-command background removal for LoRA dataset prep) · koboldcpp (~10.7k — single-file multimodal server: GGUF LLM + sd.cpp + Whisper + TTS in one binary) · TRELLIS / Hunyuan3D-2 / HunyuanVideo / YuE — research-grade 3D/music, terminal-operable but expect breakage. ☠️ Piper (rhasspy/piper, 11.3k) ARCHIVED 2025-10-06 → use the fork OHF-Voice/piper1-gpl for Raspberry-Pi-class TTS · AUTOMATIC1111 webui (163.8k but near-frozen; --api + curl only) · Forge webui 🪦 dormant.
SECTION 7 — MODEL TRAINING & DATA (ROBOFLOW-STYLE) (10)
Table

# Tool Stars (2026-08) Best machine Status

79 Ollama 178.4k M5 Max + Sparks ✅
80 llama.cpp ~124k everywhere ✅
81 vLLM ~86.0k 5090 / Sparks ✅
82 Unsloth ~66.8k 4090/5090 ✅
83 LLaMA-Factory ~45–72k 5090+4090 ✅
84 diffusers ~76.1k 4090/5090 ✅
85 kohya_ss ~12.5k 5090 / Spark ✅
86 Ultralytics YOLO ~56.3k 5090 train / 4090 infer ✅ (AGPL)
87 Roboflow supervision ~49.4k CPU sidecar ✅
88 FiftyOne ~10.8k M5 Max ✅
79. Ollama — the docker-of-local-LLMs: ollama pull/run/serve, OpenAI-compatible API, cloud tiers, MLX backend preview on Apple Silicon
curl -fsSL <https://ollama.com/install.sh> | sh | ★ 178.4k (global rank #40) | ✅ biweekly releases | <https://github.com/ollama/ollama>
Timmy's named fallback runtime. Fleet: M5 Max (daily driver) + 2× DGX Spark (128GB unified runs huge MoEs via GGUF); Timmy's OpenRouter→Ollama failover points here.
80. llama.cpp — the substrate: GGUF inference in C/C++, llama-cli/llama-server, CUDA/Metal/Vulkan/RPC distributed; multiple releases per day
cmake or package managers; llama-server -m model.gguf | ★ ~124k — most active C++ AI repo | ✅ (b10298 on 2026-08-07); ⚠️ patch CVE-2026-34159 RPC RCE (fixed b8492) before exposing RPC | <https://github.com/ggml-org/llama.cpp>
Max control + max tok/s; the RPC backend spreads one model across the 3 DGX Sparks. Fleet: everywhere — from Pi 5s to the 5090.
81. vLLM — production-grade high-throughput serving (PagedAttention, continuous batching, NVFP4 on Blackwell); vllm serve OpenAI API
pip install vllm && vllm serve <model> | ★ ~86.0k | ✅ extremely active | <https://github.com/vllm-project/vllm>
Serve 7B–70B at scale; FP8/NVFP4 paths shine on Blackwell. Fleet: 5090 for interactive serving; DGX Sparks for multi-user FP8 serving that all 8 Timmy lanes share via one OpenAI-compatible endpoint.
82. Unsloth — 2× faster, ~50% less VRAM QLoRA/LoRA via hand-written Triton kernels; unsloth-cli for YAML-free terminal runs
pip install unsloth && unsloth-cli … | ★ ~66.8k | ✅ | <https://github.com/unslothai/unsloth>
Fine-tune 8B–32B on a single 4090/5090 that would OOM elsewhere; MLX backend variant for the M5 Max. Fleet: the default LLM fine-tuner — a Timmy "training" lane can drive unsloth-cli end-to-end.
83. LLaMA-Factory — the broadest fine-tune framework: llamafactory-cli train/webui/export — SFT/LoRA/QLoRA/DPO/PPO/KTO across 100+ models
pip install llamafactory && llamafactory-cli train … | ★ ~45k (2026-05)–~72k (cited 2026-08, fast climber) | ✅ | <https://github.com/hiyouga/LLaMA-Factory>
Every major model family incl. all Chinese families, plus a WebUI. Fleet: multi-GPU LoRA/DPO on 5090+4090; WebUI headless on a DGX Spark for team access.
84. diffusers — HF's diffusion library + canonical examples/ training scripts (DreamBooth, LoRA, ControlNet, text-to-video) — the reference implementation everyone forks
pip install diffusers accelerate | ★ ~76.1k | ✅ HF-maintained, monthly releases | <https://github.com/huggingface/diffusers>
Train image LoRAs with stock scripts; base for custom video pipelines. Fleet: 4090/5090 for LoRA runs; DGX Spark for custom text-to-video training.
85. kohya_ss (sd-scripts) — the image-model training stack: SD1.5/SDXL/SD3/FLUX LoRA + full fine-tune, captioning/bucketing tools; GUI wraps the pure-CLI kohya-ss/sd-scripts
repo install; python sdxl_train_network.py … | ★ ~12.5k (base sd-scripts ~8k est.) | ✅ v26.0.0 (2026-07-09) | <https://github.com/bmaltais/kohya_ss>
Custom FLUX/SDXL LoRAs. Fleet: 5090 (32GB) for FLUX LoRAs; queue long runs on a DGX Spark's 128GB; use raw sd-scripts for scripted pipelines.
86. Ultralytics YOLO — one yolo CLI trains/validates/exports YOLO11+YOLO26 (detect/segment/pose/track) to ONNX/TensorRT — the de-facto vision trainer
pip install ultralytics && yolo train model=yolo26n.pt data=… | ★ ~56.3k (+1.3k/wk, 2B daily usages) | ✅ ⚠️ AGPL-3.0 or enterprise license | <https://github.com/ultralytics/ultralytics>
The roboflow-style train-deploy loop in a single binary-style CLI. Fleet: train on the 5090, batch inference/export on the 4090, TensorRT edge export for Pi 5s.
87. Roboflow supervision (+inference/CLI) — the reusable CV toolkit: unified Detections API, annotators, tracking, dataset conversion (YOLO/COCO/VOC), mAP eval
pip install supervision roboflow inference | ★ ~49.4k (1M+ monthly PyPI downloads) | ✅ MIT/Apache | <https://github.com/roboflow/supervision>
The glue between datasets→labels→trained models→video annotation. Fleet: CPU-side on the M5 Max or a DGX Spark next to the trainer; pairs with the roboflow CLI for dataset push/pull.
88. FiftyOne — the data-centric AI workbench with a real fiftyone CLI: curate/visualize/dedupe image+video datasets, evaluate models, push to CVAT/Label Studio
pip install fiftyone && fiftyone --help | ★ ~10.8k | ✅ last push 2026-06-02 | <https://github.com/voxel51/fiftyone>
Find bad labels before training — the roboflow-style quality layer. Fleet: M5 Max workstation against datasets on the NAS; Timmy: a "data" lane runs dedupe/quality passes as receipts-logged jobs.
Register: SGLang (~31.4k, fastest-growing serving framework, RadixAttention; preferred for DeepSeek/Qwen MoE on the Spark cluster — A/B backend against vLLM) · mlx-lm (~4.1k; parent mlx 27.3k — M5 Max only: 4-bit 70B inference + 30B QLoRA on one laptop; ~4,800 pre-converted mlx-community models) · Axolotl (~12.3k — YAML SFT/DPO/GRPO + DeepSpeed; pick over LLaMA-Factory for multi-node FSDP across the Spark trio) · Modal CLI (~7k est. — serverless H100/B200 burst when the fleet saturates) · Label Studio (~28k, multimodal labeling, self-host on a Spark) · CVAT/cvat-cli (~14k est., frame-by-frame video annotation) · lms/LM Studio CLI (~5.1k, best MLX+GGUF dual-engine UX on the M5 Max) · TabbyAPI (~2k est., EXL2/EXL3 70B on the 5090) · LocalAI (~30k est., Docker-first OpenAI drop-in) · autodistill (~5k est., ⚠️ fading — superseded by supervision+RF-DETR) · plumbing: hf download (huggingface_hub), wandb (~10k est.), DVC (~15k est., dataset versioning on the NAS).
SECTION 8 — LOGS, OBSERVABILITY, SHELL & DATA POWER TOOLS (12)
Table

# Tool Stars (2026-08) (v) Status

89 gh 45.9k [ACTIVE]
90 fzf 82.6k [ACTIVE]
91 ripgrep 67.3k [ACTIVE]
92 lazygit 81.3k [ACTIVE]
93 bat 60.2k [ACTIVE]
94 starship 59.4k [ACTIVE]
95 nushell 40.3k [ACTIVE]
96 duckdb 40.2k [ACTIVE]
97 k9s 34.3k [ACTIVE]
98 btop 34.0k [ACTIVE]
99 lnav 10.5k [ACTIVE]
100 eza 22.9k [ACTIVE] (exa ☠️)
89. gh — GitHub's official command line: PRs, issues, Actions, releases, gh browse, gh api, extensions
brew install gh / apt | ★ 45.9k (v) | [ACTIVE] | <https://github.com/cli/cli>
GitHub without the browser. Timmy: every lane's git operations and the receipts pipeline's PR links go through gh; pairs with github-mcp-server (#49).
90. fzf — the command-line fuzzy finder; the highest-leverage Unix tool of the decade
brew install fzf | ★ 82.6k (v) | [ACTIVE] | <https://github.com/junegunn/fzf>
Fuzzy-finds files, history, procs, git objects, anything; embeds everywhere. Timmy: the pattern for Timmy's own ⌘P-style lane/receipt switcher; also inside every lane's shell env.
91. ripgrep (rg) — recursive regex search that respects your .gitignore, an order of magnitude faster than grep/ack/ag
brew install ripgrep | ★ 67.3k (v) | [ACTIVE] | <https://github.com/BurntSushi/ripgrep>
The default search backend for editors and agents alike. Timmy: lane agents' grep calls route through rg; rg --json feeds structured search receipts.
92. lazygit — the most-loved git TUI: stage hunks/lines, interactive rebase, stash, cherry-pick at keyboard speed
brew install lazygit | ★ 81.3k (v) | [ACTIVE] | <https://github.com/jesseduffield/lazygit>
Timmy: the human-override pane — when a lane's branch needs manual surgery, open lazygit on that lane's worktree. Also the UX bar for Timmy's own TUI polish.
93. bat — a cat(1) clone with wings: syntax highlighting + git integration + automatic paging
brew install bat | ★ 60.2k (v) | [ACTIVE] | <https://github.com/sharkdp/bat>
Alias it and forget it. Timmy: default pager in every lane; its syntax themes inform Timmy's code-diff rendering.
94. starship — minimal, blazing-fast, infinitely customizable prompt for any shell (Rust, <10ms)
brew install starship | ★ 59.4k (v) | [ACTIVE] | <https://github.com/starship/starship>
One cross-shell prompt — git status, cloud ctx, lang versions. Timmy: per-lane prompt customization (lane name + model + cost counter) via starship's module system across the whole fleet.
95. nushell (nu) — a new type of shell where everything is structured data: pipes carry typed tables, not text
brew install nushell | ★ 40.3k (v) | [ACTIVE] | <https://github.com/nushell/nushell>
ls | where size > 10mb | sort-by modified — a genuine paradigm shift. Timmy: lane scripting where output must be machine-readable; nu's structured pipelines are what receipts wish shells always produced.
96. duckdb — in-process analytical (OLAP) SQL engine: duckdb -c "SELECT ... FROM 's3://...parquet'" — serious SQL over CSV/Parquet/JSON instantly, no server
brew install duckdb | ★ 40.2k (v) | [ACTIVE] | <https://github.com/duckdb/duckdb>
Timmy: the analytics layer over receipts — query millions of lane events stored as Parquet in R2 without standing up a database.
97. k9s — the de-facto Kubernetes cockpit: navigate, drill into logs/exec/port-forward faster than any kubectl chain
brew install k9s | ★ 34.3k (v) | [ACTIVE] | <https://github.com/derailed/k9s>
Fleet/Timmy: if lanes or MCP servers are ever container-orchestrated, k9s is the ops pane; its column-navigation UX is another design reference for Timmy.
98. btop — the gorgeous resource monitor (CPU/mem/disk/net/procs): mouse, graphs, themes, per-process trees
brew install btop / apt | ★ 34.0k (v) | [ACTIVE] | <https://github.com/aristocratos/btop>
The htop/top successor. Fleet: one btop pane per machine in Timmy's "fleet health" view — watch the 5090's VRAM while a training lane runs.
99. lnav — the log-file navigator: SQL-query, filter, and tail many log formats in one curses UI without leaving the pager
brew install lnav / apt | ★ 10.5k (v) | [ACTIVE] | <https://github.com/tstack/lnav>
Turns chaotic text logs into a queryable, time-correlated DB (;SELECT over syslog/JSON). Timmy: point lnav at aggregated lane logs; its log-format auto-detection inspires the receipts viewer.
100. eza — the modern ls: colors, icons, --git status, --tree, hyperlinks — the maintained successor to dead exa
brew install eza | ★ 22.9k (v) | [ACTIVE] | <https://github.com/eza-community/eza>
Sunset callout (verified): ogham/exa (24.4k★) is unmaintained — its own README says "exa is unmaintained, use the fork eza instead" (repo unarchived only because the sole owner is unreachable). Timmy: default ls in every lane across the fleet.
Register (category leaders outside the 100, all live-verified): tailspin/tspin (7.9k, zero-config tail -f colorizer) · logcli/grafana-loki (28.7k repo, LogQL from the shell) · goaccess (20.8k, real-time web-log dashboards) · stern (4.8k, multi-pod k8s log tailing) · glances (33.4k, monitor + Web/API modes) · lazydocker (~13k) · hyperfine (28.7k, statistical benchmarking) · atuin (31.1k, synced shell history across the fleet) · zoxide (38.6k, smarter cd) · fd (44.1k, find done right) · jq (35.5k) + yq/mikefarah (15.8k, YAML surgery) · harlequin (6.3k, Textual SQL IDE — point at D1 exports) · visidata (9.2k, terminal spreadsheet) · miller (~9.9k, CSV multitool) · fx (~20.2k, interactive JSON) · delta (31.7k, syntax-highlighted git pager) · jj/Jujutsu (31.0k, Git-compatible VCS rethink) · gitui (22.4k, [SLOW→org] community-run Rust git TUI) · gh-dash (~12.3k, PR dashboard gh extension) · mise (32.4k, polyglot version/task manager — standardize the fleet's toolchains) · just (~25k, command runner) · process-compose (~3k, TUI process orchestrator) · posting (12.3k, terminal Postman) · xh (8.0k, humane HTTP) · trippy (7.5k, modern mtr) · rclone (59.1k — rsync for 70+ clouds; NAS↔R2 sync) · croc (39.7k, PAKE P2P transfer between fleet machines) · magic-wormhole (22.8k) · tailscale (35.1k, mesh VPN tying the fleet together) · restic (~30k+, encrypted backups of receipts/datasets) · cloudflared (~10k, Cloudflare Tunnel — exposes Timmy's web view) · bandwhich (11.9k) · gping (12.6k) · doggo (4.4k). Notes: syncthing (87.7k) is a sync daemon, not a TUI — register only; q (harelba/q) is stale — prefer duckdb.
CROSS-CUTTING FINDINGS (the 2026 story, per the swarm's notes)
ACP is the interop story of 2026. Goose (#29) and OpenHands (#34) both act as ACP hubs that can drive Claude Code/Codex as subprocesses; OpenCode serves opencode acp; 30+ agents speak the spec (#43). A lane-based TUI can standardize on ACP instead of building a bespoke multiplexer — tmux-bridge-mcp (#44) is the scrappy proof-of-concept.
Headless is table stakes. Every top coding agent has a non-interactive mode (claude -p, codex exec, opencode run, goose run, crush run, qwen -p, pi -p --json, kimi -p). Prefer JSON/JSONL output modes (Pi #33, aider #30) for lane supervision — they are what receipts are made of.
Self-learning went production. DSPy (#57) + GEPA (#58) + Opik's Agent Optimizer (#61) are the three usable prompt-optimization paths; GEPA now ships inside DSPy, Opik, and MLflow and runs in production at Shopify/Databricks/Dropbox. Combined with Langfuse (#60) traces and promptfoo (#59) CI gates, a "lanes that tune themselves" loop is buildable today.
Cost routing without rewiring. OpenRouter-supported lanes (OpenCode, Crush, aider, Kilo, Goose, Pi, aichat, Fabric) let Timmy swap models per lane without changing harnesses; LiteLLM (#66, pinned ≥1.83.0) or aichat's built-in proxy (#38) front the whole fleet behind one OpenAI-compatible endpoint, with Ollama (#79) as the offline fallback.
Fleet division of labor (C5's map). 5090 = interactive generation hero (ComfyUI #72, LTX-2 FP8 #74, kohya FLUX LoRA #85, vLLM #81) · 4090 = training workhorse (Unsloth #82, Ultralytics #86, Fish-Speech #76) · 5080 = utility/upscale/transcode (FFmpeg #70, Real-ESRGAN #78, sd.cpp #73) · 3× DGX Spark = 24/7 serving + big-memory jobs (Ollama/llama.cpp RPC #79-80, Wan2.2-A14B, whisper.cpp #71, Kokoro #75, Langfuse self-host #60, Temporal #54) · M5 Max = ingestion (yt-dlp #69), curation (FiftyOne #88), MLX inference (mlx-lm register), and the Timmy dev seat · Pi 5s = edge inference targets (piper1-gpl TTS, TensorRT exports).
Consolidation & supply-chain risk are real. OpenAI acquired promptfoo, ClickHouse acquired Langfuse, ServiceNow absorbed Traceloop, LiteLLM survived a PyPI breach, and the MCP reference repo archived most of its own servers in 2025. Pin versions, hash-verify, prefer Apache-2.0/MIT cores (Opik over Phoenix if license purity matters), and treat every entry's status line as a living document.
Repo renames matter (old URLs redirect but docs rot): steipete/mcporter → openclaw/mcporter; chrishayuk/mcp-cli → IBM/mcp-cli; sst/opencode & sst/opentui → anomalyco/*; jxnl/instructor → 567-labs/instructor; explodinggradients/ragas → vibrantlabsai/ragas; laude-institute → harbor-framework; microsoft/guidance → guidance-ai; badlogic/pi-mono → earendil-works/pi; block/goose → aaif-goose/goose.
THE 12-TOOL STARTER STACK (if you install nothing else)
For a builder of an 8-lane multi-agent TUI on this fleet, these twelve give the most leverage per install:
Table

# Tool (entry) One-line reason

1 tmux (#6) The lane substrate every agent harness already assumes
2 OpenTUI (#13) The Node/TS-native renderer Timmy itself should be built on
3 node-pty (#19) The syscall primitive: every lane is a spawned PTY
4 xterm.js + @xterm/headless (#18) Server-side VT parsing = snapshot-testing + web view of lanes
5 asciinema (#23) Record/replay lane sessions — the receipts backbone
6 OpenCode (#25) The default lane agent: model-agnostic, client-server, survives drops
7 ACP (claude-agent-acp) (#43) One wire protocol to drive all 8 lanes uniformly
8 mcporter (#45) Gives non-MCP lanes full MCP access via plain shell
9 mem0 (#55) Shared cross-lane memory so panes learn from each other
10 DSPy + GEPA (#57, #58) The self-learning loop that optimizes lane prompts from receipts
11 promptfoo (#59) CI-native eval + red-team gate for every prompt change
12 LiteLLM proxy (#66) — pin ≥1.83.0 The OpenRouter/Ollama routing fabric with budgets & fallbacks
Honorable mentions just outside the 12: fzf (#90), gh (#89), duckdb (#96), Ollama (#79), Terminal-Bench (#63).
SOURCE REGISTER INDEX
This catalog is a merge of six domain research files, each with its own inline citations and per-repo GitHub API verification (2026-08-13/14). Repo URLs are kept inline per entry above; consult the source files for full evidence chains:
Section 1–2 sources: research/C1_TERMINAL_CORE.md — GitHub REST API per-repo verification, Codeberg API (foot), npm registry, launch-coverage cross-checks (cmux, rmux, amux, term.everything).
Section 3 sources: research/C2_CODING_AGENTS.md — gradually.ai, tech-insider.org, morphllm.com, vibecodinghub.org, star-history cross-checks + capability matrix (MCP/headless/ACP/OpenRouter).
Section 4 sources: research/C3_MULTIAGENT_MCP.md — live GitHub API + npm/PyPI registry verification; MCP archive/successor mapping; ACP org-renames.
Section 5 sources: research/C4_PROMPT_EVAL.md — GitHub API (2026-08-14), LiteLLM breach chain (Hudson Rock, SecurityWeek, PyPI incident report, CISA KEV), acquisition records (OpenAI→promptfoo, ClickHouse→Langfuse).
Section 6–7 sources: research/C5_MEDIA_TRAINING.md — 16 web searches cross-checked against star-history, ossinsight, gitstar, ecosyste.ms; fleet-fit analysis per GPU.
Section 8 sources: research/C6_LOGS_SHELL_DATA.md — ~45 live GitHub API lookups, all main-table stars marked (v); exa→eza sunset documentation.
Counts: Section 1: 12 · Section 2: 12 · Section 3: 18 · Section 4: 14 · Section 5: 12 · Section 6: 10 · Section 7: 10 · Section 8: 12 — Total: 100.
Compiled 2026-08-14. Stars drift daily; statuses were true when verified. When a tool in this catalog dies, its register note is how you'll know.

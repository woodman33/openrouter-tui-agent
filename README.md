# 🤖 OpenRouter TUI with Rive Animations

Welcome to **OpenRouter TUI**, a revolutionary, systems-thinking-driven terminal UI framework combining **OpenRouter's state-of-the-art AI Agent SDK** with interactive **Rive vector animations** and **Cloudflare's serverless edge capabilities**.

This project provides an aesthetic, ultra-fluid, multi-mode terminal interface for interacting with over 300+ language models, utilizing capability-adaptive graphics pipelines to display real-time animations inline in standard terminals (Kitty, iTerm2, WezTerm) or fallback browser companion windows.

---

## 🏛️ Systems Architecture

The system is built on a highly modular, decoupled architecture consisting of five independent layers:

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    React Ink TUI                       │
                               │      (Local Desktop Terminal - Kitty/iTerm2/Sixel)     │
                               └──────────────────────────┬─────────────────────────────┘
                                                          │ WebSocket / HTTPS
                                                          ▼
                               ┌────────────────────────────────────────────────────────┐
                               │            Cloudflare Workers Edge Gateway             │
                               ├────────────────────────────────────────────────────────┤
                               │  ┌──────────────────────────────────────────────────┐  │
                               │  │      Cloudflare Agents SDK (Durable Objects)     │  │
                               │  │  - Holds active conversation SQLite state        │  │
                               │  │  - Manages multi-agent routing (Swarm)           │  │
                               │  │  - Dispatches Rive triggers via WebSocket        │  │
                               │  └──────┬──────────────────────┬─────────────┬──────┘  │
                               │         │                      │             │         │
                               │         ▼                      ▼             ▼         │
                               │  ┌──────────────┐        ┌──────────┐  ┌────────────┐  │
                               │  │ Sandbox SDK  │        │    D1    │  │ Workers AI │  │
                               │  │ (Firecracker)│        │ (SQLite) │  │ (Fallback) │  │
                               │  └──────────────┘        └──────────┘  └────────────┘  │
                               └────────────────────────────────────────────────────────┘
```

1. **Terminal Capability & Graphics Pipeline (`src/graphics/`)**
   - Automatically queries terminal support for advanced graphic protocols (Kitty, iTerm2, Sixel) at runtime.
   - For high-end terminals (Kitty, WezTerm, iTerm2, Ghostty, Warp), it leverages a headless **Playwright browser rendering pipeline** to capture Rive state machine animations as PNG frames at 20fps and draw them directly inside the terminal cells.
   - For standard terminals, it triggers a lightweight local WebSocket **Companion Web Server** that auto-opens a browser page beside your terminal containing the reactive Rive mascot, syncing animatic triggers seamlessly.
   - For basic terminals, it falls back to a highly polished **custom ANSI-art rendering engine** mimicking Rive state-changes inside Ink borders.

2. **Agent Core Layer (`src/agent/`)**
   - Completely standalone and UI-agnostic core orchestrator using the latest `@openrouter/sdk` with item-based streaming (`getItemsStream`) allowing multi-turn conversations and automatic tool-execution.
   - Implements a local **JSONL-based session persistence manager** with append-only logs for reliable state restoration.
   - Integrates **Agent Swarm multi-agent routing** that uses a lightweight classifier agent to direct complex user prompts to specialized sub-agents (Chat, Code Reviewer, Researcher, Generator) utilizing different models on-the-fly.

3. **TUI Layout & React Layer (`src/tui/`)**
   - Designed using Awwwards-inspired UI design principles: dark GitHub-sleek theme backgrounds, 4px grid alignments, custom glowing borders, gradient progress bars, and typewriter-text effects.
   - Structured around a single-layout multiplexer where users can instantly hot-swap between multiple built-in panels (Chat, Code Review, Multi-Agent Dashboard, Model Explorer) using simple keys.

4. **Multi-Mode Plugin System (`src/modes/`)**
   - General-purpose mode architecture where plugins register custom tool sets, TUI panels, hotkeys, and Rive state-mappings seamlessly.

5. **Cloudflare Edge Layer (`docs/cloudflare-features.md`)**
   - Fully architected to offload heavy operations (like untrusted code execution, global state synchronization, and background worker logs) safely onto Cloudflare’s Edge network using **Sandbox SDK (Firecracker microVMs)**, **Durable Objects**, **Email Workers**, and **Pages Functions**.

---

## 📂 Project Directory Structure

```
openrouter-tui/
├── cli.tsx                                 # TUI Interactive CLI Entry Point
├── headless.ts                             # Headless Agentic CLI Entry Point
├── package.json                            # Configuration & NPM Dependencies
├── tsconfig.json                           # TypeScript Compiler Options
├── agent.config.json                       # Global Agent settings overrides
├── bin/
│   └── openrouter-tui.js                   # Executable Binary script wrapper
├── docs/
│   └── cloudflare-features.md              # Detailed Cloudflare Systems Architecture
└── src/
    ├── types/
    │   └── index.ts                        # Shared TypeScript Interface declarations
    ├── utils/
    │   ├── ansi.ts                         # Custom ANSI escape codes & Color Gradient utilities
    │   ├── config.ts                       # Layered Configuration controller (Store / Env)
    │   ├── logger.ts                       # Debug logger console recorder
    │   └── markdown.ts                     # High-performance terminal markdown parser
    ├── agent/
    │   ├── events.ts                       # Typed EventEmitter3 AgentEvents
    │   ├── openrouter-client.ts            # Client initializer with dynamic model-fetch cache
    │   ├── tools.ts                        # Built-in SDK tools (Time, Calc, System, Env)
    │   ├── conversation.ts                 # JSONL-based history append recorder
    │   ├── core.ts                         # Main Agent class running OpenRouter loops
    │   └── multi-agent.ts                  # Swarm Orchestrator and classification router
    ├── graphics/
    │   ├── pipeline.ts                     # Base abstract GraphicsPipeline class
    │   ├── capabilities.ts                 # Terminal feature OSC & escape prober
    │   ├── kitty-pipeline.ts               # Kitty Graphics chunked Base64 PNG encoder
    │   ├── iterm2-pipeline.ts              # iTerm2 Inline File image protocol overlay
    │   ├── sixel-pipeline.ts               # Sixel bit-grid ANSI downsampler
    │   ├── companion-pipeline.ts           # WebSocket frame broad-caster
    │   ├── ansi-pipeline.ts                # Polish-character mascot state renderer
    │   └── frame-extractor.ts              # Playwright Rive Canvas frame grabbing driver
    ├── companion/
    │   ├── server.ts                       # Express WebSocket local sync broker
    │   ├── sync.ts                         # WebSocket Rive State synchronization hook
    │   ├── qr.ts                           # Terminal QR generator for companion links
    │   └── client/
    │       └── index.html                  # Client companion web page containing fallback canvas
    ├── modes/
    │   ├── index.ts                        # Mode registrars and layouts
    │   ├── chat/                           # Conversational plugin mode
    │   │   ├── mode.ts
    │   │   └── tools.ts
    │   └── code-review/                    # Dynamic code git review mode
    │       ├── mode.ts
    │       └── tools.ts
    └── tui/
        ├── app.tsx                         # Root Ink Application container
        ├── layout.tsx                      # Header / Footer / Panel grid framework
        ├── router.tsx                      # Active mode component multiplexer
        ├── theme.ts                        # Sleek dark color palette overrides
        ├── components/
        │   ├── GlowBorder.tsx              # Glowing box borders
        │   ├── ModelBadge.tsx              # Dynamic color provider models badge
        │   ├── ProgressBar.tsx             # Shimmer loading progress bar
        │   ├── RiveMascotPanel.tsx         # Sidebar Rive/ASCII visual container
        │   └── TypewriterText.tsx          # Typewriter letter animator
        └── panels/
            └── ChatPanel.tsx               # Main chat messages & text input controller
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js 18+** installed. You will also need an **OpenRouter API Key**.

Get your key at [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys).

### 2. Installation

Clone and install dependencies:
```bash
git clone https://github.com/your-username/openrouter-tui.git
cd openrouter-tui
npm install
```

### 3. Configuration
Set your OpenRouter API Key in your shell or write it to a `.env` file in the project root:

```bash
# Set in shell
export OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# Or create .env
echo "OPENROUTER_API_KEY=sk-or-v1-your-api-key-here" > .env
```

### 4. Build
Compile the TypeScript source:
```bash
npm run build
```

---

## 🎮 Usage & Entry Points

### Interactive TUI Mode
The primary interactive interface. It auto-detects your terminal capabilities, spins up the best graphics pipeline, and starts in Chat mode.

```bash
# Start TUI directly
npm start

# Start TUI in a specific mode (chat, code-review, dashboard, model-explorer)
npm start -- --mode code-review

# Start TUI with a specific model
npm start -- --model anthropic/claude-3.5-sonnet

# Launch with custom companion port
npm start -- --companion-port 8080
```

### Headless Mode
A simplified, non-interactive shell interface that logs events to stderr and agent output directly to stdout.

```bash
npm run start:headless
```

### Hotkeys within the TUI
- `Esc` — Safely cleans up the graphics pipelines and exits the program.
- `Tab` — Rotates through available modes (Chat, Code Review, Dashboard, Model Explorer).
- `Ctrl + L` — Clears the current conversation history.
- `Ctrl + M` — Invokes the model-explorer panel to search and select active models.

---

## 🛡️ License
This project is licensed under the MIT License - see the LICENSE file for details.

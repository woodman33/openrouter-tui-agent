# TIMMYTUI

> **Trust the receipt, not the model.**

TIMMYTUI is a local-first Verifiable Agent Trust OS with OpenRouter model chat, MCP → CLI evidence bundles, cmux workspace launch, Browser Companion mirroring, and sealed TIMMY receipts.

---

## 🎬 1. Demo
* **Product Hunt Launch Video**: `[Insert Launch Video Embed Link / Demo Video Path Here]`
* **Product Hunt Gallery Hero**: `[Insert Product Hunt Gallery Image Placeholder Here]`

---

## 🛠️ 2. What Works Today
* **Main Chat with OpenRouter Model Rail**: Real-time streaming conversation, hotkey swapping, and dynamic model fetching.
* **MCP → CLI Evidence Bundle Generation**: Converts MCP tool calls into local inspectable bash scripts and environment setups.
* **cmux Workspace Launch**: Seamless workspace isolation with multiplexer controls (`cmux` window layout).
* **Browser Companion Chat Mirror**: Live state mirroring on local WebSocket web client (`localhost:3001`).
* **Local Sealed TIMMY Receipts**: Generates run manifestations using a tamper-evident, hash-bound `.agentrun` format.
* **Bounded Logs**: Strict console append logs verifying state changes without bloating directory index files.
* **Setup/Help/Doctor Commands**: Pre-flight CLI checkups and environment verifiers.

---

## 🚀 3. Quickstart

To run the console locally:

```bash
# 1. Install dependencies
npm install

# 2. Setup your local configuration
cp .env.example .env

# 3. Add your OPENROUTER_API_KEY to the .env file
# OPENROUTER_API_KEY=sk-or-v1-...

# 4. Run system diagnostic check
npm run timmy -- doctor

# 5. Start the TUI
npm start
```

---

## 🧬 4. First Proof

Generate your first verifiable session validation proof manifest:

```bash
npm run timmy -- agent-proof "Validate workspace integrity"
```

This runs the core telemetry auditor and writes a local **sealed TIMMY receipt** in the active session database containing a **manifest hash** and session timestamp.

---

## 📂 5. First MCP → CLI Scan

Inspect and scan an external MCP server to compile an evidence bundle:
1. Navigate to the **Code Review / Workspace panel** within the TUI interface.
2. Paste an MCP server URL directly into the `MCP → CLI` scanner prompt.
3. Review and generate the local executable code execution package before giving the agent file system permissions.

---

## 🏆 6. Product Hunt Demo Flow

Follow this end-to-end path to demonstrate TIMMYTUI's full trust loop:

```
[Main Chat with Model Rail] ──► [Scan MCP -> CLI URL] ──► [Launch Isolated cmux Workspace]
                                                                        │
[Session Verifiable Proof] ◄── [Mirror on Browser Companion] ◄──────────┘
```

---

## 📚 7. Store / Field Guides
* **TIMMY Builder Starter Pack**: Essential config boilerplate.
* **AI Automation Playbook**: Strategies for local agent deployment.
* **Agentic Commerce Survival Guide**: Transactions, token bounds, and budget safety.
* **Strategic Technology Playbook**: Governed enterprise AI architecture.
* **AI, Film & Modern Filmmaking**: Multi-modal scripting and asset workflow.
* **Online Products Deep Dive**: Scaling single-agent applications.

---

## 🗺️ 8. Roadmap

### V2.2 Pro: TIMMY Pane
* **Description**: A future agent-state workspace pane for multi-agent runs, tracking state metrics directly from the workspace terminal: `working`, `blocked`, `done`, and `idle`. *(Planned for release in V2.2)*

---

## 🚫 9. Non-goals for V2.1
* **Hosted SaaS Auth**: All credentials remain 100% local-first.
* **Production Billing**: Telemetry billing is simulated and for developer testing only.
* **Legal Proof**: TIMMY receipts are for session verification, not legal or compliance certifications.
* **Remote Container Execution**: All sandboxes are managed on local hypervisors/processes.
* **TIMMY Pane / Multi-Agent Cockpit Runtime**: The multi-agent state telemetry grid is reserved for the V2.2 release.

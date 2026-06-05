# TIMMYTUI V2.1 — Production-Demo Ready

TIMMYTUI is a chat-first Verifiable Agent Trust OS for local-first, governed workspace operations. Version 2.1 freezes the terminal console as production-demo ready: a stable local Workspace Root, MCPorter tool onboarding, cmux/tmux launch surfaces, AgentPass authority language, and sealed TIMMY receipts.

---

## 🧭 The Product Spine & Default Navigation

TIMMYTUI establishes a persistent vertical 3-column app shell layout to maintain zero visual waste, high vertical information density, and a chat-first workflow.

### Default Navigation Deck (Left Nav)
1. Brief
2. Files
3. Porter
4. Workspace
5. Proof
6. Options

*Detailed breakdown:*
* **Brief**: The central, spacious chat interface for direct human-to-agent dialogue, equipped with startup menus and a sleek scrolling scrollbar track (`▲`, `▼`, `█`, `░`).
* **Files**: The governed workspace directory navigator displaying categories, filtered item trees (max 20 rows with scroll markers), file badges, and custom safe actions.
* **Porter**: The connector scanner illustrating the universal ingestion chain from MCP servers to AgentPass visas.
* **Workspace**: The spatial execution chamber showing tmux fallback status, cmux launcher status and workspace handoff, and interactive browser actions.
* **Proof**: The audit evidence ledger that lists verified plain-English completion facts.
* **Options**: The config panel to control animation speed, layout comfort, theme settings, and dynamic developer modes.

### Developer Mode Utilities (Gated behind Developer Mode Toggle)
- Discovery
- Teams
- Logs

*Detailed breakdown:*
- **Discovery**: Live MCP capability maps.
- **Teams**: Active model DAG visualization.
- **Logs**: Bounded in-app log console showing system events from `logs/`.

---

## 📂 Governed local Workspace Root

TIMMYTUI operates as a local-first workspace manager. When the operator hits the Files page, it defaults to the curated **TIMMY Workspace Root Navigator**:
* **Root Location**: `/Users/williammeldman/Desktop/openrouter-tui`
* **Curated Categories**:
  - **Code**: `src/`, `apps/`, `packages/`
  - **Skills**: `skills/` (gathers capability `SKILL.md` descriptors)
  - **Souls**: `souls/` (gathers personality `SOUL.md` guides)
  - **Context**: `context/`, `docs/` (RAG context packages)
  - **Porter Packs**: `porter-packs/` (MCP capability shims)
  - **Auth**: `auth/` (passports, visas, scopes, and authority manuals)
  - **Receipts**: `receipts/`, `.timmy/` (verifiable proofs index)
* **Secret Shield Gating**: Blocks and filters private assets (`.env`, `.dev.vars`, keys, `node_modules`, `.git`, `logs/`, and `.runs/`).
* **Visual Status Indicators**: Probes directory existence and displays found status lights (`🟢 skills/`) and missing markers (`⚪ not created yet`).
* **Dynamic Initializer**: Provides `[Initialize TIMMY Workspace Folders]` to idempotently seed starter templates and auth/ configurations.

---

## 🛡️ Branded Authority Doctrine

The `auth/` directory layouts enforce the TIMMY local authority dock specification, cleanly separating human operator identity from subagent capability permissions:

Human Authentication identifies the operator. It is future-compatible with Clerk, WorkOS, Cloudflare Access, Auth0, or enterprise SSO.

Agent Authority governs what agents and tools are allowed to do. TIMMY models this through Passports, Visas, AgentPass Scopes, Stamps, and sealed TIMMY Receipts.

“Humans log in. Agents show passports. Tools require visas. Receipts prove the trip.”

---

## 📦 MCPorter & Porter Connector Flow

The Porter screen maps the universal capabilities ingest sequence:

MCP Server URL → MCPorter Scan → Generated CLI → AgentPass Scope → TIMMY Receipt

* **Local scan actions**: Exposes dry-run scanning of MCP packages (e.g. `https://github.com/svix/svix-webhooks`) gating them safely.
* **Developer commands reference**: Displays commands (`npx mcporter list`, `emit-ts`, `generate-cli`) and console shortcuts.

---

## ⚙️ cmux/tmux Execution Lifecycle

The Workspace stage features a robust activation deck:
* **cmux integration**: Automatically probes macOS GUI binary directories, displaying status `cmux: INSTALLED / READY` or `tmux: ACTIVE / FALLBACK READY`.
* **Async Spawning**: Launches cmux in the background asynchronously using shell commands without blocking TUI execution loop.
* **State Resilience**: Selection adjustments reset error/logs, ensuring that a failed command never poisons subsequent launcher spawns.

---

## 🧪 E2E Verifiable Proof Flow (`/agent-proof`)

Typing the `/agent-proof [prompt]` command executes a safe background completions routine:
* **Payload Verification**: Computes a full 64-character SHA-256 manifest hash of the task snapshot.
* **Receipt Commitment**: Formulates a tamper-evident `.agentrun/manifest.json` receipt and commits the record to the receipts index `.timmy/receipts/index.json`.
* **Instant Relay**: Proof page updates dynamically to present the plain-English receipt summary (what ran, who ran it, what changed, and the manifest hash).
* **Logs Tracing**: Developer Mode Logs utility records system logs (`run.created`, `manifest.written`, `receipt.generated`, and `receipt.index.updated`).

---

## 🏁 Launch Demo Path: Workspace → Tool → Run → Receipt

To showcase the complete capability of TIMMYTUI to an observer:
1. **Startup**: Start the application in standard mode (`npm start`). Confirm that the console displays the chat-first `Brief` scrolling view and startup tips.
2. **Initialize Files**: Navigate to the `Files` screen. Note that the uninitialized workspace root presents a clean setup trigger. Press `Enter` to run the initialization. Verify that the `auth/`, `skills/`, and `.timmy/` folder structures appear instantly with green active indicators.
3. **Inspect File Badges**: Select `auth/auth.md` in the tree. Verify that it displays the `[Auth Doctrine]` badge in purple and updates the simplified Right Inspector with plain-English details.
4. **Trigger /agent-proof**: Go to the Brief screen, type `/agent-proof Validate workspace integrity`, and press `Enter`.
5. **Observe Verification**: Navigate to the `Proof` screen. Confirm that the latest receipt appears as a beautifully formatted, tamper-evident Sealed TIMMY Receipt card carrying the full 64-character SHA-256 hash.
6. **Tail Logs**: Switch to options or type `/logs` to observe the system telemetry trace showing correct index updates.

---

## 🚫 Key Non-Goals (Scope Gating)

To maintain absolute local stability and focus, the following features are **explicitly postponed** to future release milestones:
1. **Hosted Auth / Web OAuth Endpoints**: Strategies are prepared; live integrations with Clerk or WorkOS remain for future scopes.
2. **Cloud Sync & R2 Storage Pools**: Off-workstation backups and edge databases are strategy-only.
3. **Billing, Stripe Checkout Webhooks, & Hosted Subscriptions**: Stripe provisioning scripts exist as local templates; live checkout integrations are deferred.
4. **Remote Sandboxes & Public Marketplace**: Remote container sandboxes and public marketplace workflows are deferred. Local cmux/tmux launching and local receipt generation remain supported.

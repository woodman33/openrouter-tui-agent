# TIMMY V2.1 Production-Demo Script

TIMMYTUI V2.1 is a local-first Verifiable Agent Trust OS. This script guides you through the official, controlled public demonstration story to record the perfect demo.

---

## 🎬 Act I: The Gateway (Main Chat & Model Selection)
1. **Launch the TUI Console**:
   ```bash
   npm start
   ```
2. **Main Chat Presentation**:
   - Point out that **Main Chat** opens first as the control cockpit.
   - Draw attention to the **OpenRouter model rail** on the right side.
   - Use standard search (`/model <query>`) to search and select models.
   - Observe that the full model IDs are visible and the chat input is top-aligned.
3. **Trigger Conversation**:
   - Submit a short, standard prompt (e.g. `"Explain the basic concept of a sealed local state."`).
   - Show how OpenRouter streams the tokens live back to the terminal.

---

## 🎬 Act II: Safe Synthesis (MCP ➔ CLI Tooling)
1. **Switch to MCP ➔ CLI**:
   - Navigate to the **MCP ➔ CLI** panel from the left navigation deck.
2. **Scan Endpoint**:
   - Enter an MCP server URL or filesystem tool schema file.
   - Press Enter to perform a dry-run scan. Show that this scan is done **tamper-evident** and never runs unverified code.
3. **Analyze Generated Evidence Bundle**:
   - Demonstrate the generated bundle path: `mcp-cli/<capability-slug>/`.
   - Point out that the evidence is immediately indexed and browseable.

---

## 🎬 Act III: Space Orchestration (Workspace & Browser Mirror)
1. **Workspace Deck**:
   - Open the **Workspace** screen.
   - Point out the clean layout: Title `TIMMY Workspace` and explainer are directly at the top.
   - Renders exactly three primary cards:
     1. **cmux Workspace**: Purpose `Visual local workspace shell` (Action: `[Open cmux]`, Status: `READY`)
     2. **Browser Companion**: Purpose `Browser mirror` (Action: `[Open Browser]`, Status: `RUNNING`)
     3. **Local Files**: Purpose `Workspace files` (Action: `[Open Files]`, Status: `READY`)
   - Expand the **Advanced fallback** drawer to show the `tmux Fallback` options. Point out that this keeps a recoverable fallback session.
2. **Open cmux**:
   - Trigger the `Open cmux` command. Explain that cmux acts as the visual local shell.
3. **Open Browser Companion**:
   - Launch the **Browser Companion** surface.
   - Show the **Chat Mirror** tab displaying live-synced chat history.
   - Show **Saved Sessions** in the left drawer, illustrating how history can be saved, exported as JSON, or deleted locally with explicit confirmation.

---

## 🎬 Act IV: Seal & Attestation (Sealed Receipts & Live Logs)
1. **Trigger Agent Verification**:
   - In Main Chat, execute the agent-proof command:
     ```bash
     /agent-proof "Validate workspace integrity"
     ```
   - Watch the task execute in the background.
2. **Receipt Attestation**:
   - Open the **Proof** panel (accessible via `/proof` or tab button).
   - Display the latest **sealed TIMMY receipt**:
     - Run ID: `run_proof_...`
     - Manifest Hash: `sha256_...` (full 64-character SHA-256 string)
     - Explain that these local receipts are tamper-evident and hash-bound proofs of agent operation.
3. **Logs Live Telemetry**:
   - Switch to the **Logs** tab (via `/logs` or browser companion tab).
   - Show the bounded live event logs tail displaying exact system telemetry.

---

## 📝 Rules of Wording during Demo
- **Approved Vocab**: Use *sealed TIMMY receipt*, *tamper-evident*, *hash-bound*, *verifiable*, *manifest hash*, *JTI passport claim*, and *production-demo ready*.
- **Forbidden Vocab**: NEVER use *cryptographic*, *signed*, *signature*, *immutable*, *notarized*, *legal proof*, or *100% production ready*.

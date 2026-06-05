# TIMMYTUI V2.1 Demo Video Script & Voiceover Guide

This script details the 60-second walkthrough and scene breakdown for the TIMMYTUI Product Hunt demo video.

---

## 🎤 60-Second Voiceover Script

```text
AI agents are powerful — but most of the time, you can’t see what they actually did.

That’s why I built TIMMYTUI: a local-first agent trust console.

It gives you OpenRouter model selection, MCP-to-CLI evidence bundles, cmux workspace launch, Browser Companion session mirroring, and sealed TIMMY receipts.

Paste an MCP server URL, generate a local evidence bundle, run the agent, and create a receipt with a manifest hash you can inspect later.

TIMMYTUI: trust the receipt, not the model.
```

---

## 🎬 Video Shot List

| Scene | Duration | Visual Description | Voiceover Segment |
| :--- | :--- | :--- | :--- |
| **1. Main Chat & Model Selection** | 0s – 10s | Start with the terminal active. Show typing a prompt and toggling the OpenRouter model rail badge showing different options. | *"AI agents are powerful — but most of the time, you can’t see what they actually did."* |
| **2. MCP → CLI Scan** | 10s – 20s | Switch focus to the Code Review panel. Paste an MCP server URL and watch the console scan and display the tool manifests. | *"That’s why I built TIMMYTUI: a local-first agent trust console."* |
| **3. Evidence Folder Inspection** | 20s – 30s | Show the generated `mcp-cli` directory in the terminal workspace showing clean bash scripts. | *"It gives you OpenRouter model selection, MCP-to-CLI evidence bundles..."* |
| **4. Workspace Split (cmux)** | 30s – 40s | Trigger a workspace shell spawn, showing side-by-side terminal splits monitoring agent processes. | *"...cmux workspace launch..."* |
| **5. Browser Companion Canvas** | 40s – 50s | Show the browser viewport mirroring the exact conversation frames in real time on port 3001. | *"...Browser Companion session mirroring, and sealed TIMMY receipts."* |
| **6. /agent-proof Verification** | 50s – 55s | Run the command `npm run timmy -- agent-proof "Validate workspace integrity"` and show the terminal generating the receipt. | *"Paste an MCP server URL, generate a local evidence bundle, run the agent, and create a receipt with a manifest hash you can inspect later."* |
| **7. Sealed TIMMY Receipt Details** | 55s – 58s | Inspect the generated tamper-evident, hash-bound `.agentrun` file, highlighting the manifest hash. | *(Silence / background music swell)* |
| **8. End Card** | 58s – 60s | Dark screen displaying: **TIMMYTUI**<br>Trust the receipt, not the model.<br>`github.com/woodman33/openrouter-tui-agent` | *"TIMMYTUI: trust the receipt, not the model."* |

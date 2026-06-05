# TIMMYTUI V2.1 — Launch Strategy & GTM Plan

This document outlines the official launch strategy, platform distribution blueprints, demo video capture directives, and documentation packaging for the public release of **TIMMYTUI V2.1**.

---

## 🎯 1. Product Positioning & Core Narrative

### The Core Hook
> **“Local-first Verifiable Agent Trust OS.”**
> Stop guessing what your autonomous coding agents did. Oversee, verify, and attach to local-first governed agent sessions with tamper-evident, hash-bound receipts.

### Key Value Propositions
* **Verifiability**: TIMMY seals local agent runs with a tamper-evident SHA-256 manifest hash, generating a local receipt folder (`.agentrun`) that documents the exact prompt, responses, executed tools, and file changes.
* **Unified Workspace Panel**: Launches visual workspaces (`cmux`), persistent background CLI runners (`tmux` persistence fallback), and browser review mirrors (`Browser Companion`) from a single terminal interface.
* **Governed MCP ➔ CLI Synthesis**: Safely dry-runs and inspects Model Context Protocol (MCP) servers, converting them into structured local CLI commands before letting them execute.
* **Privacy by Default**: Powered by OpenRouter, keeping API keys, local logs, and receipt indices encrypted or strictly local.

### Wording & Communications Governance
To ensure credibility among senior developers and systems operators, all launch content must adhere to the following vocabulary constraints:
* **Approved Terms**: *sealed TIMMY receipt*, *tamper-evident*, *hash-bound*, *verifiable*, *manifest hash*, *JTI passport claim*, *production-demo ready*.
* **Forbidden Terms**: *cryptographic*, *signed*, *signature*, *immutable*, *notarized*, *legal proof*, *100% production ready*.

---

## 🚀 2. Multi-Platform Launch Blueprint

TIMMYTUI V2.1 will launch concurrently across developer hubs to capture high-intent community interest.

### Platform 1: Hacker News (Show HN)
* **Title Formats**:
  * *Show HN: TIMMYTUI – A local-first verifiable agent trust console*
  * *Show HN: TIMMYTUI – Oversee and verify AI coding agents locally*
* **Intro Text Blueprint (Focus on engineering logic, no fluff)**:
  * "Hey HN, we built TIMMYTUI because we got tired of running agents headlessly and not knowing what tools they called, what files they edited, or where they failed.
  * TIMMYTUI runs locally as a terminal dashboard. It routes LLM tokens via OpenRouter, manages sandboxed sessions with tmux and cmux, and outputs sealed, tamper-evident JSON manifests (.agentrun bundles) detailing every single execution state and file difference.
  * The tool verification flow converts Model Context Protocol (MCP) schemas into structured local CLI command dry-runs. You verify the tool execution path before it fires, generating a hash-bound receipt.
  * It's completely local-first and does not store credentials. The companion browser app runs as a static mirror, syncing via local websocket on port 3001. We'd love to hear your feedback on the verifiability specs and local-first architecture."

### Platform 2: Product Hunt
* **Tagline**: "The Verifiable Agent Trust OS in your terminal."
* **Maker Comment Focus**:
  * Address the security concern of autonomous agents. Detail how TIMMY dry-runs MCP servers into secure CLI folders and compiles tamper-evident run receipts for every step.
* **Promo Asset Requirements**:
  * Clean GIF displaying the TUI model rail search and the single-column Workspace command launch.
  * Screenshot of the Browser Companion showing the sealed TIMMY receipt side-by-side with TUI logs.

### Platform 3: X / Twitter
* **Hook Post**:
  * "Autonomous agents are fast, but they are black boxes. We built TIMMYTUI to give you absolute, verifiable oversight over local agent operations. [Link to Demo Video]"
* **Thread Details**:
  * *Tweet 2*: Showcase **MCP ➔ CLI**. No more blind execution. Convert server specs to safe dry-runs.
  * *Tweet 3*: Showcase the **Workspace list**. Switch between cmux visual workspace, browser mirror, and tmux persistence fallbacks.
  * *Tweet 4*: Showcase **Sealed Receipts**. Local, tamper-evident manifest files that document inputs, outputs, and hashes.
  * *Tweet 5*: Open source link and installation guide (`npm install`).

### Platform 4: Subreddits (r/LocalLLaMA, r/selfhosted)
* **Approach**: Focus heavily on privacy, offline capabilities (using mock API keys for testing), and local-first persistence. Ask the self-hosted community how they manage credentials and sandbox boundaries for their agent runs.

---

## 🎥 3. Demo Video Capture Directives

The demo video is the single most important asset for conversion on Hacker News, Product Hunt, and X.

### Recording Specifications
* **Terminal Dimensions**: Set your terminal window to at least **100 x 30** characters to ensure the single-column Workspace lists and the side-by-side OpenRouter model rail in the Chat panel look perfectly balanced and clean.
* **Terminal Theme**: Standard dark theme (e.g. Catppuccin Macchiato or Nord) with contrasting colors for visual selections.
* **Pacing**: Steady, deliberate keypresses. Do not rush. Let the Typewriter and terminal transitions settle.

### Capture Script Flow

1. **Gatekeeper & Chat**:
   - Type `/model current` to show the active model configuration.
   - Type `/model test` to run a live health check on the active OpenRouter model. Show the latency.
2. **Scan & Validate**:
   - Navigate to MCP ➔ CLI, paste a mock MCP server URL, run scan, and reveal the structured evidence folder inside the Workspace local explorer.
3. **Attach & Inspect**:
   - Navigate to Workspace, select the `Show tmux Fallback` row, press Enter, show the attach command `tmux attach -t timmy-run`, copy it, then highlight `Open Browser Companion` and launch.
4. **Mirror & Seal**:
   - On the Browser Companion, show the mirrored chat window, hit **Save Chat**, and point out the saved session.
   - Go back to TUI, run `/agent-proof "Validate workspace integrity"`, and show the resulting sealed receipt inside the TUI **Proof** utility.

---

## 📚 4. Documentation Strategy

To ensure seamless onboarding, the GitBook docs are split into logical pillars:

1. **Getting Started**:
   - Install CLI (`npm install -g timmy-tui`).
   - Setup Environment (`wrangler` configuration for Durable Storage, `OPENROUTER_API_KEY`).
2. **Architectural Blueprints**:
   - Detail the **Local-First Trust Pipeline**: how prompts are hashed, how tokens are relayed, and how manifests are compiled.
3. **Workspace Management**:
   - How to configure native macos `cmux` windows.
   - Attaching to persistent background `tmux` sessions.
4. **Local Verification**:
   - Running the local verification script: `npm run timmy:agent-proof-verify`.
   - How to inspect manifest hashes (`sha256_...`) and receipts.

---

## ✅ 5. Pre-Flight Verification Checklist

Before pushing public tags or recording the final demo video, run the following verification pipeline locally:

```bash
# 1. Clean build and compilation test
npm run build

# 2. Build Vite Companion assets
npm run companion:build

# 3. Check GitBook documentation alignment
npm run docs:verify

# 4. Verify E2E Agent Proof generation
npm run timmy:agent-proof-verify
```

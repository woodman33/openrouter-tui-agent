# Landing Page, Payments, and Developer Advertising Strategy

This document details the visual landing page layout, interactive ingestion forms, Stripe payment integration models, and targeted developer advertising plans for the public launch of **TIMMYTUI V2.1**.

---

## 🎨 1. Landing Page Design & UI Storyboard

The TIMMYTUI landing page is designed to wow senior developers, platform engineers, and security leads. It utilizes a sleek, high-contrast dark-mode theme, Outfit/Inter typography, and subtle CSS micro-animations.

### Hero Section: The Live TUI Simulator
* **Headline**: "The local-first Verifiable Agent Trust OS."
* **Sub-headline**: "Stop guessing what your autonomous coding agents did. Oversee, verify, and attach to local-first governed agent sessions with tamper-evident, hash-bound receipts."
* **Primary Visual Component**: An interactive, custom-styled terminal emulator mock-up rendering a live-typed simulation of the TUI:
  1. The simulated cursor type-writes `/model test`.
  2. The emulator returns a mock model health test, displaying latency statistics and model status.
  3. The simulator types `/agent-proof "Validate workspace integrity"`.
  4. A mock manifest folder expands, showing the SHA-256 manifest hash and highlighting file differences.
  5. A prominent modal overlays showing the **Sealed TIMMY Receipt** with a clean copy-hash action.
* **CTA Button Group**:
  - `[Install CLI]` (Launches a copyable clipboard: `npm install -g timmy-tui`).
  - `[Explore Live Demo]` (Navigates to a simulated web companion sandbox).

### Interactive Product Tour Section
A tabbed, responsive showcase demonstrating TIMMY's core mechanics:
* **Tab 1: MCP ➔ CLI Ingestion**: Visualizes the conversion of Model Context Protocol (MCP) server endpoints into structured CLI parameters, showing how tools are inspected before execution.
* **Tab 2: Spatial Workspace**: Shows a mockup of the single-column Workspace launcher triggering native `cmux` windows and syncing instantly with the Browser Companion.
* **Tab 3: Bounded Event Logs**: Renders a live-tailing log stream, illustrating how Durable Object event telemetry stays isolated and verifiable.

---

## 📋 2. Onboarding Forms & Survey Funnels

TIMMY captures user intent and feedback using interactive forms embedded directly in the landing page and Web Companion:

### Form A: Developer Early Access & License Activation
* **Purpose**: Collects developer details to generate hash-bound licenses and provision sandbox credentials.
* **Fields**:
  - Full Name
  - Developer Email
  - Organization Size (Solo / 2-10 / 10-50 / 50+)
  - Primary Local Runner (e.g. Claude Code, OpenHands, CLI, Custom Scripts)
  - Optional: OpenRouter API key routing preferences.
* **Action**: Submitting sends a request to the provisioning worker, returning a mock license key in the form of a JTI Passport claim.

### Form B: Developer Capabilities Survey
* **Purpose**: Discovers what tools the community wants pre-indexed.
* **Fields**:
  - "What Model Context Protocol (MCP) servers do you run daily?" (Selectable grid: Filesystem, GitHub, Postgres, Web Browser, Custom APIs).
  - "Which terminal multiplexer or desktop manager do you prefer?" (Options: cmux, tmux, screen, none).
  - "What are your team's primary agent safety concerns?" (Options: Secret leaks, unapproved network requests, files overwritten, lack of audit history).

---

## 💳 3. Stripe Payments & Tier Provisioning

TIMMYTUI leverages the Stripe CLI and environment provisioning to gate advanced capabilities, mapping paywall thresholds directly to client-side AgentPass scopes.

### Subscription Tier Architecture

| Subscription Tier | Pricing | Included Scopes | Features Gated |
| :--- | :--- | :--- | :--- |
| **Free (Local Operator)** | `$0` | `run.local`, `model.openrouter` | Local chat, OpenRouter routing, local tmux fallback, and local manifest generation. |
| **Builder Plan** | `$29/mo` | `receipt.hosted.read`, `cmux.launch` | Hosted receipt URLs, Edge worker telemetry forwarding, and cmux auto-orchestration. |
| **Pro Developer** | `$79/mo` | `context.read.premium_packs` | Includes access to pre-verified developer context packs (e.g., specialized Canva Apps SDKs). |
| **Team Hub** | `$149/mo` | `receipt.team.read`, `durable_object.shared` | Collaborative review surfaces, shared team registries, and edge-persisted audit trails. |
| **Enterprise** | *Custom* | `policy.enterprise.custom` | Custom AgentPass policy enforcement, hosted edge control consoles, and private R2 storage pools. |

### Stripe Provisioning & Key Exchange Loop
1. **Webhook Trigger**: When a user subscribes via Stripe Checkout, Stripe fires a `checkout.session.completed` webhook to our Cloudflare edge worker.
2. **Passport Generation**: The worker generates a hash-bound **JTI Passport Claim** containing the paid scopes and user metadata.
3. **Local Activation**: The user runs `timmy auth --activate <token>` or inputs the license key in the Browser Companion. The local configuration file registers the scopes, dynamically unlocking the paid menu items (e.g. `[Open cmux]` or hosted receipt sharing) inside the TUI.

---

## 📣 4. Developer Advertising & Growth Loop

Our advertising strategy targets developers where they work and research.

### Paid Developer Channels (High-Intent Placements)
* **Developer Newsletter Sponsorships**:
  - *TLDR Newsletter*: 1-sentence sponsored link highlighting local agent verifiability.
  - *Console.dev*: Focus on the terminal UI design and MCP-to-CLI security scanner.
  - *Bytes (ui.dev)*: Target frontend-heavy builders with the Vite Browser Companion mirror features.
* **Search Engine Marketing (SEM)**:
  - Target search keywords: `MCP server manager`, `secure AI agent workspace`, `local agent console`, `run Claude locally safely`, `tmux AI helper`.

### Viral Growth Loop: The "Sealed by TIMMY" Badge
* **The Mechanism**: Developers who use TIMMY to run agent tasks on public repositories can configure the agent to append a verified build badge to the repository's `README.md`.
* **Markdown Badge**:
  ```markdown
  [![Sealed by TIMMY](https://img.shields.io/badge/TIMMY-Verifiable_Run-green?logo=terminal)](https://localhost:3001/proofs)
  ```
* **The Destination**: Clicking the badge directs visitors to the run's tamper-evident manifest index, explaining how the agent execution was monitored and verified locally.

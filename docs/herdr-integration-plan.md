# herdr Integration Blueprint & Timeline Estimate

This document details the architectural requirements and timeline estimates for integrating the **herdr** terminal-native workspace manager into **TIMMYTUI V2.1** alongside `cmux` and `tmux`.

---

## 🛠️ 1. Integration Levels & Scope

Depending on the depth of the integration, we can execute this in two phases:

### Level 1: Basic Launcher Integration (Time: ~1 Hour)
* **Objective**: Add `herdr` to the Workspace launcher panel as a selectable surface, allowing operators to launch a standard `herdr` session from the TUI.
* **Tasks**:
  1. Add binary detection in `CodeReviewPanel.tsx` (`command -v herdr`) to set an active status light (`READY` vs `MISSING`).
  2. Add `Open herdr Workspace` to the command launcher grid.
  3. Add background spawn actions using `exec('herdr run', ...)` to open `herdr` in the current working directory.
  4. Shorten and map keyboard helpers (`/workspace launch herdr` sync).

### Level 2: Verifiable Agent API Integration (Time: 2 - 3 Days)
* **Objective**: Connect TIMMY to `herdr`'s Unix socket API to read and tail active agent execution states, showing their states in the TUI/Browser Companion and compiling this evidence directly into **sealed TIMMY receipts**.
* **Tasks**:
  1. Write a local Unix socket listener in `src/agent/core.ts` to tap into `herdr`'s agent state changes.
  2. Map `herdr` state events (working, blocked, done, idle) to our typed events framework.
  3. Relay agent terminal outputs to our Edge telemetry feed, ensuring that all `herdr` agent logs are committed to the tamper-evident run manifest.
  4. Surface live `herdr` agent progress bars and block warnings directly in the TUI Chat and Browser Companion panels.

---

## 📊 2. Comparative Workspace Positioning

Adding `herdr` gives developers a tailored layout for multi-agent terminal workflows:

| Launcher | Workspace Type | Strengths | Status |
| :--- | :--- | :--- | :--- |
| **cmux** | Desktop Window | Best for rich side-by-side graphical setups. | Ready |
| **tmux** | Standard Terminal | Best for persistent background sessions over SSH. | Ready (Fallback) |
| **herdr** | AI-Native Terminal | Best for multi-agent sidebar visibility and active state tailing. | *Proposed* |

---

## 🏁 3. Recommendation

Since `CodeReviewPanel.tsx` uses a modular fixed-width grid design, we can implement **Level 1** immediately in less than an hour with zero risk to existing systems. 

This would immediately make `herdr` selectable and launchable, letting you showcase it in your next GTM demo!

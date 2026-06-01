# TIMMYTUI No-Waste Doctrine: Minimal Terminal UX Strategy

This document outlines the strict guidelines to refactor the **TIMMY TUI** (Ink-based terminal interface) to ensure maximum screen space density, robust first-party developer utilities, and a clean chat-first operational flow.

---

## 1. Primary Product Focus: Chat-First Operations
* **Spacious Chat Interface**: The TUI must focus on direct human-to-agent dialogue (`Brief` screen). 
* **Zero Padded Waste**: Strip down large margins, empty boxes, and giant settings blocks.
* **Streamlined Sidebar Nav**: Navigation deck should be strictly pruned.
  * Default Navigation: `Brief`, `Porter`, `Workspace`, `Proof`, `Options`
  * Hide or Demote `Discovery` & `Teams` under a **Developer Mode** toggle in the Options screen.

---

## 2. Minimalist Screen-by-Screen Specifications

### A. Brief Panel (`ChatPanel.tsx`)
* **Core layout**: High vertical space allocated to the scrolling dialogue.
* **One Chat Input**: Standardized CLI dialogue prompt input.
* **Three Direct Actions**: 
  1. `[Add Tool by URL]`: Triggers Porter URL scans.
  2. `[Open Workspace]`: Navigates to active work chamber.
  3. `[View Last Receipt]`: Opens the Proof ledger screen.

### B. Porter Panel (`PorterPanel.tsx`)
* **Visible MCPorter Actions**: Expose clean textual lists of available commands:
  * `/porter add <url>`
  * `/porter list`
  * `/porter inspect`
  * `/porter approve`
  * `/porter cli`
* **Capability Flow Indicator**: Clearly show status stage transitions:
  $$\text{URL} \longrightarrow \text{Capability} \longrightarrow \text{Control} \longrightarrow \text{Proof} \longrightarrow \text{Reuse}$$

### C. Workspace Panel (`CodeReviewPanel.tsx`)
* **Stop Heavy Grid Grids**: Do not render the mock heavy 4-chamber grid by default.
* **Launcher Actions**:
  1. `[Open in cmux]`
  2. `[Open in tmux]`
  3. `[Call Previous Work]`
  4. `[Attach Receipt]`
* **Subsystem Detection**: If `cmux` is not found, display a simple `cmux: NOT INSTALLED` detection status (do not require it for app startup, do not fake live sockets). If `tmux` exists, use standard TMUX launcher.

### D. Proof Panel (`ModelExplorerPanel.tsx`)
* **Lead with Receipt**: Highlight the core cryptographic receipt block.
* **Expandable Evidence**: Place raw file diffs and logs behind space-bar interactive collapsible segments.
* **Tamper-Evident Language**: Use only verified tamper-evident and hash-bound language (remove mock keywords like "immutable/signed/cryptographic" unless backed by actual variables).

### E. Options Panel (`OptionsPanel.tsx`)
* **High Density**: Tighten list items, remove unnecessary empty padding blocks.
* **Settings Selection**: Configure Layout theme, GSAP Speed, Mascot voice, Density, `cmux`/`tmux` detection status, and **Developer Mode Toggle** (default: `DISABLED`).

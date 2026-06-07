# TIMMY Roadmap

This document maps our developmental milestones from the open-source CLI wedge to stateful edge-connected audit networks.

---

## v0.1: Local Receipts (MVP)
* **Status**: Shipped
* **Deliverables**:
  - [x] Local demo receipts (`.timmy/receipts/demo-receipt.json`)
  - [x] Proof stubs (`.timmy/runs/<run_id>/manifest.json`)
  - [x] Replay markdown generator (`replay.md` template)
  - [x] Executable Node CLI (`timmy`)
  - [x] Continuous Integration & release workflow setups

---

## v0.2: Real-World Execution
* **Status**: Backlog
* **Deliverables**:
  - [ ] **Real Command Capture**: Hook child process execution to record stdout/stderr and file system mutations.
  - [ ] **GitHub PR Integration**: Automated workflow commenting receipt hashes directly on pull request reviews.
  - [ ] **OpenRouter Provider Metrics**: Append spent cost telemetry and latency metadata to the manifest.
  - [ ] **Cloudflare Worker Deployments**: Log deployment steps and vector indices changes.

---

## v0.3: Sealed Distributed Trust
* **Status**: Planned
* **Deliverables**:
  - [ ] **Local TUI Viewer**: Interactive terminal UI pane to review, search, and filter receipt files.
  - [ ] **Signed Receipts**: Cryptographically sign receipt manifest hashes using developer keys (e.g., Web Crypto API).
  - [ ] **Hosted Receipt Vault**: Secure receipt offloading using Cloudflare D1/R2.
  - [ ] **Team Audit Logs**: Collaborative dashboards showing agent runs across organizational squads.

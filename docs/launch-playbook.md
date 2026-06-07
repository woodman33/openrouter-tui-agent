# TIMMY v0.1.0 Launch Playbook

This playbook outlines the marketing assets, release checklists, and social media drafts for launching TIMMY.

---

## 🚀 Key Value Propositions
- **“Flight recorder for AI coding agents.”**
- **“Local proof receipts for autonomous dev work.”**
- **“Open-source audit trail for AI agent runs.”**
- **“Run a task. Get a receipt. Replay what happened.”**

---

## 📋 Release Checklists

### 1. NPM Publish Checklist
- [ ] Ensure `package.json` version is incremented (e.g. `0.1.0`).
- [ ] Run `npm run build` and `npm test` locally to ensure zero compiler/test failures.
- [ ] Run dry-run package checks to verify the whitelisted assets output correctly:
      ```bash
      npm pack --dry-run
      ```
- [ ] Authenticate with npm registry and publish the package:
      ```bash
      npm publish --provenance --access public
      ```

### 2. GitHub Release Checklist
- [ ] Merge the feature branch to `main`.
- [ ] Draft a new release on GitHub.
- [ ] Tag the release as `v0.1.0` (this triggers the automated GitHub release workflow).
- [ ] Paste the `CHANGELOG.md` section corresponding to v0.1.0 into the release body description.

---

## ✍️ Launch Post Templates

### A. Show HN (Hacker News) Draft
**Title:** Show HN: TIMMY – Flight recorder and local proof receipts for AI agent runs
**Body:**
> Hey HN,
>
> We love AI agents writing code, making shell calls, and changing local workspaces. However, it's hard to track what they actually modified, when it happened, and what tools they ran.
>
> TIMMY is an open-source flight recorder for AI coding agents. It generates local, verifiable receipts showing exactly what took place inside sandboxed workspaces.
>
> **Why it exists:**
> When an agent mutates files, it writes a tamper-evident, key-sorted manifest receipt with a SHA-256 validation seal. You get a replay markdown file showing the execution logs and evidence paths.
>
> **Try it out in 2 seconds:**
> ```bash
> npx timmy-tui demo
> ```
> Or generate a task proof stub:
> ```bash
> npx timmy-tui proof "create a hello world Cloudflare Worker"
> ```
>
> The MVP is 100% local, has zero telemetry by default, and doesn't collect secrets. All code is on GitHub: https://github.com/woodman33/openrouter-tui-agent
>
> We'd love your feedback on the schema and what features you want to see in the v0.2 roadmap.

### B. X / LinkedIn Post Draft
> 🤖 AI agents can write code, mutate workspaces, and edit files. But how do you prove what actually happened?
>
> Meet TIMMY — the open-source flight recorder for AI agent runs.
>
> 📝 Run a task. Get a receipt. Replay what happened.
>
> ✓ 100% local-first
> ✓ Deterministic SHA-256 receipt seals
> ✓ Zero telemetry by default
>
> npx timmy-tui demo
>
> GitHub: https://github.com/woodman33/openrouter-tui-agent
>
> #AI #DevTools #OpenSource #AgentOps

### C. Reddit Draft (r/node, r/selfhosted)
**Title:** TIMMY: Local proof receipts and audit trails for AI agent runs (open-source)
**Body:**
> AI agents are moving fast, making file edits and command calls. But tracking their output can get messy.
>
> TIMMY is a developer tool designed to capture a complete audit trail of agent actions. It writes local, tamper-evident receipts (manifests + replay logs) so you can audit runs before staging or deploying.
>
> **Quickstart:**
> ```bash
> npm install -g timmy-tui
> timmy demo
> ```
>
> **Features:**
> - Deterministic receipt hashing (excluding signatures, recursive key-sorting JSON canonicalization).
> - Human-readable replay Markdown files.
> - Bounded logs.
> - Pre-flight diagnostics.
>
> Fully open-source on GitHub: https://github.com/woodman33/openrouter-tui-agent

---

## 🎥 30-Second Demo GIF Script
1. **0:00 - 0:05**: Open terminal in an empty directory. Type `npx timmy-tui demo`.
2. **0:05 - 0:12**: Show output displaying success checkmarks, the generated Run ID, and the receipt hash.
3. **0:12 - 0:20**: Cat the file: `cat .timmy/receipts/demo-receipt.json`. Point out the key-sorted schema fields, platform, and hash.
4. **0:20 - 0:30**: Type `timmy proof "create a hello world Cloudflare Worker"`. Show the manifest.json and replay.md output structures being generated.

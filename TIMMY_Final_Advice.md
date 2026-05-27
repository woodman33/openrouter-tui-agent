# TIMMY / Founder Terminal — Final Architecture Advice, Build Doctrine, and Shipping Plan

**Date:** 2026-05-26  
**Scope:** TIMMY AgentOps TUI / Founder Terminal, OpenRouter Billing & Routing Console, DOCTRINE governance layer, OpenHands integration, x-cmd/tmux/abtop/Starship terminal stack, and the larger “Terminal Intelligence OS” thesis.

---

## 0. Executive Verdict

**Proven:** The strongest version of this project is not a flashy terminal dashboard. It is a **local-first AgentOps control plane** for safely running, supervising, routing, budgeting, replaying, and auditing AI coding agents.

**Aspirational:** The bigger thesis — “the terminal becomes the operating system for intelligence orchestration” — is directionally right, but it should be treated as a long-term narrative, not the next implementation target.

**Speculative:** The full “Terminal Intelligence OS” with MCP-native shell replacement, multi-agent swarm panes, Cloudflare edge memory, collaborative CRDT terminal sessions, and autonomous deployment is powerful, but too broad for the next milestone. It becomes credible only after one real governed agent run is proven end-to-end.

**Hard truth:** The project’s value is no longer “can we build more panels?” It is now:

> Can TIMMY prove that an AI agent changed files, spent money, used tools, followed doctrine, respected approvals, and produced a replayable audit artifact?

That is the product.

---

## 1. Product Thesis

TIMMY is a **terminal-native AgentOps cockpit** for builders running multiple coding agents, model providers, local shells, and edge deployment systems.

The core promise:

> Run AI coding agents with the density of a terminal, the safety of an approval system, the cost controls of a billing console, and the replayability of an audit log.

### What TIMMY is

**Proven:**
- A Textual/Rich TUI that consolidates agent runs, model routing, credentials, system diagnostics, doctrine validation, and terminal workspace controls.
- A local safety layer around `.env`, shell config, tmux layouts, OpenRouter keys, Stripe Projects provisioning, and agent execution.
- A model-spend and routing cockpit for OpenRouter-powered workflows.
- A governance wrapper that injects architecture rules into downstream coding agents.

### What TIMMY is not

**Anti-scope-creep:**
- Not a replacement for Cloudflare’s dashboard yet.
- Not a full MCP shell replacement yet.
- Not a multi-tenant SaaS yet.
- Not a cloud swarm control plane yet.
- Not an autonomous production deployer yet.
- Not a general “developer OS” yet.

Those are expansion paths, not V1.4.

---

## 2. The Five-Layer Architecture

This is the architectural boundary that should remain stable.

| Layer | Name | Responsibility | Tools |
|---:|---|---|---|
| 0 | Shell substrate | Portable command capability and package/tool availability | x-cmd, POSIX shell, AWK, jq, fzf, rg |
| 1 | Terminal workspace | Persistent panes, sessions, agent visibility | tmux, x tmux, Ghostty, abtop |
| 2 | TUI cockpit | Human operator control plane | Textual/Rich, TIMMY screens |
| 3 | Agent runtime | Agent execution, file editing, sandboxing, replay | OpenHands, Claude Code, OpenCode, Codex |
| 4 | Model/edge mesh | Inference, routing, budgets, caching, edge state | OpenRouter, Stripe Projects, Cloudflare Workers/Durable Objects |

### Boundary rule

**Proven:** Keep each layer replaceable. Do not let the TUI directly mutate shell state, cloud state, or model routing without going through a typed service.

### Correct internal pattern

```text
TUI button
  -> service method
    -> dry-run preview
      -> approval state
        -> execution
          -> backup / manifest log
            -> diagnostic event
              -> .agentrun replay artifact
```

### Wrong pattern

```text
TUI button -> subprocess.run("dangerous command")
```

Never do this.

---

## 3. Current State Assessment

### 3.1 OpenRouter Billing & Routing Console

**Proven:** This is now one of the strongest modules because it solves a real pain: AI-agent spend and key management.

Your current service split is correct:

```text
src/founder_terminal/openrouter/
├── detector.py
├── env_writer.py
├── stripe_projects.py
├── policy.py
└── payloads.py
```

### What each service should own

| Service | Owns | Should not own |
|---|---|---|
| `detector.py` | Host capability reports, key redaction, status | File mutation |
| `env_writer.py` | Safe `.env` writes, backups, chmod, mutation logs | Stripe subprocess logic |
| `stripe_projects.py` | Stripe CLI probing, dry-runs, live/sim provisioning | Model fallback policy |
| `policy.py` | Budget zones, ZDR/cache compatibility, routing decisions | UI rendering |
| `payloads.py` | SDK/API request blueprints | Real key storage |

### Immediate fix

**Fix required:** Do not hardcode `--yes` as a Stripe Projects fallback unless the live help probe confirms it exists. Stripe Projects and Stripe CLI docs currently emphasize flags such as `--json`, `--no-interactive`, `--auto-confirm`, and `--accept-tos`; OpenRouter’s Stripe Projects integration documents `stripe projects add openrouter/api` as the core provisioning command. Prefer dynamic probing and conservative fallback.

Recommended fallback:

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
stripe projects add openrouter/api --json --no-interactive --auto-confirm --accept-tos
```

If the host does not support those flags:

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
stripe projects add openrouter/api --json
```

Then show an operator warning that interaction may be required.

### Simulated provisioning rule

**Fix required:** Do not write fake keys that look exactly like valid production OpenRouter keys unless the destination is a throwaway sandbox path.

Better simulated key:

```env
OPENROUTER_API_KEY='test-openrouter-key-not-valid'
OPENROUTER_TYPE='bearer'
```

If you need to test redaction logic, pass a fake key into a pure function test, not a real `.env` file.

---

## 4. Budget Policy: Final Recommended Routing Logic

The current non-overlapping cost zones are good.

| Zone | Spend ratio | State | Recommended behavior |
|---|---:|---|---|
| Normal | `0–50%` | Premium allowed | Use primary model |
| Caution | `50–80%` | Cost-aware | Switch to efficient coder model |
| Emergency | `80–99%` | Minimal spend | Use flash/cheap model only |
| Blocked | `>=100%` | Stop | Freeze new premium loops |

### Important nuance

**Proven:** OpenRouter model fallbacks are failure fallbacks. They activate when a model/provider request fails or cannot satisfy requirements. They do not automatically detect a low-quality but valid answer.

So in the UI, label these separately:

```text
Provider/model fallback:
  Triggers on API/provider/request failure.

TIMMY quality retry:
  Triggers when output fails our local quality gates.
```

### Recommended policy object

```python
BUDGET_ZONES = [
    {
        "name": "normal",
        "min_ratio": 0.0,
        "max_ratio": 0.5,
        "model": "anthropic/claude-3-5-sonnet",
        "allow_expensive_tools": True,
        "message": "Premium reasoning allowed."
    },
    {
        "name": "caution",
        "min_ratio": 0.5,
        "max_ratio": 0.8,
        "model": "qwen/qwen-2.5-coder-32b",
        "allow_expensive_tools": True,
        "message": "Shift to efficient coding model."
    },
    {
        "name": "emergency",
        "min_ratio": 0.8,
        "max_ratio": 1.0,
        "model": "google/gemini-2.5-flash",
        "allow_expensive_tools": False,
        "message": "Emergency cheap routing only."
    },
    {
        "name": "blocked",
        "min_ratio": 1.0,
        "max_ratio": float("inf"),
        "model": None,
        "allow_expensive_tools": False,
        "message": "Execution blocked until operator increases cap."
    },
]
```

### Add quality-preserving mode

**Proven:** A budget policy that downgrades too early can sabotage complex coding work. Add a toggle:

```text
[ ] Preserve quality for active code-mutating runs
```

When enabled, an already-running code-mutating agent should not downgrade mid-task unless:
- the budget is above 80%, or
- the model fails, or
- the operator explicitly approves downgrade.

---

## 5. ZDR, Response Caching, and Prompt Caching

### Correct mental model

| Feature | What it does | TIMMY UI wording |
|---|---|---|
| ZDR | Routes to providers/endpoints with zero data retention policy | “Privacy routing constraint” |
| Response caching | OpenRouter returns identical completed responses from edge cache | “Stores full response temporarily; disabled by account-level ZDR” |
| Prompt caching | Provider-side repeated-prefix caching | “Provider optimization; separate from response caching” |

### UI warning logic

```python
def cache_privacy_warnings(account_zdr: bool, response_cache: bool, prompt_cache: bool) -> list[str]:
    warnings = []

    if account_zdr and response_cache:
        warnings.append(
            "Account-level ZDR is enabled. OpenRouter response caching is not available because it requires temporary response storage."
        )

    if response_cache and not account_zdr:
        warnings.append(
            "Response caching may temporarily store full responses. Use only for non-sensitive deterministic workflows."
        )

    if prompt_cache:
        warnings.append(
            "Prompt caching is distinct from OpenRouter response caching. Provider-side cache behavior depends on selected model/provider."
        )

    return warnings
```

### Recommended default

| Run type | ZDR | Response cache | Prompt cache |
|---|---:|---:|---:|
| Secret/codebase analysis | On | Off | Optional |
| Unit test deterministic prompts | Off | On | Optional |
| Public docs generation | Off | On | On |
| Investor-sensitive strategy | On | Off | Optional |
| Local throwaway coding test | Optional | On | On |

---

## 6. DOCTRINE Governance Layer

The DOCTRINE layer is one of the best ideas in the system.

### What it should do

**Proven:**
- Load `docs/architecture/DOCTRINE.md`.
- Validate the required 8 sections.
- Compute SHA-256.
- Inject either full doctrine or summary metadata into agent prompts.
- Write the doctrine hash into each run manifest.

### Required sections

```text
Product Thesis
Five-Layer Boundary Rules
Safety Rules
Agent Runtime Rules
Model Routing Rules
Edge Rules
Completion Rules
Anti-Scope-Creep Rules
```

### Recommended run behavior

| Condition | V1.3 behavior | V2 behavior |
|---|---|---|
| Doctrine file missing | Warn only | Optional block |
| Section missing | Warn only | Optional block |
| Hash changed since last run | Warn | Require confirmation for code-mutating runs |
| Full-text injection too large | Summary mode | Summary mode with source path |
| High-risk agent run | Full-text injection | Full-text or canonical compressed doctrine |

### Why this matters

This converts architecture from a static README into a **runtime constraint**.

Every future coding agent receives the rules of the system it is modifying. That prevents the project from drifting into the usual failure mode: one powerful idea spread across 200 ungoverned files.

### Add this to every `.agentrun`

```json
{
  "doctrine": {
    "path": "docs/architecture/DOCTRINE.md",
    "sha256": "4e5316a7...",
    "validation_status": "PASS",
    "sections_present": 8,
    "sections_required": 8,
    "injection_mode": "summary"
  }
}
```

---

## 7. The Next Product Milestone: V1.4 Real Run Proof

Do not build more concept modules until this works.

### V1.4 Goal

**Proven target:** One real, low-cost governed agent run that produces a replayable `.agentrun`.

The flow:

```text
1. Start TIMMY
2. Validate DOCTRINE
3. Detect OpenRouter key
4. Select budget policy
5. Run one safe agent task
6. Capture events
7. Capture model routing payload
8. Capture tool calls
9. Capture file diffs
10. Capture approvals
11. Capture cost/usage
12. Export .agentrun
13. Replay .agentrun
```

### Suggested test task

Use something harmless and measurable:

```text
Analyze this repository and create docs/FACTS.md with:
1. detected stack
2. entry points
3. test commands
4. risks
5. next shippable milestone
```

### Why this is the right test

It touches the system without risking destructive edits:
- reads repo,
- writes one doc,
- uses one model call,
- produces one file diff,
- can be replayed,
- can be audited.

---

## 8. `.agentrun` Manifest Schema

This becomes the commercial product.

```json
{
  "run_id": "run_20260526_001",
  "created_at": "2026-05-26T00:00:00-07:00",
  "operator": "local",
  "workspace": "/Users/williammeldman/Desktop/openrouter-tui/founder-terminal",
  "doctrine": {
    "path": "docs/architecture/DOCTRINE.md",
    "sha256": "4e5316a7...",
    "validation_status": "PASS",
    "injection_mode": "summary"
  },
  "model": {
    "provider": "openrouter",
    "primary": "anthropic/claude-3-5-sonnet",
    "fallbacks": [
      "qwen/qwen-2.5-coder-32b",
      "google/gemini-2.5-flash"
    ],
    "budget_zone": "normal",
    "zdr": true,
    "response_cache": false,
    "prompt_cache": true
  },
  "cost": {
    "limit_usd": 1.00,
    "estimated_spend_usd": 0.04,
    "actual_spend_usd": null
  },
  "approvals": [
    {
      "id": "approval_001",
      "risk": "low",
      "action": "write_file",
      "path": "docs/FACTS.md",
      "decision": "approved",
      "timestamp": "2026-05-26T00:02:00-07:00"
    }
  ],
  "files_changed": [
    {
      "path": "docs/FACTS.md",
      "change_type": "created",
      "sha256_after": "..."
    }
  ],
  "host_mutations": [],
  "events_path": ".runs/run_20260526_001/normalized_events.jsonl",
  "diff_path": ".runs/run_20260526_001/workspace.diff"
}
```

### The product line

This artifact is what separates TIMMY from a terminal toy.

A team does not just want an agent to run. They want to know:
- what it did,
- why it did it,
- what model it used,
- what it cost,
- what it touched,
- whether it followed policy,
- whether the run can be replayed.

---

## 9. Safety Gates

### Keep these as non-negotiable

**Proven:**
- No silent host mutations.
- Every `.env` write creates a timestamped backup.
- `.env` permissions must be `600`.
- Secrets must be redacted in logs.
- Deleting credentials requires double confirmation.
- Live Stripe provisioning requires explicit confirmation.
- Shell startup files are never modified without preview and backup.
- tmux config writes are previewed first.
- Claude/Starship settings are previewed first.
- OpenHands headless runs should default to Docker sandboxing for untrusted repos.

### Risk levels

| Risk | Examples | Default |
|---|---|---|
| Low | read file, list files, run `git status` | auto |
| Medium | write project file, run tests, install dev package | approval |
| High | edit `.env`, rotate keys, delete credentials, deploy, sudo, rm | double confirmation |
| Critical | production deploy, destructive shell, external billing mutation | require explicit typed confirmation |

### Confirmation wording

Use precise labels:

```text
CONFIRM LIVE STRIPE PROVISIONING
CONFIRM ENV WRITE
FINAL PURGE CONFIRMATION
CONFIRM HIGH-RISK SHELL COMMAND
CONFIRM AGENT RUN WITH WRITE ACCESS
```

Avoid cute copy here. This is safety UX.

---

## 10. OpenHands Integration Advice

### Best use

**Proven:** OpenHands is strongest for bounded tasks with clear success criteria:
- vulnerability fixes,
- dependency updates,
- repo analysis,
- test generation,
- issue-to-PR workflows,
- repeatable maintenance jobs.

### Best TIMMY integration path

Do not try to fully reproduce OpenHands GUI inside TIMMY. TIMMY should be the **operator layer**.

TIMMY should:
- launch OpenHands local/GUI/headless,
- inject doctrine,
- set model/routing env,
- capture events,
- show status,
- export `.agentrun`,
- link to OpenHands GUI when needed.

### Recommended wrapper pattern

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
openhands serve --mount-cwd
```

For headless:

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
openhands --headless -t "Analyze repo and create docs/FACTS.md"
```

### Rule

**Do not rely on headless always-approve for risky repos without Docker.**

If TIMMY cannot prove sandbox state, show:

```text
WARNING: OpenHands write-capable run without confirmed Docker sandbox.
Recommended: run with Docker workspace or use read-only analysis mode.
```

---

## 11. x-cmd Integration Advice

### Correct role

**Proven:** x-cmd is not a TUI framework. It is a portable shell/AWK runtime and package/tool capability layer.

Use it as **Layer 0**, not as Layer 2.

### TIMMY should use x-cmd for

- portable package resolution,
- standardized command vocabulary,
- agent-accessible CLI tools,
- shell diagnostics,
- x tmux wrappers,
- temporary tool installs,
- cross-host repeatability.

### Do not use x-cmd for

- Textual screen rendering,
- TIMMY state model,
- agent run persistence,
- model policy decisions,
- security approval rules.

### Runtime adapter rule

POSIX shells:

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
. "$HOME/.x-cmd.root/X" && x env use jq
```

Non-POSIX shells:

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
sh -lc '. "$HOME/.x-cmd.root/X" && x env use jq'
```

This is the right abstraction.

---

## 12. tmux / abtop / Starship Integration Advice

### tmux

tmux is the workspace persistence layer. It should own:
- pane sessions,
- agent terminals,
- logs panes,
- server panes,
- monitor panes,
- jump-to-agent workflows.

TIMMY should generate tmux layouts, not manually depend on a user’s existing layout.

### abtop

abtop is excellent as a monitor pane, not as your internal data source of record.

Use it for:
- real-time agent visibility,
- context/rate/port dashboard,
- orphan port detection,
- tmux pane jumping.

Do not depend on undocumented Claude/Codex internals for business-critical TIMMY state. Use TIMMY’s own normalized event store for durable history.

### Starship

Starship is a statusline telemetry helper, not a TIMMY data backbone.

Use it for:
- Claude Code context/cost display,
- prompt status UX,
- low-friction shell awareness.

Do not use Starship as the canonical source of cost or run state.

---

## 13. Cloudflare / Edge Scope

### Do not build Cloudflare Stratum yet

**Anti-scope-creep:** Stratum is a separate product. It is attractive, but it will eat the current project.

The correct next Cloudflare integration is much smaller:

```text
TIMMY Cloudflare Smoke Panel:
1. detect wrangler
2. detect logged-in account
3. show current project
4. run wrangler dev dry-run
5. tail logs
6. show deploy command preview
```

That is enough.

### Edge memory later

Durable Objects, D1, KV, R2, Vectorize, and AI Gateway are powerful for V2/V3. But in V1.4, local `.agentrun` and local JSONL are enough.

Build edge sync only after:
- local run replay works,
- doctrine hashes work,
- budget policy works,
- one real OpenHands/agent run is captured.

---

## 14. Research Assessment: Terminal Intelligence OS

### What is strong

The research has a real thesis:

> Software work is moving from direct manipulation to intelligence orchestration, and the terminal is a natural control plane because it already has composition, persistence, streams, processes, and low overhead.

That is a compelling framing.

### What is dangerous

Some supplied claims are too high-stakes to publish without rigorous source mapping:
- ARR claims,
- MCP download counts,
- enterprise adoption rates,
- “fastest ever” SaaS claims,
- exact benchmark percentages,
- security scan percentages,
- Cloudflare performance multipliers,
- vendor adoption claims.

### Rule for public docs

Any number used in investor/public material must be classified:

| Label | Meaning |
|---|---|
| Verified primary | Official docs, official blog, SEC filing, arXiv paper, GitHub repo |
| Verified secondary | Credible media/analyst coverage |
| Internal research | From your research agents, not yet public-safe |
| Speculative | Use only in strategy docs, not sales docs |

### Recommended public claim style

Bad:

```text
MCP has 97M monthly downloads and 45% enterprise adoption.
```

Better:

```text
MCP is rapidly becoming a standard integration layer for agent tools, with official SDKs, public server ecosystems, and support across major AI/developer platforms.
```

Unless the exact stat is source-mapped.

---

## 15. Build Roadmap

## V1.4 — Real Run Proof

**Timeline:** 3–5 days  
**Goal:** One replayable governed run.

### Deliverables

- [ ] `RunManifest` schema
- [ ] `.agentrun` exporter
- [ ] `.agentrun` replay viewer
- [ ] real low-cost OpenRouter call
- [ ] model payload captured
- [ ] doctrine hash captured
- [ ] budget zone captured
- [ ] approval event captured
- [ ] file diff captured
- [ ] final report generated

### Acceptance command

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
PYTHONPATH=src .venv/bin/python src/founder_terminal/app.py
```

Manual acceptance:
- Launch one safe agent run.
- Confirm `docs/FACTS.md` created.
- Export `.agentrun`.
- Replay run.
- Verify manifest contains doctrine hash, model route, budget zone, file diff, and approvals.

---

## V1.5 — OpenHands Operator Adapter

**Timeline:** 5–7 days  
**Goal:** TIMMY launches and supervises OpenHands safely.

### Deliverables

- [ ] `openhands_adapter.py`
- [ ] dry-run launch preview
- [ ] Docker availability check
- [ ] mount mode selector
- [ ] doctrine prefix injection
- [ ] event stream capture
- [ ] final output normalization

### Commands to support

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
openhands serve --mount-cwd
```

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
openhands --headless -t "Analyze repo and create docs/FACTS.md"
```

---

## V1.6 — Agent Spend Black Box Recorder

**Timeline:** 5–10 days  
**Goal:** Make run auditing the core product.

### Deliverables

- [ ] model spend report
- [ ] fallback reason capture
- [ ] cache hit/miss capture where available
- [ ] ZDR/cache compatibility log
- [ ] tool approval report
- [ ] command risk report
- [ ] replayable markdown export

### Product name

**Agent Spend Black Box Recorder**

This is commercially stronger than “Billing Console.”

---

## V2 — Cloudflare Sync

**Timeline:** after local proof  
**Goal:** Sync run artifacts to edge.

### Add only after V1.4–V1.6 pass

- Cloudflare R2 run artifact storage
- D1 run index
- Durable Object active run room
- Vectorize semantic search over run logs
- AI Gateway observability
- optional web replay viewer

---

## 16. Copy-Paste Implementation Commands

### Compile doctrine package

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
python3 -m py_compile src/founder_terminal/doctrine/*.py
```

### Check doctrine status

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
PYTHONPATH=src .venv/bin/python src/founder_terminal/doctrine/cli.py status
```

### Preview OpenRouter doctrine context

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
PYTHONPATH=src .venv/bin/python src/founder_terminal/doctrine/cli.py inject-preview --target openrouter --no-full
```

### Preview OpenHands doctrine prefix

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
PYTHONPATH=src .venv/bin/python src/founder_terminal/doctrine/cli.py inject-preview --target openhands --no-full
```

### Compile OpenRouter cockpit

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
python3 -m py_compile src/founder_terminal/openrouter/*.py src/founder_terminal/tui/screens/openrouter_management.py src/founder_terminal/tui/main_app.py
```

### Run central doctor

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
PYTHONPATH=src .venv/bin/python src/founder_terminal/doctor.py
```

### Launch TIMMY

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
PYTHONPATH=src .venv/bin/python src/founder_terminal/app.py
```

---

## 17. Required UI Copy

Use blunt operator language.

### Stripe not installed

```text
Stripe CLI not found.
Install Stripe CLI or use simulated provisioning.
No environment files were modified.
```

### Stripe Projects unavailable

```text
Stripe Projects command unavailable on this host.
Run: stripe projects --help
No environment files were modified.
```

### Live provisioning confirmation

```text
HIGH-RISK ACTION:
This will run Stripe Projects provisioning and may create or link an OpenRouter account, generate credentials, and update this project’s .env file.

A timestamped backup will be created before any write.
Click again to confirm.
```

### Budget blocked

```text
BUDGET BLOCKED:
This run would exceed the configured model spend cap.
Increase the cap or switch to emergency routing.
No model call was started.
```

### ZDR/cache conflict

```text
PRIVACY/CACHE WARNING:
Account-level ZDR disables OpenRouter response caching because response caching requires temporary response storage.
Prompt caching is separate and provider-dependent.
```

### Doctrine missing

```text
DOCTRINE WARNING:
docs/architecture/DOCTRINE.md is missing or incomplete.
This run may proceed in warn-only mode, but architecture governance will not be fully enforced.
```

---

## 18. Anti-Scope-Creep Rules

If a feature does not help produce a replayable governed run, park it.

### Park now

- Full Cloudflare Stratum
- MCP-native shell replacement
- CRDT collaborative terminal
- SaaS dashboard
- R2/D1/Vectorize sync
- voice control
- mobile control pane
- OpenRouter video generation cockpit
- multi-agent swarm scheduler
- marketplace/plugin store

### Build now

- `.agentrun`
- doctrine hash capture
- safe env mutation audit
- real model call capture
- budget policy enforcement
- OpenHands launch adapter
- replay viewer
- approval events
- file diff capture

---

## 19. Monetization Path

### Fastest first dollar

Sell the narrow tool:

> “Local AgentOps cockpit that prevents runaway AI agent spend and creates replayable audit logs.”

### Pricing

| Tier | Product | Price |
|---|---|---:|
| Solo | TIMMY Local | `$49–$149 one-time` |
| Pro | Spend Guard + Replay | `$19–$49/mo` |
| Team | Shared policies + replay bundles | `$199–$499/mo` |
| Enterprise pilot | Safe agent runner for internal repos | `$25k+ pilot` |

### Buyer pain

- “My agent spent too much.”
- “I do not know what model it used.”
- “I do not know what it changed.”
- “I need to prove it did not leak secrets.”
- “I need to replay the run.”
- “I need cost limits before letting agents touch code.”

### Demo script

```text
1. Start TIMMY.
2. Show doctrine validation.
3. Show OpenRouter budget cap.
4. Run a safe agent task.
5. Show one approval gate.
6. Show file diff.
7. Show final cost.
8. Export .agentrun.
9. Replay .agentrun.
```

If that demo works, you have a sellable product.

---

## 20. Final Recommendation

**Build V1.4 next. Nothing else.**

The next shippable version should prove:

```text
TIMMY can run one AI coding task with:
- doctrine governance,
- OpenRouter spend policy,
- safe environment handling,
- approval gates,
- model route capture,
- file diff capture,
- replayable .agentrun artifact.
```

That is the inflection point.

After that, every big concept becomes easier:
- OpenHands becomes an execution backend.
- x-cmd becomes the portable capability layer.
- tmux/abtop becomes the live monitor layer.
- OpenRouter becomes the model/budget layer.
- Cloudflare becomes the remote replay/sync layer.
- The “Terminal Intelligence OS” becomes credible because it has a working kernel.

---

## 21. Innovative Bridge

**Speculative but high-upside:** Create a `.agentrun` artifact that can be attached to GitHub PRs as an AI run receipt.

When an agent opens or modifies a PR, TIMMY posts:

```text
AI Run Receipt:
- Doctrine hash: 4e5316a7...
- Model route: Claude -> Qwen fallback
- Cost: $0.04 / $1.00 cap
- Approval gates: 1 approved, 0 rejected
- Files changed: 1
- Host mutations: 0
- Replay bundle: attached
```

This turns your terminal cockpit into a trust layer for AI-generated code.

---

## 22. Next Action Today

Run the smallest real proof:

```bash
cd /Users/williammeldman/Desktop/openrouter-tui/founder-terminal
PYTHONPATH=src .venv/bin/python src/founder_terminal/app.py
```

Then create one safe governed run:

```text
Analyze this repo and create docs/FACTS.md with stack, entry points, test commands, risks, and next shippable milestone.
```

Export `.agentrun`.

If `.agentrun` contains doctrine hash, model route, budget zone, approval event, file diff, and no unsafe host mutation, TIMMY has crossed from “impressive build” to **real product**.

---

## Source Notes

The recommendations above were cross-checked against current official/public documentation:

1. OpenRouter Stripe Projects integration — `stripe projects add openrouter/api` provisions/links OpenRouter, generates an API key, and syncs `.env`.
2. Stripe Projects CLI — stores credentials in vault and syncs `.env`; supports resource provisioning and credential rotation.
3. OpenRouter Agent SDK — `callModel`, tools, stop conditions, streaming, and multi-turn state.
4. OpenRouter model fallbacks — priority-ordered fallback model array and SDK usage.
5. OpenRouter response caching — identical request cache hits return with zero billable usage; account-level ZDR disables response caching.
6. OpenRouter ZDR — provider data-retention controls at account, guardrail, and per-request levels.
7. OpenHands local setup and GUI server — `openhands serve`, Docker requirement, `--mount-cwd`, `--gpu`.
8. OpenHands Software Agent SDK paper/docs — event-sourced state, typed tools, MCP integration, local/remote workspaces.
9. x-cmd official docs/GitHub — POSIX shell/AWK toolkit, modules/packages, on-demand tool loading.
10. Cloudflare Durable Objects docs — SQLite storage, strongly consistent state, WebSocket hibernation.


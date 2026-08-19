# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-08-19

### Added
- OpenHands A2 SDK engine: Conversation API + LocalWorkspace, tools execute
  in-process against a seeded disposable workspace; NeverConfirm headless
  policy; bounded nudge loop; non-streaming ollama (streaming mangles
  tool-call args). Demo C remains honestly RED (last-mile edit reliability
  unresolved; receipts record every attempt).
- `hyperframes` render lane; Demos A+B re-run through the Command Post
  (plan → J-BANG approval → dispatch → collect, receipted).
- `host-ephemeral` dispatch workspaces seed `context_manifest` files
  (sha256-verified, path-escape-checked) — the ephemeral temp copy the
  isolation law always promised; renders run from the seeded copy, never
  the live checkout.
- Receipt browser (:4310/browser), Mission Map (:4321), UI north-star
  reference + color-consistency law, public-repo organization pass.

### Changed
- Local default OpenHands model `ollama/qwen3.8:27b-mlx`; engine part of the
  plan hash (immutability).

### Honesty
- Demo C acceptance record: workspace seeding ✓, tool invocation ✓, patch
  red→green ✗ (sealed red, `sha256_cf72f858` preserved as the original
  failure record). No fabricated passes.

## [0.5.0] - 2026-08-16

### Added
- **One-command judge loop** (`timmy_judge_loop` MCP tool): phase 1 returns the resolved executor/judge plan + plan hash; phase 2 requires an operator-minted single-use 5-min token bound to that exact hash (`timmy approve <planHash>`). Executors run via `Promise.allSettled`; one configurable judge; child receipts per executor/judge plus a parent receipt linking children, plan hash, spend and tier.
- **AgentPass-named spend policy**: approved plans bind system/user prompts, executor order, judge, transport resolution, parameters, escalation policy and `max_spend`/`tier`/`policy`; paid routes default-deny at `max_spend: 0`; overspend aborts before the judge.
- **Receipt chain v0.5 integrity**: single-writer mkdir lock serializes read-tail → sign → append across processes; release epochs (`EPOCH.json`) let a clean signed epoch start after an incident while legacy broken streams stay queryable as incident evidence; verifier reports per-epoch segments.
- **Receipts v2 bindings**: prompt/response hashes (never raw content), requested vs resolved model, transport, latency, tokens, reported cost, status and error class; failed AND denied attempts seal signed receipts too.
- **Replay integrity enforcement**: replay refuses on active-OS/arch/executable-build-hash or sealed-source-hash mismatch with signed failure receipts; verify records bind EDL + manifest hash + sources + output hash.
- **Portable `.agentrun` acceptance artifact** (`timmy export agentrun <jobId>`): sanitized bundle (relative paths, no credential material) with EDL, media, hashes, env lock, signer key, original + replay receipts, verification report and the OTIO interchange; replays from a fresh workspace and byte-compares.
- **Apify + cult/pro lanes**: `timmy_apify_run` (mcporter http, logged + receipted), cult/pro shadcn registry wired via `config/mcporter.json` env-placeholder header for the UI remix.
- **Parallel-agent git rules** in AGENTS.md (no `git add -A`, stage-only-yours, no resets of foreign work).

### Changed
- Approval booleans removed everywhere; bare `approved: true` no longer approves anything.
- `timmy export` gains `agentrun`; `timmy.ts` delegates `mcp|logs|approve|events` to the modern CLI.

### Fixed
- CI/release pin OpenTimelineIO 0.18.1 (`otioconvert` present); `timmy help`/`version` tests spawn node directly with a real timeout instead of flaking under load.

## [0.4.0] - 2026-07-14

### Added
- **Consensus Fusion Workflow Receipts**: Integrated `/api/workflow/fusion` endpoint on the Cloudflare Durable Object companion server to generate multi-agent consensus and Rive state validation receipts.
- **MCPorter & Rive Companion**: Wired MCPorter integration and `@rive-app/canvas` in root, plus `@rive-app/react-canvas` in `my-react-app`.

### Changed
- **TypeScript 7 Upgrade**: Migrated root package and `my-react-app` workspace devDependencies to TypeScript `^7.0.2`.
- **Single-source Version Generator**: Configured automated version generation writing `src/version.ts` from root `package.json` dynamically before builds, tests, and packing.

## [0.3.0] - 2026-07-11

### Added
- **Break Mode `list_card` Tool**: Added integrated TUI tool in `src/agent/tools.ts` to fetch live card pricing and push Stripe checkout listings live on stream via the Break Mode API.
- **Hermes TUI Gateway**: Implemented Hermes TUI Gateway event mirror MVP for event mirroring, authorization, DMs, D1-backed session state, and sealed gateway receipts.
- **Setup Guidance**: Included git clone command in README and setup guide as the first installation step.
- **Code Reviews**: Configured main branch checks to require code owner reviews.

### Fixed
- **Fixed-Column Options Layout**: Fixed layout overlap issues on the options panel under specific terminal aspect ratios.
- **Repository Clean**: Cleaned up internal planning documents and absolute path file links for open-source publication.

## [0.2.0] - 2026-06-12

### Added
- **TUI Model Rail Readability**: Improved colors, rails layout, and model text truncation rules.
- **Hotfix Automator**: Added release upgrade checklists and hotfix shell automation.

### Fixed
- **TUI Layout regressions**: Resolved terminal panel regressions on Options, Workspace, and Teams layouts.
- **Deterministic Layouts**: Fixed panel flex dimensions to guarantee no overlaps on narrow screens.

## [0.1.0] - 2026-06-07

### Added
- **Deterministic Receipt Hashing**: Implemented key-sorting canonicalization and SHA-256 manifest hashing in `src/receipt/schema.ts`.
- **Command Line Interface**: Expanded `timmy` command with `demo`, `proof`, `version`, and `help` commands in `timmy.ts` and `src/cli.ts`.
- **Vitest Testing Framework**: Added unit and integration tests under `tests/receipt.test.ts` verifying receipt logic and CLI stdout/file behavior.
- **NPM Package Mappings**: Wired whitelist files and `bin` entries in `package.json` for global installs and `npx` executions.
- **GitHub Launch Files**: Added `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `ROADMAP.md`, and CI/Release GitHub Actions workflows.
- **Example Guides**: Added examples for basic demo setup and Cloudflare deployment validation receipts.

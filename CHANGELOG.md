# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.5] - 2026-08-19

### Added
- V-04 GRADUATION (first ComfyUI federation rung): `scripts/phaseD-golden.ts`
  ran two FRESH headless 5s golden executions (server restarted between runs,
  seed pinned 1337, checkpoint discovered at runtime) producing byte-identical
  output `sha256:50aa3c52…30a69`; graduation receipt `sha256_253c4a08…` with
  the two run receipts as children. `docs/VISION-REGISTER.md` strikes V-04 and
  re-registers the remaining routing scope as V-05. Re-verified after the
  ComfyUI 0.28 tool-env fix: two further fresh runs
  (timmy-golden-5s_00006/00007) reproduce the identical sha — 4/4
  byte-identical across server restarts; receipt `sha256_363f1b8e…`.
- Context Cone (V-01 rung 1): `src/utils/context-cone.ts` +
  `schemas/context-cone.cue` — CUE-validated 3-tier indexing (L0 apex
  manifest / L1 skeleton / L2 diffs+traces) with strict token budgeting;
  selection fails closed when the apex alone exceeds budget; L2 forages
  recency-desc under the remaining budget.
- Companion arming gateway: `POST /mission/store` on :4310 stores a compiled
  plan and returns its id + immutable hash; the Mission Studio page then
  emits hash-bound arm+launch requests through the controller's existing
  `/dispatch/action` (operator token required — the companion never
  executes). Integration tests cover compile→store→arm-denied and the
  theatre-state escape check.

### Fixed
- `comfy-adapter`: binary resolution fallback for PATH-less background
  shells (UV_PY pattern) and `--json env` probe (`--json version` is a usage
  error in comfy-cli 1.16); golden proof restarts the server between runs so
  determinism is proven on fresh executions, not node-cache hits.
- Local ComfyUI 0.28 tool env aligned (sqlalchemy + full requirements.txt) —
  the asset scanner crash that killed the daemon mid-phase.

## [0.7.4] - 2026-08-19

### Added
- Vision Register (`docs/VISION-REGISTER.md`, spec §11): the four unverified
  north-star targets (Hierarchical Context Cone, Tri-modal 3D USD stack,
  AgentPass escrow clearinghouse, ComfyUI federation) codified with
  receipt-grade exit criteria. Targets are not receipts: nothing in the
  register gates runtime behavior; graduation is a CHANGELOG event.
- Mission Studio on the logs companion (`:4310/mission`): survey surface that
  consumes the compiler via `POST /mission/compile` (localhost-only), renders
  dependency-ordered CUE-valid plan cards, plays compiled mission stages
  frame-accurately (Bézier sampler mirroring `theatre-runtime`, 30fps
  timebase) plus W3C media-fragment video stems; `GET /mission/theatre`
  serves compiled-folder state with path-escape checks; the :4321 Mission
  Map links across. Compiles only — launching stays with the controller.
- Media Fabric local blueprint spike (V-04 first rung):
  `src/utils/comfy-adapter.ts` — deterministic comfy-cli execution adapter
  for local headless 5s golden runs: every seed pinned (`GOLDEN_SEED`),
  checkpoints discovered at runtime and injected at the `DISCOVER` sentinel
  (never hardcoded), fail-closed `not_configured` / `missing_source` /
  `server_not_running`, every outcome receipted. `scripts/comfy-golden-5s.json`
  is the pinned core-node spine.

## [0.7.3] - 2026-08-19

### Added
- MCP tool `timmy_mission_compile`: the Mission Map compiler exposed to any
  MCP-speaking agent and the :4321 companion — a tldraw mission doc in,
  typed CUE-validated DispatchPlans out; the map still never launches.
- Studio runtime (`src/utils/theatre-runtime.ts`): loads native Theatre.js
  on-disk state (definition `0.4.0`, sheets keyed by id — the exact shape
  `@theatre/core@0.7.2` validates) from compiled project folders, plays it
  back deterministically via cubic-Bézier sampling (`sampleTrack` /
  `sampleSequence`), and hands the identical state to the browser path
  (`getProject(id, {state})`, CJS-interop safe).
- End-to-end mission verification (`tests/mission-e2e.test.ts`): multi-stage
  Slate map → CUE DispatchPlans → controller store → sanitized multi-track
  OTIO → Theatre state round-trip + playback → signed parent/child receipt
  chain verifies clean.

## [0.7.2] - 2026-08-19

### Added
- Mission Map → DispatchPlan compiler (`src/utils/slate-compiler.ts`): the
  tldraw node vocabulary (capsule / harness-slide / gate / artifact / result
  + dependency edges) compiles into typed CUE DispatchPlans — emitted in
  dependency order with `cadence.depends_on` wiring, sha256-pinned
  `context_manifest` entries from artifact handoffs, and gate-driven
  approval/acceptance; every plan passes `validatePlanCue`; cycles, unknown
  harnesses and missing artifacts fail closed with explicit errors. The map
  still never spawns work — compiled plans go through the controller.
- OTIO media-spine hardening: explicit timebases on every RationalTime (EDL
  `timebase`, default 24), multi-track audio stems (one Audio track per
  music/vo/sfx kind with ducking metadata), and `sanitizeMediaUrl`
  bundle-relative exports — absolute/home paths never leave the machine
  unless the caller opts out.
- Theatre.js native motion state: keyframes carry cubic-Bézier handles and
  `theatreStateFromSequence` emits theatrejs-v1 sheet/sequence/track JSON
  the studio loads verbatim via `@theatre/core`; the EDL transform compile
  (compile-to-EDL law) is unchanged.

## [0.7.1] - 2026-08-19

### Added
- Phase C — true sandbox isolation for the OpenHands runner: `engine: docker`
  (default) executes the agent loop AND its tools inside an ephemeral
  `timmy-oh-runner` container (`--cap-drop=ALL`, `no-new-privileges`, pids/
  memory/cpu caps, single `/work` mount); daemon-down or image-build failure
  fails closed as `not_configured`/`blocked`, never host fallback.
- In-container patch lifecycle: the bridge generates the worktree patch,
  applies it to a pristine clone, and asserts acceptance there — the receipt
  only seals green when the patch ALONE turns red→green
  (`patch_not_portable` otherwise). Host-path canary inside the container
  trips `isolation_violation` on any leaked host mount.
- Demo C GREEN (owner-approved frontier escalation, `llm=auto` under a
  $0.50 hard cap, single-use approval bound to the plan hash): workdir and
  pristine acceptance both exit 0, canary clean; parent receipt
  `sha256_69073a15`. The containerized local-model attempts that stayed red
  remain sealed honestly in the chain (`sha256_a1b85fea` correct patch but
  npm missing in image; `sha256_05a077a7`, `sha256_8c2f8f19` view-only).
- `scripts/phaseC-demo.ts` + `scripts/oh-runner.Dockerfile` (pinned
  openhands-sdk/tools/workspace 1.21/1.21/1.11, uv resolver, Chromium for
  toolset parity, npm for acceptance).

### Changed
- `timmy_openhands_run` plan hash now binds `engine` default `docker`
  (immutability law: host engines are an explicit, approved deviation).
- Note: `.agentrun` portable bundles remain clip-spine artifacts (EDL/media/
  OTIO); Demo C's proof rides the parent/child signed receipt chain instead.

## [0.7.0] - 2026-08-19

### Changed
- UI remap against the MMGEN v2.4.1 reference: strict Tokyo Night palette
  tokens centralized in `src/tui/theme.ts` (zero raw hex outside that file,
  enforced across panels, drafts, companions, logserver and project sites);
  PanelFrame standardized (hairline border, stdout-derived responsive gutters,
  semantic status glyphs from the single StatusGlyph map); Dispatch rail shows
  an 8-char plan hash with `[y]` copy / `[x]` expand, a sandbox isolation badge
  and a budget thermometer, every line width-truncated so the reverse LogRain
  never clips; LogRain is burst-safe (tail-only reads, size-signature skip,
  memoized) so Cloudflare event storms never lag chat/J-BANG input.
- TrueColor fallback: Ink/chalk down-convert the hex tokens automatically when
  `COLORTERM!=truecolor` (bare SSH/CI); `colorLevel` in theme.ts exposes the
  live mode — no second palette to keep in sync.

### Removed
- Orphaned Cloudflare workers `r2-worker` and `openrouter-tui-agent`
  decommissioned per owner decision — eliminates the false Workers-Builds
  PR checks.

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

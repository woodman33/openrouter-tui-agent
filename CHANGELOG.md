# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-07

### Added
- **Deterministic Receipt Hashing**: Implemented key-sorting canonicalization and SHA-256 manifest hashing in `src/receipt/schema.ts`.
- **Command Line Interface**: Expanded `timmy` command with `demo`, `proof`, `version`, and `help` commands in `timmy.ts` and `src/cli.ts`.
- **Vitest Testing Framework**: Added unit and integration tests under `tests/receipt.test.ts` verifying receipt logic and CLI stdout/file behavior.
- **NPM Package Mappings**: Wired whitelist files and `bin` entries in `package.json` for global installs and `npx` executions.
- **GitHub Launch Files**: Added `LICENSE`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `ROADMAP.md`, and CI/Release GitHub Actions workflows.
- **Example Guides**: Added examples for basic demo setup and Cloudflare deployment validation receipts.

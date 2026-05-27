# TIMMY OpenRouter TUI Agent Docs

TIMMY is a terminal-first agent operations console for running OpenRouter-backed assistants, local and edge agent runners, run receipts, companion UI telemetry, and provider routing experiments without hiding the audit trail.

This documentation set is structured for GitBook Git Sync. The repository root contains `.gitbook.yaml`, which points GitBook at this `docs/` directory and uses `README.md` plus `SUMMARY.md` as the published entrypoint and table of contents.

## Local Commands

- `npm run docs:verify` checks required docs, GitBook CLI availability, `.env.example`, and `GITBOOK_API_KEY` presence without printing secrets.
- `npm run docs:preview` renders a local HTML preview from the Markdown files.
- `npm run docs:gitbook` verifies GitBook authentication through `GITBOOK_API_KEY` and prepares the repo for GitBook Git Sync publication.
- `timmy docs verify`, `timmy docs preview`, and `timmy docs publish` provide the same surface after `npm run build`.

## Publishing Model

GitBook is configured for docs-as-code through Git Sync. Publish by committing safe docs and source to the private GitHub repository connected to the GitBook space. The local command verifies the GitBook CLI and token path, but it does not echo or persist the API key.

## Safety Rules

- Keep `.env` local only.
- Keep `.timmy/receipts/`, logs, local credentials, and generated previews out of git.
- Use `.env.example` for names of required variables only.
- Run `scripts/security-scan.sh` before committing.

# TIMMY Agent Trust OS Docs

TIMMY is a terminal-first Agent Trust OS for governed AI agent execution, provider routing, verified context packs, run receipts, companion telemetry, and local-first audit trails, with Cloudflare-hosted audit trails as the edge deployment path.

TIMMY's commercial wedge is governed proof: every meaningful agent action can be tied to AgentPass scopes, risk classes, verified context packs, and tamper-evident `.agentrun` receipts. The product principle is simple: trust the receipt, not the model.

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

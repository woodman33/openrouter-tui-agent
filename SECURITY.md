# Security Policy

## Supported Versions

We actively support security updates for the latest minor and major releases:

| Version | Supported |
| ------- | --------- |
| v0.1.x  | Yes       |

## Security Warnings & Best Practices

TIMMY is designed to audit autonomous agent workspaces. Please note:

1. **Secrets Gating**: Do **not** input API keys, connection passwords, or cloud credentials directly into task prompts. Task strings are recorded in plaintext inside `manifest.json` and `receipt.json`.
2. **Metadata Transparency**: Execution receipts record system environment metadata, including the current working directory (`cwd`), operating system platform, Node.js runtime version, and relative paths of touched files. Ensure you review local receipt contents before publishing them publicly.
3. **Local-Only Storage**: By default, all receipts and runs are written under the local `.timmy/` and `.runs/` directories, which are automatically gitignored.
4. **Sandboxed Stubs**: In version `v0.1`, dangerous shell mutations are not executed. Commands are run as safe programmatic stubs to prevent host infection or credential leakage.

## Reporting a Vulnerability

If you discover a security vulnerability, please do **not** open a public issue. Report it directly through GitHub Security Advisories in the repository or by emailing the owner at `owner-placeholder@example.com`.

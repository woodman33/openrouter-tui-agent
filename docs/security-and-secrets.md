# Security and Secrets

TIMMY should never commit real provider secrets, private receipt payloads, local machine credentials, tunnel URLs, or database passwords.

## Ignored Local Files

The repository ignores:

- `.env` and `.env.*`
- `.dev.vars` and `.dev.vars.*`
- `.timmy/`
- `logs/`
- `receipts/`
- `.wrangler/`
- `.vercel/`
- `.stripe/`
- `.projects/`
- private key file extensions

`.env.example` remains tracked because it contains variable names and placeholders only.

## Required Variables

Use `.env` locally for:

- `OPENROUTER_API_KEY`
- `OPENAI_API_KEY`
- `GITBOOK_API_KEY`
- Cloudflare, Clerk, Stripe, PostHog, Daytona, Trigger.dev, and Composio secrets as needed

Do not paste these values into docs, source comments, screenshots, issue text, or receipt examples.

## Scanning

Run:

```bash
scripts/security-scan.sh
```

The scanner reports filenames only, not matching secret values. If it flags a file, inspect it locally and either redact the value, replace it with a placeholder, or move the private artifact outside the commit path.

## GitBook

`npm run docs:gitbook` maps `GITBOOK_API_KEY` to `GITBOOK_TOKEN` only in the child process environment used by the GitBook CLI. It does not pass the key as a command-line flag and does not print it.

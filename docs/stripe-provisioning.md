# Stripe Projects Provisioning for TIMMY V1.5.2

This document describes how to provision the third-party integrations and secrets required for launch using the Stripe CLI Projects feature.

## Gated Projects Infrastructure

Stripe Projects enables direct, secure management of serverless environment properties without manually editing vault files or scraping plaintext secrets.

### Provisioning Checklist

To configure your local environment, run the helper script from the repository root:

```bash
chmod +x scripts/stripe-projects-provision.sh
./scripts/stripe-projects-provision.sh
```

This automates the following sequence:

1. **Host CLI Setup:** Verifies `stripe` installation and installs the official `projects` plugin command:
   ```bash
   brew install stripe/stripe-cli/stripe
   stripe plugin install projects
   ```
2. **Operator Login:** Authenticates with your Stripe Developer account:
   ```bash
   stripe login
   ```
3. **Project Initialization:** Creates the target workspace bounds:
   ```bash
   stripe projects init timmy
   ```
4. **Third-Party Services Binding:** Registers the service dependencies dynamically:
   ```bash
   stripe projects add clerk/auth --json --no-interactive --auto-confirm --accept-tos
   stripe projects add cloudflare/worker --json --no-interactive --auto-confirm --accept-tos
   stripe projects add openrouter/api --json --no-interactive --auto-confirm --accept-tos
   stripe projects add posthog/analytics --json --no-interactive --auto-confirm --accept-tos
   stripe projects add daytona/sandbox --json --no-interactive --auto-confirm --accept-tos
   stripe projects add vercel/project --json --no-interactive --auto-confirm --accept-tos
   ```
5. **Environment Pull:** Retrieves latest cloud keys and syncs to your local environment securely:
   ```bash
   stripe projects env --pull
   stripe projects llm-context
   ```

## Production Guidelines

- **Never read or edit `.projects/` directories manually.** Doing so will invalidate canonical state hashes and break credentials syncing.
- **Never scrape `.env` to discover active services.** Always use `stripe projects env` to dynamically audit bindings.
- **Preserve `.projects/state.json` and `.projects/state.local.json`.** Ensure these are in your `.gitignore` or marked as read-only.

# Cloudflare Deployment

Cloudflare support is preserved in `wrangler.jsonc`, `src/companion/cloudflare-worker.ts`, and the existing `docs/cloudflare-features.md` page.

## Commands

- `npm run cf:dev` runs the Worker locally through Wrangler.
- `npm run cf:deploy` deploys the Worker.
- `npm run cf:tail` tails Worker logs.

## Bindings

The current configuration covers:

- Durable Objects for run and session state
- D1 for relational edge state
- R2 for payload storage
- Queues for synthetic trace generation
- Vectorize for retrieval indexes
- Workers AI for fallback inference
- Workflows for long-running orchestration
- Hyperdrive for database connectivity
- Service bindings for internal Worker calls

## Secret Handling

Provider keys should be stored as Cloudflare secrets or local `.dev.vars` values, never committed to source. The repository keeps binding names and non-secret identifiers in `wrangler.jsonc`, while local connection passwords are redacted as `CHANGE_ME`.

## Deployment Checklist

1. Run `npm run build`.
2. Run `npm run docs:verify`.
3. Run `scripts/security-scan.sh`.
4. Confirm `.dev.vars`, `.env`, and local receipt files are ignored.
5. Deploy with `npm run cf:deploy` only after validating the target Cloudflare account and Worker name.

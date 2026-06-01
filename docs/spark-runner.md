# Spark Runner

Spark Runner is TIMMY's private compute plane. It is designed for jobs that should run near private storage, local credentials, internal data, or non-public model assets.

## What Sparks Do

Sparks can be used for:

- private artifact processing
- local model or workflow execution
- sensitive replay rendering
- NAS-backed storage operations
- jobs that should not leave a trusted machine or network

The registry entry is metadata-only. It does not call Spark endpoints, open tunnels, import an SDK, or require Spark variables unless Spark is enabled.

## Environment Names

The provider audit checks these names without printing their values:

- `SPARK_RUNNER_ENABLED`
- `SPARK_RUNNER_ENDPOINT`
- `SPARK_RUNNER_TOKEN`
- `NAS_STORAGE_ENABLED`
- `NAS_STORAGE_PATH`

If Spark is disabled, missing Spark variables are not treated as a failure. If Spark is enabled, the endpoint and token are required for readiness.

## Privacy Boundary

Do not publish:

- Spark machine names
- private hostnames
- tunnel URLs
- NAS volume names
- local mount paths
- access tokens
- receipt payloads with private command context

Docs should describe Spark behavior generically. Operational details belong in local `.env`, private runbooks, or credential managers.

## Cloudflare Relationship

Cloudflare remains the control plane. It can coordinate runs and receipts, while Sparks execute private work. This separation keeps orchestration visible without exposing private compute topology.

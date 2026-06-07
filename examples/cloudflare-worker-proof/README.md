# Cloudflare Worker Deployment Proof Example

This documentation guide illustrates how an AI coding agent compiles deployment proofs and seals a verification receipt when creating and publishing a Cloudflare Worker.

## Conceptual Workflow

1. **User Request**: The operator prompts the agent:
   ```bash
   timmy proof "create a hello world Cloudflare Worker"
   ```

2. **Agent Execution (Simulated)**:
   - Initializes a new project directory structure.
   - Scaffold-generates a wrangler config and typescript entrypoint.
   - Runs compile-checks and dry-run tests.
   - Deploys the worker to the Cloudflare network.

3. **Receipt Generation**:
   The agent records all execution steps, files created, and deployment hashes into the local proof folder:
   - **`replay.md`**: Textual evidence of execution logs and status checks.
   - **`receipt.json`**: Deterministic JSON containing artifact details and the SHA-256 manifest hash.
   - **`manifest.json`**: Master index linking the proof run to system runtime parameters.

## Verifying the Proof

To simulate the deployment run and check the generated manifest files:

```bash
timmy proof "create a hello world Cloudflare Worker"
```

Expected files created under `.timmy/runs/run_proof_xxxxxxxxxx/`:
- `replay.md`
- `receipt.json`
- `manifest.json`

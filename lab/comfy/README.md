# TIMMY ComfyUI system — the ally, not the python nightmare

The rule: **ComfyUI never touches host python.** The container IS the
environment; node packs are data, not installs.

## Three lanes
1. **Local isolated** — this compose file. `docker compose up` on the 5090
   host (GPU) or the Mac (CPU). Custom nodes pinned by git hash in
   `comfy.lock.json`; a hash mismatch = refuse to boot (deterministic).
2. **RunComfy (burst)** — per-generation cloud billing for overflow; the
   GENS provider list already routes here when local is saturated.
3. **ComfyDeploy (hosted API)** — stable endpoints for pack customers who
   don't run hardware; same blessed workflows, deployed as API.

## Blessing rule (from the research rulings)
≤8 blessed workflows, each pinned by content hash, each receipted when run.
`/gen --provider comfyui` sends the workflow + params through the effect
gateway so every image lands in the receipt chain with its workflow hash.

## Why this beats "download tons of nodes"
- broken venvs are impossible: the container is immutable
- reproducibility: lock file + workflow hash + seed = identical grid
- receipts: workflow hash + node hashes ride the receipt (anti-rug tripwire)

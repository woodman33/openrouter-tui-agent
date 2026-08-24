# decisions.md — TIMMY forge lane ADR log

Companion to design.md (the Clearinghouse constitution). Every forge commit
cites the sections it obeys from both files. Append-only; supersede by
adding, never by editing.

## D1 — Flag-gated lane, off the demo path
All forge work (gen verb, timeline emit, forge glass, wire stubs) lives in
`src/forge/` and is inert unless `TIMMY_FORGE=1`. The demo path, the chat
branch, and every Walnut-runbook verb are frozen and byte-untouched.

## D2 — `local` is computed, never claimed
A gen receipt's `local` field is true only when the dispatch path consulted
no API key (stub writer, local comfyui server with no cloud creds). The
adapter sets it from the path actually taken, not from provider marketing.

## D3 — CUE does validation; the chain does reconstruction
Sheet and timeline specs are validated by the CUE CLI (`cue vet`) BEFORE any
gen fires or any OTIO emits. Every gen fill pins `slot_id` into both
gen.request and gen.result so the sheet is reconstructible from the chain
alone. jbang is not used; no validation logic is hand-rolled where CUE
already decides.

## D4 — Stub provider for tests and proof
`--stub` dispatch writes a deterministic local artifact (zero cost,
local:true). Tests and forge.cast never spend. Real providers (comfyui-cli,
comfy-mcp via cmcp) are thin adapters added beside the stub, never instead.

## D5 — cmcp is the only WIRE
houdini-mcp and usd-mcp lanes connect through the existing cmcp client-exec
slot. No mcporter, bindpuppet, or new WIRE dependency. If a server literally
cannot connect through cmcp, seal a `wire.dep` receipt stating why before
adding anything.

## D6 — OTIO acceptance via the pinned python
`.otio` acceptance parses with the OpenTimelineIO python lib (uv tool env,
same 0.18.1 pin as CI). The emitter writes standard OTIO JSON; clip metadata
carries `timmy:{receipt_hash, prev, prompt_hash, gen_id, rights}`.

## D8 — CUE open-list computations bake at definition time
`cue vet` evaluates if-comprehensions AND list.Sum over open lists at
definition time (empty), baking false/0 into the definition. The loader
therefore supplies `required_classes`, `required_count`,
`hero_required_count`, and `est_total_usd` in the validated payload; CUE
bounds and cross-checks them (budget: est_total <= cap; required_count >=
1; hero_required_count >= 1; per-slot `required` flag; aspect regex).
Reconstruction-from-chain and slot uniqueness stay in sheet.ts.

## D7 — This file existed absent
The p13 work order mandated citing decisions.md; the file did not exist.
Created here as the forge ADR log rather than silently citing nothing.

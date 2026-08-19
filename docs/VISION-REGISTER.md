# Vision Register (spec §11)

Long-term north-star targets, codified so architecture stays documented
**without ever conflating targets with runtime receipts**. Everything in this
register is a TARGET: unverified, unshipped, non-binding on the controller.
Everything outside it that claims "shipped" must point at a signed receipt in
the runs chain (or an `.agentrun` bundle for clip spines). Two columns that
must never merge.

| Rule | Meaning |
|---|---|
| Targets are not receipts | A vision entry confers no capability. Code may not check "is X in the vision" to enable behavior; only receipts, env locks, and CUE-validated plans gate runtime paths. |
| Exit criteria are receipt-grade | Each entry states what would verify it. An entry graduates only when a sealed receipt (or bundle) demonstrates the criterion; graduation is a CHANGELOG event, not an edit here. |
| Fail-closed stays | If a target's sandbox/isolation/spend story cannot be verified, it remains a target forever (REAL SANDBOX OR NOTHING; default-deny spend). |

## V-01 · Hierarchical Context Cone

**Target.** Context is a cone, not a window: a hot tip (current turn), a warm
mantle (session receipts + project slate), and a cold base (cross-project
memory), each tier with its own redaction + cost policy; the compiler selects
tiers per plan instead of stuffing one prompt.

**Why.** Judge loops and multi-shot productions already pay for context they
cannot budget; tiered selection makes context a planned resource like spend.

**Verifies when.** A dispatched plan carries a `context_manifest` whose
entries are tagged by tier, the receipt records per-tier token/cost counts,
and an ablation run (mantle removed) seals a comparable receipt showing the
delta. Until then: target.

## V-02 · Tri-modal 3D USD Stack

**Target.** One USD spine served three ways: Houdini (hython lane), Unreal
(unreal-mcp lane), and browser preview — with the EDL/OTIO media spine
addressing USD stages the way it addresses clips (fragment addressing,
sha-pinned handoffs, replay verification).

**Why.** The 3D lanes exist but are siloed; a shared stage format is what
makes "receipt-bound 3D" instead of "three exporters".

**Verifies when.** A mission compiles a capsule per lane against the SAME
stage artifact (one sha256 in three manifests), and a replay of the USD
handoff byte-compares. Until then: target.

## V-03 · AgentPass Escrow Clearinghouse

**Target.** Spend authority becomes an escrow: plans deposit a signed
max_spend ceiling; executors draw against it per sealed receipt; the
clearinghouse nets child receipts against the parent ceiling and refunds the
delta on cancel/fail. Multi-party (fleet bidding) builds on the same escrow.

**Why.** Today max_spend is a gate, not a ledger — cancellation doesn't
refund, and cross-agent bidding has no settlement primitive.

**Verifies when.** A cancelled run seals a refund receipt whose amount equals
ceiling minus drawn child receipts, and `verifyChain` walks ceiling→draws→
refund clean. Until then: target (current spend policy remains default-deny).

## V-04 · ComfyUI Federation

**Target.** Local ComfyUI as a first-class harness lane: deterministic
headless golden runs (pinned seeds, discovered checkpoints, env-locked
encoders), workflow-as-fragment compilation into DispatchPlans, and
cloud/local routing under the same approval/spend law.

**Why.** The media fabric already speaks EDL/OTIO; ComfyUI is the local
render/genesis surface that closes the loop without a partner API.

**Verifies when.** A 5s golden run seals a receipt whose output sha256
reproduces on a second run with the same env lock (determinism), and the
workflow's checkpoint name came from runtime discovery, never a hardcoded
string. The v0.7.4 `comfy-adapter` spike is the first rung — a spike, not a
graduation.

---

Maintenance: edits here are documentation-only. Moving a target into runtime
is a work order + PR + receipts, and the entry is then struck through with a
pointer to the graduating release.

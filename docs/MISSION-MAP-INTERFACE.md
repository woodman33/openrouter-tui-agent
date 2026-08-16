# Mission Map interface (Command Post v0.1, §3.6)

**No second scheduler.** The tldraw Mission Map is a *compiler* into the
DispatchPlan controller (`src/utils/dispatch.ts`); it owns visualization and
authoring ergonomics only. Creative Slate behavior is UNCHANGED by this work
order — the Mission Map is a separate canvas that emits controller calls.

## Stable node vocabulary

| Node | Compiles to |
|---|---|
| Task Capsule | `timmy_plan_dispatch` payload (a `DispatchPlan`); node id ↔ plan id |
| Harness-slide | `plan.harnesses[]` entry (LANE_RUNNERS id) + `workspace` spec |
| Gate | `approval` requirement (manual token or delegated envelope) and/or acceptance_tests |
| Dependency edge | `cadence.depends_on` (plan ids); sequential cadence |
| Artifact handoff | `context_manifest` entry (path + sha256) on the dependent plan |
| Result/receipt node | reads `collect_run` output; displays child/parent receipt hashes |

## Command mapping (Mission Map → controller)

| Map action | Controller call |
|---|---|
| drop capsule / edit fields | `timmy_plan_dispatch` (re-hash; any mutation invalidates approval) |
| arm (show plan hash, operator signs) | `timmy approve <planHash>` then `timmy_dispatch_plan {id, approval}` |
| launch / clone / redirect | `timmy_dispatch_plan` (clone = new plan with copied manifest; redirect = new harness, re-hash, re-arm) |
| watch | `timmy_tail_lane` |
| hold / cancel | `timmy_pause_or_cancel_lane` |
| collect / judge / promote | `timmy_collect_run` → judge loop → lifecycle `promoted` |

## Invariants

1. The map never spawns work itself; browser-local or canvas-local state
   changes are not sufficient — every transition goes through the allowlisted
   controller and lands as normalized event + receipt.
2. Plan hash is displayed on the capsule before launch; a capsule whose stored
   hash ≠ approved hash renders `needs_approval`.
3. Isolation law is controller-enforced; the map can only *request* workspace
   kinds (`docker` | `host-ephemeral`), never override them.
4. Blocked states render the unified enum: `not_configured | blocked`.

# TIMMY dev plan → v0.6 (spec-driven, 2026-08-18)

Governing spec: ~/Desktop/TIMMY-TUI/TIMMY_UNIFIED_SPEC.md v1.2.
Isolation is the product (§5): a changed directory is never a jail; unattended
work never touches the live checkout; fail closed when genuine isolation
can't be established. §1 upgrade path: SDK/API structured events primary,
PTY/tmux demoted to watch/attach/emergency-recovery.

## Assessment of the proposed NEXT cut

It fits. Two refinements baked in below:
1. The no-tool fail-fast guard is a GENERIC adapter law (every lane), not an
   OpenHands special case — a run that makes no tool call within N turns is
   killed and sealed as a signed failure receipt.
2. Acceptance #4 (no absolute host paths in receipts) becomes an automated
   scan at seal time: patch/receipt text containing host prefixes is rejected
   and sealed as `isolation_violation`.

## Current roadmap state (shipped, main)

v0.5.x: receipts v2 + epochs + lock · env-lock · replay + .agentrun + OTIO ·
plan-hash approvals + spend policy · judge loops (local-first) · Command Post
(DispatchPlan CUE, six tools, J-BANG rail, companion survey) · lanes
(OpenHands/OpenCode/Pi/jcode/minds + 3D + stored-key API lanes) · 23+ MCP tools
+ timmy-agent (mcpc) + cmcp bridge · oapi invoker lane · roboflow MCP entry ·
receipt browser (:4310/browser) · Mission Map v0.1 (:4321) · film spine doc ·
dasel `q` · CLI verbs (demo/proof/clip/export/events/mcp/logs/approve/epoch/map).

## Phase A — OpenHands workspace-seeding (closes Demo C, completes Command Post §5)

VERIFY-FIRST (done cheap, $0, local nemotron): 1-turn repro confirms the
isolated-workspace root cause (fixture invisible under
~/.openhands/conversations/<id>/; agent never sees host cwd).

A1. Disposable seeded workspace per run: adapter copies the fixture into a
    fresh ephemeral dir and sets the conversation working_dir to it (or seeds
    the conversation workspace at init). Never a shared/live dir.
A2. Fail-fast guard (generic): no tool call within N turns (default 2) →
    kill + signed failure receipt `no_tool_activity`.
A3. Spend guard: local model first (ollama via litellm); openrouter/auto only
    when the approved plan carries a hard max_spend.
A4. Host-path scan at seal: any receipt/patch text containing host prefixes
    (/Users/, C:\, /home/) → reject + seal `isolation_violation`.

Acceptance (all four or still red):
1. Agent invokes a file tool against the SEEDED copy (not host paths).
2. Patch lands; fixture acceptance red→green.
3. Both receipts sealed; cf72f858 remains the honest failure record.
4. Automated host-path scan passes on the run's receipts.

Spec trace: §5 sandbox law; §1 structured-events ladder; AgentPass spend law.

## Phase B — Phase-0 exit (v0.6.0)

B1. Re-run all three demos THROUGH the Command Post: J-BANG launch →
    receipts → `timmy export agentrun` bundles.
B2. PR with different-model review (local judge reads the diff summary).
B3. Merge → tag v0.6.0 on main. No tag before B1+B2 green.

## Phase C — post-v0.6 (the §5 standard, not a special case)

C1. workspace-per-run becomes the DEFAULT for EVERY lane (lanes.ts templates
    gain the seeded-workspace preamble; OpenHands loses its special case).
C2. OpenHands ladder next rung: SDK/API structured events primary; PTY/tmux
    watch-and-attach only.
C3. Receipt browser v1: deep links from receipt → run workspace manifest.

## Remaining roadmap (after v0.6, in owner priority order)

1. T2 config layer: timmy.yaml, config sync, generated shell integration,
   capture-time redaction, first shell-command receipt.
2. Apify full + Roboflow keys (owner-side mints; lanes already honest).
3. Film workflows execution: OpenEdit lane round-trip on a real comp.
4. 3D lanes first live runs (blender/godot headless where installed).
5. Stored-key lanes first receipts (webcontainers/retool/anythingllm/
   langsmith/abacus) — one receipt each, honest not_configured until keyed.
6. ALE demo: "my terminal agent hired another agent overnight, and the
   receipts prove it."
7. Hosted receipt portal (paid tier) — verify links for outsiders.

## Honesty clause (unchanged)

Anything unavailable reports not_configured | blocked and seals a receipt
saying so. No fabricated passes. No absolute host paths in sealed artifacts.
No spend without an operator token bound to the complete plan hash.

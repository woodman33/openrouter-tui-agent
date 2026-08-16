# RESEARCH DIGEST 2 — kimi-k3 swarm (2026-08-10), stored 2026-08-13

Source: ~/Desktop/timmy-tui-research2/ (plan.md + TIMMY_ARCHITECTURE.md + exec overview).
Full text stays with the user; this digest is the working copy. Optimization
function: (CAP×REL×LEARN×SPEED×REUSE×REV) ÷ (COMPLEX×MAINT×COST×FRAG).

## Rulings adopted into TIMMY (implemented)
1. Receipts are the wedge; v2 = OTel-GenAI span tree + PDP decisions + manifest
   inside the hash chain → `spans`/`decisions` in receipts.ts, docs/RECEIPT-SPEC-v2.md.
2. PDP with default-deny + denial-as-observation; LOG_ONLY → ENFORCE rollout →
   effects.ts catalog (15 effects, T0–T3) + policyCheck + /agentpass enforce.
3. Evaluators read receipts back → /eval (cost σ, failures, denials → refinement).
4. Memory writes are effects → harness refinements carry receipts (already true).
5. Two-client ceiling: TUI (signing authority) + companion; no desktop/IDE clients.
6. TUI = right surface, thin-client topology later: daemon executes, TUI signs;
   approvals/seals require the TUI. (timmyd = phase 2, not now.)
7. Build exactly five: plan compiler, effect interpreter, receipt sealer,
   fleet scheduler, TUI. Everything else wrapped.

## Rulings adopted as NOT-BUILD (reinforces our list)
general agent runtime · workflow engine (Temporal/CF reuse only) · memory
runtime (thin receipt-native store only) · observability dashboard (Langfuse
ingests OTel for free) · model gateway (OpenRouter + CF AI Gateway; LiteLLM
DEFERRED per exec-overview CVE ruling — NOTE: TIMMY_ARCH §5 says wrap LiteLLM;
exec overview supersedes) · sandbox runtime (compose gVisor/microVM/WASM later) ·
enterprise SSO/RBAC/audit SaaS until the personal wedge is undeniable.

## Monetization ladder (unchanged, reinforced)
$999 w/ install ($499 founding-5) → $99/mo hosted+support → $99–199 self-serve →
(day-60 gate: ≥3 LOIs) AgentReceipts vault $99–499/mo. Policy packs = the $250
proof-pack model generalized. Open receipt spec = marketing.

## Gates
day-14: 3 demos booked · day-30: ≥3 paid installs · day-60: 5 studios + 1 hosted
convert · day-90: ≥$3K cumulative + ≥$500 MRR. Receipt review ritual 30 min/wk
BEFORE chain crypto products. Provider-side hard caps (the 3AM cost-bleed fix).

# promo v10 — tldraw-ref loop results (2026-08-15)

Lineage: v9 (sealed sha256_246b49d0) → **v10**. Receipt `sha256_6b159e6f…` · restic `fbe85374`.

## The loop (owner directive: refs from tldraw templates → drafts → fusion → new outlines)

1. **refs** — 2 image refs generated from the tldraw-template vocabulary (nano-banana-2):
   `refs/refA-beat-grid.png` (3x3 beat frames + arrows, mono labels) · `refs/refB-receipt-cluster.png`
   (hash-chained cards + sticky notes "animate this outline"). Refs feed the next pass's prompts.
2. **judge anchors** (from timmy_promo_judge v10 pass, locals 8/7, conf 0.78, $0):
   hook1 lead · cost HALT flash · connect one-liner.
3. **bodybuilder fan-out** — 4 drafters in parallel: nemotron-3.5-lightning (local $0),
   qwen3.8:27b-mlx (local $0), x-ai/grok-4.6, google/gemini-3.7-flash. All delivered JSON deltas
   with `visual` fields naming tldraw patterns.
4. **fusion** — local qwen3.8:27b-mlx, confidence **0.82** ≥ 0.7 → **no frontier arbitration, $0**.
5. **apply** v9 → v10 (12 replacements) · **render** 45.0s / 3.0MB in 47.3s.

## Fused v10 beats

| beat | copy | visual pattern |
|---|---|---|
| hook1 | Don't trust the model. Trust the receipt. | spotlight-box |
| cost | Hard ceiling. It halts. | sticky-annotation (+ cap [ENFORCED] flash) |
| lanes | Parallel tasks. Isolated lanes. | frame-grid |
| receipt | Every run mints a signed receipt. | receipt-cluster |
| connect | Plugs in. One line per tool, not a shelf. | dashed-slot |
| lockup | TIMMY. | spotlight-box |

## Cost posture

Local legs $0 (nemotron + qwen drafts + fusion). Spend: 2 frontier drafts + 2 flash-image refs —
the escalation budget, not the baseline. Baseline iterations are $0.

## Next pass inputs (the compounding part)

- refA/refB + this RESULTS as vision context for the next judge pass
- new outlines drafted from refs → vendored into `studio/tldraw-refs/` / templates.ts
- allyson lane (SVG animation) stays opportunistic — allyson.ai is splash-gated, no self-serve key;
  house animators (HyperFrames/Remotion/tldraw agent loop) remain primary
- apify ON ICE (account down; lane wired, dormant)

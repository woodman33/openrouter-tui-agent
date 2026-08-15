# TIMMY promo v6 — the clarity cut (2026-08-15)

## Doctrine applied (owner: "clarity is the name of the game; messaging first, then visuals")
- Messaging: plain words, one idea per beat, no jargon without translation.
  Hook: "Your AI agent says it did the work." → "Did it?" → "⛁ TIMMY proves it."
  Beats: "See your agents work — live." / "See every cost while it runs." /
  "Every run gets a receipt." / "Even video." / "On your machine." /
  "One grammar. Eight tabs." → lockup "Trust the receipt, not the model."
  Each beat: giant claim + ONE plain sub-sentence + tiny violet evidence line.
- Visuals: clean SYNTHETIC demo clips (vhs tapes, `timmy $` prompt, no paths /
  usernames / real run ids / costs) shaded under text; consistent dip-to-black
  transitions; no hash-rain / skew / flash noise; letterbox 8%; cost count-up kept
  (it's clear); keycap stagger for the grammar beat.

## Self-check (frames read by the agent before showing the owner)
- First pass FAILED clarity: bg videos + shades were absolute-positioned with no
  timing windows → painted over text, whole-reel overlap. Fixed: z-index stack
  (video 0 / shade 1 / text 3) + top-level timed video/shade elements
  (lint: video_nested_in_timed_element = frozen media; dips need class="clip"
  or initial hidden — kept CSS opacity:0, harmless).
- Second pass PASSED: crisp white claims, readable subs, clean clips, one idea/beat.

## Render
high · 30s · 2.1 MB · audio mixed · lint 0 errors on timed media (dip infos only).

## Proof chain
v6 receipt sha256_0d67ac78… · restic bdb6886c · making-of-v6.cast
chain: v1 94764c89 → v2 558a55d6 → v3 2877bd1e → v4 71f6965b → v5 abeb60d4 → v6 0d67ac78

## Watch
http://localhost:7688/promo-v6.mp4 · tmux attach -t timmy-promo (carbonyl)

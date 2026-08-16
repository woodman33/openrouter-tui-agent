# TIMMY promo v4 — logs & results (2026-08-15)

## The cut (24s, story arc)
0–1.6 hook type-on: "your agents lie." · 1.8–3 strike beat → "receipts don't."
3–5 brand pull-back (camera 1.28→1) + Ken Burns poster + ⛁ TIMMY / "Receipts for everything."
5–7 LANES lower-third over terminal footage · 6.9–8.9 TIMMY CLIP + OTIO lower-third
8.8–11 replay console (`timmy clip replay` → "verified: replay matches sealed output ⛁") + REPLAY lower-third
10.9–12.9 AgentPass lower-third · 12.8–15 MCP WATCHTOWER + SOLAR FLEET stacked lower-thirds
14.9–17.9 chain stroke-trace (prompt→execution→proof) + keycap row (Tab ←→ ↑↓ ↵ Esc ?) + "one grammar · eight tabs"
17.8–21 brand lockup: ⛁ TIMMY + tagline + registry (Slate · Clip · AgentPass) + woodman33/timmy-tui
20.8–24 end card: "Trust the receipt, not the model."

## Cinematic grade
letterbox bars 11% · film grain (feTurbulence data-uri, .06) · vignette · broadcast lower-thirds
(white headline bar + violet sub, drop shadows — lower-third-bild recipe) · camera pull-back +
Ken Burns · generated sound bed (bed.m4a: dual-sine pad + riser, ffmpeg lavfi, zero cost)

## Render / lint
- hyperframes check: **0 errors, 0 warnings**, 3 infos (pointer-events on grade overlays, intentional)
- contrast **14/14 WCAG AA** · layout 0 issues across 9 samples
- render --quality high: 24.0s · 3.5 MB · 16.6s wall · audioCount 1 (bed mixed in)
- first pass had 5 lint errors (audio missing id → would render SILENT; lower-thirds missing
  class="clip" → visible whole-time; GSAP exits without hard kills) — all fixed, re-rendered clean.
  LESSON: media elements need id; timed overlays need class="clip"; every GSAP exit gets a tl.set hard kill.

## Proof chain
- v4 receipt sha256_71f6965b… (spans: primitives, sound bed, check, render; cost_usd 0.02)
- restic snapshot d826d270 · making-of-v4.cast (asciinema)
- chains: v1 94764c89 → v2 558a55d6 → v3 2877bd1e → v4 71f6965b (runs stream prev_hash)

## Watch
http://localhost:7686/promo-v4.mp4 · tmux attach -t timmy-promo (carbonyl)

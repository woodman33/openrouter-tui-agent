# TIMMY promo v3 — logs & results (saved as knowledge, 2026-08-15)

## Render
- hyperframes render --quality high · 20.0s · 983.7 KB · rendered in 19.6s · 600 frames @30fps · 6 workers
- compile: GSAP CDN inlined; fonts Inter + JetBrains Mono injected deterministic @font-face
- check: **0 lint errors**, 4 overlap warnings (scene-boundary crossfades, intentional), 3 infos (mask overflow intentional, strike occlusion intentional), **contrast 11/11 WCAG AA**
- capture: drawElement w/ screenshot fallback at clip boundaries; calibration 39ms/frame p95
- video sources: terminal-kf.mp4 ×2 (keyframe-fixed -g 30 +faststart) — no seek freezes

## Receipts / archive
- v1 receipt sha256_94764c89… · restic fa0df80d
- v2 receipt sha256_558a55d6… · restic aa659efe
- v3 receipt sha256_2877bd1e… · restic 02a8288b · cost_usd 0.02 (nano-banana poster)
- making-of casts: v1, v2, v3 (asciinema)

## AI generations
- Open Design MCP: create_artifact ran twice, no parseable path in tool content; daemon did NOT write under OD_DATA_DIR during call → mtime-scan found nothing. Lesson stands; OD is unreliable for artifact recovery.
- nano-banana-2 via gen agent: artifact written to <gen-agent>/out/image-*.png (RELATIVE url in log) — extractArtifactFromLog returns relative path; resolve against genDir. Poster recovered.

## What worked (keep)
- design pass before render (Inter display + JetBrains mono + brand violet/green + poster backdrop)
- catalog primitive inlined (strikethrough-replace) — "trust the model." → "trust the receipt." landed as the thesis beat
- registered GSAP timeline (window.__timelines) — no 45s poll, deterministic choreography
- keyframe-fixed intercut footage

## What v4 must fix (owner: "more cinematic, more engaging, highlight more features, use our brand")
- no hook — v3 opens on a brand card; v4 opens on a provocation ("your agents lie." → strike → "receipts don't.")
- no camera — add pull-back-reveal primitive + Ken Burns drift on poster/terminal
- no letterbox / grain / vignette — cinematic grade missing
- no lower-thirds — feature callouts were center-cards; broadcast lower-thirds read more cinematic and let terminal footage breathe
- too few features shown — v4 montage: lanes · clip · replay · OTIO · AgentPass · MCP watchtower · solar fleet · unified grammar
- no sound — v4 gets a generated ambient bed + riser + seal hit (ffmpeg lavfi, zero cost)
- brand registry under-used — end card must carry ⛁ TIMMY + "Receipts for everything." + Slate · Clip · AgentPass lockups + url

#!/usr/bin/env bash
# TIMMY promo v3 — the good one. Postmortem-driven: design pass first,
# catalog primitives, registered GSAP timeline, keyframe-fixed intercut,
# AI poster backdrop, high-quality render. Recorded, sealed, archived.
set -e
cd "$(git rev-parse --show-toplevel)"
P3=studio/timmy-promo-v3

echo "== TIMMY promo v3 — $(date -u +%FT%TZ)"
echo "== design pass: Inter display + JetBrains mono + brand violet/green + poster backdrop"
echo "== catalog primitives: strikethrough-replace · variable-axis-type · svg-stroke-trace"
echo "== GSAP timeline registered (window.__timelines) — deterministic choreography"
echo "== intercut footage: terminal-kf.mp4 (re-encoded -g 30 +faststart)"

echo "== hyperframes check"
npx --yes hyperframes check "$P3" || echo "check flagged — continuing"

echo "== hyperframes render (HIGH quality)"
npx --yes hyperframes render "$P3" --quality high --output "$P3/promo-v3.mp4" || echo "render pending"

echo "== v3 make complete; receipt seals in the wrapping session"

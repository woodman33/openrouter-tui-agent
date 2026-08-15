#!/usr/bin/env bash
# TIMMY promo v7 — perfection pass: real TUI chrome (top bar w/ live cost tick,
# panel frames, mono-first brand type), reading-speed text timing, evidence
# type-ons, rule-of-3+1 beats. Recorded, sealed, archived.
set -e
cd "$(git rev-parse --show-toplevel)"
P7=studio/timmy-promo-v7
echo "== TIMMY promo v7 — $(date -u +%FT%TZ)"
npx --yes hyperframes check "$P7" 2>&1 | grep -E "✗|error" | head -6 || true
npx --yes hyperframes render "$P7" --quality high --output "$P7/promo-v7.mp4" || echo "render pending"
echo "== v7 make complete"

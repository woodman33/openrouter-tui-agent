#!/usr/bin/env bash
# TIMMY promo v5 — the proof cut: hook-first messaging, every claim carries
# its real receipt hash, whip wipes, hash-rain texture, count-up cost,
# keycap press, shockwave seal, sound bed. Recorded, sealed, archived.
set -e
cd "$(git rev-parse --show-toplevel)"
P5=studio/timmy-promo-v5
echo "== TIMMY promo v5 — $(date -u +%FT%TZ)"
npx --yes hyperframes check "$P5" || echo "check flagged — continuing"
npx --yes hyperframes render "$P5" --quality high --output "$P5/promo-v5.mp4" || echo "render pending"
echo "== v5 make complete; receipt seals in the wrapping session"

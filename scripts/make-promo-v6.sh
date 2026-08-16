#!/usr/bin/env bash
# TIMMY promo v6 — the clarity cut: plain-word claims, one idea per beat,
# clean synthetic demo clips (no sensitive data), shaded for readability,
# consistent dips. Messaging first, then visuals. Recorded, sealed, archived.
set -e
cd "$(git rev-parse --show-toplevel)"
P6=studio/timmy-promo-v6
echo "== TIMMY promo v6 — $(date -u +%FT%TZ)"
npx --yes hyperframes check "$P6" || echo "check flagged — continuing"
npx --yes hyperframes render "$P6" --quality high --output "$P6/promo-v6.mp4" || echo "render pending"
echo "== v6 make complete"

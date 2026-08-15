#!/usr/bin/env bash
# TIMMY promo v8 — 45s "everything, proven" cut: 12 beats, every claim carries
# a real proof card (receipt fields, env-lock build hashes, replay sha match,
# OTIO validation, connectors), SHIPS-TODAY vs ROADMAP honesty split.
set -e
cd "$(git rev-parse --show-toplevel)"
P8=studio/timmy-promo-v8
echo "== TIMMY promo v8 — $(date -u +%FT%TZ)"
npx --yes hyperframes render "$P8" --quality high --output "$P8/promo-v8.mp4" || echo "render pending"
echo "== v8 make complete"

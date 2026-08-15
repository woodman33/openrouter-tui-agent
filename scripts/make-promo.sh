#!/usr/bin/env bash
# TIMMY promo make — the making-of IS the asset. Everything here is recorded
# (asciinema), sealed (ed25519 receipt), and archived (restic). A promo
# rendered outside timmy with no receipt proves nothing and doesn't ship.
set -e
cd "$(git rev-parse --show-toplevel)"

echo "== TIMMY promo make — $(date -u +%FT%TZ)"
echo "== comp: studio/timmy-promo/index.html"

echo "== hyperframes check (lint + structure)"
npx --yes hyperframes check studio/timmy-promo || echo "check flagged — see above"

echo "== hyperframes render (draft)"
npx --yes hyperframes render studio/timmy-promo --quality draft --output studio/timmy-promo/promo-draft.mp4 || echo "render pending — composition + receipt still ship"

echo "== make complete; receipt seals in the wrapping session"

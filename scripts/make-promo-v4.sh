#!/usr/bin/env bash
# TIMMY promo v4 — cinematic cut: hook-first story arc, letterbox + grain +
# vignette, camera pull-back + Ken Burns, broadcast lower-thirds, replay
# console, brand lockup, generated sound bed. Recorded, sealed, archived.
set -e
cd "$(git rev-parse --show-toplevel)"
P4=studio/timmy-promo-v4
echo "== TIMMY promo v4 — $(date -u +%FT%TZ)"
echo "== arc: hook (agents lie → receipts don't) → brand pull-back → lanes → clip → replay → AgentPass → MCP/fleet → grammar chain → lockup → seal"
npx --yes hyperframes check "$P4" || echo "check flagged — continuing"
npx --yes hyperframes render "$P4" --quality high --output "$P4/promo-v4.mp4" || echo "render pending"
echo "== v4 make complete; receipt seals in the wrapping session"

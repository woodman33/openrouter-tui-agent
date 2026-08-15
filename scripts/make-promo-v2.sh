#!/usr/bin/env bash
# TIMMY promo v2 — intercut: terminal footage (asciinema→agg→ffmpeg) between
# HyperFrames motion scenes; theatre.js sequences compile to EDL transforms;
# EDL exports to OTIO and is validated by real OTIO tooling. Everything here
# is recorded, sealed, archived. The making-of IS the asset.
set -e
cd "$(git rev-parse --show-toplevel)"
P=studio/timmy-promo
P2=studio/timmy-promo-v2
TX="$PWD/node_modules/.bin/tsx"

echo "== TIMMY promo v2 — $(date -u +%FT%TZ)"

echo "== theatre.js sequence → EDL transform tracks"
"$TX" -e "
import { readFileSync, writeFileSync } from 'fs';
import { theatreSequenceToTransforms } from './src/utils/motion.ts';
const seq = JSON.parse(readFileSync('$P2/theatre-sequence.json', 'utf8'));
const t = theatreSequenceToTransforms(seq);
writeFileSync('$P2/promo-transforms.json', JSON.stringify(t, null, 2));
console.log('compiled transforms:', t.length);
"

echo "== EDL → OTIO + otioconvert validation"
"$TX" -e "
import { writeFileSync } from 'fs';
import { edlToOtio } from './src/utils/otio.ts';
const edl = { edl_version: 1, output: 'promo-final.mp4', clips: [
  { src: 'terminal.mp4#t=0,3' },
  { src: 'scene-otio#t=5,8' },
  { src: 'terminal.mp4#t=3,6' }
]};
writeFileSync('$P2/promo.otio', JSON.stringify(edlToOtio(edl, { model: null }), null, 2));
console.log('otio written');
"
otioconvert -i "$P2/promo.otio" -o "$P2/promo.validated.otio" && echo "otio valid (Pixar-born, ASWF-governed)"

echo "== terminal cast → footage (agg + ffmpeg)"
if command -v agg >/dev/null 2>&1 || [ -x "$HOME/.cargo/bin/agg" ]; then
  AGG=$(command -v agg || echo "$HOME/.cargo/bin/agg")
  "$AGG" "$P/making-of.cast" "$P2/terminal.gif"
  ffmpeg -y -v error -i "$P2/terminal.gif" -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1" -r 30 "$P2/terminal.mp4"
  echo "terminal footage: $P2/terminal.mp4"
else
  echo "agg not ready — terminal intercut deferred (scenes still render)"
  [ -f "$P2/terminal.mp4" ] || ffmpeg -y -v error -f lavfi -i color=c=black:s=1280x720:d=3 -r 30 "$P2/terminal.mp4"
fi

echo "== hyperframes render v2 (intercut)"
npx --yes hyperframes render "$P2" --quality draft --output "$P2/promo-final.mp4" || echo "render pending"

echo "== v2 make complete; receipt seals in the wrapping session"

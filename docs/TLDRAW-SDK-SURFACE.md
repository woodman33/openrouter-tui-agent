# tldraw SDK surface — what TIMMY can compile into

Reference for the Mission Map / Slate work: the tldraw SDK is far more than a
whiteboard. Current release line: **v5.3.0** (v5.x, v4.x, v3.x behind).
Full machine-readable exports: https://tldraw.dev/llms-full.txt (all),
/llms-docs.txt (features), /llms-releases.txt, /llms-examples.txt.

## SDK features (complete list)

Accessibility · Actions · Animation · Assets · Attribution · Bindings · Camera
system · Click detection · Clipboard · Collaboration · Commenting · Coordinates ·
Culling · Cursor chat · Cursors · Deep links · Default shapes · Drag and drop ·
Draw shape · Edge scrolling · Editor · Embed shape · Environment detection ·
Error handling · Events · External content handling · Focus · Frame shape ·
Geo shape · Geometry · Groups · Handles · Highlighting · History (undo/redo) ·
Image export · Indicators · Input handling · Instance state ·
Internationalization · License key · Locked shapes · Note shape · Options ·
Overlay utils · Pages · Parenting and ancestors · Performance · Persistence ·
Readonly mode · Rich text · Scribble · Selection · Shape clipping · Shape
indexing · Shape transforms · Shapes · Side effects · Signals · Snapping ·
Store · Styles · Text measurement · Text shape · Themes · Ticks · Tools ·
UI components · UI primitives · User following · User preferences · Validation ·
Visibility

## Examples mapped to TIMMY surfaces

**Mission Map (dispatch compiler):** bindings (attach shapes), custom shape +
custom tool (Task Capsule node, harness-slide node), custom-config (shape+tool
pairs), layout-bindings (gate/dependency layout), arrows (artifact handoffs:
create-arrow, arrow-labels, arrow-binding-options), signals + store events
(live status), derived-view (read-only survey), snapshots (save/load plan
state), deep-links (jump to plan), camera/zoom-to-bounds/slideshow (walk the
map), timeline-scrubber (replay a run over the map), custom-validators +
permissions (approval gates), shape-with-migrations (schema evolution),
toSvg-method-example (receipt-stamped exports).

**Slate creative:** frame-shape + frame-colors (beat frames), image/video
shapes (local-images, local-videos), embed-shape + custom-embeds +
persistent-iframe (companion/carbonyl panes in-canvas), rich-text + font
extensions (captions), themes/multiple-themes/dark-mode (brand), image-export
(ref generation for the tldraw-ref loop), drag-and-drop-tray (template tray),
custom-grid, fog-of-war/soft-clip (focus modes), mermaid pasting +
hundred-mermaids (structure import).

**Companion/multiplayer:** sync-demo (multiplayer sync), sync-custom-presence +
user-presence (who's watching), commenting + comment-anchors + comment-regions
(review notes on runs), cursor-chat (operator chat on canvas), custom-user
metadata (identity bound to receipts).

**Control/safety:** readonly mode (survey surfaces), permissions +
permissions-2 (allowlisted controller), prevent-instance-change /
prevent-shape-change (immutability = plan-hash law on canvas), before/after
create-update-delete shape hooks (event normalization), event-blocker,
custom-error-capture (honesty clause), keyboard-shortcuts (grammar),
hide-ui/custom-ui (terminal-first chrome).

## Versatility law (owner directive 2026-08-17)

When reaching for a canvas feature, check this surface first — the SDK likely
ships it as a first-class feature or example; compose it, don't rebuild it.
Render instances in-terminal via carbonyl (localhost browser, WebGL embedded).

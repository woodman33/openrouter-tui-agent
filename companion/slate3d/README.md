# Slate 3D

A tldraw mission board rendered as a Three.js scene. Frames are slabs, capsules
are capsules, harness nodes are lane pods, and the pods light from the Timmy
event bus. The viewer spawns nothing. Decisions and their alternatives:
`DESIGN.md` (sealed as `slate.design`).

## Run

```
npm --prefix companion/slate3d install     # three + esbuild, once
node lanes/slate/build.mjs                 # dist/: slate3d.js, index.html, lanes.json, manifest.json
node lanes/slate/render.mjs --board ledger # build, serve, capture still + clip, seal slate.render
```

The companion server (`src/companion/server.ts`) serves `dist/` at `/slate3d/`
and the boards at `/slate3d/boards/`, and pushes the bus over its WebSocket as
`{type: "bus.tail"}` on hello and `{type: "bus"}` for every new event. Run it
against the pinned repo root so the bus is the root bus:

```
TIMMY_REPO=/path/to/timmy-tui npx tsx -e "import('./src/companion/server.ts').then(m => m.startCompanionServer(3001))"
open http://127.0.0.1:3001/slate3d/?board=ledger
```

The companion page itself gets a SLATE 3D tab that embeds the same URL.

## Parameters

| Query | Meaning |
|---|---|
| `board=<name>` | `companion/boards/<name>.mission.json` (default `ledger`) |
| `still=1` | reduced motion: no idle drift, deterministic for screenshots |
| `sse=<url>` | read the bus from an EventSource instead of the companion socket |
| `room=<id>&worker=<url>` | read a Durable Object room speaking the runs/events contract |

## Bus files

Two files are tailed under the repo root: `.timmy/receipts/runs.jsonl` (the one
bus: event envelopes appended beside the receipts by `src/bus`) and
`.timmy/runs/timmy-events.jsonl` (legacy writers). Receipt records are skipped;
only `{v, ts, kind, payload}` envelopes pass. A new client receives the last six
hours from both files, then live events.

## Lit rules

- lane: `payload.harness`, else the kind prefix when it names a lane, else the
  subject prefix of `receipt.sealed` (`defold.build` lights `defold`)
- colour: phosphor for chain events, orange for human acts (approval, arming),
  red only for refusal; failure is unlit with a muted label
- decay over twenty minutes to a floor glow; the label keeps "last seen"
- `slate.*` events pulse the slabs, never a pod

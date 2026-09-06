# Slate 3D — the four decisions (ORD-018, 2026-09-06)

Slate 3D renders a tldraw mission board as a scene: frames become slabs, capsules
become capsules, harness nodes become lane pods, and the pods light from the
Timmy event bus. It is a viewer first. It never spawns work; every future
control on it emits the same allowlisted controller calls the flat Mission Map
emits (docs/MISSION-MAP-INTERFACE.md). William accepted the four defaults in
advance; this record keeps the alternatives, the reasons, and what would reverse
each call, so the choice is auditable later.

## Decision 1 — which boards first: mission + blueprint

Options considered

1. Mission + blueprint boards (accepted). Mission boards compile to DispatchPlans
   through `src/utils/slate-compiler.ts`; blueprint boards are the reference
   sheets (tokens, architecture, doctrine) that missions point at.
2. Every board kind at once (mission, blueprint, template, guide, market).
3. Only a live run view with no authored boards.

Why 1: the mission board already has a typed vocabulary (capsule, harness, gate,
artifact, result; edges depends, harness, gate, artifact, result) and a compiler,
so the 3D scene can mirror it one to one without inventing a schema. Blueprints
are what capsules cite, so they belong on the same floor as flat sheets pinned
beside the slabs. Templates and guides have no controller meaning yet; they wait.

Consequences: the loader accepts `kind: mission` (slabs + pods) and
`kind: blueprint` (sheets, no pods). The first render is a mission board only.

What reverses it: a template or guide board gaining a compile target.

## Decision 2 — the sync room: the existing Durable Object contract

Options considered

1. The existing Durable Object (accepted). `MyDurableObject` in
   `src/companion/cloudflare-worker.ts` is a SQLite room with runs and events:
   `POST /runs/create`, `POST /runs/:id/event`, `GET /runs/:id/events`. The outer
   worker forwards every `/runs/*` path to one shared instance named `central`.
2. tldraw sync (`@tldraw/sync`) on a second Durable Object.
3. No room: local companion WebSocket only.

Why 1: one event envelope everywhere. The bus, the receipts, and the room all
carry `{ts, kind, payload}`, so a board room is a run and a board event is a run
event. Option 2 would be a second sync stack with its own schema and its own
auth. Option 3 fails the p5 acceptance line "two browsers share one board".

Reality found while deciding: the worker live at timmy-ai-proxy today answers as
the ai-proxy code (`/health` and `/runs` return the ai-proxy banner), so the
Durable Object in the root wrangler config is not reachable at that name. The
contract is what is adopted. The viewer speaks it (`?room=<id>&worker=<url>`),
the bridge `lanes/slate/bus-bridge.mjs` forwards bus events into it, and the
room itself is provided by `SlateRoom` in `workers/ai-proxy` (the preview worker
Claude owns) implementing the same routes plus a WebSocket push. Deploying the
root config instead is William's call: it declares R2, D1, Queues, Hyperdrive,
AI and Workflows bindings that were not verified here.

Consequences: room id = board name; the room is append-only; the viewer never
writes to the room except through the bridge; the room never spawns work.

What reverses it: a decision to run the root worker config, in which case the
viewer changes only its `worker` parameter.

## Decision 3 — where it renders: Three.js inside the companion page

Options considered

1. Three.js inside the companion page (accepted). Served by
   `src/companion/server.ts` at `/slate3d/`, a new tab in the companion, and
   the bus pushed over the companion's existing WebSocket as `{type: "bus"}`.
2. Inside the TUI through a carbonyl pane.
3. A separate Pages site.

Why 1: the companion already owns a WebSocket to the browser and already mirrors
TUI state; pushing the bus over it costs one file tail. The page stays a static
bundle (`companion/slate3d/dist`), so option 3 remains available later without
a rewrite. Option 2 renders at terminal resolution and loses the point.

Rendering rules carried over from the gateway box: emissive surfaces only under
bloom, threshold above 1.0, matte grounds, ACES tone mapping, reduced motion
honoured (no idle drift, no pulse), labels through CSS2D so they stay crisp.

Tokens: navy #0A1628 ground, phosphor #33FF66 for chain events and sealed
state, orange #FF8C1A for human acts (approval, arming), red #FF3B3B for refusal
only (arm denied, request denied). Failure is not refusal: a failed lane renders
unlit with a muted label. Space Grotesk for human text, JetBrains Mono for chain
text, 8 px grid, scale ×1.333.

What reverses it: the companion page being retired, in which case the bundle
moves to Pages unchanged.

## Decision 4 — first render: the ledger board with live lane pods

Options considered

1. The ledger board (accepted): `companion/boards/ledger.mission.json`, six
   frames in the ORDER OF BUILD, one capsule, harness, gate and artifact each,
   dependency arcs between capsules.
2. A synthetic demo board.
3. The DEFAULT_DOC in the log server's mission panel.

Why 1: it is the board this work is governed by, its receipts exist, and its
harness nodes name real lanes (opencode, defold), so the bus lights it without
staging.

Scene vocabulary

| Board element | Scene element |
|---|---|
| frame | slab on the floor, in build order left to right, title in Space Grotesk |
| capsule | rounded capsule on the slab; phosphor edge when the frame's deliverable is sealed |
| harness | lane pod (hexagonal prism); lit from the bus by lane id |
| gate | standing ring, orange (manual approval is a human act) |
| artifact | thin card carrying the path |
| result | receipt chip |
| edge within a frame | trace on the slab |
| depends edge | arc between capsules across slabs |
| every LANE_RUNNERS id | pod on the lane rail behind the slabs, so any bus event has a pod to light |

Lit rules (`companion/slate3d/src/bus.js`)

- lane of an event: `payload.harness`, else the kind prefix when it names a lane
  (`openhands.*`, `comfy.*`), else the subject prefix of `receipt.sealed`
  (`defold.build` lights defold), else none.
- colour: phosphor for chain events (`receipt.sealed`, `dispatch.launched`,
  `dispatch.container_*`, `dispatch.collected`, `run.completed`); orange for
  human acts (`approval.required`, `approval.granted`, `dispatch.armed`); red
  only for refusal (`dispatch.arm_denied`, `*.denied`); failure unlit.
- decay: brightness falls with age over twenty minutes to a floor glow; the
  pod label keeps "last seen" so history reads without motion.
- `slate.*` events pulse the board itself, never a pod.

Acceptance for the first render

- the page loads the ledger board from the companion server and shows six slabs,
  their nodes, and the lane rail
- the bus indicator reads live and events from the root bus light pods
- the still is sealed as `slate.render` with the bundle, board and image hashes
- the viewer exposes no control that spawns work

## Sequence

1. seal this record as `slate.design`
2. build the bundle, extend the companion server and page, render, seal `slate.render`
3. `SlateRoom` in the preview worker + the bus bridge, then the two-browser check
4. blueprint boards as sheets; capsule state from the receipt lifecycle

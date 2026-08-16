# TMX-V v0 — Video as a Socket

Status: SPEC (not yet implemented) · Owner: will
Thesis: **Agora gave video its TCP. TMX-V is its HTTP.** A live room is a state
object; a viewer is a projection of that state; an intent is a state diff.
You don't watch a video — you connect to one and negotiate what you see.

## Room state (held by one Cloudflare Durable Object per room)

```json
{ "scene": "main", "style": "default", "lang": "en",
  "overlays": ["lower-third:speaker"], "branch": "A",
  "fidelity": "1080p", "cast": ["cam1","cam2","avatar1"], "version": 42 }
```

Every mutation is a **state transition** → sealed receipt (C2PA-aligned):
who/what changed what, for whom, when. Provable video lineage.

## Intent grammar (all input devices speak this)

```json
{ "type": "restyle|overlay|branch|follow|caption",
  "params": { "…": "…" },
  "source": "nl|tap|vote|sentiment|rppg", "confidence": 0.9 }
```

Inputs (swappable providers behind one `IntentParser` interface):
- **live now:** NL sentence (OpenRouter parse), TMX component taps, votes
- **stubbed:** audio sentiment, vision affect/pose, rPPG physiology
PostHog watches the *platform* (funnels, flags), never the person.

## Interfaces (vendors are suppliers, never pillars)

- `WorldRouter.pick(intent, entitlement)` → provider:
  `stub` (v0) · `decart` (interactive realtime) · `krea` (realtime v2v) ·
  `cosmos` (offline counterfactual) · `unreal` (deterministic 3D).
  **V0 ships with the stub only.** Adding Decart later = one provider file.
- `IntentParser.parse(signal)` → intent (grammar above).

## Projections & entitlements (the business model)

`projection(viewer) = f(state, entitlement)`

| Path | Entitlement example | Render |
|---|---|---|
| A · premium | JWT tier / wallet token | per-viewer generative (WorldRouter) |
| B · standard | default | edge-composited overlays (hyperframes) |
| C · base | anon | raw transport |

Routing: CF worker = policy → mints **Agora RTC token** (channel + role).
Agora controls *joins*; per-frame personalization lives in the edge render
layer. DO fan-out is control-room scale; mass viewers get state via
Workers/SSE projections.

## Transport binding

- Frames: Agora / VideoSDK / mux (recording)
- Control plane: **Agora data channel** carrying TMX-V events bidirectionally
  (client intents up; state deltas + component tags down)
- Client renders frames + live components — *Streamdown, but for video*

## Latency & cost physics (the demo must not lie)

- Generative transforms add 100–500ms → scope them to latency-tolerant layers
  (overlays, b-roll, style, branches). Base stream stays raw.
- Per-viewer generative = GPU-heavy → path A only; overlays for the masses.

## V0 prototype scope (GPU-free, ~400 lines)

1. One Room DO: state + intent intake + receipts on transitions
2. One CF worker: entitlement policy + Agora token minting
3. Two browser clients, same source, visibly different projections
4. One NL intent that mutates state; both projections update differently
5. Zero world-model vendors (WorldRouter stub returns base stream)

## Out of scope (v0)

Decart/Cosmos/Krea wiring, wallet-gating beyond a stub predicate, multi-party
consensus direction, gaze proxies. All are v1+ plugins behind the interfaces.

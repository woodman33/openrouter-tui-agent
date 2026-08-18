# Film spine — OTIO + HyperFrames + Remotion + OpenEdit

One edit spine, many compilers. The EDL is the source of truth; everything
else is a target or an editor on it. Receipts seal every transform.

```
EDL (specs/edl-v1.md, Media Fragments)
  ├─ timmy export otio <runDir>      → edit.otio (human-checkable interchange)
  ├─ hyperframes render studio/<comp> → mp4 (the terminal-native renderer)
  ├─ timmy.ts → Remotion scaffold     → React composition (existing export)
  └─ OpenEdit (joins here)            → OTIO timeline editor over the same EDL
```

## Rules

- EDL first: no editor writes the spine directly; editors emit EDL deltas
  that `timmy clip` replays and receipts seal.
- OpenEdit consumes `edit.otio` (or the EDL JSON) and returns a modified
  timeline; TIMMY re-verifies source/output hashes before sealing.
- HyperFrames = default renderer (comps live in studio/<slug>/); Remotion =
  the React target for teams that want code-owned comps; both compile from
  the same beats (templates.ts schemas, e.g. ugc-ad-15s).
- Frame evidence: roboflow observer samples frames from rendered mp4s and
  attaches evidence ids to the render receipt (key-gated; not_configured
  otherwise).
- Audio: bed/VO assets frozen + hashed at ingest; loudness checked at seal
  (ffmpeg volumedetect), never trusted from the editor.

## Commands today

- `timmy clip <jobId>` replay from cut-list alone
- `timmy export otio <runDir>` OTIO interchange
- `timmy export agentrun <jobId>` portable proof bundle
- `npm run mission-map` tldraw Mission Map over the dispatch surface
- studio/<comp>/RESULTS.md per comp: claims, hashes, receipts

OpenEdit integration = next film increment: register its MCP/CLI as a lane
(`openedit` entry in LANE_RUNNERS) whose task template round-trips OTIO.

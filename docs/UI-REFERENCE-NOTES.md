# UI references we follow

Sample: `docs/ui-references/mmgen-console-v2.4.1.png` (MMGEN CONSOLE v2.4.1,
multimodal generation workstation). Owner: "store them as references we like
to follow." This doc maps what to take from it into TIMMY TUI.

## Aesthetic law

- Near-black field (#05060a-ish), monospace everywhere, neon accents with
  semantic roles: cyan = live/streaming, magenta/violet = identity + params,
  green = health/ok/cost-ok, amber = queued/warning, red = rec/failed.
- Box-drawn panels with 1px hairline borders + corner ticks; section titles in
  small caps with an icon glyph; values right-aligned in a fixed column.
- ASCII-native data: slider rails as `|----o----|` with numeric readouts,
  waveforms as bar columns, progress as `▮▮▮░░` blocks, health as mini bars.
- Status chips in bordered pills: RUNNING (green) / READY (cyan) / QUEUED (amber).

## Layout to follow (mapped to TIMMY)

| Sample element | TIMMY surface |
|---|---|
| Left icon nav rail (HOME/CONSOLE/ROUTES/…/SETTINGS + version) | our 8-tab nav rail; add icons + version footer |
| Header: SESSION id · UPTIME · SYSTEM: NOMINAL | header gains session id + uptime + chain-health glyph |
| ROUTING panel (modality → route → status chip → health) | LANES tab: harness → model/route → status chip → health bar |
| Per-modality PIPELINE panels with sliders | per-lane param panels (seed/temp/guidance/duration/fps/res) editing the lane template before dispatch |
| LIVE OUTPUT MONITOR (audio waveform live) | LogRain/live bus as waveform-style columns |
| VIDEO GENERATION TIMELINE (frames + keyframes + %) | EDL timeline view (frames + keyframes + progress) |
| OUTPUT PREVIEW (REC + cam metadata) | carbonyl preview pane with run metadata strip |
| TELEMETRY cards (latency p95, tokens, frames, confidence, queue depth, cost est) | receipt-derived telemetry cards: cost column, tokens, queue depth, chain health |
| Footer key hints `[TAB] SWITCH [ENTER] EDIT [R] RANDOMIZE [S] SAVE PRESET` | our key grammar bar; add preset save/load verbs for lane params |
| Bottom status bar (LOGS streaming · WS connected · REGION · RATE LIMIT · clock) | status bar: companion link · ws/ollama health · rate/spend bar · clock |

## Rules

1. Every number on screen must trace to a receipt or live bus event — the
   sample's telemetry cards are exactly our receipt telemetry, styled.
2. Sliders edit the DISPATCH PLAN params (immutability law: edit → new plan
   hash → approval invalidates).
3. Keep keyboard-first: every mouse affordance has a key in the footer bar.
4. Neon is semantic, never decorative: color changes only encode state.

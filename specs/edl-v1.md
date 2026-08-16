# EDL v1 — machine cut-list, env-lock, and signed receipts

**Tier 1 spec artifact.** Status: authoritative for T1 implementation. Schema: `specs/edl-v1.schema.json`.
Naming: `timmy` in code/CLI, TIMMY in prose.

## 0. Principles

1. **The cut-list is the edit.** The `.md` runbook is for humans; renderers and verifiers read ONLY the EDL JSON. An edit is replayed from the cut-list alone — zero prose.
2. **Time is addressed, not owned.** In/out points use W3C Media Fragments URI (`source.mp4#t=12.5,15.0`). Visual surfaces (CLIP previews, tldraw review canvas) draw; they compile to EDL; they never edit time (spec §1.2).
3. **Replay is env-locked.** Deterministic re-execution requires pinning the environment: tool BUILD HASHES (sha256 of the executable, never version strings), OS build, arch, and model weight hashes when local. Without env_lock, replay claims are valid only within one machine profile (spec §4.5).
4. **Receipts are signed.** Every receipt from T1 onward carries an ed25519 signature from a per-instance keypair. Unsigned receipts are T0-grade and must not be built upon.
5. **Failures are receipts too.** A failed run seals a failure receipt (status, error class, exit code, partial artifacts) — evidence, not vibes.

## 1. EDL v1 cut-list

```json
{
  "edl_version": 1,
  "output": "clips/clip_x.mp4",
  "clips": [
    {
      "src": "~/heygen:hyperframes/renders/x/x.mp4#t=2.0,8.0",
      "filters": [],
      "overlays": []
    }
  ],
  "concat": true
}
```

- `src` — Media Fragments URI: path + `#t=<start>,<end>` (seconds, float). Path form: `~`-relative when under $HOME (absolute home paths are a T0 gap, fixed here).
- `filters` — ffmpeg `-vf`/`-af` filter strings, applied in order. v1 permits: `scale`, `crop`, `fps`, `loudnorm`. Unknown filter = reject (checks DSL stays ≤5 verbs, spec §4.3).
- `overlays` — overlay events: `{ asset, at, duration?, rect? }` (lower-thirds, masks). v1 renders overlays as `overlay=` filter chains; tldraw-drawn regions compile to `rect` (phase 2).
- `concat` — when >1 clip, stream-copy concat via the concat demuxer.
- **Determinism rules:** default pass is `-c copy` (no re-encode). Any filter forces a re-encode with pinned `-crf 23 -preset veryfast`; the ffmpeg build hash in env_lock pins the encoder. Same EDL + same env_lock ⇒ same output sha256.

## 2. env_lock schema

```json
{
  "os": { "platform": "darwin", "build": "24G84", "version": "15.6" },
  "arch": "arm64",
  "tools": {
    "ffmpeg":  { "path": "/opt/homebrew/Cellar/ffmpeg/…/ffmpeg", "sha256": "…", "size": 0, "mtime": 0 }
  },
  "models": {}
}
```

- `tools[bin].sha256` = hash of the resolved executable (realpath). **Build hash, not version string** — the free-text `ffmpeg version 9.0.1` manifest field is the bug this fixes.
- Cached in `.timmy/cache/envlock.json` keyed by `path|size|mtime`; re-hash on mismatch.
- `os.build` from `sw_vers -buildVersion` (darwin) / `uname -r` elsewhere.
- `models` — sha256 of local model weight files when a local model participates (whisperx cache, Ollama blobs); empty for deterministic ffmpeg lanes.

## 3. signature

- Per-instance ed25519 keypair at `.timmy/keys/ed25519.pem` (0600, created on first seal).
- `signer` = the public key (SPKI PEM) embedded in the receipt.
- Signed payload = canonical JSON (recursive key-sorted) of the receipt body **excluding** `hash`, `prev_hash`, `signature`. Signature = ed25519 over utf8(payload), base64.
- `hash`/`prev_hash` chain semantics unchanged (T0); signature layers on top.
- Verifier (T4) countersigns on replay pass; T1 ships instance signing only.

## 4. Failure-receipt variant

Receipt gains: `status: 'ok' | 'failed'`, `error_class` (`exec` | `missing_source` | `schema` | `env`), `exit_code`, `partial_artifacts: string[]` (e.g. the run dir's replay.md, any partial output). Failure receipts seal into the same chain — the chain records what happened, including what broke.

## 5. Replay protocol (exit criterion)

1. Seal run R from a clip job: manifest carries `edl` + `env_lock`; receipt carries `signature`.
2. `timmy clip replay <id>` reads ONLY `manifest.edl` (+ env_lock for tool resolution), re-executes, hashes the output.
3. Output sha256 == R's recorded output sha256 ⇒ `verify` receipt `status:'ok'` (signed, env-locked). Mismatch ⇒ `status:'failed'`, `error_class:'replay_drift'`.

## 6. Out of scope (T1)

Stochastic lanes (model-written EDLs, captions) are verdict-class, not replay-class (spec §4.5) — T4 concern. ALE, fleet, graph, Rust launcher: banners, not work orders.

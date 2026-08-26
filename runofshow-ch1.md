# RUN OF SHOW — Chapter 1 (retail provenance pack)

Preflight 2026-08-25, main v1.0.7 + PR #30 (`timmy seal` / `timmy verify`).
All beats below EXECUTED at preflight with the real verbs; dry-run law holds:
`--meta dry=1` seals cost-0 evidence, never dispatches outward, never mints
proof-seal (seal stays for real runs — DESIGN §2.3).

| # | Beat | Exact command (as run) | Receipt subject sealed | Glass behavior |
|---|------|------------------------|------------------------|----------------|
| 0 | preflight | `timmy doctor` | (none) | — |
| 0b | chain truth | `timmy verify` | (none) | `ok:true receipts:515 epochs:2`; ESCROW glass head seal bold-seal |
| 0c | throwaway epoch | `timmy epoch 900 "ch1 preflight throwaway"` | (epoch file only) | epoch chip moves; throwaway is FORWARD-ONLY (see law below) |
| 1 | intake | `timmy seal "retail.intake · lot-001" --meta dry=1` | retail.intake · lot-001 | slot row grouped under lot, status dry, cost 0 |
| 2 | provenance | `timmy seal "provenance.request · lot-001" --meta dry=1` | provenance.request · lot-001 | provenance pill warn until a real run answers |
| 3 | box | `timmy seal "box.verify · lot-001" --meta dry=1` | box.verify · lot-001 | box row flips seal ONLY on sealed proof (§2.3) |
| 4 | pack | `timmy seal "pack.open · lot-001" --meta dry=1` | pack.open · lot-001 | pack group header with child count |
| 5 | scan | `timmy seal "scan.capture · lot-001" --meta dry=1` | scan.capture · lot-001 | artifact hash chip lands under box row |
| 6 | card | `timmy seal "card.ident · lot-001" --meta dry=1` | card.ident · lot-001 | card row under pack; ident glyph ◇ only |
| 7 | grade | `timmy seal "grade.estimate · lot-001" --meta dry=1` | grade.estimate · lot-001 | estimate renders muted meta, never bold green |
| 8 | close throwaway | `timmy epoch 2 "restore pre-preflight current epoch …"` | (epoch file only) | current segment re-centers on 2; throwaway closes |
| 9 | main truth | `timmy verify` | (none) | `ok:true receipts:522 epochs:3` |

THROWAWAY LAW (learned at preflight, disclosed): the chain is append-only
(§1) — a throwaway epoch CANNOT be deleted; rotating back to a legacy epoch
re-centers `verify` on that epoch's tolerated incident break (ok:false).
Correct dance: rotate FORWARD to a throwaway (900), seal dry, rotate forward
back to the live epoch (2). The throwaway remains as its own independently
verified dry segment — that is the honest evidence model, and the film can
narrate it.

Walnut vocabulary needs no code: `timmy seal` takes arbitrary subjects;
`--meta k=v` pairs ride in `sources[0]` (pr, head sha, cast_hash, dry, …).

---

## SHOWRUNNER Phase C — ARMED (executes ONLY on "TUESDAY GATE")

1. ComfyUI: confirm LTX-2 weights (Docker volume first — COMFY:READY); if
   absent, download; smoke-gen 540p/2s from a stub prompt; seal gen.result
   with local:true only if no API key was used.
2. Emit fleet.json: every reachable provider with computed local:true|false —
   the truth table the film narrates from.
3. df -h check; report headroom. Nothing else.
4. Probe Unsloth Desktop's local endpoint; add provider row; check whether
   MiniMax-H3 weights are locally loadable; fleet.json is the verdict.

Phase B remains armed on "MERGE WORD". Nothing in Phase B/C executes early.

---

## REHEARSAL — 2026-08-25, on v1.0.7.1 (rehearsal-ch1.cast)

Actor qwen-rehearsal; all seals --meta dry=1; photo hash = sha256 of a
placeholder file (scan.capture meta photo_sha256); throwaway 901, forward
rotation to live 902. Total runtime 4557ms.

| Beat | ms | rc | Note |
|------|----|----|------|
| doctor | 1479 | 0 | cold bin |
| verify pre | 240 | 1 | STUMBLE (see below) |
| rotate 901 | 223 | 0 | throwaway open |
| retail.intake | 257 | 0 | |
| provenance.request | 249 | 0 | |
| box.verify | 328 | 0 | |
| pack.open | 271 | 0 | |
| scan.capture | 261 | 0 | photo_sha256 pinned |
| card.ident | 264 | 0 | |
| grade.estimate | 256 | 0 | |
| rotate 902 | 193 | 0 | forward, live |
| verify post | 203 | 0 | ok:true on live segment 902 |

FLAGGED STUMBLE (report only, no code fix): verify-pre rc=1 — epoch-2 segment
broken at rc_mt8iqfq9_wbnv (prev_hash mismatch). Cause: the parallel vitest
suite seals some tests into the REAL chain concurrently; two appends raced
the same prev. Epoch-1 break (rc_msvbkiwz_zrcm) is the known legacy incident.
Rehearsal segments 900/901 verify clean; post-rotation live segment green.
Follow-up candidate (out of scope here): isolate chain-writing tests to a
tmp dir, or serialize appends with the existing chain lock.

---

## POST-FILM QUEUE — appended 2026-08-25 by owner word (DO NOT IMPLEMENT NOW)

(a) Serialize chain appends — lock or single-writer queue.
    evidence=rc_mt8iqfq9_wbnv (epoch-2 prev_hash race, parallel test
    appends). BLOCKS NIGHT SHIFT.
(b) Isolate all chain-writing tests to tmp dirs per the forge pattern
    (tests/forge.test.ts mkdtemp + dir param).
(c) Audit ledger for test-junk receipts; report count only.

Incident scars sealed 2026-08-25: chain.incident ×2 (epoch-2
rc_mt8iqfq9_wbnv cause=parallel-test-append-race; epoch-1 rc_msvbkiwz_zrcm
cause=legacy-incident), both status=documented. Verify green after:
ok:true receipts:538 epochs:5.

MONDAY PLAN CONFIRMED UNCHANGED: fresh WALNUT rotation (forward, new epoch),
film.plan is the FIRST seal of that epoch, epoch-scoped verify green.
Phases B (MERGE WORD) and C (TUESDAY GATE) stay armed.

---

## FILMING TAG DIFF — v1.0.7.1..v1.0.7.2 (CURTAIN CALL 2026-08-26)

Exact file list: package.json, src/version.ts, scripts/timmy-doctor.ts
(version plumbing + doctor proof header ONLY) plus rehearsal-ch1.cast and
runofshow-ch1.md carried from the already-approved #31. Walnut verb paths
(src/cli.ts, timmy.ts, src/utils/receipts.ts, src/forge/, src/tui/): ZERO
changed bytes. FILE FROZEN after this commit; further changes need owner word.

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

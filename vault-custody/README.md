# Vault Custody × Timmy — tap-to-verify layer

Every seal points to one address we own. The address itself proves the tag is real and the tap is new. The page behind it is the box's whole history.

## The URL scheme

All taps land on `/t`. Two mirror modes, one CMAC parameter (`c`), whose name is part of the signed input whenever file data is mirrored, so it never changes.

| Mode | URL | Meaning |
|---|---|---|
| Encrypted mirror (production tags) | `/t?e=<PICCData 32 hex>&c=<SDMMAC 16 hex>[&d=<SDMENCFileData hex>][&tt=<2 chars>]` | PICCData = tag byte + UID + read counter, AES-encrypted under the SDM meta-read key. |
| Plaintext mirror (bench tags) | `/t?u=<UID 14 hex>&n=<counter 6 hex>&c=<SDMMAC 16 hex>[&tt=..]` | UID and counter in the clear; CMAC over an empty input under the session key. |

`tt` is the NTAG 424 DNA TagTamper status mirror, permanent then current: `CC` never opened, `OO` open now, `OC` opened and reclosed (the resealed box).

What `/t` does, in order: verify the SUN message (`src/lib/sun.ts`, NXP AN12196 algorithm, WebCrypto only), refuse replay (counter must move forward per UID), seal a `custody.tap` receipt into the unit's chain (`src/lib/chain.ts`, same canon + sha256 shape as Timmy's root chain), then redirect the phone to `/r/<serial>?tap=<receipt>&n=<counter>&tt=<status>`. Refusals go to `/verify?refused=<reason>`. Add `&format=json` to get the outcome as JSON instead of a redirect (the Custody Companion uses this).

## The pages

| Route | Mode | What it is |
|---|---|---|
| `/r/<serial>` | paper | The receipt page, sealed or opened (VC0001 sealed, VC0007 opened, VC0003 event 1/1) |
| `/c/<id>` | paper | The card page (VC0007-17-03) |
| `/relic/<id>` | paper | The relic page (VC2210-08-01) |
| `/m` | paper | The manufacturer view |
| `/log` | product | The custody lane as Timmy renders it |
| `/s/<id>` | paper | The Series page: published contents hashes and the chain head |
| `/verify` | product | Where a tap lands when it cannot reach a receipt page; refusal is the only red |
| `/api/chain/<serial>` | JSON | The unit's timeline + sealed taps + verification |

Paper = the physical object. Navy/phosphor = the chain. Both modes are defined in `../design/tokens.json`.

## Real tap URLs

The fixtures map NXP's published AN12196 test vectors to pilot boxes, with the factory-default all-zero keys, so the deck's URLs verify against public test data:

```
/t?e=EF963FF7828658A599F3041510671E88&c=94EED9EE65337086&tt=CC   → VC0007, counter 61
/t?u=041E3C8A2D6B80&n=000006&c=4B00064004B0B3D3                  → VC0003, counter 6
/t?e=EF963FF7828658A599F3041510671E88&c=94EED9EE65337087         → refused: bad_cmac
```

These four registry entries are marked `demo: true`: their addresses are fixed by nature (a published vector, a printed QR), so every tap is recorded but never refused as replay, and the receipt says `replay: "demo-vector"`. Production tags never carry `demo`: the second tap of the same address is refused as replay when `CUSTODY_KV` is bound, and stateless deployments report `replay_checked: false` in the receipt.

The daily head: the timmy-ai-proxy cron walks every chain in `CUSTODY_KV` at 09:05 UTC and publishes `head:<date>` at `/api/head` (and `/head` on the worker). The local anchor job in `../lanes/anchor` pulls it and seals `chain.anchor` into the Timmy root chain every morning. The edge never writes to the root chain.

## Run, test, deploy

```
npm install
npm test          # 28 tests: AN12196 sun1/sun2/sun3/plain vectors, corrupted CMACs, chain, tap
npm run build     # static pages + on-demand /t and /api
npm run preview   # wrangler pages dev on the build
```

Bindings (all optional, see `wrangler.jsonc`): `CUSTODY_KV` for replay + chains, `CUSTODY_KEYS` (secret) for per-batch keys, `TIMMY_EDGE_URL` + `TIMMY_EDGE_TOKEN` to mirror every tap as an event on the Timmy run store. Deploy is the owner's word: `npx wrangler pages deploy dist`.

## Rive badge (state transitions)

The provenance page loads `/rive/badges.riv` when it exists and falls back to a CSS badge otherwise. The artboard lives in the Rive file open on the desktop: artboard **Badge** (240 × 72), view model **BadgeVM** with a number `state` (0 sealed, 1 opened, 2 verified), state machine **State** whose three any-state transitions crossfade the SEALED / OPENED / VERIFIED pills. The bridge cannot export: select the Badge artboard in Rive → Export → Download for runtime → save as `public/rive/badges.riv`, rebuild, deploy.

## What this proves, and what it does not

It proves the PICC data came from a tag holding the meta-read key, the CMAC came from a tag holding the file-read key for this UID and counter, and the counter is new. It does not prove a card is authentic; grading does. A patient attacker with a scalpel can defeat any seal, which is why the seal photo and the signed reveal tag are the second and third factors.

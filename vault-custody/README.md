# Vault Custody × Timmy — tap-to-verify layer

Every seal points to one address we own. The address itself proves the tag is real and the tap is new. The page behind it is the box's whole history.

## The URL scheme

All taps land on `/t`. Two mirror modes, one CMAC parameter (`c`), whose name is part of the signed input whenever file data is mirrored, so it never changes.

| Mode | URL | Meaning |
|---|---|---|
| Encrypted mirror (production tags) | `/t?e=<PICCData 32 hex>&c=<SDMMAC 16 hex>[&d=<SDMENCFileData hex>][&tt=<2 chars>]` | PICCData = tag byte + UID + read counter, AES-encrypted under the SDM meta-read key. |
| Plaintext mirror (bench tags) | `/t?u=<UID 14 hex>&n=<counter 6 hex>&c=<SDMMAC 16 hex>[&tt=..]` | UID and counter in the clear; CMAC over an empty input under the session key. |

`tt` is the NTAG 424 DNA TagTamper status mirror, permanent then current: `CC` never opened, `OO` open now, `OC` opened and reclosed (the resealed box).

What `/t` does, in order: verify the SUN message (`src/lib/sun.ts`, NXP AN12196 algorithm, WebCrypto only), refuse replay (counter must move forward per UID), seal a `custody.tap` receipt into the unit's chain (`src/lib/chain.ts`, same canon + sha256 shape as Timmy's root chain), then redirect the phone to `/r/<serial>?tap=<receipt>&n=<counter>&tt=<status>`. Refusals go to `/verify?refused=<reason>`. Add `&format=json` to get the outcome as JSON instead of a redirect. Add `&app=1` to land in the Custody Companion instead of the receipt page.

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

## Custody Companion (HTML5 Defold + Rive)

`/companion/` is the Custody Companion: a Defold HTML5 build (project in `../companion/custody-companion`, 720×1280) with the Rive extension. It reads the unit's chain from `/api/chain/<serial>` on the same origin and drives the HUD and the Rive model. Launch it from a tag: `/t?…&app=1` verifies the tap, seals the receipt, and redirects to `/companion/?serial=<serial>&tap=<hash8>&n=<counter>&tt=<status>`. The receipt page also links to it.

The HUD (`main/hud.gui`) shows only what the chain API returns: serial, state (orange when a human opened it, phosphor otherwise), product and series, where it was sealed, where it was opened, the number of signed taps and whether the chain verifies, the chain head, and the tap that launched the app. `main/custody.script` owns the fetch, plays the Badge artboard's `State` machine, and sets `BadgeVM.state` from the chain (opened → 1, verified with taps → 2). The badge is `assets/badges.riv` (from the share, see the Rive badge section), rendered in Rive coordinates with Fit Contain and centre alignment so the 240 × 72 pill sits between the two HUD panels.

The project uses its own render script, `render/custody.render_script`, derived from the extension's `rive.render_script`. It exists because of one HTML5 bug found with a WebGL state probe against the deployed bundle: Rive's WebGL renderer leaves its stencil function (EQUAL, ref 128) and a zero stencil write mask in the real GL state, and Defold's OpenGL adapter applies stencil state lazily as a diff against what it last applied, so the GUI pass's ALWAYS never reached GL and every HUD fragment failed the stencil test. The script parks the stencil state on values the GUI never uses before the Rive pass (Defold applies them at the blit draw), then sets the GUI values, which now register as a change.

The bundle is not committed. `node ../lanes/defold/build.mjs` produces it with bob.jar pinned to the installed engine, through the Defold build server (native Rive extension), copies it into `public/companion/`, and seals a `defold.build` receipt in the root chain carrying the bob, JDK, engine, input, output, and .riv hashes. `--skip-build` re-hashes and re-seals an existing bundle; `--no-seal` skips the receipt.

## Rive badge (state transitions)

The provenance page loads `/rive/badges.riv` when it exists and falls back to a CSS badge otherwise. Artboard **Badge** (240 × 72), view model **BadgeVM** with a number `state` (0 sealed, 1 opened, 2 verified), state machine **State** whose three any-state transitions crossfade the SEALED / OPENED / VERIFIED pills (T_Sealed, T_Opened, T_Verified).

The file comes from Will's Rive share, not from a desktop export: the share page loads the hosted `.riv` directly, and `node ../lanes/rive/fetch-badge.mjs` downloads it, verifies the pinned sha256 (a9d01cc3…, sealed as `rive.export` with `source=share`), and places it at `public/rive/badges.riv` and in the companion project. `*.riv` is gitignored, so run that lane on a fresh checkout before building. Two lessons from the verification: Playwright's `response.body()` re-encodes a `text/plain` body and corrupts the bytes (use `curl --compressed`), and the gatekeeper's bundled runtime (2.38.3) is older than this export, so the checks ran on `@rive-app` 2.42.0 in Node and in the browser with the site's own canvas runtime.

## What this proves, and what it does not

It proves the PICC data came from a tag holding the meta-read key, the CMAC came from a tag holding the file-read key for this UID and counter, and the counter is new. It does not prove a card is authentic; grading does. A patient attacker with a scalpel can defeat any seal, which is why the seal photo and the signed reveal tag are the second and third factors.

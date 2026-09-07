#!/usr/bin/env node
// Fetch the Badge .riv from Will's Rive share (the .riv the runtime loads), verify
// its sha256 against the pinned value, and place it where the site and the
// companion read it. *.riv is gitignored, so this is how a fresh checkout gets
// the badge. The pin changes only with a new rive.export receipt.
//   node lanes/rive/fetch-badge.mjs [--url <riv url>] [--sha256 <hex>] [--no-verify]
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const URL_ = opt('--url', 'https://public.rive.app/hosted/667822/422141/Cy7BNKJ9mEyR7aSWm-DCaQ.riv');
const PIN = opt('--sha256', 'a9d01cc3ef8bcfd5306fa04e9defefbd9d935b13733d14e83ca3e0129c75092c');
const DEST = [join(ROOT, 'vault-custody', 'public', 'rive', 'badges.riv'), join(ROOT, 'companion', 'custody-companion', 'assets', 'badges.riv')];

const r = await fetch(URL_);
if (!r.ok) throw new Error(`fetch ${r.status} ${URL_}`);
const bytes = Buffer.from(await r.arrayBuffer());
if (bytes.subarray(0, 4).toString('latin1') !== 'RIVE') throw new Error('not a .riv (magic)');
const sha = createHash('sha256').update(bytes).digest('hex');
if (!args.includes('--no-verify') && sha !== PIN) throw new Error(`sha256 mismatch: got ${sha}, pinned ${PIN}`);
for (const d of DEST) { mkdirSync(dirname(d), { recursive: true }); writeFileSync(d, bytes); }
console.log(JSON.stringify({ url: URL_, bytes: bytes.length, sha256: sha, verified: sha === PIN, dest: DEST.map((d) => d.slice(ROOT.length + 1)) }, null, 1));

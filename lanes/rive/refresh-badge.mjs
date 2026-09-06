#!/usr/bin/env node
// After Will re-shares the Badge: fetch the hosted .riv by URL, verify the badge
// contract on runtime 2.42.0, place the file for the site and the companion,
// seal rive.export (source=share) in the ROOT chain, run the Defold lane (seals
// defold.build), rebuild + redeploy the custody preview. One command, receipted.
//   node lanes/rive/refresh-badge.mjs [--url <riv url>] [--expect-change] [--no-deploy] [--no-seal]
// --expect-change refuses to proceed when the hash equals the currently pinned one
// (nothing new was shared yet).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkBadgeContract, inspectRiv } from './inspect-riv.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const URL_ = opt('--url', 'https://public.rive.app/hosted/667822/422141/Cy7BNKJ9mEyR7aSWm-DCaQ.riv');
const PIN_FILE = join(ROOT, 'lanes', 'rive', 'badge.pin.json');
const DEST = [join(ROOT, 'vault-custody', 'public', 'rive', 'badges.riv'), join(ROOT, 'companion', 'custody-companion', 'assets', 'badges.riv')];
const run = (cmd, a, opts = {}) => { const r = spawnSync(cmd, a, { stdio: 'inherit', cwd: ROOT, ...opts }); if (r.status !== 0) throw new Error(`${cmd} ${a.join(' ')} exited ${r.status}`); };

const pin = existsSync(PIN_FILE) ? JSON.parse(readFileSync(PIN_FILE, 'utf8')) : {};

// 1. fetch (the server gzips a text/plain body; fetch decodes it)
const r = await fetch(URL_, { cache: 'no-store' });
if (!r.ok) throw new Error(`fetch ${r.status} ${URL_}`);
const bytes = Buffer.from(await r.arrayBuffer());
if (bytes.subarray(0, 4).toString('latin1') !== 'RIVE') throw new Error('not a .riv (magic)');
const sha256 = createHash('sha256').update(bytes).digest('hex');
console.log(`fetched ${bytes.length} B sha256 ${sha256}${pin.sha256 === sha256 ? ' (same as pinned)' : ''}`);
if (args.includes('--expect-change') && pin.sha256 === sha256) { console.error('the share still serves the pinned file; nothing new to refresh'); process.exit(3); }

// 2. verify on runtime 2.42.0
const tmp = join(ROOT, 'lanes', 'rive', '.cache');
mkdirSync(tmp, { recursive: true });
const tmpFile = join(tmp, `badge-${sha256.slice(0, 12)}.riv`);
writeFileSync(tmpFile, bytes);
const report = await inspectRiv(tmpFile);
const errors = checkBadgeContract(report);
console.log(JSON.stringify({ artboards: report.artboards, viewModels: report.viewModels, drive: report.drive }, null, 1));
if (errors.length) { console.error('CONTRACT FAILED:\n - ' + errors.join('\n - ')); process.exit(1); }

// 3. place + pin
for (const d of DEST) { mkdirSync(dirname(d), { recursive: true }); writeFileSync(d, bytes); }
const version = (pin.version ?? 1) + (pin.sha256 && pin.sha256 !== sha256 ? 1 : 0);
writeFileSync(PIN_FILE, JSON.stringify({ url: URL_, sha256, bytes: bytes.length, version, fetched: new Date().toISOString() }, null, 1) + '\n');

// 4. seal rive.export
if (!args.includes('--no-seal')) {
  const ab = report.artboards.find((a) => a.name === 'Badge');
  const meta = ['source=share', `riv_url=${URL_}`, `sha256=${sha256}`, `bytes=${bytes.length}`, `version=${version}`,
    `artboard=Badge ${ab.width}x${ab.height}`, `state_machines=${ab.stateMachines.join(',')}`, `animations=${ab.animations.join(',')}`,
    `view_model=${ab.linkedViewModel} linked`, `transitions=${report.drive.steps.map((s) => `${s.set}->${s.entered.join('/')}`).join(',')}`,
    'runtime=@rive-app/canvas-advanced 2.42.0', `dest=${DEST.map((d) => d.slice(ROOT.length + 1)).join(',')}`];
  const a = ['rive.export']; for (const m of meta) a.push('--meta', m);
  run('node', [join(ROOT, 'lanes', 'anchor', 'seal-root.mjs'), ...a]);
}

// 5. companion lane build (seals defold.build) + site
run('node', [join(ROOT, 'lanes', 'defold', 'build.mjs'), ...(args.includes('--no-seal') ? ['--no-seal'] : [])]);
run('npm', ['--prefix', join(ROOT, 'vault-custody'), 'run', 'build']);
if (!args.includes('--no-deploy')) run('npm', ['--prefix', join(ROOT, 'vault-custody'), 'run', 'deploy:preview']);
console.log(JSON.stringify({ ok: true, sha256, version, deployed: !args.includes('--no-deploy') }, null, 1));

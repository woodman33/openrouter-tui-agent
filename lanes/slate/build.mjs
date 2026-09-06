#!/usr/bin/env node
// Slate 3D build: lanes.json from LANE_RUNNERS + fleet.json, esbuild bundle of
// companion/slate3d/src → companion/slate3d/dist, index.html copied beside it,
// manifest with sha256 of every output. No receipt here; the render lane seals.
//   node lanes/slate/build.mjs
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(here, '..', '..');
const SLATE = join(ROOT, 'companion', 'slate3d');
const DIST = join(SLATE, 'dist');
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

export function buildSlate() {
  if (!existsSync(join(SLATE, 'node_modules', '.bin', 'esbuild'))) {
    throw new Error('companion/slate3d/node_modules missing: run npm install there first');
  }
  mkdirSync(DIST, { recursive: true });

  // 1. lanes.json: LANE_RUNNERS (read-only import of src/agent/lanes.ts) + fleet entries
  let runners = [];
  const dump = spawnSync('npx', ['tsx', '-e', "import('./src/agent/lanes.ts').then(m => console.log(JSON.stringify(Object.entries(m.LANE_RUNNERS).map(([id, r]) => ({ id, label: r.label, source: 'runner' })))))"], { cwd: ROOT, encoding: 'utf8' });
  try { runners = JSON.parse((dump.stdout || '').trim().split('\n').pop()); } catch { runners = []; }
  if (!runners.length) throw new Error(`LANE_RUNNERS dump failed: ${(dump.stderr || '').slice(0, 300)}`);
  const fleet = JSON.parse(readFileSync(join(ROOT, 'fleet', 'fleet.json'), 'utf8'));
  const known = new Set(runners.map((r) => r.id));
  for (const f of fleet) if (!known.has(f.id)) { runners.push({ id: f.id, label: f.note?.split(/[·(]/)[0].trim() ?? f.id, source: 'fleet' }); known.add(f.id); }
  writeFileSync(join(DIST, 'lanes.json'), JSON.stringify(runners, null, 1));

  // 2. bundle
  const esbuild = join(SLATE, 'node_modules', '.bin', 'esbuild');
  const r = spawnSync(esbuild, [join(SLATE, 'src', 'main.js'), '--bundle', '--format=esm', '--minify', '--target=es2022', `--outfile=${join(DIST, 'slate3d.js')}`], { cwd: SLATE, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`esbuild failed: ${r.stderr}`);
  cpSync(join(SLATE, 'index.html'), join(DIST, 'index.html'));

  // 3. manifest
  const outputs = readdirSync(DIST).filter((n) => n !== 'manifest.json').map((n) => ({ path: n, sha256: sha(join(DIST, n)), bytes: statSync(join(DIST, n)).size }));
  const src = readdirSync(join(SLATE, 'src')).map((n) => ({ path: `src/${n}`, sha256: sha(join(SLATE, 'src', n)) }));
  const three = JSON.parse(readFileSync(join(SLATE, 'node_modules', 'three', 'package.json'), 'utf8')).version;
  const manifest = { built: new Date().toISOString(), three, lanes: runners.length, src, outputs };
  writeFileSync(join(DIST, 'manifest.json'), JSON.stringify(manifest, null, 1));
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const m = buildSlate();
  console.log(JSON.stringify(m, null, 1));
}

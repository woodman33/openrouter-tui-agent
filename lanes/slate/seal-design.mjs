#!/usr/bin/env node
// Seal the Slate 3D decision record as slate.design in the ROOT chain.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = 'companion/slate3d/DESIGN.md';
const text = readFileSync(join(ROOT, doc), 'utf8');
const sha256 = createHash('sha256').update(text).digest('hex');
const decisions = [...text.matchAll(/^## Decision (\d) — (.+)$/gm)].map((m) => `d${m[1]}=${m[2].replace(/\s+/g, ' ').trim()}`);
const meta = [`doc=${doc}`, `sha256=${sha256}`, `lines=${text.split('\n').length}`, ...decisions, 'order=ORD-20260906-018', 'viewer_spawns_work=false'];
const args = ['slate.design'];
for (const m of meta) args.push('--meta', m);
const r = spawnSync('node', [join(ROOT, 'lanes', 'anchor', 'seal-root.mjs'), ...args], { stdio: 'inherit' });
process.exit(r.status ?? 1);

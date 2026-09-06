#!/usr/bin/env node
// Seal into (or verify) the ROOT chain from anywhere. Runs the canonical CLI
// with cwd = the main checkout, so the store-pin preflight applies (prints the
// resolved store, STOPs if it is not the pinned root store). Never seals from
// a subdirectory or a worktree, which is how the 2026-09-06 worktree fork happened.
//   node lanes/anchor/seal-root.mjs <subject> [--meta k=v ...]
//   node lanes/anchor/seal-root.mjs verify
import { spawnSync } from 'node:child_process';

const REPO = process.env.TIMMY_REPO ?? '/Users/williammeldman/Desktop/Code-Projects/timmy-tui';
const args = process.argv.slice(2);
if (!args.length) {
  console.error('usage: seal-root.mjs <subject> [--meta k=v ...] | verify');
  process.exit(2);
}
const cli = args[0] === 'verify' ? ['tsx', 'src/cli.ts', 'verify'] : ['tsx', 'src/cli.ts', 'seal', ...args];
const r = spawnSync('npx', cli, { cwd: REPO, encoding: 'utf8', env: process.env });
const out = (r.stdout + r.stderr).replace(/\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g, '');
process.stdout.write(out);
process.exit(r.status ?? 1);

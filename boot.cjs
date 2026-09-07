#!/usr/bin/env node
// BOOT (opentui-u4e9): first frame ≤1s. Plain node paints the header with the
// chain head via raw ANSI (no tsx, no ink), then hands the terminal to the
// tsx app, which repaints the same header and assembles HOME.
const { existsSync, readFileSync } = require('fs');
const head8 = () => {
  try {
    const p = '.timmy/receipts/runs.jsonl';
    if (!existsSync(p)) return '—';
    const lines = readFileSync(p, 'utf8').split('\n').filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const j = JSON.parse(lines[i]);
        const hash = typeof j.hash === 'string' ? j.hash : '';
        if (hash) return hash.slice(7, 15) || '—';
      } catch { /* skip malformed tail lines */ }
    }
    return '—';
  } catch { return '—'; }
};
process.stdout.write('\x1Bc');
process.stdout.write(`\x1b[1mTIMMY\x1b[0m   chain · ${head8()}\r\n\x1b[2massembling…\x1b[0m\r\n`);
const { spawnSync } = require('child_process');
const fast = existsSync('dist/fast-entry.js') && process.argv.length === 2;
const args = fast ? ['dist/fast-entry.js'] : existsSync('dist/cli.js') ? ['dist/cli.js', ...process.argv.slice(2)] : ['tsx', 'cli.tsx', ...process.argv.slice(2)];
const cmd = fast || existsSync('dist/cli.js') ? process.execPath : 'npx';
const r = spawnSync(cmd, args, { stdio: 'inherit' });
process.exit(r.status ?? 0);

// Phase D — V-04 graduation attempt (VISION-REGISTER exit criterion): two
// consecutive headless 5s golden runs under pinned seed + discovered
// checkpoint must produce BYTE-IDENTICAL output (matching sha256) to
// graduate V-04. Mismatch or failure seals an honest failed receipt; the
// register entry stays a target.
import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { spawnSync } from 'child_process';
import crypto from 'crypto';
import { runComfyGolden } from '../src/utils/comfy-adapter.js';
import { appendReceipt } from '../src/utils/receipts.js';

// Determinism proof must be two FRESH executions, not cache hits: ComfyUI
// caches executed nodes in server memory, so restart between runs.
const comfyBin = (): string => {
  const p = spawnSync('comfy', ['--json', 'env'], { encoding: 'utf8', timeout: 15000 });
  if (p.status === 0) return 'comfy';
  const fb = join(homedir(), '.local', 'bin', 'comfy');
  return existsSync(fb) ? fb : 'comfy';
};
function restartComfy(): void {
  spawnSync(comfyBin(), ['stop'], { encoding: 'utf8', timeout: 30000 });
  spawnSync(comfyBin(), ['launch', '--background'], { encoding: 'utf8', timeout: 60000 });
  for (let i = 0; i < 45; i++) {
    const c = spawnSync('curl', ['-s', '--max-time', '1', 'http://127.0.0.1:8188/system_stats'], { encoding: 'utf8' });
    if (c.status === 0 && (c.stdout ?? '').includes('system')) break;
    spawnSync('sleep', ['2']);
  }
  spawnSync('sleep', ['5']); // asset scanner settles after boot (crash window)
}

const sha = (p: string): string => crypto.createHash('sha256').update(readFileSync(p)).digest('hex');
const OUT_DIR = join(process.env.HOME ?? '', 'Documents', 'comfy', 'ComfyUI', 'output');

function latestGolden(): { name: string; sha: string } | null {
  try {
    const files = readdirSync(OUT_DIR)
      .filter(f => /^timmy-golden-5s.*\.png$/.test(f))
      .map(f => ({ f, m: statSync(join(OUT_DIR, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    if (!files.length) return null;
    return { name: files[0].f, sha: sha(join(OUT_DIR, files[0].f)) };
  } catch { return null; }
}

const wf = join(process.cwd(), 'scripts', 'comfy-golden-5s.json');

restartComfy();
const run1 = await runComfyGolden({ workflow: wf, wall_ms: 300000 });
if (!run1.ok) {
  const rec = appendReceipt('runs', { kind: 'verify', subject: 'V-04 graduation BLOCKED', policy: 'human-gated', status: 'failed', error_class: run1.error_class ?? 'blocked', discrepancies: [run1.note ?? 'run1 failed'], child_receipts: run1.receipt ? [run1.receipt] : [], spans: [], artifacts: [] });
  console.log(JSON.stringify({ graduated: false, error_class: run1.error_class, note: run1.note, receipt: rec.hash }, null, 2));
  process.exit(1);
}
const out1 = latestGolden();

restartComfy();
const run2 = await runComfyGolden({ workflow: wf, wall_ms: 300000 });
if (!run2.ok) {
  const rec = appendReceipt('runs', { kind: 'verify', subject: 'V-04 graduation BLOCKED (run2)', policy: 'human-gated', status: 'failed', error_class: run2.error_class ?? 'blocked', discrepancies: [run2.note ?? 'run2 failed'], child_receipts: [run1.receipt!, run2.receipt!].filter(Boolean), spans: [], artifacts: [] });
  console.log(JSON.stringify({ graduated: false, error_class: run2.error_class, note: run2.note, receipt: rec.hash }, null, 2));
  process.exit(1);
}
const out2 = latestGolden();

if (!out1 || !out2 || out1.name === out2.name) {
  const rec = appendReceipt('runs', { kind: 'verify', subject: 'V-04 graduation BLOCKED (no distinct outputs)', policy: 'human-gated', status: 'failed', error_class: 'exec', discrepancies: [`out1=${out1?.name ?? 'none'} out2=${out2?.name ?? 'none'}`], child_receipts: [run1.receipt!, run2.receipt!], spans: [], artifacts: [] });
  console.log(JSON.stringify({ graduated: false, error_class: 'exec', receipt: rec.hash }, null, 2));
  process.exit(1);
}

if (out1.sha === out2.sha) {
  const rec = appendReceipt('runs', { kind: 'verify', subject: 'V-04 GRADUATION · deterministic golden 5s · byte-identical', policy: 'human-gated', status: 'ok', output_sha256: out1.sha, child_receipts: [run1.receipt!, run2.receipt!], spans: [{ name: 'determinism proof: two runs, one sha', kind: 'execute_tool' }], artifacts: [out1.name, out2.name] });
  console.log(JSON.stringify({ graduated: true, sha256: out1.sha, runs: [out1.name, out2.name], checkpoint: run1.checkpoint, receipt: rec.hash }, null, 2));
  process.exit(0);
}

const rec = appendReceipt('runs', { kind: 'verify', subject: 'V-04 graduation FAILED · determinism mismatch', policy: 'human-gated', status: 'failed', error_class: 'determinism_mismatch', discrepancies: [`${out1.name}=${out1.sha.slice(0, 16)}…`, `${out2.name}=${out2.sha.slice(0, 16)}…`], child_receipts: [run1.receipt!, run2.receipt!], spans: [], artifacts: [out1.name, out2.name] });
console.log(JSON.stringify({ graduated: false, error_class: 'determinism_mismatch', sha1: out1.sha, sha2: out2.sha, receipt: rec.hash }, null, 2));
process.exit(1);

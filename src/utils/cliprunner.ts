import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { join, dirname } from 'path';
import crypto from 'crypto';
import { appendReceipt } from './receipts.js';
import { appendEvent } from './eventbus.js';
import type { ClipJob } from './clip.js';

// Deterministic clip runner — Tier 0's E2E proof. A stream-copy cut is fully
// replay-verifiable (same bytes in → same bytes out), which is exactly the
// property the ALE replay verifier will later settle payments on. The run is
// sealed three ways: .timmy/runs/run_<ts>/{manifest,receipt,replay} per spec,
// the runs-stream receipt chain, and the event bus.

export interface RunResult { ok: boolean; runDir?: string; receiptHash?: string; output?: string; note?: string }

const sha = (p: string): string => crypto.createHash('sha256').update(readFileSync(p)).digest('hex');

export function runClipJob(job: ClipJob, dir: string = process.cwd()): RunResult {
  if (!job.sources[0]) return { ok: false, note: 'no sources linked — SLATE [c] links gens with receipt hashes' };
  const src = job.sources[0].artifact;
  if (!existsSync(src)) return { ok: false, note: `source missing: ${src}` };

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = join(dir, '.timmy', 'runs', `run_${ts}`);
  mkdirSync(runDir, { recursive: true });
  mkdirSync(dirname(job.output), { recursive: true });

  let ffmpegVersion = 'unknown';
  try { ffmpegVersion = execFileSync('ffmpeg', ['-version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n')[0]; } catch { /* probe */ }

  const cmd = ['ffmpeg', '-y', '-i', src, '-ss', '2', '-to', '8', '-c', 'copy', job.output];
  try {
    execFileSync('ffmpeg', cmd.slice(1), { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    writeFileSync(join(runDir, 'replay.md'), `# replay (FAILED)\n\n\`\`\`\n${cmd.join(' ')}\n\`\`\`\n`);
    return { ok: false, note: 'ffmpeg cut failed — replay.md written for diagnosis', runDir };
  }

  const srcHash = sha(src);
  const outHash = sha(job.output);
  const manifest = {
    task: job.instruction,
    lang: 'ffmpeg',
    lane: 'clip',
    deps: { ffmpeg: ffmpegVersion },
    sources: [{ artifact: src, sha256: srcHash, receipt: job.sources[0].receiptHash ?? null }],
    model: null,
    created_at: new Date().toISOString()
  };
  const receipt = {
    id: job.id,
    manifest_sha256: crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex'),
    output_sha256: outHash,
    sealed_at: manifest.created_at
  };
  writeFileSync(join(runDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  writeFileSync(join(runDir, 'receipt.json'), JSON.stringify(receipt, null, 2));
  writeFileSync(join(runDir, 'replay.md'), [
    '# replay',
    '',
    '```',
    cmd.join(' '),
    '```',
    '',
    `source sha256:${srcHash}`,
    `output sha256:${outHash}`
  ].join('\n') + '\n');

  const rec = appendReceipt('runs', {
    kind: 'run',
    subject: `clip ${job.id} · ${job.project}`,
    policy: 'human-gated',
    spans: [{ name: 'ffmpeg stream-copy cut', kind: 'execute_tool' }],
    cost_usd: 0
  }, dir);
  appendEvent('run.completed', { lane: 'clip', job: job.id, out: outHash.slice(0, 16) }, dir);
  return { ok: true, runDir, receiptHash: rec.hash, output: job.output };
}

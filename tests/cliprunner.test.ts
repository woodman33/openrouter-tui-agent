import { describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { createClipJob } from '../src/utils/clip.js';
import { runClipJob, replayFromEdl } from '../src/utils/cliprunner.js';
import { readChain } from '../src/utils/receipts.js';
import { writeFileSync } from 'fs';

describe('clip runner (Tier 0 E2E shape)', () => {
  it('runs a deterministic cut and seals a run dir + receipt', () => {
    const dir = mkdtempSync(join(tmpdir(), 'timmy-run-'));
    const src = join(dir, 'src.mp4');
    execFileSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'testsrc=duration=10:size=320x240:rate=15', '-c:v', 'mpeg4', src], { stdio: ['ignore', 'pipe', 'pipe'] });
    const job = createClipJob('t0', 'E2E deterministic cut', [{ genId: 'g1', label: 'test source', artifact: src }], dir);
    const r = runClipJob(job, dir);
    expect(r.ok).toBe(true);
    expect(r.runDir && existsSync(join(r.runDir, 'manifest.json'))).toBe(true);
    expect(r.runDir && existsSync(join(r.runDir, 'receipt.json'))).toBe(true);
    const replay = readFileSync(join(r.runDir as string, 'replay.md'), 'utf8');
    expect(replay).toContain('output sha256:');
    expect(r.output && existsSync(r.output)).toBe(true);
  }, 30000);

  it('rejects replay with a signed failure receipt when a sealed source drifts', () => {
    const dir = mkdtempSync(join(tmpdir(), 'timmy-drift-'));
    const src = join(dir, 'src.mp4');
    execFileSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'testsrc=duration=10:size=320x240:rate=15', '-c:v', 'mpeg4', src], { stdio: ['ignore', 'pipe', 'pipe'] });
    const job = createClipJob('drift1', 'drift rejection', [{ genId: 'g1', label: 'test source', artifact: src }], dir);
    const r = runClipJob(job, dir);
    expect(r.ok).toBe(true);
    // tamper the sealed source AFTER the run
    writeFileSync(src, readFileSync(src).subarray(0, 4096).toString('binary') + 'TAMPER', 'binary');
    const rep = replayFromEdl(job.id, dir);
    expect(rep.ok).toBe(false);
    expect(rep.note).toContain('source hash drift');
    const last = readChain('runs', dir).at(-1) as any;
    expect(last.status).toBe('failed');
    expect(last.error_class).toBe('source_drift');
    expect(last.signature).toBeTruthy(); // signed failure receipt
    expect(last.signer).toBeTruthy();
  }, 30000);
});

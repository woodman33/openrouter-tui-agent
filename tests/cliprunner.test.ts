import { describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { createClipJob } from '../src/utils/clip.js';
import { runClipJob } from '../src/utils/cliprunner.js';

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
});

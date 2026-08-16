import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { createClipJob } from '../src/utils/clip.js';
import { runClipJob } from '../src/utils/cliprunner.js';
import { exportAgentRun, replayAgentRun } from '../src/utils/agentrun.js';

// T1 acceptance: export a sanitized portable .agentrun, replay it from a
// FRESH temp workspace using only the bundle, byte-compare outputs, verify
// both signatures and the clean receipt chain.
describe('portable .agentrun bundle', () => {
  it('exports sanitized, replays from fresh workspace, byte-matches, verifies', () => {
    const runDir = mkdtempSync(join(tmpdir(), 'timmy-ar-run-'));
    const src = join(runDir, 'src.mp4');
    execFileSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'testsrc=duration=10:size=320x240:rate=15', '-c:v', 'mpeg4', src], { stdio: ['ignore', 'pipe', 'pipe'] });
    const job = createClipJob('portable1', 'portable acceptance', [{ genId: 'g1', label: 'src', artifact: src }], runDir);
    const r = runClipJob(job, runDir);
    expect(r.ok).toBe(true);

    const outBase = mkdtempSync(join(tmpdir(), 'timmy-ar-out-'));
    const exp = exportAgentRun(job.id, outBase, runDir);
    expect(existsSync(join(exp.bundle, 'edit.otio'))).toBe(true);
    expect(existsSync(join(exp.bundle, 'original-receipt.json'))).toBe(true);
    // sanitized: no absolute home paths in any bundle JSON
    for (const f of ['manifest.json', 'edl.json', 'index.json']) {
      const blob = readFileSync(join(exp.bundle, f), 'utf8');
      expect(blob.includes(process.env.HOME as string)).toBe(false);
    }

    const workDir = mkdtempSync(join(tmpdir(), 'timmy-ar-replay-'));
    const rep = replayAgentRun(exp.bundle, workDir);
    expect(rep.ok).toBe(true);
    expect(rep.byteMatch).toBe(true);
    expect((rep.report as any).original_signature_ok).toBe(true);
    expect((rep.report as any).replay_signature_ok).toBe(true);
    expect((rep.report as any).chain_ok).toBe(true);
    // report + replay receipt rode back into the bundle
    expect(existsSync(join(exp.bundle, 'verification-report.json'))).toBe(true);
    expect(existsSync(join(exp.bundle, 'replay-receipt.json'))).toBe(true);
  }, 60000);
});

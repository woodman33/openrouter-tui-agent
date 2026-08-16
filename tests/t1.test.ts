import { describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { signBody, verifyBody, loadOrCreateKeys } from '../src/utils/signing.js';
import { captureEnvLock, relHome } from '../src/utils/envlock.js';
import { applyEdl, makeFragment, parseFragment } from '../src/utils/edl.js';
import { appendReceipt, readChain, verifySignature } from '../src/utils/receipts.js';
import { createClipJob } from '../src/utils/clip.js';
import { runClipJob, replayFromEdl } from '../src/utils/cliprunner.js';

const mkVideo = (p: string, secs = 10) =>
  execFileSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', `testsrc=duration=${secs}:size=320x240:rate=15`, '-c:v', 'mpeg4', p], { stdio: ['ignore', 'pipe', 'pipe'] });

describe('signing (ed25519 per-instance)', () => {
  it('signs and verifies; tamper breaks verification', () => {
    const dir = mkdtempSync(join(tmpdir(), 'timmy-sig-'));
    const body = { kind: 'run', subject: 'x', n: 1 };
    const sig = signBody(body, dir);
    expect(sig.signature.length).toBeGreaterThan(0);
    expect(verifyBody({ ...body, ...sig })).toBe(true);
    expect(verifyBody({ ...body, ...sig, subject: 'tampered' })).toBe(false);
    expect(verifyBody(body)).toBe(false); // unsigned = T0-grade
    expect(existsSync(join(dir, '.timmy', 'keys', 'ed25519.pem'))).toBe(true);
  });
});

describe('env_lock', () => {
  it('pins tool BUILD HASHES, not version strings', () => {
    const dir = mkdtempSync(join(tmpdir(), 'timmy-env-'));
    const lock = captureEnvLock(['ffmpeg'], dir);
    expect(lock.arch).toBe(process.arch);
    expect(lock.os.platform).toBe(process.platform);
    expect(lock.tools.ffmpeg?.sha256).toMatch(/^[0-9a-f]{64}$/);
    // cached second capture agrees
    expect(captureEnvLock(['ffmpeg'], dir).tools.ffmpeg?.sha256).toBe(lock.tools.ffmpeg?.sha256);
  });
  it('relativizes home paths', () => {
    expect(relHome(join(tmpdir(), 'x'))).toBe(join(tmpdir(), 'x')); // not home
    expect(relHome(process.env.HOME + '/a.mp4')).toBe('~/a.mp4');
  });
});

describe('edl v1', () => {
  it('addresses time with W3C Media Fragments and rejects bad addressing', () => {
    const f = makeFragment('/tmp/x.mp4', 2.5, 8);
    expect(f).toContain('#t=2.5,8');
    expect(parseFragment(f).start).toBe(2.5);
    expect(() => parseFragment('/tmp/x.mp4')).toThrow();
  });
  it('replays deterministically (same EDL ⇒ same sha256)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'timmy-edl-'));
    const src = join(dir, 's.mp4');
    mkVideo(src);
    const edl = { edl_version: 1 as const, output: join(dir, 'o1.mp4'), clips: [{ src: makeFragment(src, 2, 8) }], concat: false };
    const a = applyEdl(edl);
    const b = applyEdl({ ...edl, output: join(dir, 'o2.mp4') });
    expect(a.sha256).toBe(b.sha256);
  });
  it('rejects filters outside the v1 vocabulary', () => {
    const dir = mkdtempSync(join(tmpdir(), 'timmy-edl2-'));
    const src = join(dir, 's.mp4');
    mkVideo(src);
    expect(() => applyEdl({ edl_version: 1, output: join(dir, 'o.mp4'), clips: [{ src: makeFragment(src, 1, 2), filters: ['hflip=1'] }] })).toThrow(/vocabulary/);
  });
});

describe('receipts T1 extensions', () => {
  it('seals env-locked signed receipts; chain + signature verify', () => {
    const dir = mkdtempSync(join(tmpdir(), 'timmy-rec-'));
    const rec = appendReceipt('runs', { kind: 'run', subject: 't1', policy: 'auto' }, dir);
    expect(rec.env_lock?.tools.ffmpeg?.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(rec.signature).toBeTruthy();
    expect(verifySignature(rec)).toBe(true);
    const onDisk = readChain('runs', dir)[0];
    expect(verifySignature(onDisk)).toBe(true);
  });
});

describe('clip runner failure receipts', () => {
  it('seals a failure receipt end to end (missing source)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'timmy-fail-'));
    const job = createClipJob('f', 'will fail', [{ genId: 'g', label: 'ghost', artifact: join(dir, 'nope.mp4') }], dir);
    const r = runClipJob(job, dir);
    expect(r.ok).toBe(false);
    expect(r.note).toContain('missing_source');
    const chain = readChain('runs', dir);
    const fail = chain[chain.length - 1];
    expect(fail.status).toBe('failed');
    expect(fail.error_class).toBe('missing_source');
    expect(fail.partial_artifacts?.length).toBeGreaterThan(0);
    expect(verifySignature(fail)).toBe(true);
  });
});

describe('T1 exit criterion', () => {
  it('replays a real edit from the cut-list ALONE via a signed env-locked receipt', () => {
    const dir = mkdtempSync(join(tmpdir(), 'timmy-exit-'));
    const src = join(dir, 'real.mp4');
    mkVideo(src);
    const job = createClipJob('exit', 'T1 exit: replay from cut-list alone', [{ genId: 'g1', label: 'real', artifact: src }], dir);
    const run = runClipJob(job, dir);
    expect(run.ok).toBe(true);
    const manifest = JSON.parse(readFileSync(join(run.runDir as string, 'manifest.json'), 'utf8'));
    expect(manifest.edl.clips[0].src).toContain('#t=2,8');
    expect(manifest.env_lock.tools.ffmpeg.sha256).toMatch(/^[0-9a-f]{64}$/);
    const replay = replayFromEdl(job.id, dir);
    expect(replay.verified).toBe(true);
    const chain = readChain('runs', dir);
    const verifyRec = chain[chain.length - 1];
    expect(verifyRec.kind).toBe('verify');
    expect(verifyRec.status).toBe('ok');
    expect(verifySignature(verifyRec)).toBe(true);
    expect(verifyRec.env_lock).toBeTruthy();
  }, 60000);
});

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from 'fs';
import { join, basename, isAbsolute } from 'path';
import { homedir } from 'os';
import crypto from 'crypto';
import { findRunForJob, envMismatches } from './cliprunner.js';
import { applyEdl, parseFragment, type Edl } from './edl.js';
import { edlToOtio } from './otio.js';
import { appendReceipt, verifySignature, verifyChain, type Receipt } from './receipts.js';
import { captureEnvLock } from './envlock.js';

// v0.5 T1 acceptance artifact: a portable, SANITIZED .agentrun bundle —
// EDL, relative-path manifest (no absolute home paths, no credential
// material), source media, source/output hashes, env lock, signer key,
// original receipt, replay receipt, verification report, and the OTIO export
// as the human-checkable artifact. Replays from a fresh temp workspace using
// ONLY the bundle; byte-compares outputs; verifies both signatures and the
// clean receipt chain.

const sha = (p: string): string => crypto.createHash('sha256').update(readFileSync(p)).digest('hex');
const resolveRel = (p: string, dir: string): string =>
  p.startsWith('~') ? join(homedir(), p.slice(1)) : isAbsolute(p) ? p : join(dir, p);

export interface AgentRunExport {
  bundle: string;
  outputSha: string;
  files: string[];
}

export function exportAgentRun(jobId: string, outBase?: string, dir: string = process.cwd()): AgentRunExport {
  const found = findRunForJob(jobId, dir);
  if (!found) throw new Error(`no sealed run for ${jobId}`);
  const { manifest, runDir } = found;
  const bundle = join(outBase ?? join(dir, '.timmy', 'exports'), `${jobId}.agentrun`);
  mkdirSync(join(bundle, 'media'), { recursive: true });

  // media + sanitized sources (relative paths only)
  const sources = (manifest.sources ?? []).map((s: any, i: number) => {
    const srcPath = resolveRel(s.artifact, dir);
    const name = `${i}_${basename(srcPath)}`;
    copyFileSync(srcPath, join(bundle, 'media', name));
    return { artifact: `media/${name}`, sha256: s.sha256, receipt: s.receipt ?? null };
  });

  // sanitized EDL: rewrite clip src paths to bundle-relative media/
  const edl = manifest.edl as Edl;
  const sanitizedEdl: Edl = {
    ...edl,
    output: 'out.mp4',
    clips: edl.clips.map((c, i) => ({
      ...c,
      src: `media/${i}_${basename(parseFragment(c.src).path)}#t=${parseFragment(c.src).start},${parseFragment(c.src).end}`
    }))
  };
  writeFileSync(join(bundle, 'edl.json'), JSON.stringify(sanitizedEdl, null, 2));

  const sanitizedManifest = { ...manifest, sources, edl: sanitizedEdl };
  writeFileSync(join(bundle, 'manifest.json'), JSON.stringify(sanitizedManifest, null, 2));

  // original signed receipt rides along (carries the signer public key)
  const original: Receipt = JSON.parse(readFileSync(join(runDir, 'receipt.json'), 'utf8'));
  writeFileSync(join(bundle, 'original-receipt.json'), JSON.stringify(original, null, 2));

  // OTIO interchange = the human-checkable artifact (spec §2.9)
  const otio = edlToOtio(edl, { env_lock_hash: sha(join(runDir, 'manifest.json')), model: null });
  writeFileSync(join(bundle, 'edit.otio'), JSON.stringify(otio, null, 2));

  const files = ['edl.json', 'manifest.json', 'original-receipt.json', 'edit.otio',
    ...readdirSync(join(bundle, 'media')).map(f => `media/${f}`)];
  const index = { job: jobId, exported_at: new Date().toISOString(), files, output_sha256: manifest.output_sha256 };
  writeFileSync(join(bundle, 'index.json'), JSON.stringify(index, null, 2));

  // sanitize gate: no absolute home paths, no credential material
  const blob = JSON.stringify({ sanitizedManifest, sanitizedEdl, index });
  if (blob.includes(homedir())) throw new Error('sanitize failure: absolute home path leaked into bundle');
  if (/sk-or-|apify_api_|Bearer /.test(blob)) throw new Error('sanitize failure: credential material in bundle');

  return { bundle, outputSha: manifest.output_sha256, files };
}

export interface AgentRunReplay {
  ok: boolean;
  verified?: boolean;
  byteMatch?: boolean;
  note?: string;
  report?: Record<string, unknown>;
}

export function replayAgentRun(bundle: string, workDir: string): AgentRunReplay {
  const manifest = JSON.parse(readFileSync(join(bundle, 'manifest.json'), 'utf8'));
  const edl = JSON.parse(readFileSync(join(bundle, 'edl.json'), 'utf8')) as Edl;
  const original: Receipt = JSON.parse(readFileSync(join(bundle, 'original-receipt.json'), 'utf8'));

  mkdirSync(join(workDir, 'media'), { recursive: true });
  const srcProblems: string[] = [];
  for (const s of manifest.sources as { artifact: string; sha256: string }[]) {
    const from = join(bundle, s.artifact);
    const to = join(workDir, s.artifact);
    copyFileSync(from, to);
    if (sha(to) !== s.sha256) srcProblems.push(`bundle media corrupt: ${s.artifact}`);
  }
  const envProblems = manifest.env_lock ? envMismatches(manifest.env_lock, workDir) : ['no sealed env_lock'];
  if (srcProblems.length || envProblems.length) {
    const rec = appendReceipt('runs', {
      kind: 'verify', subject: `agentrun replay · rejected`, policy: 'auto',
      status: 'failed', error_class: srcProblems.length ? 'source_drift' : 'env',
      env_lock: captureEnvLock(['ffmpeg', 'ffprobe'], workDir),
      discrepancies: [...srcProblems, ...envProblems]
    }, workDir);
    return { ok: false, note: [...srcProblems, ...envProblems].join('; '), report: { rejected: true, receipt: rec.hash } };
  }

  const replayEdl: Edl = {
    ...edl,
    output: join(workDir, 'out.mp4'),
    clips: edl.clips.map(c => ({ ...c, src: join(workDir, c.src.split('#')[0]) + c.src.slice(c.src.indexOf('#')) }))
  };
  let result: { output: string; sha256: string };
  try {
    result = applyEdl(replayEdl);
  } catch (e) {
    const rec = appendReceipt('runs', {
      kind: 'verify', subject: 'agentrun replay · exec failed', policy: 'auto',
      status: 'failed', error_class: 'exec', edl,
      env_lock: captureEnvLock(['ffmpeg', 'ffprobe'], workDir)
    }, workDir);
    return { ok: false, note: (e as Error).message, report: { receipt: rec.hash } };
  }
  const byteMatch = result.sha256 === manifest.output_sha256;
  const originalSigOk = verifySignature(original);
  const replayRec = appendReceipt('runs', {
    kind: 'verify', subject: `agentrun replay · ${byteMatch ? 'byte-match' : 'drift'}`, policy: 'auto',
    status: byteMatch ? 'ok' : 'failed', ...(byteMatch ? {} : { error_class: 'replay_drift' as const }),
    edl, output_sha256: result.sha256,
    manifest_sha256: sha(join(bundle, 'manifest.json')),
    sources: manifest.sources,
    env_lock: captureEnvLock(['ffmpeg', 'ffprobe'], workDir)
  }, workDir);
  const chain = verifyChain('runs', workDir);
  const ok = byteMatch && originalSigOk && verifySignature(replayRec) && chain.ok;
  const report = {
    byte_match: byteMatch,
    original_signature_ok: originalSigOk,
    replay_signature_ok: verifySignature(replayRec),
    chain_ok: chain.ok,
    original_receipt: original.hash,
    replay_receipt: replayRec.hash,
    output_sha256: result.sha256,
    verified_at: new Date().toISOString()
  };
  writeFileSync(join(workDir, 'verification-report.json'), JSON.stringify(report, null, 2));
  copyFileSync(join(workDir, 'verification-report.json'), join(bundle, 'verification-report.json'));
  writeFileSync(join(bundle, 'replay-receipt.json'), JSON.stringify(replayRec, null, 2));
  return { ok, verified: ok, byteMatch, report };
}

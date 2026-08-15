import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { BRAND } from './brand.js';
import { readChain } from './receipts.js';

// TIMMY Clip — the video-editing surface, built OVER veedstudio/open-edit.
// Editor code is Apache-2.0 (derivative + rebrand fine, keep LICENSE/NOTICE);
// renderer binaries are PolyForm Shield 1.0.0 — the VIDEOS you produce are
// commercializable without paying VEED, but the renderer itself may not be
// resold as a competing service. We sell packs/receipts/outputs, not editing
// SaaS — so TIMMY Clip stands. A hosted editing service later = re-check Shield.
//
// open-edit has no GUI and is designed to be DRIVEN BY A CODING AGENT — our
// lanes are coding agents. TIMMY links generations into an edit-ready
// manifest + prompt; the lane agent runs open-edit; the receipt seals the job.

export const OPEN_EDIT_REPO = 'https://github.com/veedstudio/open-edit.git';
export const CLIP_INSTALL = `git clone ${OPEN_EDIT_REPO}`;

export function locateOpenEdit(): string | null {
  const candidates = [
    process.env.TIMMY_OPEN_EDIT,
    join(process.cwd(), 'tools', 'open-edit'),
    join(homedir(), 'open-edit'),
    join(homedir(), 'Desktop', 'Code-Projects', 'open-edit')
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    if (existsSync(join(c, 'package.json'))) return c;
  }
  return null;
}

export interface ClipStatus { dir?: string; arch: string; archOk: boolean; note?: string }

export function detectClip(): ClipStatus {
  const arch = process.arch;
  const archOk = arch === 'arm64'; // open-edit renderer: Apple Silicon only
  const dir = locateOpenEdit() ?? undefined;
  if (!dir) return { arch, archOk, note: `open-edit not found — ${CLIP_INSTALL} (or set TIMMY_OPEN_EDIT)` };
  if (!archOk) return { dir, arch, archOk, note: 'open-edit renderer needs Apple Silicon (arm64)' };
  return { dir, arch, archOk };
}

export interface ClipSource { genId: string; label: string; artifact: string; receiptHash?: string }

export interface ClipJob {
  id: string;
  project: string;
  instruction: string;
  sources: ClipSource[];
  output: string;
  status: 'queued';
  created_at: string;
  openEditDir?: string;
}

const receiptFor = (genId: string): string | undefined => {
  try {
    const chain = readChain('gens');
    const hit = [...chain].reverse().find(r => r.subject.includes(genId));
    return hit?.hash;
  } catch {
    return undefined;
  }
};

export function createClipJob(project: string, instruction: string, sources: ClipSource[], dir: string = process.cwd()): ClipJob {
  const clipsDir = join(dir, 'studio', project, 'clips');
  mkdirSync(clipsDir, { recursive: true });
  const id = `clip_${Date.now().toString(36)}`;
  const withHashes = sources.map(s => ({ ...s, receiptHash: s.receiptHash ?? receiptFor(s.genId) }));
  const job: ClipJob = {
    id,
    project,
    instruction,
    sources: withHashes,
    output: join(clipsDir, `${id}.mp4`),
    status: 'queued',
    created_at: new Date().toISOString(),
    openEditDir: locateOpenEdit() ?? undefined
  };
  writeFileSync(join(clipsDir, `${id}.json`), JSON.stringify(job, null, 2));
  const md = [
    `# ${BRAND.clip} job ${id} — ${project}`,
    '',
    `Edit instruction: ${instruction}`,
    '',
    'Sources (TIMMY generations, receipt-linked):',
    ...withHashes.map(s => `- ${s.artifact}  (${s.label}${s.receiptHash ? ` · receipt ${s.receiptHash.slice(0, 24)}` : ''})`),
    '',
    `Output: ${job.output}`,
    '',
    runLines(job)
  ].join('\n');
  writeFileSync(join(clipsDir, `${id}.md`), md + '\n');
  return job;
}

function runLines(job: ClipJob): string {
  if (!job.openEditDir) return `open-edit not installed yet: ${CLIP_INSTALL}`;
  const first = job.sources[0]?.artifact ?? '<video>';
  return [
    'Run in a coding-agent lane (open-edit is agent-driven):',
    `  cd ${job.openEditDir}`,
    '  # local transcription (whisperx) when there is speech:',
    `  node --import tsx prep/transcribe.ts ${first}`,
    '  # then hand the instruction + sources above to the lane agent;',
    `  # render the result to: ${job.output}`
  ].join('\n');
}

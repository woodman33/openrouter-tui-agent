import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

// TIMMY Generation Ledger — every prompt → generation → capture → critique
// cycle lands here as a reviewable, sha256-stamped record. Async by design:
// runs execute detached; /gens derives live status from the run log lazily.

export type GenerationStatus = 'queued' | 'running' | 'done' | 'failed';

export interface GenerationRecord {
  id: string;
  prompt: string;
  prompt_hash: string;
  provider: string;
  model?: string;
  kind: string;
  transport: string;
  status: GenerationStatus;
  artifact?: string;
  framesDir?: string;
  frameCount?: number;
  critique?: string;
  log?: string;
  recursion_of?: string;
  stamp: string;
  created_at: string;
}

interface LedgerFile {
  schema: 1;
  generations: GenerationRecord[];
}

const now = () => new Date().toISOString();
const stampOf = (payload: string) => 'sha256_' + crypto.createHash('sha256').update(payload).digest('hex');

export function generationsPath(dir: string = process.cwd()): string {
  return join(dir, '.timmy', 'generations.json');
}

export function loadGenerations(dir?: string): GenerationRecord[] {
  const path = generationsPath(dir);
  if (!existsSync(path)) return [];
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    if (!data || !Array.isArray(data.generations)) return [];
    return data.generations.filter((g: any) => g && typeof g.id === 'string' && typeof g.prompt === 'string');
  } catch {
    return [];
  }
}

export function saveGenerations(records: GenerationRecord[], dir?: string): void {
  const path = generationsPath(dir);
  mkdirSync(join(path, '..'), { recursive: true });
  const file: LedgerFile = { schema: 1, generations: records };
  writeFileSync(path, JSON.stringify(file, null, 2), 'utf8');
}

export function recordGeneration(
  input: Omit<GenerationRecord, 'id' | 'prompt_hash' | 'stamp' | 'created_at'>,
  dir?: string
): GenerationRecord {
  const records = loadGenerations(dir);
  const record: GenerationRecord = {
    ...input,
    id: `gen_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    prompt_hash: stampOf(input.prompt),
    stamp: stampOf(JSON.stringify({ prompt: input.prompt, provider: input.provider })),
    created_at: now()
  };
  records.push(record);
  saveGenerations(records, dir);
  return record;
}

export function updateGeneration(id: string, patch: Partial<GenerationRecord>, dir?: string): GenerationRecord | undefined {
  const records = loadGenerations(dir);
  const rec = records.find(r => r.id === id);
  if (!rec) return undefined;
  Object.assign(rec, patch, { stamp: stampOf(JSON.stringify({ ...rec, ...patch, stamp: undefined })) });
  saveGenerations(records, dir);
  return rec;
}

export function listGenerations(filter: { id?: string; provider?: string; kind?: string } = {}, dir?: string): GenerationRecord[] {
  return loadGenerations(dir)
    .filter(g =>
      (!filter.id || g.id.includes(filter.id) || g.prompt.toLowerCase().includes(filter.id.toLowerCase())) &&
      (!filter.provider || g.provider.includes(filter.provider.toLowerCase())) &&
      (!filter.kind || g.kind === filter.kind))
    .reverse();
}

// Lazy status derivation from a detached run log written by genbridge:
// the wrapper appends EXIT=<code> when the npm script finishes.
export function deriveStatusFromLog(logText: string, fallback: GenerationStatus): GenerationStatus {
  const m = logText.match(/EXIT=(\d+)/);
  if (m) return m[1] === '0' ? 'done' : 'failed';
  if (logText.trim()) return 'running';
  return fallback === 'done' || fallback === 'failed' ? fallback : 'running';
}

export function extractArtifactFromLog(logText: string): string | undefined {
  const m = logText.match(/(out\/[^\s"']+\.(png|jpe?g|webp|mp4|webm|gif))/i);
  return m ? m[1] : undefined;
}

export function countFrames(framesDir: string): number {
  try {
    return readdirSync(framesDir).filter(f => f.endsWith('.png')).length;
  } catch {
    return 0;
  }
}

export function generationsOverview(dir?: string): string {
  const all = loadGenerations(dir);
  const by = (s: GenerationStatus) => all.filter(g => g.status === s).length;
  return `generations:${all.length} (done:${by('done')} running:${by('running')} queued:${by('queued')} failed:${by('failed')})`;
}

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { appendReceipt } from './receipts.js';

// TIMMY Continual Harness — durable, reviewable self-improvement state.
// Adapted from Prime Agent's continual-harness idea, with one addition:
// every refinement is stamped with a sha256 so the trust layer can seal it.

export type HarnessKind = 'prompt' | 'memory' | 'skill' | 'subagent';
export const HARNESS_KINDS: HarnessKind[] = ['prompt', 'memory', 'skill', 'subagent'];

export interface HarnessEntry {
  id: string;
  kind: HarnessKind;
  title: string;
  content: string;
  version: number;
  source: string;
  stamp: string;
  created_at: string;
  updated_at: string;
}

export interface RefinementEvent {
  id: string;
  trigger: string;
  changes: string[];
  evidence: string;
  outcome: string;
  stamp: string;
  created_at: string;
}

interface HarnessFile {
  schema: 1;
  entries: Record<string, Record<string, HarnessEntry>>;
  refinements: RefinementEvent[];
}

const now = () => new Date().toISOString();
const stampOf = (payload: string) => 'sha256_' + crypto.createHash('sha256').update(payload).digest('hex');
const slug = (raw: string, fallback: string) => {
  const s = raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
  return s || fallback;
};

export function harnessPath(dir: string = process.cwd()): string {
  return join(dir, '.timmy', 'harness_state.json');
}

function emptyFile(): HarnessFile {
  return { schema: 1, entries: { prompt: {}, memory: {}, skill: {}, subagent: {} }, refinements: [] };
}

// Corrupt or partial state must never crash the TUI; load leniently.
export function loadHarness(dir?: string): HarnessFile {
  const file = emptyFile();
  const path = harnessPath(dir);
  if (!existsSync(path)) return file;
  let data: any;
  try {
    data = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return file;
  }
  if (!data || typeof data !== 'object') return file;
  for (const kind of HARNESS_KINDS) {
    const raw = (data.entries || {})[kind];
    if (!raw || typeof raw !== 'object') continue;
    for (const [id, e] of Object.entries(raw as Record<string, any>)) {
      if (!e || typeof e.title !== 'string' || typeof e.content !== 'string') continue;
      let version = e.version;
      if (typeof version === 'string') version = parseInt(version, 10);
      if (typeof version !== 'number' || !Number.isFinite(version)) version = 1;
      file.entries[kind][id] = {
        id,
        kind,
        title: e.title,
        content: e.content,
        version,
        source: typeof e.source === 'string' ? e.source : 'user',
        stamp: typeof e.stamp === 'string' ? e.stamp : stampOf(e.content),
        created_at: typeof e.created_at === 'string' ? e.created_at : now(),
        updated_at: typeof e.updated_at === 'string' ? e.updated_at : now()
      };
    }
  }
  if (Array.isArray(data.refinements)) {
    for (const r of data.refinements) {
      if (!r || typeof r.trigger !== 'string') continue;
      file.refinements.push({
        id: typeof r.id === 'string' ? r.id : `ref_${file.refinements.length + 1}`,
        trigger: r.trigger,
        changes: Array.isArray(r.changes) ? r.changes.map(String) : [],
        evidence: typeof r.evidence === 'string' ? r.evidence : '',
        outcome: typeof r.outcome === 'string' ? r.outcome : '',
        stamp: typeof r.stamp === 'string' ? r.stamp : stampOf(r.trigger),
        created_at: typeof r.created_at === 'string' ? r.created_at : now()
      });
    }
  }
  return file;
}

export function saveHarness(file: HarnessFile, dir?: string): void {
  const path = harnessPath(dir);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, JSON.stringify(file, null, 2), 'utf8');
}

export function upsertHarnessEntry(
  kind: HarnessKind,
  title: string,
  content: string,
  opts: { id?: string; source?: string; dir?: string } = {}
): HarnessEntry {
  const file = loadHarness(opts.dir);
  const id = opts.id || slug(title, kind);
  const existing = file.entries[kind][id];
  const entry: HarnessEntry = existing
    ? {
        ...existing,
        title,
        content,
        version: existing.version + 1,
        source: opts.source || existing.source,
        stamp: stampOf(content),
        updated_at: now()
      }
    : {
        id,
        kind,
        title,
        content,
        version: 1,
        source: opts.source || 'user',
        stamp: stampOf(content),
        created_at: now(),
        updated_at: now()
      };
  file.entries[kind][id] = entry;
  saveHarness(file, opts.dir);
  return entry;
}

export function listHarnessEntries(kind?: HarnessKind, dir?: string): HarnessEntry[] {
  const file = loadHarness(dir);
  const kinds = kind ? [kind] : HARNESS_KINDS;
  return kinds.flatMap(k => Object.values(file.entries[k]));
}

export function recordHarnessRefinement(
  trigger: string,
  changes: string[],
  evidence: string,
  outcome: string,
  dir?: string
): RefinementEvent {
  const file = loadHarness(dir);
  const event: RefinementEvent = {
    id: `ref_${Date.now().toString(36)}`,
    trigger,
    changes,
    evidence,
    outcome,
    stamp: stampOf(JSON.stringify({ trigger, changes })),
    created_at: now()
  };
  file.refinements.push(event);
  saveHarness(file, dir);
  appendReceipt('harness', { kind: 'refinement', subject: event.id, policy: 'auto' }, dir);
  return event;
}

export function harnessOverview(dir?: string): string {
  const file = loadHarness(dir);
  const counts = HARNESS_KINDS.map(k => `${k}:${Object.keys(file.entries[k]).length}`).join('  ');
  const last = file.refinements[file.refinements.length - 1];
  return `${counts}  refinements:${file.refinements.length}` +
    (last ? `\nlast refinement: ${last.trigger} → ${last.changes.join(', ') || '(no changes)'}` : '');
}

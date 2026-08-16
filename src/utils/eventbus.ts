import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { notify } from './notify.js';

// TIMMY event bus — one NDJSON envelope for everything the TUI consumes, so
// `timmy events --ndjson` (headless/CI/companion) and the TUI read the SAME
// stream. Append-only under .timmy/runs/; notifications fire at append time
// (TTY-gated inside notify), never at read time.

export interface TimmyEvent {
  v: 1;
  ts: string;
  kind: string; // receipt.sealed · approval.required · approval.granted · gen.*
  payload: Record<string, unknown>;
}

export function eventsPath(dir: string = process.cwd()): string {
  return join(dir, '.timmy', 'runs', 'timmy-events.jsonl');
}

export function appendEvent(kind: string, payload: Record<string, unknown>, dir?: string): TimmyEvent {
  const ev: TimmyEvent = { v: 1, ts: new Date().toISOString(), kind, payload };
  try {
    const p = eventsPath(dir);
    mkdirSync(dirname(p), { recursive: true });
    appendFileSync(p, JSON.stringify(ev) + '\n', 'utf8');
  } catch { /* best effort — the bus never breaks the spine */ }
  if (kind === 'receipt.sealed') {
    notify('seal', 'TIMMY receipt sealed', `${payload.stream ?? ''} · ${String(payload.hash ?? '').slice(0, 16)}`);
  }
  if (kind === 'approval.required') {
    notify('approval', 'TIMMY approval waiting', String(payload.command ?? '').slice(0, 80));
  }
  return ev;
}

export function readEvents(tail = 0, dir?: string): TimmyEvent[] {
  const p = eventsPath(dir);
  if (!existsSync(p)) return [];
  try {
    const lines = readFileSync(p, 'utf8').split('\n').filter(Boolean);
    const slice = tail > 0 ? lines.slice(-tail) : lines;
    return slice
      .map(l => { try { return JSON.parse(l) as TimmyEvent; } catch { return null; } })
      .filter((e): e is TimmyEvent => Boolean(e && typeof e.kind === 'string'));
  } catch {
    return [];
  }
}

// Studio runtime (v0.7.3): load native Theatre.js state from compiled project
// folders and play it back deterministically (cubic-Bézier sampling) so
// renderers/verifiers get exact values at exact times. The browser path hands
// the SAME state to @theatre/core verbatim (getProject(id, {state})) — one
// source of truth, two playback surfaces.
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { THEATRE_STATE_DEFINITION_VERSION, type TheatreProjectState, type TheatreNativeKeyframe, type BezierHandles } from './motion.js';

export const THEATRE_STATE_FILE = 'theatre-state.json';

export function validateTheatreState(s: unknown): s is TheatreProjectState {
  const o = s as TheatreProjectState;
  return Boolean(o && typeof o === 'object' && !Array.isArray(o)
    && o.definitionVersion === THEATRE_STATE_DEFINITION_VERSION
    && typeof o.revision === 'number'
    && o.sheets && typeof o.sheets === 'object' && !Array.isArray(o.sheets)
    && Object.values(o.sheets).length > 0
    && Object.values(o.sheets).every(sh => sh.sequence?.type === 'Theatre_Sequence'
      && typeof sh.sequence.length === 'number'
      && Object.values(sh.sequence.tracks ?? {}).every(t => t.type === 'Theatre_Track' && Array.isArray(t.keyframes))));
}

/** Write a sequence's native state into a compiled project folder. */
export function saveTheatreState(folder: string, state: TheatreProjectState): string {
  const p = join(folder, THEATRE_STATE_FILE);
  writeFileSync(p, JSON.stringify(state, null, 2));
  return p;
}

/** Load + validate native state from a compiled project folder (fail closed). */
export function loadTheatreState(folder: string): TheatreProjectState {
  const primary = join(folder, THEATRE_STATE_FILE);
  const candidates = existsSync(primary)
    ? [primary]
    : readdirSync(folder).filter(f => f.endsWith('.theatre.json')).map(f => join(folder, f));
  if (candidates.length === 0) throw new Error(`no theatre state in ${folder}`);
  const parsed = JSON.parse(readFileSync(candidates[0], 'utf8'));
  if (!validateTheatreState(parsed)) throw new Error(`invalid theatrejs state: ${candidates[0]}`);
  return parsed;
}

// CSS-style cubic-bézier: solve x(u)=x by bisection, return y(u).
export function bezierSample(handles: BezierHandles, x: number): number {
  const [x1, y1, x2, y2] = handles;
  const cx = (u: number) => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  const cy = (u: number) => 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  const t = Math.min(1, Math.max(0, x));
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (cx(mid) < t) lo = mid; else hi = mid;
  }
  return cy((lo + hi) / 2);
}

function sampleKeyframes(kfs: TheatreNativeKeyframe[], t: number): number | string {
  if (kfs.length === 0) return 0;
  if (t <= kfs[0].position) return kfs[0].value;
  if (t >= kfs[kfs.length - 1].position) return kfs[kfs.length - 1].value;
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i], b = kfs[i + 1];
    if (t >= a.position && t <= b.position) {
      if (typeof a.value === 'string' || typeof b.value === 'string') return a.value; // strings step
      const span = b.position - a.position;
      const x = span <= 0 ? 1 : (t - a.position) / span;
      const y = bezierSample(a.interpolation.config.handles, x);
      return a.value + (b.value - a.value) * y;
    }
  }
  return kfs[kfs.length - 1].value;
}

/** Exact value of one track at time t. */
export function sampleTrack(state: TheatreProjectState, sheetId: string, trackKey: string, t: number): number | string {
  const sheet = state.sheets[sheetId];
  if (!sheet) throw new Error(`no sheet ${sheetId}`);
  const track = sheet.sequence.tracks[trackKey];
  if (!track) throw new Error(`no track ${trackKey}`);
  return sampleKeyframes(track.keyframes, t);
}

/** Every track value at time t — what a renderer applies per frame. */
export function sampleSequence(state: TheatreProjectState, sheetId: string, t: number): Record<string, number | string> {
  const sheet = state.sheets[sheetId];
  if (!sheet) throw new Error(`no sheet ${sheetId}`);
  const out: Record<string, number | string> = {};
  for (const [key, track] of Object.entries(sheet.sequence.tracks)) out[key] = sampleKeyframes(track.keyframes, t);
  return out;
}

// Browser playback: the studio imports @theatre/core and feeds the identical
// state. Kept dynamic so node-side tooling never pays for the browser bundle.
// CJS interop: node exposes the API on default/'module.exports', bundlers on
// the namespace itself.
export async function theatreCoreProject(state: TheatreProjectState, id: string): Promise<unknown> {
  const mod = (await import('@theatre/core')) as Record<string, any>;
  const core = typeof mod.getProject === 'function' ? mod : (mod.default ?? mod['module.exports']);
  return core.getProject(id, { state });
}

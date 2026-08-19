import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, renameSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import crypto from 'crypto';
import { homedir } from 'os';

// EDL v1 (specs/edl-v1.md): the cut-list IS the edit. Renderers and verifiers
// read only this JSON — zero prose. Time is addressed with W3C Media Fragments
// URI (path#t=start,end). Default pass is stream-copy; filters force a pinned
// re-encode (-crf 23 -preset veryfast) whose encoder is pinned by env_lock.

export interface EdlRect { x: number; y: number; w: number; h: number }
export interface EdlOverlay { asset: string; at: number; duration?: number; rect?: EdlRect }
export interface EdlClip { src: string; filters?: string[]; overlays?: EdlOverlay[] }
/** Multi-track audio stem (v0.7.2): rides OTIO Audio tracks; addressed like clips. */
export interface EdlAudioStem { src: string; kind: 'music' | 'vo' | 'sfx'; duck_db?: number }
export interface Edl {
  edl_version: 1;
  output: string;
  clips: EdlClip[];
  concat?: boolean;
  /** explicit timebase (fps) for the timeline; default 24 */
  timebase?: number;
  audio_stems?: EdlAudioStem[];
}

const ALLOWED_FILTER = /^(scale|crop|fps|loudnorm)=/;

export function parseFragment(src: string): { path: string; start: number; end: number } {
  const m = src.match(/^(.+)#t=(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/);
  if (!m) throw new Error(`bad media fragment (want path#t=start,end): ${src}`);
  const raw = m[1];
  const path = raw.startsWith('~') ? join(homedir(), raw.slice(1)) : raw;
  return { path, start: Number(m[2]), end: Number(m[3]) };
}

export function makeFragment(path: string, start: number, end: number): string {
  const p = path.startsWith(homedir()) ? '~' + path.slice(homedir().length) : path;
  return `${p}#t=${start},${end}`;
}

export function validateEdl(edl: Edl): void {
  if (edl.edl_version !== 1) throw new Error(`unsupported edl_version: ${edl.edl_version}`);
  if (!edl.clips?.length) throw new Error('edl has no clips');
  for (const c of edl.clips) {
    parseFragment(c.src); // throws on bad addressing
    for (const f of c.filters ?? []) {
      if (!ALLOWED_FILTER.test(f)) throw new Error(`filter not in edl v1 vocabulary: ${f}`);
    }
  }
  if (edl.timebase !== undefined && !(Number.isFinite(edl.timebase) && edl.timebase > 0)) {
    throw new Error(`bad timebase: ${edl.timebase}`);
  }
  for (const s of edl.audio_stems ?? []) parseFragment(s.src);
}

const sha = (p: string): string => crypto.createHash('sha256').update(readFileSync(p)).digest('hex');

// Deterministic replay: same EDL + same env_lock ⇒ same output sha256.
export function applyEdl(edl: Edl): { output: string; sha256: string } {
  validateEdl(edl);
  mkdirSync(dirname(edl.output), { recursive: true });
  const parts: string[] = [];

  edl.clips.forEach((c, i) => {
    const { path, start, end } = parseFragment(c.src);
    if (!existsSync(path)) throw Object.assign(new Error(`missing source: ${path}`), { code: 'missing_source' });
    const overlays = c.overlays ?? [];
    const hasFx = Boolean(c.filters?.length) || overlays.length > 0;
    const out = join(dirname(edl.output), `.edl_part_${i}.mp4`);
    const args = ['-y', '-i', path];
    for (const o of overlays) args.push('-i', o.asset.startsWith('~') ? join(homedir(), o.asset.slice(1)) : o.asset);
    args.push('-ss', String(start), '-to', String(end));
    if (hasFx) {
      const chain: string[] = [];
      if (c.filters?.length) chain.push(...c.filters);
      overlays.forEach((o, oi) => {
        const pos = o.rect ? `overlay=x=${o.rect.x}:y=${o.rect.y}` : 'overlay';
        const en = o.duration ? `:enable='between(t,${o.at},${o.at + o.duration})'` : `:enable='gte(t,${o.at})'`;
        chain.push(`[${oi + 1}:v]${pos}${en}[ov${oi}]`);
      });
      if (overlays.length) {
        // simple stacked overlay graph: [0:v]+[1:v]→[ov0], [ov0]+[2:v]→[ov1]…
        let prev = '0:v';
        const graph: string[] = [];
        overlays.forEach((o, oi) => {
          const pos = o.rect ? `x=${o.rect.x}:y=${o.rect.y}` : 'x=0:y=0';
          const en = o.duration ? `:enable='between(t,${o.at},${o.at + o.duration})'` : `:enable='gte(t,${o.at})'`;
          const outLabel = oi === overlays.length - 1 ? 'vout' : `ov${oi}`;
          graph.push(`[${prev}][${oi + 1}:v]overlay=${pos}${en}[${outLabel}]`);
          prev = outLabel;
        });
        args.push('-filter_complex', graph.join(''), '-map', '[vout]', '-map', '0:a?');
      } else {
        args.push('-vf', chain.join(','));
      }
      args.push('-crf', '23', '-preset', 'veryfast');
    } else {
      args.push('-c', 'copy');
    }
    args.push(out);
    try {
      execFileSync('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      throw Object.assign(new Error(`ffmpeg failed on clip ${i}`), { code: 'exec', cause: e });
    }
    parts.push(out);
  });

  if (parts.length === 1 && !edl.concat) {
    renameSync(parts[0], edl.output);
  } else {
    const list = join(dirname(edl.output), '.edl_concat.txt');
    writeFileSync(list, parts.map(p => `file '${p}'`).join('\n') + '\n');
    try {
      execFileSync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', edl.output], { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      throw Object.assign(new Error('ffmpeg concat failed'), { code: 'exec', cause: e });
    }
  }
  return { output: edl.output, sha256: sha(edl.output) };
}

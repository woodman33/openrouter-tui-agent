// theatre.js sequences describe motion (the when/how-it-moves counterpart to
// tldraw's where). Under the compile-to-EDL law they are DATA: keyframe JSON
// compiles to EDL transform tracks; only lanes render. motion-canvas and
// rive-runtime sit under the same rule (spec §2.9).
// v0.7.2: keyframes carry cubic-Bézier handles and compile to NATIVE
// Theatre.js sheet/state JSON (theatrejs v1) — no more placeholder linear
// ramps; the studio loads the state verbatim via @theatre/core.

export type BezierHandles = [number, number, number, number];

export interface TheatreKeyframe {
  t: number;
  value: number | string;
  /** cubic-bézier easing OUT of this keyframe [x1, y1, x2, y2]; default ease-in-out */
  handles?: BezierHandles;
}
export interface TheatreTrack { target: string; prop: string; keyframes: TheatreKeyframe[] }
export interface TheatreSequence { name: string; duration: number; tracks: TheatreTrack[] }

export interface EdlTransformEvent { target: string; at: number; prop: string; value: number | string }

const DEFAULT_HANDLES: BezierHandles = [0.42, 0, 0.58, 1];

export function theatreSequenceToTransforms(seq: TheatreSequence): EdlTransformEvent[] {
  const out: EdlTransformEvent[] = [];
  for (const tr of seq.tracks) {
    for (const kf of tr.keyframes) {
      out.push({ target: tr.target, at: kf.t, prop: tr.prop, value: kf.value });
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

// Native Theatre.js project state (data-only; the browser sheet loads it via
// getProject(...).setState / studio import). Track keys mirror the EDL
// transform addressing: <target>.<prop>.
export interface TheatreNativeKeyframe {
  id: string;
  position: number;
  value: number | string;
  interpolation: { type: 'CubicBezier'; config: { handles: BezierHandles } };
  handles: [number, number];
}
export interface TheatreProjectState {
  theatrejs: 'v1';
  sheets: Array<{
    id: string;
    type: 'Theatre_Sheet';
    staticOverrides: Record<string, never>;
    sequence: {
      type: 'Theatre_Sequence';
      length: number;
      subUnits: number;
      tracks: Record<string, { type: 'Theatre_Track'; keyframes: TheatreNativeKeyframe[] }>;
    };
  }>;
}

export function theatreStateFromSequence(seq: TheatreSequence): TheatreProjectState {
  const tracks: TheatreProjectState['sheets'][0]['sequence']['tracks'] = {};
  for (const tr of seq.tracks) {
    const key = `${tr.target}.${tr.prop}`;
    tracks[key] = {
      type: 'Theatre_Track',
      keyframes: tr.keyframes.map((kf, i) => ({
        id: `${key}-${i}`,
        position: kf.t,
        value: kf.value,
        interpolation: { type: 'CubicBezier', config: { handles: kf.handles ?? DEFAULT_HANDLES } },
        handles: [0, 0]
      }))
    };
  }
  return {
    theatrejs: 'v1',
    sheets: [{
      id: seq.name,
      type: 'Theatre_Sheet',
      staticOverrides: {},
      sequence: { type: 'Theatre_Sequence', length: seq.duration, subUnits: 30, tracks }
    }]
  };
}

// Attach compiled transforms to matching EDL clips (by clip id/target prefix).
export function attachTransforms<T extends { transforms?: EdlTransformEvent[] }>(
  clips: T[],
  transforms: EdlTransformEvent[],
  idOf: (c: T, i: number) => string
): T[] {
  return clips.map((c, i) => {
    const id = idOf(c, i);
    const mine = transforms.filter(t => t.target === id);
    return mine.length ? { ...c, transforms: mine } : c;
  });
}

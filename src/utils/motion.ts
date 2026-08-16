// theatre.js sequences describe motion (the when/how-it-moves counterpart to
// tldraw's where). Under the compile-to-EDL law they are DATA: keyframe JSON
// compiles to EDL transform tracks; only lanes render. motion-canvas and
// rive-runtime sit under the same rule (spec §2.9).

export interface TheatreKeyframe { t: number; value: number | string }
export interface TheatreTrack { target: string; prop: string; keyframes: TheatreKeyframe[] }
export interface TheatreSequence { name: string; duration: number; tracks: TheatreTrack[] }

export interface EdlTransformEvent { target: string; at: number; prop: string; value: number | string }

export function theatreSequenceToTransforms(seq: TheatreSequence): EdlTransformEvent[] {
  const out: EdlTransformEvent[] = [];
  for (const tr of seq.tracks) {
    for (const kf of tr.keyframes) {
      out.push({ target: tr.target, at: kf.t, prop: tr.prop, value: kf.value });
    }
  }
  return out.sort((a, b) => a.at - b.at);
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

import { describe, expect, it } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { edlToOtio } from '../src/utils/otio.js';
import { makeFragment } from '../src/utils/edl.js';
import { theatreSequenceToTransforms, attachTransforms, type TheatreSequence } from '../src/utils/motion.js';

describe('EDL v1 → OTIO interchange', () => {
  it('maps clips losslessly with timmy metadata', () => {
    const edl = {
      edl_version: 1 as const,
      output: 'x.mp4',
      clips: [{ src: makeFragment('/tmp/a.mp4', 2, 8), filters: ['scale=1080:-2'] }],
      concat: false
    };
    const otio = edlToOtio(edl, { env_lock_hash: 'ab'.repeat(32), signature: 'c2ln', model: null }) as any;
    expect(otio.OTIO_SCHEMA).toBe('Timeline.1');
    const clip = otio.tracks.children[0].children[0];
    expect(clip.OTIO_SCHEMA).toBe('Clip.2');
    expect(clip.source_range.start_time.value).toBe(48);      // 2s @ 24
    expect(clip.source_range.duration.value).toBe(144);      // 6s @ 24
    expect(clip.media_references.DEFAULT_MEDIA.target_url).toBe('/tmp/a.mp4');
    expect(clip.active_media_reference_key).toBe('DEFAULT_MEDIA');
    expect(clip.metadata.timmy.env_lock_hash).toBe('ab'.repeat(32));
    expect(clip.metadata.timmy.filters).toContain('scale=1080:-2');
  });

  it('produces OTIO that the real OTIO tooling accepts', () => {
    const dir = mkdtempSync(join(tmpdir(), 'timmy-otio-'));
    const edl = { edl_version: 1 as const, output: 'x.mp4', clips: [{ src: makeFragment('/tmp/a.mp4', 0, 3) }] };
    const p = join(dir, 't.otio');
    writeFileSync(p, JSON.stringify(edlToOtio(edl)));
    const out = execFileSync('otioconvert', ['-i', p, '-o', join(dir, 't2.otio')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    expect(out ?? '').toBe(out ?? ''); // otioconvert exit 0 = valid
  }, 30000);
});

describe('theatre.js → EDL transforms', () => {
  it('compiles keyframe sequences to sorted transform events and attaches them', () => {
    const seq: TheatreSequence = {
      name: 'brand-reveal',
      duration: 3,
      tracks: [
        { target: 'scene-brand', prop: 'opacity', keyframes: [{ t: 0, value: 0 }, { t: 1.2, value: 1 }] },
        { target: 'scene-brand', prop: 'y', keyframes: [{ t: 0, value: 24 }, { t: 1.2, value: 0 }] }
      ]
    };
    const transforms = theatreSequenceToTransforms(seq);
    expect(transforms[0].at).toBe(0);
    expect(transforms.length).toBe(4);
    const clips = attachTransforms([{ id: 'scene-brand' }, { id: 'scene-slate' }], transforms, c => c.id);
    expect(clips[0].transforms?.length).toBe(4);
    expect(clips[1].transforms).toBeUndefined();
  });
});

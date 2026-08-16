import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createClipJob, detectClip } from '../src/utils/clip.js';

describe('TIMMY Clip', () => {
  it('writes a manifest linking gens with an open-edit-ready prompt', () => {
    const dir = mkdtempSync(join(tmpdir(), 'timmy-clip-'));
    const job = createClipJob('demo', 'burn captions, cut on the beat', [
      { genId: 'gen_a', label: 'SC12 wide', artifact: '/tmp/a.mp4' },
      { genId: 'gen_b', label: 'SC13 close', artifact: '/tmp/b.mp4' }
    ], dir);
    const json = JSON.parse(readFileSync(join(dir, 'studio', 'demo', 'clips', `${job.id}.json`), 'utf8'));
    expect(json.sources).toHaveLength(2);
    expect(json.status).toBe('queued');
    expect(json.output).toContain('clips');
    const md = readFileSync(join(dir, 'studio', 'demo', 'clips', `${job.id}.md`), 'utf8');
    expect(md).toContain('burn captions');
    expect(md).toContain('/tmp/a.mp4');
  });

  it('detects honestly either way', () => {
    const st = detectClip();
    expect(st.arch).toBeTruthy();
    if (!st.dir) expect(st.note).toContain('open-edit');
  });
});

import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { shareFile, detectShare } from '../src/utils/share.js';

describe('share layer', () => {
  it('refuses missing files honestly', () => {
    const r = shareFile('/nonexistent/nope.md');
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('no such file');
  });

  it('degrades honestly when croc is missing, shares with a code when present', () => {
    const dir = mkdtempSync(join(tmpdir(), 'timmy-share-'));
    const f = join(dir, 'RIGHTS-LOG.md');
    writeFileSync(f, '# rights');
    const r = shareFile(f, dir);
    const st = detectShare();
    if (st.croc) {
      expect(r.ok).toBe(true);
      expect(r.code).toMatch(/^timmy-/);
    } else {
      expect(r.ok).toBe(false);
      expect(r.reason).toContain('croc');
    }
  });
});

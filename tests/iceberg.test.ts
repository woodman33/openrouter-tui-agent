import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildIndex, recall, contextDir } from '../src/utils/iceberg.js';
import { initProject, addCastToProject, readProject, saveProject } from '../src/utils/projects.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'timmy-iceberg-'));
});

describe('ICEBERG context funnel', () => {
  it('builds a tiny index over topics and vault', () => {
    initProject('sting', {}, dir);
    addCastToProject('sting', { id: 'C1', name: 'Mara', wardrobe: 'orange jumpsuit' }, dir);
    const { branches, indexPath } = buildIndex(dir);
    expect(existsSync(indexPath)).toBe(true);
    const index = readFileSync(indexPath, 'utf8');
    expect(index).toContain('slate:sting');
    expect(index).toContain('cast:C1');
    expect(branches.some(b => b.id === 'slate:sting')).toBe(true);
    expect(existsSync(join(contextDir(dir), 'topics', 'slate-sting.md'))).toBe(true);
    const topic = readFileSync(join(contextDir(dir), 'topics', 'slate-sting.md'), 'utf8');
    expect(topic).toContain('Mara');
  });

  it('descends relevant branches and caps vault hits', () => {
    initProject('sting', {}, dir);
    addCastToProject('sting', { id: 'C1', name: 'Mara', wardrobe: 'orange jumpsuit' }, dir);
    const proj = readProject('sting', dir)!;
    proj.sheet = { continuity: { flags: ['wardrobe', 'hair'] } };
    saveProject(proj, dir);
    const r = recall('mara wardrobe continuity', dir);
    expect(r.descended.length).toBeGreaterThan(0);
    expect(r.descended[0].id).toBe('slate:sting');
    expect(r.stoppedEarly).toBe(false);
  });

  it('stops early on irrelevant queries — saves the tokens', () => {
    initProject('sting', {}, dir);
    const r = recall('zebra quantum blockchain nonsense', dir);
    expect(r.stoppedEarly).toBe(true);
    expect(r.descended).toHaveLength(0);
    expect(r.reason).toContain('stopped');
  });

  it('receipts every retrieval path', () => {
    recall('anything at all', dir);
    expect(existsSync(join(contextDir(dir), 'paths.jsonl'))).toBe(true);
    expect(existsSync(join(contextDir(dir), '..', '.timmy', 'receipts', 'context.jsonl'))).toBe(true);
  });
});

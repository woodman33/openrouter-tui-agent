import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  ensureProjectTree, projectTree, writePromptRecord, appendChatThread,
  exportTraining, renderProjectIndex, TREE_FOLDERS
} from '../src/utils/projecttree.js';
import { initProject, addGenToProject } from '../src/utils/projects.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'timmy-tree-'));
  initProject('north', {}, dir);
});

describe('TIMMY project tree', () => {
  it('creates the full context-optimized skeleton + index', () => {
    ensureProjectTree('north', dir);
    for (const f of TREE_FOLDERS) expect(existsSync(join(dir, 'studio', 'north', f))).toBe(true);
    expect(existsSync(join(dir, 'studio', 'north', 'logs', 'lanes'))).toBe(true);
    const idx = readFileSync(join(dir, 'studio', 'north', 'PROJECT.md'), 'utf8');
    expect(idx).toContain('# PROJECT · north');
    expect(idx).toContain('prompts/<gen-id>.md ↔ gens/<gen-id>');
  });

  it('matches prompts to outcomes by gen-id', () => {
    const p = writePromptRecord('north', { id: 'gen_1', prompt: 'foil card', provider: 'nano-banana-2', model: 'google/gemini-3.1-flash-image', cost_usd: 0.07, status: 'done', artifact: 'gens/gen_1.png' }, dir);
    const body = readFileSync(p, 'utf8');
    expect(body).toContain('# prompt · gen_1');
    expect(body).toContain('outcome: ../gens/gen_1.png');
    expect(body).toContain('foil card');
  });

  it('exports training data with labels', () => {
    mkdirSync(join(dir, 'studio', 'north', 'gens'), { recursive: true });
    writeFileSync(join(dir, 'studio', 'north', 'gens', 'gen_1.png'), 'png');
    addGenToProject('north', { id: 'gen_1', provider: 'nano-banana-2', prompt: 'x', label: 'card v1' }, dir);
    const r = exportTraining('north', dir);
    expect(r.files).toBe(1);
    const labels = JSON.parse(readFileSync(r.labelsPath!, 'utf8'));
    expect(labels.labels[0].label).toBe('card v1');
  });

  it('captures chat threads and lists the tree', () => {
    appendChatThread('north', [{ role: 'user', content: 'make it rain' }], dir);
    expect(readFileSync(join(dir, 'studio', 'north', 'logs', 'chat.md'), 'utf8')).toContain('make it rain');
    const tree = projectTree('north', dir);
    expect(tree.some(f => f.rel === join('logs', 'chat.md'))).toBe(true);
    renderProjectIndex('north', dir);
    expect(readFileSync(join(dir, 'studio', 'north', 'PROJECT.md'), 'utf8')).toContain('PROJECT · north');
  });
});

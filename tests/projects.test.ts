import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  initProject, listProjects, readProject,
  addGenToProject, addRefToProject, renderProjectSite, projectDir
} from '../src/utils/projects.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'timmy-proj-'));
});

describe('Slate projects', () => {
  it('initializes the visual project folder skeleton', () => {
    initProject('launch', {}, dir);
    for (const sub of ['refs', 'gens', 'frames', 'receipts', 'site']) {
      expect(existsSync(join(projectDir('launch', dir), sub))).toBe(true);
    }
    expect(listProjects(dir)).toContain('launch');
    expect(readProject('launch', dir)?.refs).toEqual([]);
  });

  it('stores labeled generations and refs', () => {
    initProject('launch', {}, dir);
    writeFileSync(join(dir, 'char.png'), 'png-bytes');
    expect(addRefToProject('launch', join(dir, 'char.png'), 'hero character', dir)).toContain('refs/');
    const gen = addGenToProject('launch', { id: 'gen_1', provider: 'nano-banana-2', prompt: 'foil card', label: 'card v1' }, dir);
    expect(gen?.created_at).toBeTruthy();
    const proj = readProject('launch', dir)!;
    expect(proj.refs[0].label).toBe('hero character');
    expect(proj.gens[0].label).toBe('card v1');
  });

  it('renders the site with refs, gens, receipt footer and the mcp fleet', () => {
    initProject('launch', {}, dir);
    writeFileSync(join(dir, 'char.png'), 'png-bytes');
    addRefToProject('launch', join(dir, 'char.png'), 'hero', dir);
    addGenToProject('launch', { id: 'gen_1', provider: 'nano-banana-2', prompt: 'foil card on velvet', label: 'card v1' }, dir);
    const site = renderProjectSite('launch', dir)!;
    const html = readFileSync(site, 'utf8');
    expect(html).toContain('TIMMY Slate — launch');
    expect(html).toContain('hero');
    expect(html).toContain('foil card on velvet');
    expect(html).toContain('receipts for everything');
  });

  it('keeps Porter strictly separate — no MCP fleet data in Slate sites', () => {
    initProject('launch', {}, dir);
    const site = renderProjectSite('launch', dir)!;
    expect(existsSync(site)).toBe(true);
    expect(existsSync(join(projectDir('launch', dir), 'site', 'mcp.json'))).toBe(false);
    expect(readFileSync(site, 'utf8')).toContain('TIMMY Slate — launch');
  });
});

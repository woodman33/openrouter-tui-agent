import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadOrgConfig, saveOrgConfig, resolveBase, ensureTree, exportSession } from '../src/utils/sessionstore.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'timmy-archive-'));
});

describe('log organization config', () => {
  it('defaults sensibly and round-trips', () => {
    const def = loadOrgConfig(dir);
    expect(def.naming).toBe('date');
    expect(def.baseDir).toContain('archive');
    saveOrgConfig({ baseDir: '~/TIMMY-archive', naming: 'run' }, dir);
    expect(loadOrgConfig(dir).naming).toBe('run');
    expect(resolveBase(loadOrgConfig(dir), dir)).toContain('TIMMY-archive');
  });
});

describe('archive tree + export', () => {
  it('creates the category skeleton with a README', () => {
    const base = join(dir, 'archive');
    ensureTree(base);
    for (const sub of ['sessions', 'generations', 'uploads', 'skills', 'context', 'exports']) {
      expect(existsSync(join(base, sub))).toBe(true);
    }
    expect(readFileSync(join(base, 'README.md'), 'utf8')).toContain('sessions/');
  });

  it('exports a session bundle under date folders by default', () => {
    const folder = exportSession(loadOrgConfig(dir), {
      sessionId: 'run_test1',
      chat: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }],
      eventsLines: ['{"e":1}'],
      generationsJson: '{"generations":[]}'
    }, dir);
    const date = new Date().toISOString().slice(0, 10);
    expect(folder).toContain(join('sessions', date, 'run_test1'));
    expect(readFileSync(join(folder, 'chat.md'), 'utf8')).toContain('## assistant');
    expect(existsSync(join(folder, 'events.jsonl'))).toBe(true);
    expect(existsSync(join(folder, 'generations.json'))).toBe(true);
  });

  it('honors run-id naming when configured', () => {
    saveOrgConfig({ baseDir: join(dir, 'arc2'), naming: 'run' }, dir);
    const folder = exportSession(loadOrgConfig(dir), { sessionId: 'run_abc' }, dir);
    expect(folder).toContain(join('sessions', 'run_abc'));
    expect(folder).not.toContain(new Date().toISOString().slice(0, 10));
  });
});

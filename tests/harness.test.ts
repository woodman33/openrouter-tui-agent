import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  HARNESS_KINDS,
  loadHarness,
  upsertHarnessEntry,
  listHarnessEntries,
  recordHarnessRefinement,
  harnessOverview,
  harnessPath
} from '../src/utils/harness.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'timmy-harness-'));
});

describe('TIMMY Continual Harness', () => {
  it('exposes the four entry kinds', () => {
    expect(HARNESS_KINDS).toEqual(['prompt', 'memory', 'skill', 'subagent']);
  });

  it('creates entries at v1 and bumps version on update', () => {
    const first = upsertHarnessEntry('memory', 'Prefer focused patches', 'Small updates validate easier.', { dir });
    expect(first.version).toBe(1);
    expect(first.stamp).toMatch(/^sha256_[0-9a-f]{64}$/);

    const second = upsertHarnessEntry('memory', 'Prefer focused patches', 'Small updates validate easier. Always run tests.', { dir });
    expect(second.version).toBe(2);
    expect(second.id).toBe(first.id);
  });

  it('lists entries by kind and across kinds', () => {
    upsertHarnessEntry('skill', 'Check failures first', 'Inspect failure evidence before editing.', { dir });
    upsertHarnessEntry('subagent', 'Reviewer', 'Review proposed patches for regressions.', { dir });
    expect(listHarnessEntries('skill', dir)).toHaveLength(1);
    expect(listHarnessEntries(undefined, dir)).toHaveLength(2);
  });

  it('records refinement events with evidence and outcome', () => {
    recordHarnessRefinement('skill failed twice', ['updated failure_first'], 'two failed validations', 'next validation passed', dir);
    const file = loadHarness(dir);
    expect(file.refinements).toHaveLength(1);
    expect(file.refinements[0].trigger).toBe('skill failed twice');
    expect(file.refinements[0].stamp).toMatch(/^sha256_/);
    expect(harnessOverview(dir)).toContain('refinements:1');
  });

  it('tolerates corrupt state files and self-heals on next write', () => {
    mkdirSync(join(dir, '.timmy'), { recursive: true });
    writeFileSync(harnessPath(dir), 'not json at all', 'utf8');
    expect(loadHarness(dir).refinements).toHaveLength(0);
    const entry = upsertHarnessEntry('prompt', 'Recovered', 'Works after corruption.', { dir });
    expect(loadHarness(dir).entries.prompt[entry.id].content).toBe('Works after corruption.');
  });

  it('ignores unknown json keys but keeps valid entries', () => {
    mkdirSync(join(dir, '.timmy'), { recursive: true });
    writeFileSync(harnessPath(dir), JSON.stringify({
      schema: 1,
      entries: { memory: { known: { title: 'Known', content: 'Kept', version: '3', unexpected: true } } },
      refinements: [{ trigger: 't', changes: [1, 'kept'] }, { noTrigger: true }]
    }), 'utf8');
    const file = loadHarness(dir);
    expect(file.entries.memory.known.version).toBe(3);
    expect(file.refinements).toHaveLength(1);
    expect(file.refinements[0].changes).toEqual(['1', 'kept']);
  });
});

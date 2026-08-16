import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadEnvFile } from '../src/utils/config.js';

const KEYS = ['TIMMY_ENV_TEST_PLAIN', 'TIMMY_ENV_TEST_QUOTED', 'TIMMY_ENV_TEST_SINGLE', 'TIMMY_ENV_TEST_EXPORT', 'TIMMY_ENV_TEST_REAL'];

describe('loadEnvFile', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'timmy-env-'));
  });

  afterEach(() => {
    for (const k of KEYS) delete process.env[k];
    rmSync(dir, { recursive: true, force: true });
  });

  it('parses plain, quoted, single-quoted, and export-prefixed lines; skips comments', () => {
    writeFileSync(join(dir, '.env'), [
      '# a comment',
      'TIMMY_ENV_TEST_PLAIN=hello',
      'TIMMY_ENV_TEST_QUOTED="hi there"',
      "TIMMY_ENV_TEST_SINGLE='yo'",
      'export TIMMY_ENV_TEST_EXPORT=1',
      '',
      'not a valid line'
    ].join('\n'));

    loadEnvFile(dir);

    expect(process.env.TIMMY_ENV_TEST_PLAIN).toBe('hello');
    expect(process.env.TIMMY_ENV_TEST_QUOTED).toBe('hi there');
    expect(process.env.TIMMY_ENV_TEST_SINGLE).toBe('yo');
    expect(process.env.TIMMY_ENV_TEST_EXPORT).toBe('1');
  });

  it('never overrides variables already present in the real environment', () => {
    process.env.TIMMY_ENV_TEST_REAL = 'real';
    writeFileSync(join(dir, '.env'), 'TIMMY_ENV_TEST_REAL=fromfile\n');

    loadEnvFile(dir);

    expect(process.env.TIMMY_ENV_TEST_REAL).toBe('real');
  });

  it('is a no-op when no .env exists', () => {
    expect(() => loadEnvFile(dir)).not.toThrow();
    expect(process.env.TIMMY_ENV_TEST_PLAIN).toBeUndefined();
  });
});

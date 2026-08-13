import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { listMarket, installMarketTemplate } from '../src/utils/templates.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'timmy-market-'));
});

describe('template market v0', () => {
  it('lists curated bundles with installed flags', () => {
    const rows = listMarket(dir);
    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(rows.every(r => r.installed === false)).toBe(true);
    expect(rows.some(r => r.name === 'ugc-ad-15s')).toBe(true);
  });

  it('installs a bundle into the local library', () => {
    const p = installMarketTemplate('trailer-60s', dir)!;
    expect(existsSync(p)).toBe(true);
    const body = JSON.parse(readFileSync(p, 'utf8'));
    expect(body.source).toBe('market');
    expect(body.beats.length).toBe(6);
    expect(listMarket(dir).find(r => r.name === 'trailer-60s')?.installed).toBe(true);
    expect(installMarketTemplate('nope', dir)).toBeNull();
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadBank, addBankEntry, useBankEntry, randomCharacter, seedBankEntries } from '../src/utils/promptbank.js';
import { seedStarter } from '../src/utils/starter.js';
import { listProjects, readProject } from '../src/utils/projects.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'timmy-bank-'));
});

describe('prompt bank', () => {
  it('seeds curated entries once', () => {
    expect(seedBankEntries(dir)).toBeGreaterThan(3);
    expect(seedBankEntries(dir)).toBe(0); // idempotent
    expect(loadBank(dir).some(e => e.label === 'turntable-5view')).toBe(true);
  });

  it('adds and uses entries with usage counts', () => {
    const e = addBankEntry({ label: 'neon rain', kind: 'lighting', text: 'neon rain on wet asphalt', tags: ['lighting'] }, dir);
    const used = useBankEntry(e.id, dir)!;
    expect(used.uses).toBe(1);
    expect(useBankEntry('neon rain', dir)!.uses).toBe(2);
  });

  it('random character produces a full slatable card + consistent prompt', () => {
    const { card, prompt } = randomCharacter('C7');
    expect(card.id).toBe('C7');
    expect(card.name).toBeTruthy();
    expect(card.hair).toBeTruthy();
    expect(card.wardrobe).toBeTruthy();
    expect(card.emotion).toBeTruthy();
    expect(prompt).toContain(card.name);
    expect(prompt).toContain(card.wardrobe);
    expect(prompt).toContain('turntable');
  });
});

describe('starter seed', () => {
  it('fills blank panels once with a labeled demo project', () => {
    expect(seedStarter(dir)).toBe(true);
    expect(seedStarter(dir)).toBe(false); // never re-seeds over the user
    expect(listProjects(dir)).toContain('demo-north');
    const proj = readProject('demo-north', dir)!;
    expect(proj.cast?.length).toBe(2);
    expect(proj.sheet?.continuity?.hours_rule).toContain('unshowered');
    expect(existsSync(join(dir, '.timmy', '.seeded'))).toBe(true);
  });
});

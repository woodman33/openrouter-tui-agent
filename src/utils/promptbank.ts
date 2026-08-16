import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type { CharacterCard } from './projects.js';

// Prompt bank — reusable prompt fragments + full prompts, banked and counted.
// Every /gen can pull from it; every use increments the count so the bank
// learns what actually gets used.

export interface PromptBankEntry {
  id: string;
  label: string;
  kind: 'character' | 'scene' | 'lighting' | 'mood' | 'camera' | 'full';
  text: string;
  tags: string[];
  uses: number;
  last_used?: string;
}

export function bankPath(dir: string = process.cwd()): string {
  return join(dir, '.timmy', 'promptbank.json');
}

export function loadBank(dir?: string): PromptBankEntry[] {
  try {
    const raw = JSON.parse(readFileSync(bankPath(dir), 'utf8'));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function saveBank(entries: PromptBankEntry[], dir?: string): void {
  const p = bankPath(dir);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(entries, null, 2), 'utf8');
}

export function addBankEntry(e: Omit<PromptBankEntry, 'id' | 'uses'>, dir?: string): PromptBankEntry {
  const bank = loadBank(dir);
  const entry: PromptBankEntry = { ...e, id: `pb_${bank.length + 1}_${e.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 24)}`, uses: 0 };
  bank.push(entry);
  saveBank(bank, dir);
  return entry;
}

export function useBankEntry(id: string, dir?: string): PromptBankEntry | null {
  const bank = loadBank(dir);
  const e = bank.find(x => x.id === id || x.label.toLowerCase() === id.toLowerCase());
  if (!e) return null;
  e.uses += 1;
  e.last_used = new Date().toISOString();
  saveBank(bank, dir);
  return e;
}

// Curated fragment pools — film-grade, not lorem-ipsum.
const FRAG = {
  names: ['Mara Voss', 'Eli Tanaka', 'Ruth "Ru" Okafor', 'Dmitri Kessler', 'June Calloway', 'Silas Brandt', 'Nadia Reyes', "Tommy 'Two-Step' Vale"],
  hair: ['buzzcut', 'wet-look slickback', 'gray wolf-cut', 'braided crown', 'sun-bleached shag', 'shaved sides + long top'],
  wardrobe: ['orange jumpsuit, scuffed', 'waxed canvas coat, salt-stained', 'thrifted tux, one missing button', 'hi-vis vest over a wedding shirt', 'oil-stained coveralls', 'rain shell, hood up'],
  emotion: ['wired', 'grieving-but-functional', 'quietly furious', 'half-asleep', 'grinning on the edge', 'flat, dissociative'],
  age: ['late 20s', '30s', '40s', '60s, sharp', '17, too old for this'],
  props: ['tablet with cracked screen', 'brass compass', 'paper call sheet, coffee-stained', 'walkie, antenna bent', 'polaroid of the location', 'iodine bottle + gauze'],
  lighting: ['sodium-vapor night', 'magic hour, low sun', 'overcast flat', 'single practical bulb', 'lightning-flash strobe', 'dawn blue, breath visible']
};

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

// Random character generator — one keypress, a full slatable card + a
// turntable prompt built from the same fragments (consistency by
// construction).
export function randomCharacter(nextId?: string): { card: CharacterCard; prompt: string } {
  const prop = pick(FRAG.props);
  const card: CharacterCard = {
    id: nextId || `C${Math.floor(Math.random() * 8) + 1}`,
    name: pick(FRAG.names),
    hair: pick(FRAG.hair),
    wardrobe: pick(FRAG.wardrobe),
    emotion: pick(FRAG.emotion),
    age: pick(FRAG.age),
    props: [prop]
  };
  const light = pick(FRAG.lighting);
  const prompt =
    `full-body character turntable, 5 views (front/side/back/other/bottom): ` +
    `${card.name}, ${card.age}, ${card.hair}, ${card.wardrobe}, expression ${card.emotion}, ` +
    `holding ${prop}; ${light}; consistent identity across all views; film still, 35mm`;
  return { card, prompt };
}

export function seedBankEntries(dir?: string): number {
  if (loadBank(dir).length) return 0;
  const seeds: Omit<PromptBankEntry, 'id' | 'uses'>[] = [
    { label: 'turntable-5view', kind: 'character', tags: ['character', 'consistency'], text: 'full-body character turntable, 5 views (front/side/back/other/bottom), consistent identity, film still 35mm' },
    { label: 'call-sheet-scene', kind: 'scene', tags: ['scene', 'callsheet'], text: 'INT. {location} — {time}: {beat}. Wardrobe and props per call sheet; continuity flags honored; single continuous shot' },
    { label: 'light-sodium-night', kind: 'lighting', tags: ['lighting'], text: 'sodium-vapor night, wet asphalt reflections, single practical source, hard shadows' },
    { label: 'light-magic-hour', kind: 'lighting', tags: ['lighting'], text: 'magic hour, low sun raking, long shadows, breath visible, lens flare controlled' },
    { label: 'mood-24h-rule', kind: 'mood', tags: ['continuity', 'mood'], text: '24-hour continuity: unshowered, clothes yesterday-stale, cut on right arm scabbed (non-lethal), fatigue in the eyes' },
    { label: 'camera-handheld', kind: 'camera', tags: ['camera'], text: 'handheld 24mm, shallow focus, motivated moves only, no unmotivated pushes' },
    { label: 'full-launch-sting', kind: 'full', tags: ['full', 'studio'], text: '12s launch sting: HOOK problem demo trust CTA; receipts visible; terminal aesthetic; purple/green on near-black' }
  ];
  saveBank(seeds.map((s, i) => ({ ...s, id: `pb_seed_${i + 1}`, uses: 0 })), dir);
  return seeds.length;
}

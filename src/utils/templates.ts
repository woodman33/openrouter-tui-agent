import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

// TIMMY Slate template layer — storyboard templates as plain JSON so ANY
// agent can author one per workflow (write studio/templates/<name>.json).
// tldraw Slate exports drop into the same folder later; schema is the contract.

export interface TemplateBeat {
  at: number;
  dur: number;
  label: string;
  text: string;
}

export interface StudioTemplate {
  name: string;
  total: number;
  source: string;
  beats: TemplateBeat[];
}

export const DEFAULT_TEMPLATE_NAME = 'storyboard';

export function defaultStoryboard(): StudioTemplate {
  return {
    name: DEFAULT_TEMPLATE_NAME,
    total: 12,
    source: 'timmy-default',
    beats: [
      { at: 0, dur: 2.5, label: 'HOOK', text: 'TIMMY' },
      { at: 2.5, dur: 2.5, label: 'PROBLEM', text: '{brief}' },
      { at: 5, dur: 3, label: 'DEMO', text: 'chat rises · logs rain · receipts seal' },
      { at: 8, dur: 2.5, label: 'TRUST', text: 'every frame sha256-stamped' },
      { at: 10.5, dur: 1.5, label: 'CTA', text: 'timmytui.com' }
    ]
  };
}

export function templatesDir(dir: string = process.cwd()): string {
  return join(dir, 'studio', 'templates');
}

export function saveTemplate(t: StudioTemplate, dir?: string): string {
  mkdirSync(templatesDir(dir), { recursive: true });
  const path = join(templatesDir(dir), `${t.name}.json`);
  writeFileSync(path, JSON.stringify(t, null, 2), 'utf8');
  return path;
}

const applyBrief = (t: StudioTemplate, brief: string): StudioTemplate => ({
  ...t,
  beats: t.beats.map(b => ({ ...b, text: String(b.text ?? '').replace(/\{brief\}/g, brief) }))
});

// Lenient by design: a broken or missing template never blocks a studio seed.
export function loadTemplate(name: string, brief: string, dir?: string): StudioTemplate {
  const path = join(templatesDir(dir), `${name}.json`);
  if (!existsSync(path)) {
    if (name === DEFAULT_TEMPLATE_NAME) {
      const t = defaultStoryboard();
      saveTemplate(t, dir);
      return applyBrief(t, brief);
    }
    return applyBrief(defaultStoryboard(), brief);
  }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'));
    if (!raw || !Array.isArray(raw.beats) || !raw.beats.length) return applyBrief(defaultStoryboard(), brief);
    const t: StudioTemplate = {
      name: typeof raw.name === 'string' ? raw.name : name,
      total: typeof raw.total === 'number' ? raw.total : 12,
      source: typeof raw.source === 'string' ? raw.source : 'agent',
      beats: raw.beats
    };
    return applyBrief(t, brief);
  } catch {
    return applyBrief(defaultStoryboard(), brief);
  }
}

export function listTemplates(dir?: string): string[] {
  try {
    return readdirSync(templatesDir(dir)).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, ''));
  } catch {
    return [];
  }
}

// Template market v0 — bundled "pro" templates, installable into the local
// library. Offline and honest: market = curated bundles today, a hosted
// store later (that's the paid tier per the research rulings).
export const MARKET_TEMPLATES: Record<string, { kind: string; total: number; beats: { at: number; dur: number; label: string; text: string }[]; blurb: string }> = {
  'music-video-30s': {
    kind: 'storyboard', total: 30, blurb: '6 beats × 5s — hook/verse/chorus/bridge/drop/outro',
    beats: [
      { at: 0, dur: 5, label: 'HOOK', text: '{brief} — cold open on the strongest image' },
      { at: 5, dur: 5, label: 'VERSE', text: 'world-building wide + detail inserts' },
      { at: 10, dur: 5, label: 'CHORUS', text: 'performance shots, cut on the beat' },
      { at: 15, dur: 5, label: 'BRIDGE', text: 'contrast — new location or lighting flip' },
      { at: 20, dur: 5, label: 'DROP', text: 'fastest cuts of the piece' },
      { at: 25, dur: 5, label: 'OUTRO', text: 'title card + artist card, hold 2s' }
    ]
  },
  'ugc-ad-15s': {
    kind: 'storyboard', total: 15, blurb: 'TikTok/Reels UGC ad — problem/agitate/flip/proof/cta',
    beats: [
      { at: 0, dur: 2, label: 'HOOK', text: 'pattern-interrupt close-up, {brief}' },
      { at: 2, dur: 3, label: 'PROBLEM', text: 'the pain, shown not told' },
      { at: 5, dur: 3, label: 'AGITATE', text: 'make it 10% worse' },
      { at: 8, dur: 3, label: 'FLIP', text: 'product enters, world changes' },
      { at: 11, dur: 2, label: 'PROOF', text: 'receipt/result on screen' },
      { at: 13, dur: 2, label: 'CTA', text: 'one verb, one URL' }
    ]
  },
  'podcast-clip-60s': {
    kind: 'storyboard', total: 60, blurb: 'talking-head clip — cold open/quote/b-roll/return/tag',
    beats: [
      { at: 0, dur: 8, label: 'COLD-OPEN', text: 'the best sentence first, no intro' },
      { at: 8, dur: 20, label: 'QUOTE', text: 'two-shot → push-in on the punchline' },
      { at: 28, dur: 16, label: 'B-ROLL', text: 'coverage over the story beat' },
      { at: 44, dur: 10, label: 'RETURN', text: 'reaction shot, hold the laugh' },
      { at: 54, dur: 6, label: 'TAG', text: 'show card + follow CTA' }
    ]
  },
  'trailer-60s': {
    kind: 'storyboard', total: 60, blurb: 'film trailer — world/inciting/escalation/turn/climax/button',
    beats: [
      { at: 0, dur: 10, label: 'WORLD', text: 'establish tone + place, {brief}' },
      { at: 10, dur: 10, label: 'INCITING', text: 'the thing that breaks the world' },
      { at: 20, dur: 12, label: 'ESCALATION', text: 'three rising images, faster cuts' },
      { at: 32, dur: 10, label: 'TURN', text: 'silence beat — one image, no music' },
      { at: 42, dur: 12, label: 'CLIMAX', text: 'fastest montage, title stingers between' },
      { at: 54, dur: 6, label: 'BUTTON', text: 'title + date card' }
    ]
  }
};

export function listMarket(dir?: string): { name: string; installed: boolean; blurb: string }[] {
  const have = new Set(listTemplates(dir));
  return Object.entries(MARKET_TEMPLATES).map(([name, t]) => ({ name, installed: have.has(name), blurb: t.blurb }));
}

export function installMarketTemplate(name: string, dir?: string): string | null {
  const t = MARKET_TEMPLATES[name];
  if (!t) return null;
  const p = join(templatesDir(dir), `${name}.json`);
  mkdirSync(templatesDir(dir), { recursive: true });
  writeFileSync(p, JSON.stringify({ name, kind: t.kind, total: t.total, source: 'market', beats: t.beats }, null, 2), 'utf8');
  return p;
}

// The template library — six kinds, seeded once, agent-authorable forever.
// kinds: storyboard · callsheet · character · moodboard · branching · blocking
export function writeTemplateSeeds(dir?: string): string[] {
  mkdirSync(templatesDir(dir), { recursive: true });
  const seeds: Record<string, unknown> = {
    storyboard: defaultStoryboard(),
    character: {
      name: 'character', kind: 'character', total: 30, source: 'timmy-default',
      views: ['front', 'side', 'back', 'other_side', 'bottom'],
      variations: { wardrobe: 3, moods: 4, ages: 2, lightings: ['dawn', 'noon', 'dusk', 'night'], ref_cap: 50 },
      beats: [{ at: 0, dur: 30, label: 'TURNTABLE', text: '{brief} — full reference turntable + variations' }]
    },
    moodboard: {
      name: 'moodboard', kind: 'moodboard', total: 12, source: 'timmy-default',
      refs: [{ role: 'palette', weight: 1 }, { role: 'lighting', weight: 1 }, { role: 'lens', weight: 0.5 }],
      beats: [{ at: 0, dur: 12, label: 'MOOD', text: '{brief} — seedance 2.0 reference-to-video' }]
    },
    callsheet: {
      name: 'callsheet', kind: 'callsheet', total: 0, source: 'timmy-default',
      sheet: { day: 17, of: 32, sunrise: '5:51 AM', sunset: '8:26 PM', weather: '68F/54F partly cloudy', continuity: { flags: ['wardrobe', 'hair', 'props', 'weather', 'injury'], hours_rule: 'unshowered 24h · cut scabbed · non-lethal' }, coverage: { must_get: ['confrontation', 'phone insert', 'wide establishing'] } },
      beats: []
    },
    branching: {
      name: 'branching', kind: 'branching', total: 0, source: 'timmy-default',
      branches: [
        { id: 'b1', prompt: 'treat the cut with iodine', if_yes: 'clean heal by day 3', if_no: 'infection — pus by nightfall', consequence: 'changes C1 stamina + wardrobe stain' }
      ],
      beats: []
    },
    blocking: {
      name: 'blocking', kind: 'blocking', total: 12, source: 'timmy-default',
      beats: [{ at: 0, dur: 12, label: 'BLOCKING', text: '{brief} — GOD/POV diagrams, marks + facing + emotion' }]
    },
    iceberg: {
      name: 'iceberg', kind: 'iceberg', total: 24, source: 'timmy-default',
      beats: [
        { at: 0, dur: 8, label: 'INDEX', text: 'tiny index — always loaded, ≤2k tokens' },
        { at: 8, dur: 8, label: 'TOPICS', text: 'condensed mid-layer — descend only when relevant' },
        { at: 16, dur: 8, label: 'VAULT', text: 'massive raw below — logs, receipts, photos, history' }
      ]
    }
  };
  const written: string[] = [];
  for (const [name, body] of Object.entries(seeds)) {
    const p = join(templatesDir(dir), `${name}.json`);
    if (!existsSync(p)) {
      writeFileSync(p, JSON.stringify(body, null, 2), 'utf8');
      written.push(name);
    }
  }
  return written;
}

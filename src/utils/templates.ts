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

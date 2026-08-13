import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// TIMMY archive — one organized place for everything TIMMY produces.
// Configured once at onboarding (or via /export config later): where logs
// live, how session folders are named, one category per artifact kind.

export interface LogOrgConfig {
  baseDir: string; // cwd-relative, ~-relative, or absolute
  naming: 'date' | 'run';
}

const CONFIG_REL = join('.timmy', 'logorg.json');

export function loadOrgConfig(dir: string = process.cwd()): LogOrgConfig {
  try {
    const raw = JSON.parse(readFileSync(join(dir, CONFIG_REL), 'utf8'));
    return {
      baseDir: typeof raw.baseDir === 'string' ? raw.baseDir : join('.timmy', 'archive'),
      naming: raw.naming === 'run' ? 'run' : 'date'
    };
  } catch {
    return { baseDir: join('.timmy', 'archive'), naming: 'date' };
  }
}

export function saveOrgConfig(cfg: LogOrgConfig, dir: string = process.cwd()): void {
  mkdirSync(join(dir, '.timmy'), { recursive: true });
  writeFileSync(join(dir, CONFIG_REL), JSON.stringify(cfg, null, 2), 'utf8');
}

export function resolveBase(cfg: LogOrgConfig, dir: string = process.cwd()): string {
  if (cfg.baseDir.startsWith('~')) return join(homedir(), cfg.baseDir.slice(1));
  return cfg.baseDir.startsWith('/') ? cfg.baseDir : join(dir, cfg.baseDir);
}

// Category skeleton — one folder per kind of artifact, explained in a README.
export function ensureTree(base: string): void {
  for (const sub of ['sessions', 'generations', 'uploads', 'skills', 'context', 'exports']) {
    mkdirSync(join(base, sub), { recursive: true });
  }
  const readme = join(base, 'README.md');
  if (!existsSync(readme)) {
    writeFileSync(readme, [
      '# TIMMY archive',
      '',
      'sessions/     one folder per session — chat.md transcript, events.jsonl, receipts/, frames manifest',
      'generations/  prompt + result ledger exports, grouped by provider',
      'uploads/      references you attach (images, refs, briefs)',
      'skills/       agent-authored skills & Slate templates',
      'context/      harness entries, memory, research notes',
      'exports/      manual /export bundles',
      ''
    ].join('\n'), 'utf8');
  }
}

export interface ExportInput {
  sessionId: string;
  chat?: { role: string; content: string }[];
  eventsLines?: string[];
  receipts?: { id: string; json: string }[];
  framesDir?: string;
  generationsJson?: string;
}

export function exportSession(cfg: LogOrgConfig, input: ExportInput, dir: string = process.cwd()): string {
  const base = resolveBase(cfg, dir);
  ensureTree(base);
  const date = new Date().toISOString().slice(0, 10);
  const folder = cfg.naming === 'run'
    ? join(base, 'sessions', input.sessionId)
    : join(base, 'sessions', date, input.sessionId);
  mkdirSync(join(folder, 'receipts'), { recursive: true });

  if (input.chat && input.chat.length) {
    const md = input.chat.map(m => `## ${m.role}\n\n${m.content}\n`).join('\n');
    writeFileSync(join(folder, 'chat.md'), `# TIMMY session ${input.sessionId} — ${date}\n\n${md}`, 'utf8');
  }
  if (input.eventsLines && input.eventsLines.length) {
    writeFileSync(join(folder, 'events.jsonl'), input.eventsLines.join('\n') + '\n', 'utf8');
  }
  for (const r of input.receipts || []) {
    writeFileSync(join(folder, 'receipts', `${r.id}.json`), r.json, 'utf8');
  }
  if (input.framesDir && existsSync(input.framesDir)) {
    writeFileSync(
      join(folder, 'frames-manifest.json'),
      JSON.stringify({ source: input.framesDir, frames: readdirSync(input.framesDir).filter(f => f.endsWith('.png')) }, null, 2),
      'utf8'
    );
  }
  if (input.generationsJson) writeFileSync(join(folder, 'generations.json'), input.generationsJson, 'utf8');
  return folder;
}

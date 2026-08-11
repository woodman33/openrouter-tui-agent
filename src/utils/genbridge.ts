import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { spawn } from 'child_process';
import type { GenerationProvider } from './providers.js';

// TIMMY → generation-agent bridge. The user's openrouter-agent
// (~/Desktop/Ebay-Selling-Cards/tools/openrouter-agent) already owns the
// OpenRouter/Venice/WaveSpeed clients and their async job plumbing; TIMMY
// shells into its one-shot npm scripts detached and seals the run locally.

export function locateGenAgent(): string | null {
  const candidates = [
    process.env.TIMMY_GEN_AGENT_DIR,
    join(homedir(), 'Desktop', 'Ebay-Selling-Cards', 'tools', 'openrouter-agent')
  ].filter(Boolean) as string[];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'package.json'))) return dir;
  }
  return null;
}

export interface GenScript {
  script: string;
  // 'prompt-first': npm run <script> -- "<prompt>" "<alias/model>"
  // 'path-first':   npm run wavespeed -- "<model-path>" "<prompt>"
  order: 'prompt-first' | 'path-first';
  extra: string[];
}

export function genAgentScript(provider: GenerationProvider): GenScript | null {
  switch (provider.transport) {
    case 'openrouter':
      if (provider.kind === 'video') return { script: 'video', order: 'prompt-first', extra: [] };
      if (provider.kind === 'image') return { script: 'image', order: 'prompt-first', extra: [] };
      return null; // text/meta are not generative lanes
    case 'venice':
      if (provider.kind === 'video') return { script: 'venice-video', order: 'prompt-first', extra: ['5s', '720p', '16:9'] };
      return { script: 'venice-image', order: 'prompt-first', extra: [] };
    case 'wavespeed':
      return { script: 'wavespeed', order: 'path-first', extra: [] };
    default:
      return null; // local/cloud-api lanes have no runner in the gen agent yet
  }
}

export function buildGenAgentArgs(provider: GenerationProvider, prompt: string): string[] | null {
  const spec = genAgentScript(provider);
  if (!spec) return null;
  const alias = provider.aliases[0] || provider.id;
  const model = provider.modelId || alias;
  if (spec.order === 'path-first') return ['run', spec.script, '--', model, prompt];
  if (spec.script === 'venice-image') return ['run', spec.script, '--', prompt, provider.modelId || 'lustify-v8', ...spec.extra];
  if (spec.script === 'venice-video') return ['run', spec.script, '--', prompt, provider.modelId || 'wan-2-7-text-to-video', ...spec.extra];
  return ['run', spec.script, '--', prompt, alias, ...spec.extra];
}

// Detached, log-anchored launch: the wrapper appends EXIT=<code> so the
// ledger can derive status lazily without a watcher process.
export function launchDetached(genDir: string, args: string[], logPath: string): void {
  mkdirSync(dirname(logPath), { recursive: true });
  const q = (s: string) => JSON.stringify(s);
  const cmd = `cd ${q(genDir)} && npm ${args.map(q).join(' ')} > ${q(logPath)} 2>&1; echo "EXIT=$?" >> ${q(logPath)}`;
  const child = spawn('bash', ['-c', cmd], { detached: true, stdio: 'ignore' });
  child.unref();
}

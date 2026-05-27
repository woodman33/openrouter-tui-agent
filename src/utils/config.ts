import Conf from 'conf';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

export interface TuiConfig {
  apiKey: string;
  model: string;
  theme: 'light' | 'dark' | 'auto';
  graphics: 'auto' | 'kitty' | 'iterm2' | 'companion' | 'ansi';
  modes: string[];
  rive: {
    enabled: boolean;
    fps: number;
    width: number;
    height: number;
  };
  companion: {
    enabled: boolean;
    port: number;
    autoOpen: boolean;
  };
}

const DEFAULT_CONFIG: TuiConfig = {
  apiKey: process.env.OPENROUTER_API_KEY || '',
  model: 'anthropic/claude-opus-4.7',
  theme: 'dark',
  graphics: 'auto',
  modes: ['chat', 'code-review', 'dashboard', 'model-explorer'],
  rive: {
    enabled: true,
    fps: 20,
    width: 400,
    height: 300,
  },
  companion: {
    enabled: true,
    port: 3001,
    autoOpen: true,
  },
};

const store = new Conf<TuiConfig>({
  projectName: 'openrouter-tui',
  defaults: DEFAULT_CONFIG,
});

export function loadConfig(): TuiConfig {
  let config = store.store;

  const localPath = resolve(process.cwd(), 'openrouter-tui.config.json');
  if (existsSync(localPath)) {
    try {
      const localConfig = JSON.parse(readFileSync(localPath, 'utf-8'));
      config = { ...config, ...localConfig };
    } catch (e) {
      // ignore invalid local config
    }
  }

  if (process.env.OPENROUTER_API_KEY) {
    config.apiKey = process.env.OPENROUTER_API_KEY;
  }
  if (process.env.OPENROUTER_MODEL) {
    config.model = process.env.OPENROUTER_MODEL;
  }

  return config;
}

export function saveConfig(config: Partial<TuiConfig>): void {
  store.set(config);
}

export function getConfig(): Conf<TuiConfig> {
  return store;
}

import chalk from 'chalk';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

let currentLevel: LogLevel = 'info';
const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export function setLogLevel(level: LogLevel) {
  currentLevel = level;
}

function writeToLogFile(level: string, ...args: unknown[]) {
  try {
    if (!existsSync('logs')) {
      mkdirSync('logs');
    }
    const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${msg}\n`;
    appendFileSync(join('logs', 'companion.log'), line, 'utf-8');
  } catch {
    // ignore logging failures
  }
}

export const logger = {
  debug: (...args: unknown[]) => {
    writeToLogFile('debug', ...args);
    if (process.env.TIMMY_TUI_ACTIVE === 'true') return;
    if (levels[currentLevel] <= levels.debug) console.error(chalk.gray('[DEBUG]', ...args));
  },
  info: (...args: unknown[]) => {
    writeToLogFile('info', ...args);
    if (process.env.TIMMY_TUI_ACTIVE === 'true') return;
    if (levels[currentLevel] <= levels.info) console.error(chalk.blue('[INFO]', ...args));
  },
  warn: (...args: unknown[]) => {
    writeToLogFile('warn', ...args);
    if (process.env.TIMMY_TUI_ACTIVE === 'true') return;
    if (levels[currentLevel] <= levels.warn) console.error(chalk.yellow('[WARN]', ...args));
  },
  error: (...args: unknown[]) => {
    writeToLogFile('error', ...args);
    if (process.env.TIMMY_TUI_ACTIVE === 'true') return;
    if (levels[currentLevel] <= levels.error) console.error(chalk.red('[ERROR]', ...args));
  }
};

import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

let currentLevel: LogLevel = 'info';
const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export function setLogLevel(level: LogLevel) {
  currentLevel = level;
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (levels[currentLevel] <= levels.debug) console.error(chalk.gray('[DEBUG]', ...args));
  },
  info: (...args: unknown[]) => {
    if (levels[currentLevel] <= levels.info) console.error(chalk.blue('[INFO]', ...args));
  },
  warn: (...args: unknown[]) => {
    if (levels[currentLevel] <= levels.warn) console.error(chalk.yellow('[WARN]', ...args));
  },
  error: (...args: unknown[]) => {
    if (levels[currentLevel] <= levels.error) console.error(chalk.red('[ERROR]', ...args));
  }
};

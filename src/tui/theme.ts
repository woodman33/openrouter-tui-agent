import chalk from 'chalk';

export const theme = {
  surfaceBase: '#0d1117',
  surfaceRaised: '#161b22',
  surfaceOverlay: '#21262d',
  textPrimary: '#e6edf3',
  textSecondary: '#8b949e',
  textTertiary: '#6e7681',
  borderDefault: '#30363d',
  accent: '#5e6ad2',
  success: '#3fb950',
  warning: '#d29922',
  error: '#f85149',
  info: '#58a6ff',
  userColor: '#79c0ff',
  assistantColor: '#a5d6ff',
  toolColor: '#d2a8ff',
  reasoningColor: '#8b949e',
};

// Named color wrappers for quick use
export const colors = {
  primary: (t: string) => chalk.hex(theme.textPrimary)(t),
  secondary: (t: string) => chalk.hex(theme.textSecondary)(t),
  accent: (t: string) => chalk.hex(theme.accent)(t),
  success: (t: string) => chalk.hex(theme.success)(t),
  error: (t: string) => chalk.hex(theme.error)(t),
  warning: (t: string) => chalk.hex(theme.warning)(t),
  user: (t: string) => chalk.hex(theme.userColor)(t),
  assistant: (t: string) => chalk.hex(theme.assistantColor)(t),
  tool: (t: string) => chalk.hex(theme.toolColor)(t),
  reasoning: (t: string) => chalk.hex(theme.reasoningColor).italic(t),
  border: (t: string) => chalk.hex(theme.borderDefault)(t),
  bg: (t: string) => chalk.bgHex(theme.surfaceRaised)(t),
};

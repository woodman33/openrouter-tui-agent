import chalk from 'chalk';

// Deterministic masculine minimal: one dominant accent, one semantic color set,
// no purple/pink/violet tones. Amber = precision instrument, terminal-classic.
export const theme = {
  surfaceBase: '#0a0e12',       // near-black, slightly cool
  surfaceRaised: '#101418',     // 1 step up
  surfaceOverlay: '#161c22',    // 2 steps up
  textPrimary: '#e8ecf0',       // bright neutral
  textSecondary: '#8892a0',     // mid grey-blue
  textTertiary: '#5a6470',      // dim
  borderDefault: '#1c232c',     // hairline, barely-there
  accent: '#ffaa33',            // AMBER — the signal color (singular, dominant)
  accentDim: '#7a5a20',         // amber muted (inactive chrome)
  success: '#3ddc84',           // mint green — sharp, not yellow-green
  warning: '#e6b800',           // deep yellow (distinct from amber accent)
  error: '#ff4444',             // hard red, no pink
  info: '#4aa8ff',              // cool blue (info/links)
  userColor: '#ffc966',         // warm mid-amber for user text
  assistantColor: '#d0d6dd',    // neutral for assistant
  toolColor: '#8f9aa8',         // greyed tool output
  reasoningColor: '#5a6470',    // very dim mono
};

// Named color wrappers for quick use
export const colors = {
  primary: (t: string) => chalk.hex(theme.textPrimary)(t),
  secondary: (t: string) => chalk.hex(theme.textSecondary)(t),
  accent: (t: string) => chalk.hex(theme.accent)(t),
  accentDim: (t: string) => chalk.hex(theme.accentDim)(t),
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

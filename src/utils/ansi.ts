export const ESC = '\x1b';
export const CSI = `${ESC}[`;
export const OSC = `${ESC}]`;
export const APC = `${ESC}_G`;

// Colors (RGB)
export function rgb(r: number, g: number, b: number, text: string): string {
  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}

export function rgbBg(r: number, g: number, b: number, text: string): string {
  return `\x1b[48;2;${r};${g};${b}m${text}\x1b[0m`;
}

// Cursor movement
export const cursor = {
  hide: () => `${CSI}?25l`,
  show: () => `${CSI}?25h`,
  save: () => `${CSI}s`,
  restore: () => `${CSI}u`,
  position: (row: number, col: number) => `${CSI}${row};${col}H`,
};

// Screen control
export const screen = {
  clear: () => `${CSI}2J${CSI}H`,
  clearLine: () => `${CSI}2K`,
  clearToEnd: () => `${CSI}0J`,
  scrollUp: (n = 1) => `${CSI}${n}S`,
  scrollDown: (n = 1) => `${CSI}${n}T`,
};

// Text formatting
export const format = {
  bold: (t: string) => `\x1b[1m${t}\x1b[0m`,
  dim: (t: string) => `\x1b[2m${t}\x1b[0m`,
  italic: (t: string) => `\x1b[3m${t}\x1b[0m`,
  underline: (t: string) => `\x1b[4m${t}\x1b[0m`,
  strikethrough: (t: string) => `\x1b[9m${t}\x1b[0m`,
};

// Awwwards-inspired gradient text
export function gradientText(text: string, from: [number, number, number], to: [number, number, number]): string {
  const len = text.length;
  return text.split('').map((ch, i) => {
    const t = len > 1 ? i / (len - 1) : 0;
    const r = from[0] + (to[0] - from[0]) * t;
    const g = from[1] + (to[1] - from[1]) * t;
    const b = from[2] + (to[2] - from[2]) * t;
    return `\x1b[38;2;${Math.round(r)};${Math.round(g)};${Math.round(b)}m${ch}`;
  }).join('') + '\x1b[0m';
}

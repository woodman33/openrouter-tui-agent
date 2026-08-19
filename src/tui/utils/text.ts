import { theme } from '../theme.js';
const ANSI_PATTERN = /[\u001b\u009b][[\]()#;?]*(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;
const OSC_PATTERN = /\u001b\][^\u0007]*(?:\u0007|\u001b\\)/g;

export function stripTerminalCodes(value: string): string {
  return value.replace(OSC_PATTERN, '').replace(ANSI_PATTERN, '');
}

function isCombiningCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x0300 && codePoint <= 0x036f) ||
    (codePoint >= 0x1ab0 && codePoint <= 0x1aff) ||
    (codePoint >= 0x1dc0 && codePoint <= 0x1dff) ||
    (codePoint >= 0x20d0 && codePoint <= 0x20ff) ||
    (codePoint >= 0xfe20 && codePoint <= 0xfe2f)
  );
}

function charWidth(char: string): number {
  const codePoint = char.codePointAt(0) || 0;
  if (codePoint === 0 || codePoint < 32 || (codePoint >= 0x7f && codePoint < 0xa0)) return 0;
  if (isCombiningCodePoint(codePoint)) return 0;
  if (
    codePoint >= 0x1100 &&
    (codePoint <= 0x115f ||
      codePoint === 0x2329 ||
      codePoint === 0x232a ||
      (codePoint >= 0x2e80 && codePoint <= 0xa4cf) ||
      (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
      (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
      (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
      (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
      (codePoint >= 0xff00 && codePoint <= 0xff60) ||
      (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
      (codePoint >= 0x1f300 && codePoint <= 0x1faff))
  ) {
    return 2;
  }
  return 1;
}

export function visibleWidth(value: string): number {
  return Array.from(stripTerminalCodes(value)).reduce((width, char) => width + charWidth(char), 0);
}

// Terminal captures arrive with escape codes (real ESC sequences AND literal
// \033 text from uninterpreted printf). Strip both so panes read clean.
export function stripAnsi(value: string): string {
  return value
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\\033\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\\n/g, ' ')
    .replace(/\s+$/, '');
}

export function truncateVisible(value: string, maxWidth: number, suffix = '...'): string {
  const clean = stripTerminalCodes(value);
  if (maxWidth <= 0) return '';
  if (visibleWidth(clean) <= maxWidth) return clean;

  const suffixWidth = visibleWidth(suffix);
  if (maxWidth <= suffixWidth) return suffix.slice(0, maxWidth);

  let output = '';
  let width = 0;
  const targetWidth = maxWidth - suffixWidth;

  for (const char of Array.from(clean)) {
    const nextWidth = charWidth(char);
    if (width + nextWidth > targetWidth) break;
    output += char;
    width += nextWidth;
  }

  return output + suffix;
}

export function scrollVisibleLeft(value: string, maxWidth: number, prefix = '...'): string {
  const clean = stripTerminalCodes(value);
  if (maxWidth <= 0) return '';
  
  const totalWidth = visibleWidth(clean);
  if (totalWidth <= maxWidth) return clean;

  const prefixWidth = visibleWidth(prefix);
  if (maxWidth <= prefixWidth) {
    return prefix.slice(prefix.length - maxWidth);
  }

  const targetWidth = maxWidth - prefixWidth;
  let output = '';
  let width = 0;

  const chars = Array.from(clean);
  for (let i = chars.length - 1; i >= 0; i--) {
    const char = chars[i];
    const charW = charWidth(char);
    if (width + charW > targetWidth) {
      break;
    }
    output = char + output;
    width += charW;
  }

  return prefix + output;
}


function pushWrappedWord(lines: string[], word: string, width: number): void {
  let current = '';
  let currentWidth = 0;

  for (const char of Array.from(word)) {
    const nextWidth = charWidth(char);
    if (current && currentWidth + nextWidth > width) {
      lines.push(current);
      current = '';
      currentWidth = 0;
    }
    current += char;
    currentWidth += nextWidth;
  }

  if (current) lines.push(current);
}

export function wrapVisible(value: string, width: number): string[] {
  const clean = stripTerminalCodes(value);
  if (width <= 0) return [''];
  if (visibleWidth(clean) <= width) return [clean];

  const lines: string[] = [];
  const words = clean.split(/(\s+)/);
  let current = '';
  let currentWidth = 0;

  for (const token of words) {
    if (!token) continue;
    const tokenWidth = visibleWidth(token);

    if (/^\s+$/.test(token)) {
      if (current && currentWidth < width) {
        current += ' ';
        currentWidth += 1;
      }
      continue;
    }

    if (tokenWidth > width) {
      if (current.trimEnd()) lines.push(current.trimEnd());
      pushWrappedWord(lines, token, width);
      current = '';
      currentWidth = 0;
      continue;
    }

    if (!current) {
      current = token;
      currentWidth = tokenWidth;
    } else if (currentWidth + tokenWidth <= width) {
      current += token;
      currentWidth += tokenWidth;
    } else {
      lines.push(current.trimEnd());
      current = token;
      currentWidth = tokenWidth;
    }
  }

  if (current.trimEnd()) lines.push(current.trimEnd());
  return lines.length > 0 ? lines : [''];
}

/**
 * Truncates model name prioritizing the actual model name suffix if it contains a slash,
 * or truncates from the end for normal text like descriptions.
 */
export function truncateMiddleOrEnd(value: string, max: number, isDescription = false): string {
  const clean = stripTerminalCodes(value);
  if (clean.length <= max) return clean;
  if (max <= 3) return '...'.slice(0, max);

  if (isDescription) {
    return clean.slice(0, max - 3) + '...';
  }

  // If it's a model ID (contains slash, like provider/model)
  if (clean.includes('/')) {
    const parts = clean.split('/');
    const provider = parts[0];
    const model = parts.slice(1).join('/');

    // If model name itself is short enough, we can show "prov.../model"
    const remainingForProvider = max - model.length - 4; // for ".../"
    if (remainingForProvider >= 1) {
      return provider.slice(0, remainingForProvider) + '.../' + model;
    }
    
    // Otherwise, if the model itself is too long, we can truncate the model portion or provider portion
    const prefix = provider + '/';
    const prefixLen = prefix.length;
    if (max > prefixLen + 6) {
      const remainingModelLen = max - prefixLen - 3;
      const keepStart = Math.ceil(remainingModelLen / 2);
      const keepEnd = Math.floor(remainingModelLen / 2);
      return prefix + model.slice(0, keepStart) + '...' + model.slice(model.length - keepEnd);
    }
  }

  // Default end truncation
  return clean.slice(0, max - 3) + '...';
}

/**
 * Splits model name from any description marketing blurbs
 */
export function splitModelNameAndBlurb(name: string, fallbackDesc?: string): { cleanName: string; cleanDesc: string } {
  const splitters = [' is ', ' - ', ' : ', ' — '];
  for (const splitter of splitters) {
    const index = name.indexOf(splitter);
    if (index !== -1) {
      const cleanName = name.slice(0, index).trim();
      const cleanDesc = name.slice(index + splitter.length).trim();
      return { cleanName, cleanDesc };
    }
  }
  return { cleanName: name, cleanDesc: fallbackDesc || '' };
}

/**
 * Maps model state to high-contrast colors
 */
export function getModelColors(isSelected: boolean, isActive: boolean, isUnavailable = false): { nameColor: string; descColor: string } {
  if (isUnavailable) {
    return { nameColor: theme.textTertiary, descColor: theme.textTertiary };
  }
  if (isSelected) {
    return { nameColor: theme.warning, descColor: theme.textPrimary }; // Bright yellow / light gray
  }
  if (isActive) {
    return { nameColor: theme.focus, descColor: theme.textSecondary }; // Bright cyan / dim gray
  }
  return { nameColor: theme.textPrimary, descColor: theme.textSecondary }; // Bright white / dim gray
}



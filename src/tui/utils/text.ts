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

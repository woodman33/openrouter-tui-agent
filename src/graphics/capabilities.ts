import type { GraphicsCapabilities } from '../types/index.js';

export async function detectCapabilities(): Promise<GraphicsCapabilities> {
  const program = process.env.TERM_PROGRAM || 'unknown';
  const term = process.env.TERM || '';
  const colorterm = process.env.COLORTERM || '';

  // Known terminals with specific features
  const caps: GraphicsCapabilities = {
    kittyGraphics: false,
    iterm2Images: false,
    sixel: false,
    trueColor: colorterm === 'truecolor' || colorterm === '24bit',
    mouseEvents: false,
    cellSize: { width: 8, height: 16 }, // default
    program,
  };

  const programLower = program.toLowerCase();

  if (programLower.includes('kitty') || programLower.includes('ghostty')) {
    caps.kittyGraphics = true;
    caps.trueColor = true;
  }
  if (programLower.includes('iterm') || programLower.includes('iterm2') || programLower === 'wezterm' || programLower === 'hyper') {
    caps.iterm2Images = true;
    caps.trueColor = true;
  }
  if (programLower.includes('wezterm')) {
    caps.iterm2Images = true;
    caps.sixel = true;
    caps.trueColor = true;
  }
  if (programLower.includes('warp')) {
    caps.kittyGraphics = true;
    caps.iterm2Images = true;
    caps.trueColor = true;
  }
  if (term === 'xterm-kitty') {
    caps.kittyGraphics = true;
    caps.trueColor = true;
  }
  if (term === 'xterm-256color' && process.env.SIXEL_SUPPORT) {
    caps.sixel = true;
  }

  // Try detecting cell size via OSC 1337 (iTerm2)
  try {
    const cellSize = await probeCellSize();
    if (cellSize) caps.cellSize = cellSize;
  } catch {
    // ignore
  }

  return caps;
}

async function probeCellSize(): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      process.stdin.removeListener('data', onData);
      resolve(null);
    }, 200);

    let buffer = '';
    const onData = (data: Buffer) => {
      buffer += data.toString();
      // Match OSC 1337 response: \x1b]1337;ReportCellSize=width;height;
      const m = buffer.match(/\x1b\]1337;ReportCellSize=(\d+);(\d+)/);
      if (m) {
        clearTimeout(timeout);
        process.stdin.removeListener('data', onData);
        resolve({ width: parseInt(m[1], 10), height: parseInt(m[2], 10) });
      }
    };

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.on('data', onData);
      process.stdout.write('\x1b]1337;ReportCellSize\x07');
    } else {
      clearTimeout(timeout);
      resolve(null);
    }
  });
}

export function selectPipeline(caps: GraphicsCapabilities): string {
  if (caps.kittyGraphics) return 'kitty';
  if (caps.iterm2Images) return 'iterm2';
  if (caps.sixel) return 'sixel';
  return 'companion';
}

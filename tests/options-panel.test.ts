import { describe, it, expect } from 'vitest';

/**
 * Options panel rendering regression tests.
 * Validates that the deterministic column layout never produces
 * undefined values, overflow, or mismatched toggle states.
 */

// ── Replicate the local helpers from OptionsPanel.tsx ──────────────────────
function ellipsize(text: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';
  if (!text) return '';
  if (text.length <= maxWidth) return text;
  if (maxWidth <= 3) return text.slice(0, maxWidth);
  return text.slice(0, maxWidth - 2) + '..';
}

function padRight(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  return text + ' '.repeat(width - text.length);
}

interface MockOption {
  key: string;
  label: string;
  choices: string[];
  current: string;
  desc: string;
}

function formatValue(opt: MockOption): string {
  const raw = opt.current;
  if (raw == null || raw === '' || raw === 'undefined') return '[NOT SET]';
  if (opt.key === 'cmuxPath' || opt.key === 'tmuxPath') {
    const upper = raw.toUpperCase();
    if (upper === 'DETECTED') return '[DETECTED]';
    if (upper === 'MISSING') return '[MISSING]';
    return `[${upper}]`;
  }
  if (opt.choices.length === 2 && opt.choices.includes('ON') && opt.choices.includes('OFF')) {
    return raw === 'ON' ? '[ON]' : '[OFF]';
  }
  return `[${raw}]`;
}

// ── Test data matching the real options ─────────────────────────────────────
const TEST_OPTIONS: MockOption[] = [
  { key: 'animations', label: 'Animations', choices: ['ON', 'OFF'], current: 'ON', desc: 'Visual motion indicators' },
  { key: 'devmode', label: 'Developer Mode', choices: ['ON', 'OFF'], current: 'OFF', desc: 'Show developer utilities' },
  { key: 'autohide', label: 'Sidebar Auto-hide', choices: ['ON', 'OFF'], current: 'OFF', desc: 'Auto hide left nav column' },
  { key: 'autoopen', label: 'Browser Auto-open', choices: ['ON', 'OFF'], current: 'ON', desc: 'Open browser companion' },
  { key: 'theme', label: 'Theme', choices: ['Timmy Amber', 'Timmy Blue', 'Timmy Green'], current: 'Timmy Amber', desc: 'Color palette and accents' },
  { key: 'model', label: 'OpenRouter Model', choices: ['openai/gpt-4o'], current: 'openai/gpt-4o', desc: 'Active model for workflows' },
  { key: 'cmuxPath', label: 'cmux Path', choices: ['DETECTED'], current: 'DETECTED', desc: 'Native cmux companion' },
  { key: 'tmuxPath', label: 'tmux Path', choices: ['MISSING'], current: 'MISSING', desc: 'Local tmux binary' },
  { key: 'logs', label: 'Logs', choices: ['ON', 'OFF'], current: 'ON', desc: 'Write bounded local logs' },
];

describe('Options Panel Rendering', () => {
  it('no option value renders as [undefined]', () => {
    for (const opt of TEST_OPTIONS) {
      const val = formatValue(opt);
      expect(val).not.toBe('[undefined]');
      expect(val).not.toContain('undefined');
    }
  });

  it('formatValue returns [NOT SET] for empty/undefined values', () => {
    const emptyOpt: MockOption = { key: 'test', label: 'Test', choices: ['ON', 'OFF'], current: '', desc: 'test' };
    expect(formatValue(emptyOpt)).toBe('[NOT SET]');

    const undefinedOpt: MockOption = { key: 'test', label: 'Test', choices: ['ON', 'OFF'], current: 'undefined', desc: 'test' };
    expect(formatValue(undefinedOpt)).toBe('[NOT SET]');
  });

  it('binary options render only [ON] or [OFF]', () => {
    const binaryOpts = TEST_OPTIONS.filter(
      (o) => o.choices.length === 2 && o.choices.includes('ON') && o.choices.includes('OFF')
    );
    expect(binaryOpts.length).toBeGreaterThan(0);

    for (const opt of binaryOpts) {
      const val = formatValue(opt);
      expect(['[ON]', '[OFF]']).toContain(val);
    }
  });

  it('path detection options render [DETECTED] or [MISSING]', () => {
    const pathOpts = TEST_OPTIONS.filter((o) => o.key === 'cmuxPath' || o.key === 'tmuxPath');
    expect(pathOpts.length).toBe(2);

    for (const opt of pathOpts) {
      const val = formatValue(opt);
      expect(['[DETECTED]', '[MISSING]']).toContain(val);
    }
  });

  it('no rendered row exceeds available width at various terminal sizes', () => {
    const terminalWidths = [80, 92, 100, 120, 140, 180];

    for (const tw of terminalWidths) {
      const rowWidth = Math.max(30, tw - 8);
      const SELECTOR_W = 2;
      const VALUE_W = Math.min(16, Math.max(8, Math.floor(rowWidth * 0.2)));
      const remainAfterValue = rowWidth - SELECTOR_W - VALUE_W - 2;
      const showDesc = remainAfterValue > 28;
      const LABEL_W = showDesc ? Math.min(20, Math.floor(remainAfterValue * 0.45)) : remainAfterValue;
      const DESC_W = showDesc ? remainAfterValue - LABEL_W : 0;

      for (const opt of TEST_OPTIONS) {
        const selector = '▶ '; // 2 chars
        const label = padRight(ellipsize(opt.label, LABEL_W), LABEL_W);
        const desc = showDesc ? padRight(ellipsize(opt.desc, DESC_W), DESC_W) : '';
        const val = ellipsize(formatValue(opt), VALUE_W);

        // Total row width = selector + label + gap + desc + gap + value
        const totalChars = selector.length + label.length + 1 + desc.length + 1 + val.length;
        expect(totalChars).toBeLessThanOrEqual(rowWidth + 2); // +2 tolerance for gap chars
      }
    }
  });

  it('toggling a binary option flips from ON to OFF and vice versa', () => {
    const opt: MockOption = { key: 'devmode', label: 'Developer Mode', choices: ['ON', 'OFF'], current: 'OFF', desc: 'test' };
    const currentIdx = opt.choices.indexOf(opt.current);
    const nextIdx = (currentIdx + 1) % opt.choices.length;
    const toggled = { ...opt, current: opt.choices[nextIdx] };

    expect(formatValue(opt)).toBe('[OFF]');
    expect(formatValue(toggled)).toBe('[ON]');
  });

  it('ellipsize never exceeds maxWidth', () => {
    const longText = 'This is a very long label that should get truncated';
    for (const maxW of [5, 10, 15, 20, 30]) {
      const result = ellipsize(longText, maxW);
      expect(result.length).toBeLessThanOrEqual(maxW);
    }
  });

  it('ellipsize handles empty and short strings', () => {
    expect(ellipsize('', 10)).toBe('');
    expect(ellipsize('Hi', 10)).toBe('Hi');
    expect(ellipsize('Hello', 5)).toBe('Hello');
    expect(ellipsize('Hello World', 5)).toBe('Hel..');
  });
});

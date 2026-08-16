import { describe, expect, it } from 'vitest';
import { detectOpenHands, hasRunStart, parseRunEnd, RUN_START } from '../src/utils/openhands.js';

describe('openhands adapter', () => {
  it('parses run-end markers with exit codes', () => {
    expect(parseRunEnd(['noise', 'TIMMY_RUN_END:0'])).toEqual({ code: 0 });
    expect(parseRunEnd(['TIMMY_RUN_END:3', 'prompt>'])).toEqual({ code: 3 });
    expect(parseRunEnd(['no markers here'])).toBeNull();
  });

  it('detects start markers', () => {
    expect(hasRunStart([RUN_START, 'openhands thinking…'])).toBe(true);
    expect(hasRunStart(['openhands thinking…'])).toBe(false);
  });

  it('reports install guidance honestly either way', () => {
    const st = detectOpenHands();
    if (!st.installed) expect(st.install).toContain('uv tool install openhands');
    else expect(st.path).toBeTruthy();
  }, 10000);
});

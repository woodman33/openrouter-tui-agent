import { describe, it, expect } from 'vitest';
import {
  layoutBudget, footerKeysLine, footerHintLine, tickerLine, chromeFor, VIEWS, VIEW_PANES,
  HEADER_ROWS, FOOTER_ROWS
} from '../src/tui/utils/ergonomics.js';
import { theme } from '../src/tui/theme.js';

describe('v1.0.1 ergonomic shell', () => {
  it('hard budget: header 2 + footer 2, main = rows − 4 at 80×24 / 120×40 / 200×50', () => {
    for (const rows of [24, 40, 50]) {
      const b = layoutBudget(rows);
      expect(b.header).toBe(HEADER_ROWS);
      expect(b.footer).toBe(FOOTER_ROWS);
      expect(b.main).toBe(rows - 4);
    }
    expect(layoutBudget(24).main).toBe(20);
    expect(layoutBudget(40).main).toBe(36);
    expect(layoutBudget(50).main).toBe(46);
    // tiny terminals never collapse main below 3 rows
    expect(layoutBudget(6).main).toBeGreaterThanOrEqual(3);
  });

  it('footer + ticker lines clamp to the viewport (no wrap artifacts)', () => {
    for (const w of [80, 120, 200]) {
      expect(footerKeysLine(w).length).toBeLessThanOrEqual(w);
      expect(footerHintLine(0, 0, 1, true, w).length).toBeLessThanOrEqual(w);
      expect(tickerLine({ kind: 'receipt.sealed', snippet: 'x'.repeat(200) }, w).length).toBeLessThanOrEqual(w);
    }
    expect(tickerLine(null, 80)).toContain('[● LIVE]');
    expect(tickerLine(null, 80)).toContain('[L] telemetry');
  });

  it('Active Pane Invariant: bright #7dcfff + ◆ when active, muted #292e42 + ◇ when not', () => {
    const on = chromeFor(true);
    const off = chromeFor(false);
    expect(on.border).toBe(theme.focus);
    expect(on.border).toBe('#7dcfff');
    expect(on.glyph).toBe('◆');
    expect(on.bold).toBe(true);
    expect(off.border).toBe(theme.borderMuted);
    expect(off.border).toBe('#292e42');
    expect(off.glyph).toBe('◇');
    expect(off.bold).toBe(false);
  });

  it('four views, [1-4] keys, pane budgets for Tab focus', () => {
    expect(VIEWS.map(v => v.key)).toEqual(['1', '2', '3', '4']);
    expect(VIEWS.map(v => v.label)).toEqual(['COMMAND', 'MISSION', 'TELEMETRY', 'ESCROW']);
    expect(VIEW_PANES).toHaveLength(4);
    expect(VIEW_PANES[0]).toBe(1);
  });
});

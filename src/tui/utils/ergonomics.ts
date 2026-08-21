// v1.0.1 ergonomic overhaul — pure viewport arithmetic + chrome decisions.
// Everything the shell renders derives from these, so the budget caps are
// testable without a terminal attached.
import { theme } from '../theme.js';
import { truncateVisible } from './text.js';

export const HEADER_ROWS = 2; // status bar + live ticker
export const FOOTER_ROWS = 2; // keymap + view/pane hints

/** Hard layout budget: header 2, footer 2, main gets the rest. */
export function layoutBudget(rows: number): { header: number; footer: number; main: number } {
  const main = Math.max(3, rows - HEADER_ROWS - FOOTER_ROWS);
  return { header: HEADER_ROWS, footer: FOOTER_ROWS, main };
}

export const VIEWS = [
  { key: '1', label: 'COMMAND', sub: 'chat + J-BANG cards' },
  { key: '2', label: 'MISSION', sub: 'DAG + capsules' },
  { key: '3', label: 'TELEMETRY', sub: 'logs + rain' },
  { key: '4', label: 'ESCROW', sub: 'ledger + receipts' }
] as const;

export const FOOTER_KEYS = '[Tab] Focus  [1-4] Views  [J-BANG] Launch  [?] Help  [q] Quit';

export const footerKeysLine = (width: number): string => truncateVisible(FOOTER_KEYS, width);

export const footerHintLine = (view: number, paneFocus: number, panes: number, busy: boolean, width: number): string =>
  truncateVisible(`${VIEWS[view]?.label ?? '?'} · ${VIEWS[view]?.sub ?? ''} · pane ${paneFocus + 1}/${panes} · ${busy ? 'BUSY' : 'IDLE'} · ^K palette`, width);

export const tickerLine = (last: { kind: string; snippet: string } | null, width: number): string =>
  truncateVisible(`[● LIVE] Last event: ${last ? last.kind + (last.snippet ? ' · ' + last.snippet : '') : 'quiet bus'}  ·  [L] telemetry`, width);

/** Active Pane Invariant: focused pane bright #7dcfff + glyph; others muted. */
export function chromeFor(active: boolean): { border: string; title: string; glyph: string; bold: boolean } {
  return active
    ? { border: theme.focus, title: theme.focus, glyph: '◆', bold: true }
    : { border: theme.borderMuted, title: theme.brandDim, glyph: '◇', bold: false };
}

/** pane counts per view — Tab cycles focus within these bounds */
export const VIEW_PANES = [1, 2, 2, 2];

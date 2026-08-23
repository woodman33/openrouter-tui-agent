// Single source of truth for status → (glyph, color, label). Every panel and
// the rain use this map so "running" looks identical everywhere in TIMMY.
// Colors come from the Tokyo Night token set (src/tui/theme.ts) — no hex here.
import { theme } from '../theme.js';

export type TimmyStatus =
  | 'running'
  | 'waiting'
  | 'created'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'sealed'
  | 'ready'
  | 'missing'
  | 'idle'
  | 'warn'
  | 'queued';

export const STATUS_GLYPH: Record<TimmyStatus, { glyph: string; color: string; label: string }> = {
  running:   { glyph: '●', color: theme.warn, label: 'running' },
  waiting:   { glyph: '⚠', color: theme.warn, label: 'waiting on you' },
  created:   { glyph: '◇', color: theme.textMuted, label: 'created' },
  completed: { glyph: '✓', color: theme.seal, label: 'completed' },
  failed:    { glyph: '×', color: theme.danger, label: 'failed' },
  cancelled: { glyph: '', color: theme.textMuted, label: 'cancelled' },
  sealed:    { glyph: '●', color: theme.seal, label: 'sealed' },
  ready:     { glyph: '●', color: theme.accent, label: 'ready · installed' },
  missing:   { glyph: '◇', color: theme.textMuted, label: 'not installed' },
  idle:      { glyph: '◇', color: theme.textMuted, label: 'idle' },
  warn:      { glyph: '⚠', color: theme.warn, label: 'warning' },
  queued:    { glyph: '●', color: theme.warn, label: 'queued' }
};

export function statusGlyph(status: TimmyStatus): { glyph: string; color: string; label: string } {
  return STATUS_GLYPH[status];
}

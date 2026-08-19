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
  running:   { glyph: '●', color: theme.success, label: 'running' },
  waiting:   { glyph: '⚠', color: theme.warning, label: 'waiting on you' },
  created:   { glyph: '○', color: theme.textTertiary, label: 'created' },
  completed: { glyph: '✓', color: theme.success, label: 'completed' },
  failed:    { glyph: '✕', color: theme.error, label: 'failed' },
  cancelled: { glyph: '', color: theme.textTertiary, label: 'cancelled' },
  sealed:    { glyph: '⛁', color: theme.success, label: 'sealed' },
  ready:     { glyph: '●', color: theme.success, label: 'ready · installed' },
  missing:   { glyph: '○', color: theme.textTertiary, label: 'not installed' },
  idle:      { glyph: '○', color: theme.textTertiary, label: 'idle' },
  warn:      { glyph: '⚠', color: theme.warning, label: 'warning' },
  queued:    { glyph: '◌', color: theme.warning, label: 'queued' }
};

export function statusGlyph(status: TimmyStatus): { glyph: string; color: string; label: string } {
  return STATUS_GLYPH[status];
}

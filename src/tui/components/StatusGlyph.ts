// Single source of truth for status → (glyph, color, label). Every panel and
// the rain use this map so "running" looks identical everywhere in TIMMY.

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
  running:   { glyph: '●', color: '#3fb950', label: 'running' },
  waiting:   { glyph: '⚠', color: '#f5b545', label: 'waiting on you' },
  created:   { glyph: '○', color: '#8a8a94', label: 'created' },
  completed: { glyph: '✓', color: '#3fb950', label: 'completed' },
  failed:    { glyph: '✕', color: '#ff6b6b', label: 'failed' },
  cancelled: { glyph: '⊘', color: '#8a8a94', label: 'cancelled' },
  sealed:    { glyph: '⛁', color: '#3fb950', label: 'sealed' },
  ready:     { glyph: '●', color: '#3fb950', label: 'ready · installed' },
  missing:   { glyph: '○', color: '#6e7681', label: 'not installed' },
  idle:      { glyph: '○', color: '#8a8a94', label: 'idle' },
  warn:      { glyph: '⚠', color: '#f5b545', label: 'warning' },
  queued:    { glyph: '◌', color: '#d29922', label: 'queued' }
};

export function statusGlyph(status: TimmyStatus): { glyph: string; color: string; label: string } {
  return STATUS_GLYPH[status];
}

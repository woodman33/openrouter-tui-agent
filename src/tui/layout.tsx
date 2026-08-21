// v1.0.1 ergonomic overhaul — the shell. Hard budget: header 2 rows
// (status bar + live ticker), footer 2 rows (keymap + view/pane hints),
// main content gets rows − 4. No left nav; views switch by [1-4], focus
// walks by Tab. All text clamps — nothing wraps box-drawing chrome.
import React, { useEffect, useState } from 'react';
import { Box, Text, useWindowSize } from 'ink';
import { theme } from './theme.js';
import { VERSION } from '../version.js';
import { checkDocker, checkComfyCli } from '../utils/doctor.js';
import { StatusTicker } from './components/StatusTicker.js';
import { layoutBudget, footerKeysLine, footerHintLine, VIEWS, VIEW_PANES } from './utils/ergonomics.js';

// children read the debounced viewport through this — one source of truth
// for column/row math below the shell.
export const ViewportContext = React.createContext<{ w: number; h: number }>({ w: 80, h: 20 });

export interface LayoutProps {
  view: number;
  paneFocus: number;
  model: string;
  totalCost: number;
  animState: 'idle' | 'thinking' | 'streaming' | 'tool_call' | 'error' | 'success';
  telemetryStatus?: string;
  queuedTelemetryCount?: number;
  activeRunId?: string;
  children: React.ReactNode;
}

function telemetryGlyph(status: string, queued: number): { glyph: string; color: string } {
  if (status === 'online') return queued > 0 ? { glyph: '▲', color: theme.warning } : { glyph: '●', color: theme.success };
  if (status === 'syncing') return { glyph: '◆', color: theme.warning };
  return { glyph: '○', color: theme.error };
}

function animGlyph(state: LayoutProps['animState']): { glyph: string; color: string } {
  switch (state) {
    case 'thinking': return { glyph: '◐', color: theme.accent };
    case 'streaming': return { glyph: '◑', color: theme.accent };
    case 'tool_call': return { glyph: '◒', color: theme.accent };
    case 'error': return { glyph: '✕', color: theme.error };
    case 'success': return { glyph: '✓', color: theme.success };
    default: return { glyph: '·', color: theme.textTertiary };
  }
}

export function Layout({
  view,
  paneFocus,
  model,
  totalCost,
  animState,
  telemetryStatus = 'online',
  queuedTelemetryCount = 0,
  activeRunId,
  children
}: LayoutProps) {
  const raw = useWindowSize();
  // debounced dimensions: rapid resizes don't thrash panel re-layout
  const [dims, setDims] = useState({ w: raw.columns || 80, h: raw.rows || 24 });
  useEffect(() => {
    const t = setTimeout(() => setDims({ w: raw.columns || 80, h: raw.rows || 24 }), 120);
    return () => clearTimeout(t);
  }, [raw.columns, raw.rows]);
  const W = dims.w;
  const H = dims.h;
  const budget = layoutBudget(H);

  // environment badges — cached, never per-render spawns
  const [env, setEnv] = useState({ docker: false, comfy: false });
  useEffect(() => {
    const load = () => {
      try { setEnv({ docker: checkDocker().state === 'ok', comfy: checkComfyCli().state === 'ok' }); }
      catch { /* doctor unavailable */ }
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const tel = telemetryGlyph(telemetryStatus, queuedTelemetryCount);
  const anim = animGlyph(animState);
  const busy = animState === 'thinking' || animState === 'streaming' || animState === 'tool_call';
  const runDisplay = activeRunId ? activeRunId.slice(0, 12) : '—';
  const modelDisplay = model.split('/').pop() || model;
  const viewDef = VIEWS[view] ?? VIEWS[0];

  return (
    <Box flexDirection="column" width={W} height={H}>
      {/* ══ HEADER ROW 1 — status bar ══ */}
      <Box justifyContent="space-between" paddingX={1} flexShrink={0}>
        <Box>
          <Text bold color={theme.brand}>TIMMY</Text>
          <Text color={theme.textTertiary}> v{VERSION} · </Text>
          <Text bold color={theme.focus}>{viewDef.label}</Text>
          {W >= 72 && (
            <>
              <Text color={theme.textTertiary}> · </Text>
              <Text color={theme.textSecondary}>{modelDisplay}</Text>
            </>
          )}
        </Box>
        <Box>
          <Text color={busy ? anim.color : theme.textTertiary}>{anim.glyph}</Text>
          <Text color={tel.color}> {tel.glyph}</Text>
          {queuedTelemetryCount > 0 && <Text color={theme.textTertiary}>+{queuedTelemetryCount}</Text>}
          <Text color={theme.textTertiary}> · RUN·</Text>
          <Text color={theme.textPrimary}>{runDisplay}</Text>
          <Text color={theme.textTertiary}> · COST·</Text>
          <Text color={theme.accent}>${totalCost.toFixed(4)}</Text>
          {W >= 90 && (
            <>
              <Text color={theme.textTertiary}> · </Text>
              <Text color={env.docker ? theme.success : theme.error}>docker{env.docker ? '✓' : '✗'}</Text>
              <Text color={theme.textTertiary}> </Text>
              <Text color={env.comfy ? theme.success : theme.error}>comfy{env.comfy ? '✓' : '✗'}</Text>
            </>
          )}
        </Box>
      </Box>

      {/* ══ HEADER ROW 2 — live ticker (the rain's only ambient surface) ══ */}
      <Box paddingX={1} flexShrink={0}>
        <StatusTicker width={W - 2} />
      </Box>

      {/* ══ MAIN — rows − 4, hard budget ══ */}
      <Box height={budget.main} flexDirection="row" paddingX={1} flexShrink={0}>
        <ViewportContext.Provider value={{ w: Math.max(40, W - 2), h: budget.main }}>
          {children}
        </ViewportContext.Provider>
      </Box>

      {/* ══ FOOTER ROW 1 — keymap ══ */}
      <Box paddingX={1} flexShrink={0}>
        <Text color={theme.textTertiary} wrap="truncate">{footerKeysLine(W - 2)}</Text>
      </Box>

      {/* ══ FOOTER ROW 2 — view/pane hints ══ */}
      <Box paddingX={1} flexShrink={0}>
        <Text color={theme.textTertiary} wrap="truncate">
          {footerHintLine(view, paneFocus, VIEW_PANES[view] ?? 1, busy, W - 2)}
        </Text>
      </Box>
    </Box>
  );
}

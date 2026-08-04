import React from 'react';
import { Box, Text, useWindowSize } from 'ink';
import { theme } from './theme.js';
import type { Agent } from '../agent/core.js';
import type { Mode } from './router.js';
import { truncateVisible } from './utils/text.js';
import { usePulse } from './hooks/usePulse.js';


export interface LayoutProps {
  agent: Agent;
  mode: Mode;
  focusedMode: Mode;
  model: string;
  pipelineType: string;
  totalCost: number;
  animState: 'idle' | 'thinking' | 'streaming' | 'tool_call' | 'error' | 'success';
  children: React.ReactNode;
  activeRunId?: string;
  activeReceiptUrl?: string;
  telemetryStatus?: string;
  queuedTelemetryCount?: number;
  snapshotStatus?: string;
  inspectorData?: any;
  focusArea: 'nav' | 'stage';
}

type ModeDef = { mode: Mode; key: string; label: string };

const MODES: ModeDef[] = [
  { mode: 'brief',    key: '1', label: 'CHAT' },
  { mode: 'hermes',   key: '2', label: 'RUNS' },
  { mode: 'workspace',key: '3', label: 'WORK' },
  { mode: 'logs',     key: '4', label: 'LOGS' },
];

function telemetryGlyph(status: string, queued: number): { glyph: string; color: string } {
  if (status === 'online')  return queued > 0 ? { glyph: '▲', color: theme.warning } : { glyph: '●', color: theme.success };
  if (status === 'syncing') return { glyph: '◆', color: theme.warning };
  return { glyph: '○', color: theme.error };
}

function animGlyph(state: LayoutProps['animState']): { glyph: string; color: string } {
  switch (state) {
    case 'thinking':  return { glyph: '◐', color: theme.accent };
    case 'streaming': return { glyph: '◑', color: theme.accent };
    case 'tool_call': return { glyph: '◒', color: theme.accent };
    case 'error':     return { glyph: '✕', color: theme.error };
    case 'success':   return { glyph: '✓', color: theme.success };
    default:          return { glyph: '·', color: theme.textTertiary };
  }
}

export function Layout({
  mode,
  focusedMode,
  model,
  totalCost,
  animState,
  children,
  activeRunId,
  telemetryStatus = 'online',
  queuedTelemetryCount = 0,
  focusArea
}: LayoutProps) {
  const { columns: width, rows: height } = useWindowSize();
  const W = width || process.stdout.columns || 80;
  const H = height || process.stdout.rows || 24;
  const pulseFrame = usePulse(500);

  const tel = telemetryGlyph(telemetryStatus, queuedTelemetryCount);
  const anim = animGlyph(animState);
  const isActive = animState === 'thinking' || animState === 'streaming' || animState === 'tool_call';

  const runDisplay = activeRunId ? activeRunId.slice(0, 14) : '—';
  const costDisplay = `$${totalCost.toFixed(4)}`;
  const modelDisplay = model.split('/').pop() || model;

  const isFocused = (m: Mode) => focusArea === 'nav' && focusedMode === m;
  const isActiveMode = (m: Mode) => mode === m;

  return (
    <Box flexDirection="column" width={W} height={H}>
      {/* ══ TOP BAR ══ */}
      <Box
        justifyContent="space-between"
        paddingX={1}
        borderStyle="single"
        borderColor={theme.borderDefault}
        borderBottom={true}
        borderTop={false}
        borderLeft={false}
        borderRight={false}
      >
        <Box>
          <Text bold color={theme.accent}>TIMMY</Text>
          <Text color={theme.textTertiary}> :: </Text>
          <Text color={theme.textPrimary}>{mode.toUpperCase()}</Text>
          {W >= 90 && (
            <>
              <Text color={theme.textTertiary}>  ·  </Text>
              <Text color={theme.textSecondary}>{modelDisplay}</Text>
            </>
          )}
        </Box>
        <Box>
          {/* Activity glyph — pulses when agent is running */}
          <Text color={isActive && pulseFrame % 2 === 0 ? anim.color : theme.textTertiary}>
            {anim.glyph}
          </Text>
          <Text color={theme.textTertiary}>  </Text>
          {/* Telemetry: ● online / ▲ queued / ◆ syncing / ○ offline */}
          <Text color={tel.color}>{tel.glyph}</Text>
          {queuedTelemetryCount > 0 && (
            <Text color={theme.textTertiary}>+{queuedTelemetryCount}</Text>
          )}
          <Text color={theme.textTertiary}>  </Text>
          <Text color={theme.textSecondary}>RUN</Text>
          <Text color={theme.textTertiary}>·</Text>
          <Text color={theme.textPrimary}>{runDisplay}</Text>
          <Text color={theme.textTertiary}>  </Text>
          <Text color={theme.textSecondary}>COST</Text>
          <Text color={theme.textTertiary}>·</Text>
          <Text color={theme.accent}>{costDisplay}</Text>
        </Box>
      </Box>

      {/* ══ BODY ══ */}
      <Box flexGrow={1} flexShrink={1} flexDirection="row">
        {/* LEFT NAV — narrow, key-based, honest */}
        {W >= 90 && (
          <Box
            width={14}
            flexDirection="column"
            borderStyle="single"
            borderColor={theme.borderDefault}
            borderRight={true}
            borderLeft={false}
            borderTop={false}
            borderBottom={false}
            paddingX={1}
            paddingTop={1}
          >
            <Box marginBottom={1}>
              <Text color={theme.textTertiary}>NAV</Text>
            </Box>
            {MODES.map((m) => {
              const focused = isFocused(m.mode);
              const active = isActiveMode(m.mode);
              const marker = focused ? '▸' : active ? '■' : '□';
              let color = theme.textTertiary;
              if (active) color = theme.accent;
              if (focused) color = pulseFrame % 2 === 0 ? theme.textPrimary : theme.accent;
              return (
                <Box key={m.mode} marginBottom={1}>
                  <Text color={color}>
                    <Text color={focused || active ? theme.accent : theme.textTertiary}>{marker}</Text>
                    {' '}{m.label}
                  </Text>
                </Box>
              );
            })}
            <Box flexGrow={1} />
            <Box marginBottom={0}>
              <Text color={theme.textTertiary}>TAB·↑↓</Text>
            </Box>
          </Box>
        )}

        {/* STAGE — content fills remaining width */}
        <Box flexGrow={1} flexShrink={1} flexDirection="column" paddingX={2} paddingTop={1}>
          {children}
        </Box>
      </Box>

      {/* ══ BOTTOM BAR ══ */}
      <Box
        height={1}
        paddingX={1}
        justifyContent="space-between"
        borderStyle="single"
        borderColor={theme.borderDefault}
        borderTop={true}
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
      >
        <Box>
          <Text color={theme.textTertiary}>
            {focusArea === 'nav'
              ? (W >= 90 ? 'TAB·↑↓  ENTER·open  ?·help  ESC·back' : 'TAB·nav  ENTER·open  ?·help')
              : (W >= 90 ? 'ESC·nav  ↑↓·scroll  Ctrl+K·palette' : 'ESC·nav  ↑↓·scroll')
            }
          </Text>
        </Box>
        <Box>
          <Text color={theme.textTertiary}>
            {isActive ? 'BUSY' : 'IDLE'}{telemetryStatus === 'online' ? '' : ' ·NET'}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

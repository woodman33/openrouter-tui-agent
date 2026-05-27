import React from 'react';
import { Box, Text, useWindowSize } from 'ink';
import { RiveMascotPanel } from './components/RiveMascotPanel.js';
import { ModelBadge } from './components/ModelBadge.js';
import { theme } from './theme.js';
import type { Agent } from '../agent/core.js';

export interface LayoutProps {
  agent: Agent;
  mode: string;
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
}

export function Layout({
  agent,
  mode,
  model,
  pipelineType,
  totalCost,
  animState,
  children,
  activeRunId,
  activeReceiptUrl,
  telemetryStatus = 'online',
  queuedTelemetryCount = 0,
  snapshotStatus = 'idle'
}: LayoutProps) {
  const { columns: width, rows: height } = useWindowSize();

  const modeColors: Record<string, string> = {
    chat: '#5e6ad2',
    'code-review': '#3fb950',
    dashboard: '#d29922',
    'model-explorer': '#58a6ff',
    workspace: '#d2a8ff',
  };
  const modeColor = modeColors[mode] || '#5e6ad2';

  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Header */}
      <Box height={1} justifyContent="space-between" paddingX={1}>
        <Box>
          <Text bold color={modeColor}>OpenRouter TUI</Text>
          <Text color={theme.textSecondary}> | </Text>
          <Text color={modeColor} bold>Mode: {mode.toUpperCase()}</Text>
        </Box>
        <Box>
          <ModelBadge model={model} current />
          <Text color={theme.textSecondary}> | </Text>
          <Text color={theme.textTertiary}>${totalCost.toFixed(4)}</Text>
        </Box>
      </Box>

      {/* Separator */}
      <Box height={1}>
        <Text color={theme.borderDefault}>{'─'.repeat(width)}</Text>
      </Box>

      {/* Main content */}
      <Box flexDirection="row" flexGrow={1}>
        <Box flexGrow={1} flexDirection="column" paddingX={1}>
          {children}
        </Box>

        {/* Right sidebar - Rive / Info */}
        <Box width={34} flexDirection="column" paddingX={1}>
          <RiveMascotPanel
            agent={agent}
            mode={mode}
            agentState={animState === 'tool_call' ? 'tool' : animState}
            pipelineType={pipelineType}
          />
        </Box>
      </Box>

      {/* Footer */}
      <Box height={1} justifyContent="space-between" paddingX={1}>
        <Box>
          <Text color={theme.textTertiary} dimColor>
            Esc:exit  Tab:mode  Ctrl+L:clear  Ctrl+M:model  Ctrl+S:snapshot
          </Text>
        </Box>
        <Box>
          <Text color={theme.textTertiary} dimColor>
            {activeRunId ? `Run:${activeRunId.slice(0, 10)} | ` : ''}Tel:${telemetryStatus} (${queuedTelemetryCount}) | Snap:${snapshotStatus} | {animState.toUpperCase()}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

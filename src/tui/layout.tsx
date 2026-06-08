import React from 'react';
import { Box, Text, useWindowSize } from 'ink';
import { ModelBadge } from './components/ModelBadge.js';
import { SignalBars, Spinner } from './components/Motion.js';
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

export function Layout({
  agent: _agent,
  mode,
  focusedMode,
  model,
  pipelineType: _pipelineType,
  totalCost,
  animState,
  children,
  activeRunId,
  activeReceiptUrl: _activeReceiptUrl,
  telemetryStatus = 'online',
  queuedTelemetryCount = 0,
  snapshotStatus = 'idle',
  inspectorData,
  focusArea
}: LayoutProps) {
  const { columns: width, rows: height } = useWindowSize();
  const terminalWidth = width || process.stdout.columns || 80;
  const terminalHeight = height || process.stdout.rows || 24;
  const pulseFrame = usePulse(600);


  const navItems: { mode: Mode; label: string; desc: string }[] = [
    { mode: 'brief' as Mode, label: 'Main Chat', desc: 'OpenRouter Agent prompt' },
    { mode: 'porter' as Mode, label: 'MCP ➔ CLI', desc: 'Turn MCP server into CLI' },
    { mode: 'workspace' as Mode, label: 'Workspace', desc: 'Open cmux/browser workspace' },
    { mode: 'options' as Mode, label: 'Options', desc: 'Change simple settings' }
  ];

  const nextStepMap: Record<Mode, string> = {
    brief: 'Type a prompt or run proof.',
    porter: 'Paste an MCP server URL.',
    workspace: 'Open cmux Workspace.',
    proof: 'Copy hash or open receipt.',
    options: 'Toggle one setting.',
    files: 'Open cmux Workspace.',
    discovery: 'ready',
    teams: 'ready',
    logs: 'ready'
  };
  const nextStep = nextStepMap[mode] || 'ready';

  const modeColors: Record<Mode, string> = {
    brief: '#5e6ad2',
    files: '#a5d6ff',
    discovery: '#d29922',
    teams: '#d2a8ff',
    workspace: '#3fb950',
    proof: '#58a6ff',
    porter: '#ff7b72',
    options: '#79c0ff',
    logs: '#4f9cff'
  };

  const modeColor = modeColors[mode] || '#5e6ad2';
  const isActive = animState === 'thinking' || animState === 'streaming' || animState === 'tool_call';

  // Fallback default inspector data
  const defaultInspector = {
    title: 'TIMMY CENTRAL PASSPORT',
    subtitle: 'VERIFIABLE OPERATIONS HUB',
    type: 'AgentPass Authority',
    status: 'VERIFIED',
    risk: 'LOW',
    scope: 'global.system.trust',
    details: [
      '• System Status: SECURED',
      '• Visa Stamps: ACTIVE & ARMED',
      '• Sandbox Level: Hyper-Isolated',
      '• Telemetry sync: Edge D1 Enabled',
      `• Active Run ID: ${activeRunId ? activeRunId.slice(0, 12) : 'STANDBY'}`
    ]
  };

  const activeInspector = inspectorData || defaultInspector;

  // Responsive breakpoints
  const isCompact = terminalWidth < 120;
  const isChatActiveAndFocused = mode === 'brief' && focusArea === 'stage';
  const showTrustInspector = terminalWidth >= 140 && mode !== 'brief';
  const showLeftNav = !isChatActiveAndFocused && (terminalWidth >= 120);

  // Header Title and Slogan only
  let headerLeftText = ` TIMMY | ${mode.toUpperCase()} | Verifiable Agent Trust OS`;
  if (terminalWidth < 110) {
    headerLeftText = ` TIMMY | ${mode.toUpperCase()}`;
  }
  if (terminalWidth < 70) {
    headerLeftText = ` TIMMY`;
  }

  const headerRight = `[COST: $${totalCost.toFixed(4)}]`;

  return (
    <Box flexDirection="column" width={terminalWidth} height={terminalHeight}>
      {/* Top Title Bar */}
      <Box justifyContent="space-between" paddingX={1} borderStyle="single" borderColor="#30363d" borderBottom={true} borderTop={false} borderLeft={false} borderRight={false}>
        <Box>
          <Text bold color={modeColor}>{headerLeftText}</Text>
          {terminalWidth >= 120 && (
            <Text color={theme.textTertiary}>  - "Governed work. Verifiable proofs."</Text>
          )}
        </Box>
        <Box>
          {isActive ? <Spinner color={modeColor} label={animState.toLowerCase()} /> : <SignalBars width={8} color={modeColor} active={telemetryStatus === 'online'} />}
          <Text color={theme.textSecondary}> | </Text>
          <ModelBadge model={model} current maxWidth={terminalWidth < 95 ? 10 : 20} />
          <Text color={theme.textSecondary}> | </Text>
          <Text color="#e6edf3" bold>{headerRight}</Text>
        </Box>
      </Box>

      {/* Main Responsive App Shell Grid */}
      <Box flexGrow={1} flexShrink={1} flexDirection="row">
        
        {/* 1. Left Column: Persistent VerticalNav (width 24, hidden in compact mode) */}
        {showLeftNav && (
          <Box width={24} flexDirection="column" borderStyle="single" borderColor="#30363d" borderRight={true} borderLeft={false} borderTop={false} borderBottom={false} paddingX={1}>
            <Box marginBottom={1} height={1}>
              <Text bold color={focusArea === 'nav' ? '#d2a8ff' : '#8b949e'}>🧭 LEFT NAV DECK</Text>
            </Box>
            {navItems.map((item) => {
              const isFocused = focusedMode === item.mode && focusArea === 'nav';
              const isActiveStage = mode === item.mode;
              
              let bullet = '  ';
              if (isFocused) bullet = '▶ ';
              else if (isActiveStage) bullet = '● ';

              let color = '#8b949e';
              if (isFocused) color = pulseFrame % 2 === 0 ? '#ffffff' : '#d2a8ff';
              else if (isActiveStage) color = pulseFrame % 2 === 0 ? modeColors[item.mode] : '#a5d6ff';

              return (
                <Box key={item.mode} flexDirection="column" marginBottom={1}>
                  <Box>
                    <Text bold={isFocused || isActiveStage} color={color}>
                      {bullet}{item.label}
                    </Text>
                  </Box>
                  <Box paddingLeft={2}>
                    <Text dimColor color="#8b949e">{item.desc}</Text>
                  </Box>
                </Box>
              );
            })}
            <Box flexGrow={1} />
            <Box flexDirection="column" borderStyle="single" borderColor="#30363d" paddingX={1} borderBottom={false} borderLeft={false} borderRight={false}>
              <Text color="#8b949e" dimColor>Tab / Shift+Tab</Text>
              <Text color="#8b949e" dimColor>to move navigation.</Text>
              <Text color="#8b949e" dimColor>Enter to select.</Text>
            </Box>
          </Box>
        )}

        {/* 2. Center Column: Main Stage (flexGrow) */}
        <Box flexGrow={1} flexShrink={1} flexDirection="column" paddingX={1} paddingTop={1}>
          {children}
        </Box>

        {/* 3. Right Column: Compact TrustInspector (hidden in compact/medium layout) */}
        {showTrustInspector && (
          <Box width={28} flexDirection="column" borderStyle="single" borderColor="#30363d" borderLeft={true} borderRight={false} borderTop={false} borderBottom={false} paddingX={1}>
            <Box marginBottom={1} height={1}>
              <Text bold color="#79c0ff">🛡️ TRUST INSPECTOR</Text>
            </Box>

            <Box flexDirection="column">
              <Text color="#8b949e">Selected: <Text bold color="#e6edf3" wrap="truncate">{activeInspector.title}</Text></Text>
              <Text color="#8b949e">Status:   <Text bold color="#3fb950">[{activeInspector.status}]</Text></Text>
              <Text color="#8b949e">Risk:     <Text bold color={activeInspector.risk === 'HIGH' ? '#f85149' : activeInspector.risk === 'MEDIUM' ? '#d29922' : '#3fb950'}>{activeInspector.risk}</Text></Text>
              <Text color="#8b949e">Visa:     <Text color="#79c0ff" wrap="truncate">{activeInspector.scope}</Text></Text>
              <Text color="#8b949e">Receipt:  <Text color="#bc8cff">verifiable hash</Text></Text>
              <Text color="#8b949e">Next:     <Text color="#d2a8ff">{nextStep}</Text></Text>
            </Box>

            <Box flexGrow={1} />

            <Box flexDirection="column" borderStyle="single" borderColor="#30363d" paddingX={1} borderBottom={false} borderLeft={false} borderRight={false}>
              <Text color="#8b949e" dimColor>Esc: return to nav</Text>
              <Text color="#8b949e" dimColor>Ctrl+G: release lock</Text>
            </Box>
          </Box>
        )}
      </Box>

      {/* Operator controls and Safety Global Bar */}
      <Box height={2} flexDirection="column" borderStyle="single" borderColor="#30363d" borderTop={true} borderBottom={false} borderLeft={false} borderRight={false} paddingX={1}>
        <Box height={1} justifyContent="space-between">
          <Box flexGrow={1} flexShrink={1}>
            <Text bold color="#d29922">GUIDES </Text>
            <Text color="#e6edf3" wrap="truncate">
              {focusArea === 'nav' 
                ? (isCompact ? 'Tab/Enter nav' : 'Tab down nav | Shift+Tab up nav | Enter select main stage')
                : (isCompact ? 'Arrows nav | Esc back' : 'Arrow keys navigate active panel | Esc back to nav deck')
              }
            </Text>
          </Box>
          <Box flexShrink={0}>
            {!showTrustInspector && terminalWidth >= 100 && (
              <>
                <Text color="#8b949e">Inspector: </Text>
                <Text bold color="#79c0ff">{truncateVisible(activeInspector.title, isCompact ? 8 : 14)} </Text>
                <Text bold color="#3fb950">[{activeInspector.status}] </Text>
                <Text color="#8b949e">| </Text>
              </>
            )}
            <Text bold color={pulseFrame % 2 === 0 ? "#3fb950" : "#2ea043"}>AgentPass VERIFIED </Text>
            {terminalWidth >= 110 && (
              <>
                <Text color="#8b949e">| </Text>
                <Text bold color={pulseFrame % 2 === 0 ? "#79c0ff" : "#58a6ff"}>Visa READY </Text>
              </>
            )}
            {terminalWidth >= 130 && (
              <>
                <Text color="#8b949e">| </Text>
                <Text bold color={pulseFrame % 2 === 0 ? "#d2a8ff" : "#bc8cff"}>Stamp ARMED </Text>
                <Text color="#8b949e">| </Text>
                <Text bold color={pulseFrame % 2 === 0 ? "#58a6ff" : "#388bfd"}>Receipt READY </Text>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}


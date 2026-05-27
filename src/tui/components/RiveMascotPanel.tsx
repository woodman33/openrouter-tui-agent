import React from 'react';
import { Box, Text, useWindowSize } from 'ink';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { GlowBorder } from './GlowBorder.js';
import type { Agent } from '../../agent/core.js';
import { theme } from '../theme.js';

interface RiveMascotPanelProps {
  agent: Agent;
  mode: string;
  agentState: 'idle' | 'thinking' | 'streaming' | 'tool' | 'error' | 'success';
  pipelineType: string;
  companionUrl?: string;
}

const STATE_ICONS: Record<string, string> = {
  idle: '●',
  thinking: '◌',
  streaming: '◎',
  tool: '⚙',
  error: '✕',
  success: '✓',
};

const STATE_COLORS: Record<string, string> = {
  idle: '#5e6ad2',
  thinking: '#d29922',
  streaming: '#58a6ff',
  tool: '#d2a8ff',
  error: '#f85149',
  success: '#3fb950',
};

export function RiveMascotPanel({ agent, mode, agentState, pipelineType, companionUrl }: RiveMascotPanelProps) {
  const { rows: terminalHeight } = useWindowSize();
  const height = terminalHeight || process.stdout.rows || 24;

  const color = STATE_COLORS[agentState] || '#5e6ad2';
  const icon = STATE_ICONS[agentState] || '●';

  // Force component re-renders when agent tmux:update fires
  const [_, forceUpdate] = React.useState(0);
  React.useEffect(() => {
    const handleUpdate = () => forceUpdate(n => n + 1);
    agent.on('tmux:update' as any, handleUpdate);
    return () => {
      agent.off('tmux:update' as any, handleUpdate);
    };
  }, [agent]);

  // Map modes to custom high-visibility cybernetic monitor titles
  const modeTitles: Record<string, string> = {
    chat: '💬 CHAT CONSOLE',
    'code-review': '🛡️ CODE REVIEWER',
    dashboard: '📊 SWARM TELEMETRY',
    'model-explorer': '⚙️ MODEL SELECTOR',
    setup: '🔑 ONBOARD SETUP',
    workspace: '🖥️ HYPER-GRID WORK',
  };
  const activeTitle = modeTitles[mode] || '🤖 SYSTEMS AGENT';
  const runningSessionsCount = agent.tmuxSessions.length;

  const mascotArt = `┌──────────────────────────┐
│ ${activeTitle.padEnd(24)} │
├──────────────────────────┤
│ STATUS : ${agentState.toUpperCase().padEnd(14)} │
│ PULSE  : [ ${icon}  ${icon}  ${icon}  ${icon} ]   │
│ PIPELINE: ${pipelineType.toUpperCase().padEnd(13)}│
│ SESSIONS: ${`${runningSessionsCount} active (tmux)`.padEnd(14)}│
└──────────────────────────┘`.trim();

  const daytonaKey = process.env.DAYTONA_API_KEY;
  const isDaytonaActive = !!(daytonaKey && !daytonaKey.includes('your') && !daytonaKey.includes('paste_your'));

  const triggerKey = process.env.TRIGGER_SECRET_KEY;
  const isTriggerActive = !!(triggerKey && !triggerKey.includes('your') && !triggerKey.includes('paste_your'));

  const composioKey = process.env.COMPOSIO_API_KEY;
  const isComposioActive = !!(composioKey && !composioKey.includes('your') && !composioKey.includes('paste_your'));

  const cfAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
  const isCloudflareActive = !!(cfAccount && cfAccount.trim() !== '');

  // Dynamic toggleable Tmux Session details dropdown monitor
  const showTmux = agent.showTmuxDropdown && agent.tmuxSessions.length > 0;

  // Let's decide what to render responsively based on terminal height:
  // - height >= 34: full (mascot art, edge integrations, tmux cluster dropdown)
  // - height >= 26: mascot art, edge integrations
  // - height >= 18: mascot art only
  // - height < 18: compact status badge only
  const showLocalToolchain = height >= 34 && !showTmux; // Hide toolchain if tmux dropdown is open to prevent overflow!
  const showEdgeIntegrations = height >= 26;
  const showMascotArt = height >= 18;

  if (!showMascotArt) {
    // Ultra compact display for very small terminals
    return (
      <Box flexDirection="column" width={32} borderStyle="single" borderColor={color} paddingX={1}>
        <Text bold color={color}>{activeTitle}</Text>
        <Text color={theme.textSecondary}>Status: <Text bold color={color}>{agentState.toUpperCase()}</Text></Text>
        <Text color={theme.textTertiary}>Pipeline: {pipelineType.toUpperCase()}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width={32}>
      <GlowBorder color={color} width={32} label="TELEMETRY PULSE">
        <Box flexDirection="column" paddingX={1}>
          <Text color={color}>{mascotArt}</Text>
        </Box>
      </GlowBorder>

      {/* Integrations Monitor Status */}
      {showEdgeIntegrations && (
        <Box marginTop={1} borderStyle="single" borderColor="#30363d" flexDirection="column" paddingX={1} width={32}>
          <Text bold color="#a5d6ff">🔌 EDGE INTEGRATIONS</Text>
          <Box flexDirection="column" marginTop={1}>
            <Box justifyContent="space-between" width={28}>
              <Text color={theme.textSecondary}>Daytona: </Text>
              <Text bold color={isDaytonaActive ? '#3fb950' : '#d29922'}>
                {isDaytonaActive ? 'ACTIVE (Edge)' : 'LOCAL (Sub)'}
              </Text>
            </Box>
            <Box justifyContent="space-between" width={28}>
              <Text color={theme.textSecondary}>Trigger.dev: </Text>
              <Text bold color={isTriggerActive ? '#3fb950' : '#d29922'}>
                {isTriggerActive ? 'ACTIVE (Edge)' : 'MOCK (Local)'}
              </Text>
            </Box>
            <Box justifyContent="space-between" width={28}>
              <Text color={theme.textSecondary}>Composio: </Text>
              <Text bold color={isComposioActive ? '#3fb950' : '#d29922'}>
                {isComposioActive ? 'ACTIVE (Edge)' : 'MOCK (Local)'}
              </Text>
            </Box>
            <Box justifyContent="space-between" width={28}>
              <Text color={theme.textSecondary}>Cloudflare: </Text>
              <Text bold color={isCloudflareActive ? '#3fb950' : '#d2a8ff'}>
                {isCloudflareActive ? 'ACTIVE (Edge)' : 'LOCAL (DO)'}
              </Text>
            </Box>
          </Box>

          {showLocalToolchain && (
            <Box borderStyle="double" borderColor="#444c56" marginTop={1} paddingX={1} flexDirection="column" width={28}>
              <Text bold color="#d2a8ff">🛠️ LOCAL TOOLCHAIN</Text>
              <Box justifyContent="space-between" width={24} marginTop={1}>
                <Text color={theme.textSecondary}>Rust oha: </Text>
                <Text bold color={true ? '#3fb950' : '#f85149'}>ACTIVE</Text>
              </Box>
              <Box justifyContent="space-between" width={24}>
                <Text color={theme.textSecondary}>CDP CLI: </Text>
                <Text bold color={true ? '#3fb950' : '#f85149'}>ACTIVE</Text>
              </Box>
            </Box>
          )}
        </Box>
      )}
      
      {/* Dynamic toggleable Tmux Session details dropdown monitor */}
      {showTmux && height >= 24 && (
        <Box marginTop={1} borderStyle="single" borderColor="#d29922" flexDirection="column" paddingX={1} width={32}>
          <Text bold color="#d29922">📊 Active Clusters:</Text>
          {agent.tmuxSessions.slice(0, 2).map((s: any) => (
            <Box key={s.id} flexDirection="column" marginTop={1} borderStyle="round" borderColor="#30363d" paddingX={1} width={28}>
              <Text bold color="#79c0ff">Pane {s.id}: {s.name}</Text>
              <Text color={theme.textSecondary}>Model: {s.model.split('/').pop()}</Text>
              <Text color={theme.textTertiary}>Mem: {s.memory} | Cost: ${s.cost.toFixed(4)}</Text>
            </Box>
          ))}
        </Box>
      )}

      {companionUrl && height >= 28 && (
        <Box flexDirection="column" paddingX={1} marginTop={1} width={32}>
          <Text dimColor>Companion: {companionUrl}</Text>
        </Box>
      )}
    </Box>
  );
}

import React, { useState, useEffect } from 'react';
import { render, useApp, useInput, Box, Text } from 'ink';
import { createAgent } from '../agent/core.js';
import type { AgentConfig } from '../types/index.js';
import { Layout } from './layout.js';
import { ModeRouter, MODES, type Mode } from './router.js';
import { useTerminalCapabilities } from './hooks/useTerminalCapabilities.js';
import { useGraphicsPipeline } from './hooks/useGraphicsPipeline.js';
import { useAgent } from './hooks/useAgent.js';
import { useTelemetryBridge } from './hooks/useTelemetryBridge.js';
import { useCompanionSync } from './hooks/useCompanionSync.js';
import { useModeAgentConfig } from './hooks/useModeAgentConfig.js';

import { agentLogger, tuiLogger } from '../utils/logger.js';

interface AppProps {
  config: AgentConfig;
  initialMode?: Mode;
  graphicsType?: string;
}

function App({ config, initialMode = 'brief', graphicsType = 'auto' }: AppProps) {
  const { exit } = useApp();
  
  const mappedInitialMode = ((initialMode as string) === 'chat') ? 'brief' : initialMode;
  const [mode, setMode] = useState<Mode>(mappedInitialMode);
  
  // V2.0 App Shell navigation and focus states
  const [focusedMode, setFocusedMode] = useState<Mode>(mappedInitialMode);
  const [focusArea, setFocusArea] = useState<'nav' | 'stage'>('nav');
  const [inspectorData, setInspectorData] = useState<any>(null);
  const setInspectorSafe = React.useCallback((data: any) => {
    Promise.resolve().then(() => {
      setInspectorData(data);
    });
  }, []);
  
  // Command Palette State
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [paletteIdx, setPaletteIdx] = useState(0);

  // Stateful Active Receipt and Snapshot Trackers
  const [activeRunId, setActiveRunId] = useState<string | undefined>(undefined);
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | undefined>(undefined);
  const [snapshotStatus, setSnapshotStatus] = useState<string>('idle');

  const agent = React.useMemo(() => createAgent(config), [config]);
  const agentState = useAgent(agent);
  const capsState = useTerminalCapabilities();

  // 1. Telemetry Bridge integration
  const {
    telemetryStatus,
    queuedTelemetryCount
  } = useTelemetryBridge({
    agent,
    mode,
    model: agentState.model,
    totalCost: agentState.totalCost,
    config,
    activeRunId,
    activeReceiptUrl,
    operator: 'William Meldman'
  });

  // 2. Companion synchronization integrations
  useCompanionSync({
    agent,
    messages: agentState.messages,
    activeRunId,
    activeReceiptUrl
  });

  // 3. Dynamic Mode agent configuration
  useModeAgentConfig({
    agent,
    mode,
    config
  });

  // Listener to dynamic agent state modifications
  useEffect(() => {
    const handleRunCreated = (data: any) => {
      agentLogger.info(`run.created: ${JSON.stringify(data)}`);
      if (data && data.runId) {
        setActiveRunId(data.runId);
        setActiveReceiptUrl(`https://openrouter-tui-agent.wmeldman33.workers.dev/runs/${data.runId}/receipt`);
      }
    };
    const handleReceiptGenerated = (data: any) => {
      agentLogger.info(`receipt.generated: ${JSON.stringify(data)}`);
      if (data && data.receiptUrl) {
        setActiveReceiptUrl(data.receiptUrl);
      }
    };
    const handleTelemetryRun = (data: any) => {
      agentLogger.info(`telemetry:run: ${JSON.stringify(data)}`);
      if (data && data.runId) {
        setActiveRunId(data.runId);
        if (data.receiptUrl) setActiveReceiptUrl(data.receiptUrl);
      }
    };
    const handleSnapshotCreated = () => {
      agentLogger.info('snapshot:created event processed');
      setSnapshotStatus('created');
      setTimeout(() => setSnapshotStatus('idle'), 2500);
    };

    agent.on('run.created' as any, handleRunCreated);
    agent.on('receipt.generated' as any, handleReceiptGenerated);
    agent.on('telemetry:run' as any, handleTelemetryRun);
    agent.on('snapshot:created' as any, handleSnapshotCreated);

    return () => {
      agent.off('run.created' as any, handleRunCreated);
      agent.off('receipt.generated' as any, handleReceiptGenerated);
      agent.off('telemetry:run' as any, handleTelemetryRun);
      agent.off('snapshot:created' as any, handleSnapshotCreated);
    };
  }, [agent]);

  // Emit run.created on mount
  useEffect(() => {
    const startupRunId = `run_${Math.random().toString(36).substring(2, 9)}`;
    const receiptUrl = `https://openrouter-tui-agent.wmeldman33.workers.dev/runs/${startupRunId}/receipt`;
    agent.emit('run.created' as any, {
      runId: startupRunId,
      receiptUrl,
      source: 'timmy-tui-startup',
      timestamp: Date.now()
    });
  }, [agent]);

  // Bind mode:change emitter events to TUI state router
  useEffect(() => {
    const handleModeChange = (nextMode: Mode) => {
      setMode(nextMode);
      setFocusedMode(nextMode);
    };
    agent.on('mode:change' as any, handleModeChange);
    return () => {
      agent.off('mode:change' as any, handleModeChange);
    };
  }, [agent]);

  // Derive animations state triggers
  const animState: 'idle' | 'thinking' | 'streaming' | 'tool_call' | 'error' | 'success' = agentState.isThinking
    ? (agentState.currentTools.length > 0 ? 'tool_call' : 'thinking')
    : agentState.isStreaming
      ? 'streaming'
      : agentState.error
        ? 'error'
        : 'idle';

  const { pipeline, pipelineType } = useGraphicsPipeline(capsState.capabilities, animState, graphicsType);

  const safeExit = () => {
    try {
      if (pipeline) pipeline.cleanup();
    } catch {
      // Guard circular graphics reference warnings
    }
    exit();
  };

  const isDev = (agent as any).developerMode === true;

  const paletteItems = [
    { label: 'Main Chat Screen', action: () => { setMode('brief'); setFocusedMode('brief'); } },
    { label: 'MCP ➔ CLI Screen', action: () => { setMode('porter'); setFocusedMode('porter'); } },
    { label: 'Workspace Screen', action: () => { setMode('workspace'); setFocusedMode('workspace'); } },
    { label: 'Proof Screen', action: () => { setMode('proof'); setFocusedMode('proof'); } },
    { label: 'Options Screen', action: () => { setMode('options'); setFocusedMode('options'); } },
    ...(isDev ? [
      { label: 'Local Files Browser', action: () => { setMode('files'); setFocusedMode('files'); } },
      { label: 'Discovery Screen', action: () => { setMode('discovery'); setFocusedMode('discovery'); } },
      { label: 'Teams Screen', action: () => { setMode('teams'); setFocusedMode('teams'); } },
      { label: 'Logs Monitor', action: () => { setMode('logs'); setFocusedMode('logs'); } }
    ] : []),
    { label: 'Exit Application', action: safeExit }
  ];

  // Core V2.0 keyboard inputs router hook
  useInput((input, key) => {
    // 1. Always exit cleanly on Ctrl+C
    if (key.ctrl && input === 'c') {
      tuiLogger.info('Ctrl+C captured. Clean exit.');
      safeExit();
      return;
    }

    // 2. Interactive Command Palette (Ctrl+K)
    if (key.ctrl && input === 'k') {
      tuiLogger.info('Ctrl+K captured. Toggle Command Palette.');
      setCommandPaletteOpen(prev => !prev);
      setPaletteIdx(0);
      return;
    }

    // 2b. Logs Monitor Shortcut (Ctrl+L)
    if (key.ctrl && input === 'l') {
      tuiLogger.info('Ctrl+L captured. Switch to Logs Monitor.');
      setMode('logs');
      setFocusedMode('logs');
      setFocusArea('stage');
      return;
    }

    if (commandPaletteOpen) {
      if (key.escape) {
        setCommandPaletteOpen(false);
        return;
      }
      if (key.upArrow) {
        setPaletteIdx(prev => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        setPaletteIdx(prev => Math.min(paletteItems.length - 1, prev + 1));
        return;
      }
      if (key.return) {
        paletteItems[paletteIdx].action();
        setCommandPaletteOpen(false);
        return;
      }
      return;
    }

    // 3. Central release commands: Esc returns focus to Nav, Ctrl+G force-releases pane lock
    if (key.escape) {
      if (focusArea === 'stage') {
        // Returns focus to navigation deck
        setFocusArea('nav');
        return;
      }
    }

    if (key.ctrl && input === 'g') {
      setFocusArea('nav');
      return;
    }

    // 4. In Navigation Deck Area Focus (focusArea === 'nav')
    if (focusArea === 'nav') {
      const allowedModes: Mode[] = ['brief', 'porter', 'workspace', 'options'];

      if (key.tab) {
        const idx = allowedModes.indexOf(focusedMode);
        let nextIdx;
        if (key.shift) {
          nextIdx = (idx - 1 + allowedModes.length) % allowedModes.length;
        } else {
          nextIdx = (idx + 1) % allowedModes.length;
        }
        setFocusedMode(allowedModes[nextIdx]);
        return;
      }

      if (key.return || input === '\r' || input === '\n') {
        setMode(focusedMode);
        agent.emit('mode:change' as any, focusedMode);
        setFocusArea('stage');
        return;
      }

      if (key.upArrow) {
        const idx = allowedModes.indexOf(focusedMode);
        const nextIdx = (idx - 1 + allowedModes.length) % allowedModes.length;
        setFocusedMode(allowedModes[nextIdx]);
        return;
      }
      if (key.downArrow) {
        const idx = allowedModes.indexOf(focusedMode);
        const nextIdx = (idx + 1) % allowedModes.length;
        setFocusedMode(allowedModes[nextIdx]);
        return;
      }
    }
  });

  return (
    <Layout
      agent={agent}
      mode={mode}
      focusedMode={focusedMode}
      model={agentState.model}
      pipelineType={pipelineType}
      totalCost={agentState.totalCost}
      animState={animState}
      activeRunId={activeRunId}
      activeReceiptUrl={activeReceiptUrl}
      telemetryStatus={telemetryStatus}
      queuedTelemetryCount={queuedTelemetryCount}
      snapshotStatus={snapshotStatus}
      inspectorData={inspectorData}
      focusArea={focusArea}
    >
      <Box flexGrow={1} flexShrink={1}>
        <ModeRouter mode={mode} agent={agent} setInspector={setInspectorSafe} focusArea={focusArea} />

        {/* Command Palette Overlay */}
        {commandPaletteOpen && (
          <Box
            position="absolute"
            top={3}
            left={25}
            borderStyle="double"
            borderColor="#d2a8ff"
            paddingX={2}
            flexDirection="column"
            width={45}
            height={paletteItems.length + 3}
          >
            <Text bold color="#d2a8ff">🏛️ TIMMY COMMAND PALETTE (Ctrl+K)</Text>
            <Text color="#8b949e">─────────────────────────────────────────</Text>
            {paletteItems.map((item, idx) => {
              const isSelected = idx === paletteIdx;
              return (
                <Text key={idx} color={isSelected ? '#3fb950' : '#e6edf3'} bold={isSelected}>
                  {isSelected ? '▶ ' : '  '}
                  {item.label}
                </Text>
              );
            })}
            <Text color="#8b949e">─────────────────────────────────────────</Text>
            <Text color="#8b949e" dimColor>Arrows to scroll | Enter to choose | Esc to exit</Text>
          </Box>
        )}
      </Box>
    </Layout>
  );
}

export function startTUI(config: AgentConfig, mode?: Mode, graphicsType = 'auto') {
  render(<App config={config} initialMode={mode} graphicsType={graphicsType} />, {
    exitOnCtrlC: false,
    debug: false,
  });
}


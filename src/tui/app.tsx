import React, { useState, useEffect } from 'react';
import { render, useApp, useInput, Box, Text } from 'ink';
import { createAgent } from '../agent/core.js';
import type { AgentConfig } from '../types/index.js';
import { Layout } from './layout.js';
import { ModeRouter, MODES, type Mode } from './router.js';
import { GLOBAL_KEYS, MODE_KEYS } from './keymap.js';
import { useTerminalCapabilities } from './hooks/useTerminalCapabilities.js';
import { useGraphicsPipeline } from './hooks/useGraphicsPipeline.js';
import { useAgent } from './hooks/useAgent.js';
import { useTelemetryBridge } from './hooks/useTelemetryBridge.js';
import { useCompanionSync } from './hooks/useCompanionSync.js';
import { useModeAgentConfig } from './hooks/useModeAgentConfig.js';

import { agentLogger, tuiLogger } from '../utils/logger.js';

import { Onboarding } from './Onboarding.js';
import { condenseSession } from '../utils/iceberg.js';
import { theme } from './theme.js';

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
  // Unified zone model: -1 = left nav, 0..n = stage panes (panels own panes).
  // Drop straight into the chat stage — no Tab+Enter dance to start working.
  const [zone, setZone] = useState<number>(0);
  // A panel is in modal text-entry (composer etc.) — global keys stand down.
  const [modalInput, setModalInput] = useState(false);
  const [inspectorData, setInspectorData] = useState<any>(null);
  const setInspectorSafe = React.useCallback((data: any) => {
    Promise.resolve().then(() => {
      setInspectorData(data);
    });
  }, []);
  
  // Command Palette State
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [paletteIdx, setPaletteIdx] = useState(0);

  // Help overlay state (the '?·help' hint is now real, not a dead affordance)
  const [helpOpen, setHelpOpen] = useState(false);

  // First-run onboarding gate (local-first, skippable, persisted)
  const [showOnboard, setShowOnboard] = useState(() => !(config as any).onboarded);

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
        setActiveReceiptUrl(`https://timmy-ai-proxy.wmeldman33.workers.dev/runs/${data.runId}/receipt`);
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
    const receiptUrl = `https://timmy-ai-proxy.wmeldman33.workers.dev/runs/${startupRunId}/receipt`;
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
      condenseSession(); // ICEBERG: vault stays raw, topics/ gets the summary
    } catch {
      // condensing is best-effort on exit
    }
    try {
      if (pipeline) pipeline.cleanup();
    } catch {
      // Guard circular graphics reference warnings
    }
    exit();
  };

  const paletteItems = [
    { label: 'Chat', action: () => { setMode('brief'); setFocusedMode('brief'); } },
    { label: 'Lanes', action: () => { setMode('lanes'); setFocusedMode('lanes'); } },
    { label: 'Gens', action: () => { setMode('gens'); setFocusedMode('gens'); } },
    { label: 'Slate', action: () => { setMode('slate'); setFocusedMode('slate'); } },
    { label: 'Browse', action: () => { setMode('browse'); setFocusedMode('browse'); } },
    { label: 'Logs', action: () => { setMode('logs'); setFocusedMode('logs'); } },
    { label: 'Files', action: () => { setMode('files'); setFocusedMode('files'); } },
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
      setZone(0);
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

    // Help overlay: any Esc or '?' closes it
    if (helpOpen) {
      if (key.escape || input === '?') {
        setHelpOpen(false);
      }
      return;
    }

    // Global Ctrl-layer jumps — one dialect everywhere, no nav dance required
    // (Ink doesn't parse F-keys; Ctrl combos are conflict-free in raw mode)
    if (key.ctrl && input === 'r') {
      setMode('lanes');
      setFocusedMode('lanes');
      setZone(0);
      return;
    }
    if (key.ctrl && input === 'w') {
      setMode('files');
      setFocusedMode('files');
      setZone(0);
      return;
    }

    const autocompleteActive = Boolean((agent as any).autocompleteActive);

    // ONE GRAMMAR — Tab/⇧Tab walks the left menu from anywhere, unless a
    // modal text-entry (composer) or the slash autocomplete owns Tab.
    if (key.tab && !modalInput && !autocompleteActive) {
      const idx = MODES.indexOf(mode);
      const next = key.shift
        ? (idx - 1 + MODES.length) % MODES.length
        : (idx + 1) % MODES.length;
      setMode(MODES[next]);
      setFocusedMode(MODES[next]);
      return;
    }

    // ? = the keymap, from anywhere a '?' can't be plain text
    if (input === '?' && !modalInput && !autocompleteActive && !(mode === 'brief' && zone === 0)) {
      tuiLogger.info('Help overlay opened.');
      setHelpOpen(true);
      return;
    }

    // Esc = ALWAYS back: stage pane → nav, nav → stage
    if (key.escape) {
      if (!modalInput && !autocompleteActive) setZone(z => (z === -1 ? 0 : -1));
      return;
    }

    if (key.ctrl && input === 'g') {
      setZone(-1);
      return;
    }

    // Nav zone: ↑↓ move the highlight, Enter ALWAYS selects, → drops in
    if (zone === -1) {
      if (key.return || input === '\r' || input === '\n') {
        setMode(focusedMode);
        agent.emit('mode:change' as any, focusedMode);
        setZone(0);
        return;
      }
      if (key.upArrow) {
        const idx = MODES.indexOf(focusedMode);
        setFocusedMode(MODES[(idx - 1 + MODES.length) % MODES.length]);
        return;
      }
      if (key.downArrow) {
        const idx = MODES.indexOf(focusedMode);
        setFocusedMode(MODES[(idx + 1) % MODES.length]);
        return;
      }
      if (key.rightArrow) {
        setZone(0);
        return;
      }
    }
  });

  // First-run gate: local-first onboarding before the unified screen
  if (showOnboard) {
    return <Onboarding agent={agent} onDone={() => setShowOnboard(false)} />;
  }

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
      zone={zone}
    >
      <Box flexGrow={1} flexShrink={1}>
        <ModeRouter mode={mode} agent={agent} setInspector={setInspectorSafe} zone={zone} setZone={setZone} setModalInput={setModalInput} inputLocked={commandPaletteOpen} />

        {/* Command Palette Overlay */}
        {commandPaletteOpen && (
          <Box
            position="absolute"
            top={3}
            left={25}
            borderStyle="double"
            borderColor={theme.brand}
            paddingX={2}
            flexDirection="column"
            width={45}
            height={paletteItems.length + 3}
          >
            <Text bold color={theme.brand}>🏛️ TIMMY COMMAND PALETTE (Ctrl+K)</Text>
            <Text color={theme.textSecondary}>─────────────────────────────────────────</Text>
            {paletteItems.map((item, idx) => {
              const isSelected = idx === paletteIdx;
              return (
                <Text key={idx} color={isSelected ? theme.success : theme.textPrimary} bold={isSelected}>
                  {isSelected ? '▶ ' : '  '}
                  {item.label}
                </Text>
              );
            })}
            <Text color={theme.textSecondary}>─────────────────────────────────────────</Text>
            <Text color={theme.textSecondary} dimColor>Arrows to scroll | Enter to choose | Esc to exit</Text>
          </Box>
        )}

        {/* Help Overlay */}
        {helpOpen && (
          <Box
            position="absolute"
            top={3}
            left={25}
            borderStyle="double"
            borderColor={theme.success}
            paddingX={2}
            flexDirection="column"
            width={52}
          >
            <Text bold color={theme.success}>❓ ONE GRAMMAR — same keys, every tab · {mode.toUpperCase()}</Text>
            <Text color={theme.textSecondary}>────────────────────────────────────────────────</Text>
            {GLOBAL_KEYS.map(g => (
              <Text key={g.key} color={theme.textPrimary}>{g.key.padEnd(10)} {g.label}</Text>
            ))}
            <Text color={theme.textSecondary}>────────────────────────────────────────────────</Text>
            {MODE_KEYS[mode].map(g => (
              <Text key={g.key} color={theme.textPrimary}>{g.key.padEnd(10)} {g.label}</Text>
            ))}
            <Text color={theme.textSecondary}>────────────────────────────────────────────────</Text>
            <Text color={theme.textPrimary}>Ctrl+K palette · Ctrl+L logs · Ctrl+R lanes · Ctrl+W projects · Ctrl+C quit</Text>
            <Text color={theme.textSecondary} dimColor>Press ? or ESC to close</Text>
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


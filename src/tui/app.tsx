// v1.0.1 ergonomic overhaul — app shell. Four top-level views ([1-4],
// Tab walks pane focus), no left nav, no ambient rain in chat. The shell
// owns navigation + budget; ViewStage owns content; Layout owns chrome.
import React, { useState, useEffect } from 'react';
import { render, useApp, Box, Text } from 'ink';
import { FocusProvider, useFocus, useKeyDispatcher } from './hooks/useKeyDispatcher.js';
import { createAgent } from '../agent/core.js';
import type { AgentConfig } from '../types/index.js';
import { Layout } from './layout.js';
import { ViewStage } from './views.js';
import { VIEWS, VIEW_PANES, PALETTE_MODELS } from './utils/ergonomics.js';
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
  graphicsType?: string;
}

export function App(props: AppProps) {
  // v1.0.5-keyboard-arch: the focus stack lives above everything
  return <FocusProvider><Shell {...props} /></FocusProvider>;
}

function Shell({ config, graphicsType = 'auto' }: AppProps) {
  const { exit } = useApp();

  // v1.0.1 view grammar: 0 COMMAND · 1 MISSION · 2 TELEMETRY · 3 ESCROW
  const [view, setView] = useState(0);
  const [paneFocus, setPaneFocus] = useState(0);
  const setInspectorSafe = React.useCallback((data: unknown) => {
    Promise.resolve().then(() => void data);
  }, []);

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showOnboard, setShowOnboard] = useState(() => !(config as any).onboarded);

  const [activeRunId, setActiveRunId] = useState<string | undefined>(undefined);
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | undefined>(undefined);

  const agent = React.useMemo(() => createAgent(config), [config]);
  const agentState = useAgent(agent);
  const capsState = useTerminalCapabilities();

  const { telemetryStatus, queuedTelemetryCount } = useTelemetryBridge({
    agent,
    mode: 'brief',
    model: agentState.model,
    totalCost: agentState.totalCost,
    config,
    activeRunId,
    activeReceiptUrl,
    operator: 'William Meldman'
  });

  useCompanionSync({ agent, messages: agentState.messages, activeRunId, activeReceiptUrl });
  useModeAgentConfig({ agent, mode: 'brief', config });

  useEffect(() => {
    const handleRunCreated = (data: any) => {
      agentLogger.info(`run.created: ${JSON.stringify(data)}`);
      if (data && data.runId) {
        setActiveRunId(data.runId);
        setActiveReceiptUrl(`https://timmy-ai-proxy.wmeldman33.workers.dev/runs/${data.runId}/receipt`);
      }
    };
    const handleTelemetryRun = (data: any) => {
      agentLogger.info(`telemetry:run: ${JSON.stringify(data)}`);
      if (data && data.runId) {
        setActiveRunId(data.runId);
        if (data.receiptUrl) setActiveReceiptUrl(data.receiptUrl);
      }
    };
    agent.on('run.created' as any, handleRunCreated);
    agent.on('telemetry:run' as any, handleTelemetryRun);
    return () => {
      agent.off('run.created' as any, handleRunCreated);
      agent.off('telemetry:run' as any, handleTelemetryRun);
    };
  }, [agent]);

  useEffect(() => {
    const startupRunId = `run_${Math.random().toString(36).substring(2, 9)}`;
    agent.emit('run.created' as any, {
      runId: startupRunId,
      receiptUrl: `https://timmy-ai-proxy.wmeldman33.workers.dev/runs/${startupRunId}/receipt`,
      source: 'timmy-tui-startup',
      timestamp: Date.now()
    });
  }, [agent]);

  const animState: 'idle' | 'thinking' | 'streaming' | 'tool_call' | 'error' | 'success' = agentState.isThinking
    ? (agentState.currentTools.length > 0 ? 'tool_call' : 'thinking')
    : agentState.isStreaming
      ? 'streaming'
      : agentState.error
        ? 'error'
        : 'idle';

  const { pipeline } = useGraphicsPipeline(capsState.capabilities, animState, graphicsType);

  const safeExit = () => {
    try { condenseSession(); } catch { /* best-effort */ }
    try { if (pipeline) pipeline.cleanup(); } catch { /* guard */ }
    exit();
    // v1.0.5-keyboard-arch: a lingering handle (companion spawn, heartbeat
    // socket) must never block a clean quit; the exit hook restores the
    // alt-screen before this fires.
    setTimeout(() => process.exit(0), 250);
  };

  const gotoView = (v: number) => {
    setView(v);
    setPaneFocus(0);
  };

  const paletteItems = [
    ...VIEWS.map((vd, i) => ({ label: `${vd.key} · ${vd.label}`, action: () => gotoView(i) })),
    // v1.0.2: model switching + health live strictly here, never in a sidebar
    ...PALETTE_MODELS.map(m => ({ label: `model · ${m.label}`, action: () => agentState.switchModel(m.id) })),
    { label: 'q · Exit Application', action: safeExit }
  ];

  // v1.0.5-keyboard-arch: ONE root dispatcher; the focus stack replaces the
  // modalInput boolean. Palette/help visibility mirrors the stack so Esc-pop
  // at the dispatcher closes them structurally.
  const focus = useFocus();
  useEffect(() => {
    if (!focus.stack.includes('modal:palette')) setCommandPaletteOpen(false);
  }, [focus.stack]);
  useEffect(() => {
    if (!focus.stack.includes('modal:help')) setHelpOpen(false);
  }, [focus.stack]);

  useKeyDispatcher({
    view,
    gotoView,
    cyclePane: rev => {
      const panes = VIEW_PANES[view] ?? 1;
      setPaneFocus(prev => rev ? (prev - 1 + panes) % panes : (prev + 1) % panes);
    },
    openPalette: () => { focus.claim('modal:palette'); setCommandPaletteOpen(true); setPaletteIdx(0); },
    paletteKey: (input, key) => {
      if (key.upArrow) { setPaletteIdx(p => Math.max(0, p - 1)); return; }
      if (key.downArrow) { setPaletteIdx(p => Math.min(paletteItems.length - 1, p + 1)); return; }
      if (key.return) { paletteItems[paletteIdx].action(); focus.release('modal:palette'); return; }
    },
    toggleHelp: () => { focus.claim('modal:help'); setHelpOpen(true); },
    quit: () => { tuiLogger.info('quit captured. Clean exit.'); safeExit(); },
    jumpTelemetry: () => gotoView(2),
    enterCommandInput: () => focus.claim('input:command')
  });

  if (showOnboard) {
    return <Onboarding agent={agent} onDone={() => setShowOnboard(false)} />;
  }

  return (
    <Layout
      view={view}
      paneFocus={paneFocus}
      model={agentState.model}
      totalCost={agentState.totalCost}
      animState={animState}
      activeRunId={activeRunId}
      telemetryStatus={telemetryStatus}
      queuedTelemetryCount={queuedTelemetryCount}
      focusTop={focus.top}
    >
      <Box flexGrow={1} flexShrink={1}>
        <ViewStage
          view={view}
          paneFocus={paneFocus}
          agent={agent}
          setInspector={setInspectorSafe}
        />

        {/* v1.0.4: SOLID full-card overlay — opaque #16161e field, never
            a transparent float over text */}
        {commandPaletteOpen && (
          <Box
            position="absolute"
            top={2}
            left={20}
            borderStyle="double"
            borderColor={theme.brand}
            backgroundColor={theme.bgDeep}
            paddingX={2}
            flexDirection="column"
            width={52}
            height={paletteItems.length + 4}
          >
            <Text bold color={theme.brand}>🏛️ TIMMY COMMAND PALETTE (^K)</Text>
            <Text color={theme.borderDefault}>──────────────────────────────────────────────</Text>
            {paletteItems.map((item, idx) => {
              const isSelected = idx === paletteIdx;
              return (
                <Box key={item.label} backgroundColor={isSelected ? theme.surfaceOverlay : undefined}>
                  <Text color={isSelected ? theme.focus : theme.textPrimary} bold={isSelected}>
                    {String(idx + 1).padStart(2, ' ')}. {item.label}
                  </Text>
                </Box>
              );
            })}
            <Text color={theme.borderDefault}>──────────────────────────────────────────────</Text>
            <Text color={theme.textTertiary}>Arrows scroll · Enter choose · Esc dismiss</Text>
          </Box>
        )}

        {helpOpen && (
          <Box
            position="absolute"
            top={2}
            left={20}
            borderStyle="double"
            borderColor={theme.success}
            backgroundColor={theme.bgDeep}
            paddingX={2}
            flexDirection="column"
            width={52}
          >
            <Text bold color={theme.success}>❓ VIEW GRAMMAR — {VIEWS[view]?.label}</Text>
            <Text color={theme.textSecondary}>────────────────────────────────────────────────</Text>
            <Text bold color={theme.focus}>What is TIMMY?</Text>
            <Text color={theme.textSecondary}>Terminal-first Agent Trust OS — a flight recorder for AI agent runs.</Text>
            <Text color={theme.textSecondary}>What is a receipt? Every action seals a SHA-256 / ed25519 receipt; chains verify from [4] ESCROW.</Text>
            <Text color={theme.borderDefault}>──────────────────────────────────────────────</Text>
            <Text color={theme.textPrimary}>[1-4]     switch top-level views</Text>
            <Text color={theme.textPrimary}>[Tab]     cycle pane focus (⇧Tab reverses)</Text>
            <Text color={theme.textPrimary}>[L]       jump to TELEMETRY</Text>
            <Text color={theme.textPrimary}>[^K]      models + command palette</Text>
            <Text color={theme.textPrimary}>[?]       this overlay · [q] quit · ^C quit</Text>
            <Text color={theme.textSecondary}>────────────────────────────────────────────────</Text>
            <Text color={theme.textSecondary} dimColor>Press ? or ESC to close</Text>
          </Box>
        )}
      </Box>
    </Layout>
  );
}

export function startTUI(config: AgentConfig, mode?: string, graphicsType = 'auto') {
  void mode; // legacy --mode flag accepted; the 4-view shell owns navigation
  // v1.0.4: alternate screen buffer + cleared scrollback; the UI lives in a
  // strict full-screen bounding box and restores the terminal on exit.
  process.stdout.write('\x1b[?1049h\x1b[3J\x1b[H');
  process.on('exit', () => {
    try { process.stdout.write('\x1b[?1049l'); } catch { /* terminal gone */ }
  });
  render(<App config={config} graphicsType={graphicsType} />, {
    exitOnCtrlC: false,
    debug: false,
  });
}

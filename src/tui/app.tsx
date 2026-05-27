import React, { useState, useEffect } from 'react';
import { render, useApp } from 'ink';
import { createAgent } from '../agent/core.js';
import type { AgentConfig } from '../types/index.js';
import { Layout } from './layout.js';
import { ModeRouter, MODES, type Mode } from './router.js';
import { useTerminalCapabilities } from './hooks/useTerminalCapabilities.js';
import { useGraphicsPipeline } from './hooks/useGraphicsPipeline.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { useAgent } from './hooks/useAgent.js';
import { useTelemetryBridge } from './hooks/useTelemetryBridge.js';
import { useCompanionSync } from './hooks/useCompanionSync.js';
import { useModeAgentConfig } from './hooks/useModeAgentConfig.js';

interface AppProps {
  config: AgentConfig;
  initialMode?: Mode;
  graphicsType?: string;
}

function App({ config, initialMode = 'chat', graphicsType = 'auto' }: AppProps) {
  const { exit } = useApp();
  const [mode, setMode] = useState<Mode>(initialMode);

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
      if (data && data.runId) {
        setActiveRunId(data.runId);
        setActiveReceiptUrl(`https://openrouter-tui-agent.wmeldman33.workers.dev/runs/${data.runId}/receipt`);
      }
    };
    const handleReceiptGenerated = (data: any) => {
      if (data && data.receiptUrl) {
        setActiveReceiptUrl(data.receiptUrl);
      }
    };
    const handleTelemetryRun = (data: any) => {
      if (data && data.runId) {
        setActiveRunId(data.runId);
        if (data.receiptUrl) setActiveReceiptUrl(data.receiptUrl);
      }
    };
    const handleSnapshotCreated = () => {
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

  // Bind mode:change emitter events to TUI state router
  useEffect(() => {
    const handleModeChange = (nextMode: Mode) => {
      setMode(nextMode);
    };
    agent.on('mode:change' as any, handleModeChange);
    return () => {
      agent.off('mode:change' as any, handleModeChange);
    };
  }, [agent]);

  // Derive Rive animations state triggers
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
      // Guard circular graphics reference warnings on termination
    }
    exit();
  };

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onEscape: safeExit,
    onCtrlC: safeExit,
    onTab: (shift) => {
      if (mode === 'setup') return; // prevent cycling during onboarding
      if ((agent as any).autocompleteActive) {
        return; // swallow tab and let the active panel handle autocompleting
      }
      const idx = MODES.indexOf(mode);
      const nextIdx = shift
        ? (idx - 1 + MODES.length) % MODES.length
        : (idx + 1) % MODES.length;
      setMode(MODES[nextIdx]);
    },
    onCtrlL: () => {
      if (mode === 'setup') return;
      agentState.clearHistory();
    },
    onCtrlM: () => {
      if (mode === 'setup') return;
      process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
      setMode('model-explorer');
    },
    onCtrlS: () => {
      if (mode === 'setup') return;
      setSnapshotStatus('pending');
      agent.emit('snapshot:requested' as any, {
        runId: activeRunId || 'default-run',
        receiptUrl: activeReceiptUrl || 'none',
        mode,
        timestamp: Date.now()
      });
    }
  });

  return (
    <Layout
      agent={agent}
      mode={mode}
      model={agentState.model}
      pipelineType={pipelineType}
      totalCost={agentState.totalCost}
      animState={animState}
      activeRunId={activeRunId}
      activeReceiptUrl={activeReceiptUrl}
      telemetryStatus={telemetryStatus}
      queuedTelemetryCount={queuedTelemetryCount}
      snapshotStatus={snapshotStatus}
    >
      <ModeRouter mode={mode} agent={agent} />
    </Layout>
  );
}

export function startTUI(config: AgentConfig, mode?: Mode, graphicsType = 'auto') {
  render(<App config={config} initialMode={mode} graphicsType={graphicsType} />, {
    exitOnCtrlC: false,
    debug: false,
  });
}

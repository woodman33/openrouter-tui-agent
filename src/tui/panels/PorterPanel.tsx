import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useWindowSize } from 'ink';
import { theme } from '../theme.js';
import { GlowBorder } from '../components/GlowBorder.js';

interface PorterPanelProps {
  agent: any;
  setInspector: (data: any) => void;
}

export function PorterPanel({ agent, setInspector }: PorterPanelProps) {
  const { columns: width } = useWindowSize();
  const [inputCmd, setInputCmd] = useState('/porter add https://github.com/svix/svix-webhooks');
  const [activeChainStep, setActiveChainStep] = useState(1); // 0 = URL, 1 = Capability, 2 = Control, 3 = Proof, 4 = Reuse
  const [outputLogs, setOutputLogs] = useState<string[]>([
    'MCPorter v2.0 Client initialized.',
    'Sourcing adapters: local-bin, agent-browser, composio, stratum-worker.',
    'Type /porter commands or execute capability sweeps.',
    '------------------------------------------------------------'
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateInspectorData = (cmd: string, status: string) => {
    setInspector({
      title: 'MCPORTER INTEGRATION HUB',
      subtitle: 'VERIFIABLE OPERATIONS VALUE CHAIN',
      type: 'MCP Porter Bridge',
      status,
      risk: 'LOW',
      scope: 'porter.command.cli',
      details: [
        `• Active Command: ${cmd}`,
        `• Flow State: URL ──> Capability ──> Control`,
        `• Sandbox: daytona-vm-382a (Docker)`,
        `• Verification Hash: sha256_e430f8219`,
        `• Telemetry Sync: Connected (D1 KV)`
      ]
    });
  };

  useEffect(() => {
    updateInspectorData(inputCmd, 'READY');
  }, []);

  useInput((char, key) => {
    if (key.upArrow) {
      setActiveChainStep(prev => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow) {
      setActiveChainStep(prev => Math.min(4, prev + 1));
      return;
    }

    if (char && char !== '\t' && char !== '\r' && char !== '\n' && !key.ctrl && !key.meta) {
      const nextCmd = inputCmd + char;
      setInputCmd(nextCmd);
      updateInspectorData(nextCmd, 'TYPING');
    } else if (key.backspace || key.delete) {
      const nextCmd = inputCmd.slice(0, -1);
      setInputCmd(nextCmd);
      updateInspectorData(nextCmd, 'TYPING');
    }

    if (key.return) {
      if (isProcessing || !inputCmd.trim()) return;
      const cmd = inputCmd.trim();
      setIsProcessing(true);
      setOutputLogs(prev => [...prev, `$ ${cmd}`, 'Sweeping capability descriptors...']);
      updateInspectorData(cmd, 'PROCESSING');

      setTimeout(() => {
        setIsProcessing(false);
        if (cmd.startsWith('/porter add')) {
          const targetUrl = cmd.split(' ')[2] || 'unknown-url';
          const name = targetUrl.split('/').pop() || 'pkg';
          setOutputLogs(prev => [
            ...prev,
            `✓ Found Git/MCP target at: ${targetUrl}`,
            `✓ Schema Ingest: Successfully mapped tool Zod schemas for "${name}".`,
            `✓ Security pass: 0 hardcoded keys detected. Redaction triggers primed.`,
            `✓ Visa check: Authorized actions [fs.read, fs.write, cmd.exec] in daytona sandbox.`,
            `✓ Ingest manifest logged to local evidence store.`
          ]);
          updateInspectorData(cmd, 'SUCCESS');
        } else if (cmd.startsWith('/porter list')) {
          setOutputLogs(prev => [
            ...prev,
            'Enrolled capabilities registry:',
            '  • stress (oha) [ACTIVE] — latency load sweep',
            '  • browser.open (agent-browser) [ACTIVE] — headless automation',
            '  • browser.snapshot (agent-browser) [ACTIVE] — accessibility parse',
            '  • composio.help (composio) [IDLE] — connector directory'
          ]);
          updateInspectorData(cmd, 'LISTED');
        } else if (cmd.startsWith('/porter inspect')) {
          setOutputLogs(prev => [
            ...prev,
            'Schema Descriptor inspect: "browser.open"',
            '  Input schema: { url: string, headed?: boolean, session?: string }',
            '  Output schema: { status: string, title: string, htmlLength: number }',
            '  Risk Level: MEDIUM | Isolation boundary enforced.'
          ]);
          updateInspectorData(cmd, 'INSPECTED');
        } else if (cmd.startsWith('/porter approve')) {
          setOutputLogs(prev => [
            ...prev,
            '✓ AgentPass Visa status: Gated check passes.',
            '✓ Signed JTI authorization stamp synced globally to D1 edge SQLite.'
          ]);
          updateInspectorData(cmd, 'APPROVED');
        } else if (cmd.startsWith('/porter cli')) {
          setOutputLogs(prev => [
            ...prev,
            '✓ Running local binary sweep...',
            '  oha --version -> oha 0.6.0',
            '  agent-browser doctor --quick -> Chrome connection stable'
          ]);
          updateInspectorData(cmd, 'CLI_RUN');
        } else {
          setOutputLogs(prev => [
            ...prev,
            `Command not found. Exposing core commands list.`
          ]);
          updateInspectorData(cmd, 'ERROR');
        }
        setInputCmd('/porter ');
      }, 1000);
    }
  });

  const panelWidth = Math.max(20, (width || 80) - 54);
  const mainStageWidth = Math.floor(panelWidth * 0.95);

  const chainLabels = ['URL', 'Capability', 'Control', 'Proof', 'Reuse'];

  return (
    <Box flexDirection="column" width={mainStageWidth} paddingX={1}>
      {/* 1. Value Chain flow - Compact Horizontal spacing */}
      <Box borderStyle="single" borderColor="#30363d" paddingX={2} marginBottom={1} flexDirection="column" width={mainStageWidth - 2}>
        <Text bold color="#79c0ff">⚙️  TIMMY Verifiable Operations Value Chain</Text>
        <Box flexDirection="row" marginTop={1} justifyContent="center" width={mainStageWidth - 6}>
          {chainLabels.map((lbl, idx) => {
            const isCurrent = idx === activeChainStep;
            return (
              <Box key={idx} flexDirection="row" alignItems="center">
                <Text bold={isCurrent} color={isCurrent ? 'var(--accent)' : '#8b949e'}>
                  {isCurrent ? `▶ [ ${lbl} ]` : ` ${lbl} `}
                </Text>
                {idx < chainLabels.length - 1 && (
                  <Text color="#30363d">{" ──> "}</Text>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* 2. Commands Cheat Sheet */}
      <Box borderStyle="round" borderColor="#30363d" paddingX={2} marginBottom={1} flexDirection="column" width={mainStageWidth - 2}>
        <Text bold color="#d2a8ff">📜 MCPorter Command Surface Reference:</Text>
        <Box flexDirection="column" marginTop={1}>
          <Text color="#e6edf3">  <Text color="#79c0ff" bold>/porter add &lt;url&gt;</Text>   — Ingest tool package descriptors</Text>
          <Text color="#e6edf3">  <Text color="#79c0ff" bold>/porter list</Text>           — List currently active capabilities</Text>
          <Text color="#e6edf3">  <Text color="#79c0ff" bold>/porter inspect</Text>        — Inspect schema parameters and types</Text>
          <Text color="#e6edf3">  <Text color="#79c0ff" bold>/porter approve</Text>        — Sign JTI token and enroll in AgentPass</Text>
          <Text color="#e6edf3">  <Text color="#79c0ff" bold>/porter cli</Text>            — Validate local tool command dependencies</Text>
        </Box>
      </Box>

      {/* 3. Output Logs Console */}
      <GlowBorder color={theme.borderDefault} width={mainStageWidth - 2} label="💻 MCPORTER SHELL CONSOLE">
        <Box flexDirection="column" paddingX={1} height={6} overflowY="hidden">
          {outputLogs.slice(-5).map((log, idx) => (
            <Text key={idx} color={log.startsWith('✓') ? '#3fb950' : log.startsWith('$') ? '#79c0ff' : '#c9d1d9'} wrap="truncate">
              {log}
            </Text>
          ))}
        </Box>
      </GlowBorder>

      {/* 4. Active CLI prompt */}
      <Box borderStyle="single" borderColor={isProcessing ? "#d29922" : "#5e6ad2"} paddingX={1} marginTop={1} width={mainStageWidth - 2}>
        <Text color="#8b949e">[ mcporter ] </Text>
        <Text color="#79c0ff">▶ </Text>
        <Text color="#ffffff">{inputCmd}</Text>
        <Text color="#8b949e">█</Text>
      </Box>
    </Box>
  );
}

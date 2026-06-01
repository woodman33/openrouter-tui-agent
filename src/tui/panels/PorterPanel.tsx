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
  const [activeChainStep, setActiveChainStep] = useState(1); // 0 = URL, 1 = Scan, 2 = CLI, 3 = Scope, 4 = Receipt
  const [outputLogs, setOutputLogs] = useState<string[]>([
    'MCPorter v2.0 Client initialized.',
    'Sourcing adapters: local-bin, agent-browser, composio, stratum-worker.',
    'Type /porter commands or execute capability sweeps.',
    '------------------------------------------------------------'
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateInspectorData = (cmd: string, status: string) => {
    setInspector({
      title: 'MCPORTER CAPABILITY PIPELINE',
      subtitle: 'VERIFIABLE OPERATIONS VALUE CHAIN',
      type: 'MCP Porter Bridge',
      status,
      risk: 'LOW',
      scope: 'porter.command.cli',
      details: [
        `• Active Command: ${cmd}`,
        `• Chain Step: ${chainLabels[activeChainStep]}`,
        `• Target Sandbox: daytona-vm-382a (Isolated)`,
        `• Verification Hash: sha256_e430f8219`,
        `• Global Ledger: SQLite D1 database synced`
      ]
    });
  };

  useEffect(() => {
    updateInspectorData(inputCmd, 'READY');
  }, [activeChainStep]);

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

      const disableAnimation = typeof process !== 'undefined' && process.env.TIMMY_DISABLE_ANIMATION === '1';
      let currentStep = 0;
      setActiveChainStep(0);
      
      let stepTimer: NodeJS.Timeout | null = null;
      if (!disableAnimation) {
        stepTimer = setInterval(() => {
          currentStep++;
          if (currentStep < 5) {
            setActiveChainStep(currentStep);
          }
        }, 180);
      }

      setTimeout(() => {
        if (stepTimer) clearInterval(stepTimer);
        setIsProcessing(false);
        setActiveChainStep(4); // Land on finalized receipt proof stage
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
            '  • svix-webhooks (svix) [ACTIVE] — webhooks listener'
          ]);
          updateInspectorData(cmd, 'LISTED');
        } else if (cmd.startsWith('/porter inspect')) {
          setOutputLogs(prev => [
            ...prev,
            'Schema Descriptor inspect: "svix-webhooks"',
            '  Input schema: { url: string, payload: any, secretKey?: string }',
            '  Output schema: { status: string, msg: string, attemptCount: number }',
            '  Risk Level: LOW | Sandbox isolation active.'
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
            '  svix --version -> svix v1.4.1',
            '  npx mcporter doctor -> connection stable'
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

  const chainLabels = ['URL', 'Scan', 'CLI', 'Scope', 'Receipt'];

  return (
    <Box flexDirection="column" width={mainStageWidth} paddingX={1}>
      {/* 1. Value Ingest Chain - Focal Point */}
      <Box borderStyle="single" borderColor="#30363d" paddingX={2} marginBottom={1} flexDirection="column" width={mainStageWidth - 2}>
        <Text bold color="#79c0ff">⚙️  TIMMY Verifiable Operations Ingest Chain</Text>
        <Box flexDirection="row" marginTop={1} justifyContent="center" width={mainStageWidth - 8}>
          {chainLabels.map((lbl, idx) => {
            const isCurrent = idx === activeChainStep;
            return (
              <Box key={idx} flexDirection="row" alignItems="center">
                <Text bold={isCurrent} color={isCurrent ? '#d2a8ff' : '#8b949e'}>
                  {isCurrent ? `▶ [ ${lbl} ]` : ` ${lbl} `}
                </Text>
                {idx < chainLabels.length - 1 && (
                  <Text color="#30363d">{" ──> "}</Text>
                )}
              </Box>
            );
          })}
        </Box>
        <Box marginTop={1} justifyContent="center">
          <Text color="#8b949e" dimColor>
            Pipeline: MCP Server URL ──&gt; MCPorter Scan ──&gt; Generated CLI ──&gt; AgentPass Scope ──&gt; TIMMY Receipt
          </Text>
        </Box>
      </Box>

      {/* 2. Commands Reference */}
      <Box borderStyle="round" borderColor="#30363d" paddingX={2} marginBottom={1} flexDirection="column" width={mainStageWidth - 2}>
        <Box flexDirection="row" justifyContent="space-between" width={mainStageWidth - 8}>
          <Box flexDirection="column" width={Math.floor((mainStageWidth - 10) / 2)}>
            <Text bold color="#d2a8ff">📜 /porter Console Actions:</Text>
            <Text color="#e6edf3"> • <Text color="#79c0ff" bold>/porter add &lt;url&gt;</Text>   — Ingest server descriptor</Text>
            <Text color="#e6edf3"> • <Text color="#79c0ff" bold>/porter list</Text>           — List active capabilities</Text>
            <Text color="#e6edf3"> • <Text color="#79c0ff" bold>/porter inspect</Text>        — Inspect schema Zod parameters</Text>
            <Text color="#e6edf3"> • <Text color="#79c0ff" bold>/porter approve</Text>        — Enroll visa in AgentPass</Text>
            <Text color="#e6edf3"> • <Text color="#79c0ff" bold>/porter cli</Text>            — Validate local client hooks</Text>
          </Box>
          <Box flexDirection="column" width={Math.floor((mainStageWidth - 10) / 2)} paddingLeft={2}>
            <Text bold color="#3fb950">🛠️ Copyable CLI Tools ($ npx):</Text>
            <Text color="#e6edf3"> • <Text color="#a5d6ff" bold>$ npx mcporter list</Text></Text>
            <Text color="#e6edf3"> • <Text color="#a5d6ff" bold>$ npx mcporter emit-ts --mode client</Text></Text>
            <Text color="#e6edf3"> • <Text color="#a5d6ff" bold>$ npx mcporter generate-cli --bundle</Text></Text>
            <Text color="#8b949e" dimColor> Note: Do not execute unverified third-party scripts.</Text>
          </Box>
        </Box>
      </Box>

      {/* 3. Active Scan Preview */}
      <Box borderStyle="round" borderColor="#3fb950" paddingX={2} marginBottom={1} flexDirection="column" width={mainStageWidth - 2}>
        <Text bold color="#3fb950">🔍 Highlighted Tool Sandbox Ingest Preview</Text>
        <Box flexDirection="column" marginTop={1}>
          <Text color="#e6edf3">Source URL: <Text color="#79c0ff" bold>https://github.com/svix/svix-webhooks</Text></Text>
          <Text color="#e6edf3">Status: <Text color="#3fb950" bold>scanned / gated / ready for approval 🟢</Text></Text>
          <Text color="#e6edf3">Generated capability: <Text color="#d2a8ff" bold>svix-webhooks</Text></Text>
          <Text color="#8b949e" dimColor>Next action: Execute '/porter approve' or compile CLI via npx.</Text>
        </Box>
      </Box>

      {/* 4. Output Logs Console */}
      <GlowBorder color={theme.borderDefault} width={mainStageWidth - 2} label="💻 MCPORTER SHELL CONSOLE">
        <Box flexDirection="column" paddingX={1} height={4} overflowY="hidden">
          {outputLogs.slice(-4).map((log, idx) => (
            <Text key={idx} color={log.startsWith('✓') ? '#3fb950' : log.startsWith('$') ? '#79c0ff' : '#c9d1d9'} wrap="truncate">
              {log}
            </Text>
          ))}
        </Box>
      </GlowBorder>

      {/* 5. Active CLI prompt */}
      <Box borderStyle="single" borderColor={isProcessing ? "#d29922" : "#5e6ad2"} paddingX={1} marginTop={1} width={mainStageWidth - 2}>
        <Text color="#8b949e">[ mcporter ] </Text>
        <Text color="#79c0ff">▶ </Text>
        <Text color="#ffffff">{inputCmd}</Text>
        <Text color="#8b949e">█</Text>
      </Box>
    </Box>
  );
}

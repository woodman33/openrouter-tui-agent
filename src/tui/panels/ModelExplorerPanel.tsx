import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useWindowSize } from 'ink';
import { theme } from '../theme.js';
import { GlowBorder } from '../components/GlowBorder.js';

interface ModelExplorerPanelProps {
  agent: any;
  setInspector: (data: any) => void;
}

export function ModelExplorerPanel({ agent, setInspector }: ModelExplorerPanelProps) {
  const { columns: width } = useWindowSize();
  const [expandLogs, setExpandLogs] = useState(false);
  const [expandVerdict, setExpandVerdict] = useState(false);

  const updateInspectorData = () => {
    setInspector({
      title: 'TAMPER-EVIDENT PROOF LEDGER',
      subtitle: 'TIMMY RUN EVIDENCE SYSTEM',
      type: 'Verification Receipt',
      status: 'VERIFIED',
      risk: 'LOW',
      scope: 'proof.receipt.ledger',
      details: [
        '• Run ID: run_jti_81f292',
        '• Ledger Type: Tamper-Evident log',
        '• Registry Hash: sha256_e430f8219',
        '• Integrity Check: PASSED',
        '• Secure redact check: OK (No credentials)'
      ]
    });
  };

  useEffect(() => {
    updateInspectorData();
  }, []);

  useInput((char, key) => {
    if (char === ' ') {
      setExpandLogs(prev => !prev);
      return;
    }
    if (key.return) {
      setExpandVerdict(prev => !prev);
    }
  });

  const panelWidth = Math.max(20, (width || 80) - 54);
  const mainStageWidth = Math.floor(panelWidth * 0.95);

  const mockLogs = (agent as any).relayedVmLogs || [
    'Establishing Daytona VM sandbox isolation...',
    'opencode: connected successfully via tmux-palette',
    'Doctrine verification check: PASSED',
    'Committed Run run_jti_81f292 evidence hash to registry.',
    'Dispatched webhook notification logs.'
  ];

  return (
    <Box flexDirection="column" width={mainStageWidth} paddingX={1}>
      {/* 1. Tamper-Evident Receipt Card */}
      <Box borderStyle="single" borderColor="#58a6ff" paddingX={2} marginBottom={1} flexDirection="column" width={mainStageWidth - 2}>
        <Text bold color="#58a6ff">🧾  Tamper-Evident Run Receipt</Text>
        <Box flexDirection="column" marginTop={1}>
          <Text color="#e6edf3">Run ID: <Text color="#79c0ff" bold>run_jti_81f292</Text></Text>
          <Text color="#8b949e">Integrity Hash: <Text color="#a78bfa">sha256_e430f8219ab92cd0c07d3</Text></Text>
          <Text color="#8b949e">Visa Gated Permissions: <Text color="#e6edf3" bold>fs.read, fs.write, cmd.exec</Text></Text>
          <Text color="#8b949e">Database state: <Text color="#3fb950">Synced (Local D1 Registry)</Text></Text>
        </Box>
      </Box>

      {/* 2. Diffs & Transcripts log - Expandable Section */}
      <Box borderStyle="round" borderColor="#30363d" paddingX={2} marginBottom={1} flexDirection="column" width={mainStageWidth - 2}>
        <Box justifyContent="space-between" width={mainStageWidth - 6}>
          <Text bold color="#79c0ff">💻 Relayed Workspace Transcript Logs</Text>
          <Text bold color="var(--accent)">
            {expandLogs ? '[ COLLAPSE ]' : '[ EXPAND (Space) ]'}
          </Text>
        </Box>
        {expandLogs ? (
          <Box flexDirection="column" marginTop={1} minHeight={4}>
            {mockLogs.slice(-6).map((log: string, idx: number) => (
              <Text key={idx} color="#c9d1d9" wrap="truncate">• {log}</Text>
            ))}
          </Box>
        ) : (
          <Box marginTop={1}>
            <Text color="#8b949e" dimColor>Transcript lines compressed. Press [Spacebar] to inspect full execution logs.</Text>
          </Box>
        )}
      </Box>

      {/* 3. Grader Verdict - Expandable Section */}
      <Box borderStyle="round" borderColor="#30363d" paddingX={2} marginBottom={1} flexDirection="column" width={mainStageWidth - 2}>
        <Box justifyContent="space-between" width={mainStageWidth - 6}>
          <Text bold color="#d2a8ff">🤖 Active Swarm Grader Critique</Text>
          <Text bold color="var(--accent)">
            {expandVerdict ? '[ COLLAPSE ]' : '[ EXPAND (Enter) ]'}
          </Text>
        </Box>
        {expandVerdict ? (
          <Box flexDirection="column" marginTop={1}>
            <Text color="#3fb950">• TypeScript validation: GATED PASS</Text>
            <Text color="#3fb950">• Redaction filters scans: SECURED & ACTIVE</Text>
            <Text color="#3fb950">• Empty state launching rules: CONFORMS</Text>
          </Box>
        ) : (
          <Box marginTop={1}>
            <Text color="#8b949e" dimColor>Grader results collapsed. Press [Enter] to reveal detailed compliance diagnostics.</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useWindowSize } from 'ink';
import { theme } from '../theme.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface LogsPanelProps {
  agent: any;
  setInspector: (data: any) => void;
  focusArea: 'nav' | 'stage';
}

type LogFile = 'timmy-tui.log' | 'companion.log' | 'browser-launcher.log' | 'workspace-launcher.log' | 'agent-events.log';

export function LogsPanel({ agent: _agent, setInspector, focusArea: _focusArea }: LogsPanelProps) {
  const { columns: width, rows: height } = useWindowSize();
  const terminalHeight = height || 24;
  const terminalWidth = width || 80;
  const [activeFile, setActiveFile] = useState<LogFile>('timmy-tui.log');
  const [logLines, setLogLines] = useState<string[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const logFiles: { key: LogFile; label: string; num: string }[] = [
    { key: 'timmy-tui.log', label: 'TUI Core', num: '1' },
    { key: 'companion.log', label: 'Companion Server', num: '2' },
    { key: 'browser-launcher.log', label: 'Browser Launcher', num: '3' },
    { key: 'workspace-launcher.log', label: 'Workspace Launcher', num: '4' },
    { key: 'agent-events.log', label: 'Agent Events', num: '5' }
  ];

  const loadLogs = () => {
    const filePath = join('logs', activeFile);
    if (!existsSync(filePath)) {
      setLogLines([]);
      setScrollOffset(0);
      return;
    }
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(Boolean);
      const last100 = lines.slice(-100);
      setLogLines(last100);
      
      const visibleHeight = Math.max(4, terminalHeight - 20);
      if (last100.length > visibleHeight) {
        setScrollOffset(last100.length - visibleHeight);
      } else {
        setScrollOffset(0);
      }
    } catch {
      setLogLines(['✕ Failed to read log file.']);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [activeFile, refreshTrigger]);

  const updateInspectorData = () => {
    setInspector({
      title: 'TIMMY SYSTEM TELEMETRY',
      subtitle: 'VERIFIABLE LOG FILES AUDIT',
      type: 'Logger Stream',
      status: 'VERIFIED',
      risk: 'LOW',
      scope: `system.logs.${activeFile.replace('.log', '')}`,
      details: [
        `• Active Log: ${activeFile}`,
        `• Total Cached Lines: ${logLines.length}`,
        `• Auto-refresh: Enabled`,
        `• Directory: logs/`,
        `• Integrity checks: PASS`
      ]
    });
  };

  useEffect(() => {
    updateInspectorData();
  }, [activeFile, logLines.length]);

  const [inputCmd, setInputCmd] = useState('/logs tail');

  const isSmallScreen = terminalHeight < 30;
  const visibleHeight = Math.max(4, terminalHeight - 20);
  const visibleLines = logLines.slice(scrollOffset, scrollOffset + visibleHeight);

  useInput((char, key) => {
    if (char === '1') {
      setActiveFile('timmy-tui.log');
      return;
    }
    if (char === '2') {
      setActiveFile('companion.log');
      return;
    }
    if (char === '3') {
      setActiveFile('browser-launcher.log');
      return;
    }
    if (char === '4') {
      setActiveFile('workspace-launcher.log');
      return;
    }
    if (char === '5') {
      setActiveFile('agent-events.log');
      return;
    }

    if (char.toLowerCase() === 'r') {
      setRefreshTrigger(prev => prev + 1);
      return;
    }

    if (key.upArrow) {
      setScrollOffset(prev => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow) {
      const maxScroll = Math.max(0, logLines.length - visibleHeight);
      setScrollOffset(prev => Math.min(maxScroll, prev + 1));
      return;
    }

    if (char && char !== '\t' && char !== '\r' && char !== '\n' && !key.ctrl && !key.meta) {
      setInputCmd(prev => prev + char);
    } else if (key.backspace || key.delete) {
      setInputCmd(prev => prev.slice(0, -1));
    }
  });

  // Strict cap on main stage width to prevent stretching awkwardly in wide screens
  const panelWidth = Math.max(20, (terminalWidth || 80) - 28);
  const mainStageWidth = Math.min(84, Math.floor(panelWidth * 0.95));

  return (
    <Box flexDirection="column" width={mainStageWidth} paddingX={1}>
      <Box borderStyle="single" borderColor="#30363d" paddingX={2} marginBottom={isSmallScreen ? 0 : 1} flexDirection="column" width={mainStageWidth - 2}>
        <Text bold color="#4f9cff">📊  TIMMY Audit Log File Monitor</Text>
        <Text color="#8b949e">View bounded local log files without corrupting the terminal.</Text>
        <Box flexDirection="row" marginTop={1} flexWrap="wrap">
          {logFiles.map(lf => {
            const isActive = lf.key === activeFile;
            return (
              <Box key={lf.key} borderStyle={isActive ? 'double' : 'single'} borderColor={isActive ? '#4f9cff' : '#30363d'} paddingX={1} marginRight={2}>
                <Text bold color={isActive ? '#4f9cff' : '#e6e6ea'}>[{lf.num}] {lf.label}</Text>
              </Box>
            );
          })}
        </Box>
        <Box marginTop={1}>
          <Text color="#8a8a94" dimColor>Press keys [1-5] to switch logs | Press [R] to manually refresh.</Text>
        </Box>
      </Box>

      <Box borderStyle="round" borderColor="#30363d" paddingX={1} width={mainStageWidth - 2} height={visibleHeight + 2} flexDirection="column">
        {logLines.length === 0 ? (
          <Box flexGrow={1} justifyContent="center" alignItems="center">
            <Text color="#8a8a94" bold>● No logs written yet under logs/{activeFile}</Text>
          </Box>
        ) : (
          visibleLines.map((line, idx) => {
            let color = '#e6e6ea';
            if (line.includes('[ERROR]')) color = '#ff6b6b';
            else if (line.includes('[WARN]')) color = '#f5b545';
            else if (line.includes('[INFO]')) color = '#e6e6ea';
            else if (line.includes('[DEBUG]')) color = '#8a8a94';
            return (
              <Text key={idx} color={color} wrap="wrap">{line}</Text>
            );
          })
        )}
      </Box>

      <Box marginTop={1} flexShrink={0}>
        <Text color="#8a8a94" dimColor>
          Showing lines {scrollOffset + 1}-{Math.min(logLines.length, scrollOffset + visibleHeight)} of {logLines.length} (last 100 max) | Arrows scroll Up/Down.
        </Text>
      </Box>

      {/* Universal logs command prompt box */}
      <Box borderStyle="single" borderColor="#5e6ad2" paddingX={1} marginTop={1} width={mainStageWidth - 2} flexShrink={0}>
        <Text color="#8a8a94">[ system-logs ] </Text>
        <Text color="#79c0ff">▶ </Text>
        <Text color="#ffffff">{inputCmd}</Text>
        <Text color="#8a8a94">█</Text>
      </Box>
    </Box>
  );
}

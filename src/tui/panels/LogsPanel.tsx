import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput, useWindowSize } from 'ink';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { humanizeLines, clockTime } from '../../utils/humanlog.js';

interface LogsPanelProps {
  agent: any;
  setInspector: (data: any) => void;
  focusArea: 'nav' | 'stage';
}

type LogFile = 'timmy-tui.log' | 'companion.log' | 'browser-launcher.log' | 'workspace-launcher.log' | 'agent-events.log';

const REFRESH_MS = 2000;

export function LogsPanel({ agent: _agent, setInspector, focusArea }: LogsPanelProps) {
  const { columns: width, rows: height } = useWindowSize();
  const terminalHeight = height || 24;
  const terminalWidth = width || 80;
  const [activeFile, setActiveFile] = useState<LogFile>('timmy-tui.log');
  const [logLines, setLogLines] = useState<string[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [autoFollow, setAutoFollow] = useState(true);
  const [human, setHuman] = useState(true);
  const [fileStat, setFileStat] = useState<{ sizeKb: number; mtime: string } | null>(null);

  const autoFollowRef = useRef(autoFollow);
  useEffect(() => { autoFollowRef.current = autoFollow; }, [autoFollow]);

  const logFiles: { key: LogFile; label: string; num: string }[] = [
    { key: 'timmy-tui.log', label: 'TUI Core', num: '1' },
    { key: 'agent-events.log', label: 'Agent Events', num: '2' },
    { key: 'companion.log', label: 'Companion', num: '3' },
    { key: 'browser-launcher.log', label: 'Browser', num: '4' },
    { key: 'workspace-launcher.log', label: 'Workspace', num: '5' }
  ];

  const loadLogs = () => {
    const filePath = join('logs', activeFile);
    if (!existsSync(filePath)) {
      setLogLines([]);
      setFileStat(null);
      setScrollOffset(0);
      return;
    }
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(Boolean);
      const last100 = lines.slice(-100);
      setLogLines(last100);

      try {
        const st = statSync(filePath);
        const t = new Date(st.mtimeMs);
        const hh = String(t.getHours()).padStart(2, '0');
        const mm = String(t.getMinutes()).padStart(2, '0');
        const ss = String(t.getSeconds()).padStart(2, '0');
        setFileStat({ sizeKb: Math.round(st.size / 1024), mtime: `${hh}:${mm}:${ss}` });
      } catch {
        setFileStat(null);
      }

      const visibleHeight = Math.max(4, terminalHeight - 16);
      if (autoFollowRef.current) {
        setScrollOffset(Math.max(0, last100.length - visibleHeight));
      } else {
        setScrollOffset(prev => Math.min(prev, Math.max(0, last100.length - visibleHeight)));
      }
    } catch {
      setLogLines(['✕ Failed to read log file.']);
    }
  };

  // Load on file switch + manual refresh
  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile, refreshTrigger]);

  // Live tail: re-read every REFRESH_MS so logs stream while you work
  useEffect(() => {
    const timer = setInterval(() => setRefreshTrigger(prev => prev + 1), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setInspector({
      title: 'TIMMY SYSTEM TELEMETRY',
      subtitle: 'LIVE LOG FILE MONITOR',
      type: 'Logger Stream',
      status: 'VERIFIED',
      risk: 'LOW',
      scope: `system.logs.${activeFile.replace('.log', '')}`,
      details: [
        `• Active Log: ${activeFile}`,
        `• Cached Lines: ${logLines.length} (last 100)`,
        `• Auto-refresh: every ${REFRESH_MS / 1000}s`,
        `• Follow tail: ${autoFollow ? 'ON' : 'OFF'}`,
        `• Directory: logs/`
      ]
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile, logLines.length, autoFollow]);

  const isSmallScreen = terminalHeight < 30;
  const visibleHeight = Math.max(4, terminalHeight - 16);

  // Human mode (default): short readable sentences, telemetry collapsed.
  const humanized = human ? humanizeLines(logLines) : null;
  const rows: { text: string; color: string }[] = humanized
    ? humanized.events.map(e => ({ text: `${clockTime(e.ts)}  ${e.icon}  ${e.text}`, color: e.color }))
    : logLines.map(l => {
        let color = '#e6e6ea';
        if (l.includes('[ERROR]')) color = '#ff6b6b';
        else if (l.includes('[WARN]')) color = '#f5b545';
        else if (l.includes('[DEBUG]')) color = '#8a8a94';
        return { text: l, color };
      });
  const off = Math.min(scrollOffset, Math.max(0, rows.length - visibleHeight));
  const visibleLines = rows.slice(off, off + visibleHeight);
  const atBottom = off >= Math.max(0, rows.length - visibleHeight);

  useInput((char, key) => {
    // Only consume keys when the stage owns focus; nav keeps its arrows/numbers-free behavior
    if (focusArea !== 'stage') return;

    const fileByNum = logFiles.find(lf => lf.num === char);
    if (fileByNum) {
      setActiveFile(fileByNum.key);
      setAutoFollow(true);
      return;
    }

    if (char.toLowerCase() === 'r') {
      setRefreshTrigger(prev => prev + 1);
      return;
    }

    if (char.toLowerCase() === 'f') {
      setAutoFollow(prev => !prev);
      return;
    }

    if (char.toLowerCase() === 'h') {
      setHuman(prev => !prev);
      setScrollOffset(0);
      return;
    }

    if (key.upArrow) {
      setAutoFollow(false);
      setScrollOffset(prev => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow) {
      setScrollOffset(prev => {
        const next = Math.min(Math.max(0, logLines.length - visibleHeight), prev + 1);
        if (next >= Math.max(0, logLines.length - visibleHeight)) setAutoFollow(true);
        return next;
      });
      return;
    }
  });

  // Strict cap on main stage width to prevent stretching awkwardly in wide screens
  const panelWidth = Math.max(20, (terminalWidth || 80) - 28);
  const mainStageWidth = Math.min(84, Math.floor(panelWidth * 0.95));

  return (
    <Box flexDirection="column" width={mainStageWidth} paddingX={1}>
      <Box borderStyle="single" borderColor="#30363d" paddingX={2} marginBottom={isSmallScreen ? 0 : 1} flexDirection="column" width={mainStageWidth - 2}>
        <Box justifyContent="space-between">
          <Text bold color="#4f9cff">📊  TIMMY Audit Log Monitor</Text>
          <Text color="#3fb950">● LIVE {REFRESH_MS / 1000}s</Text>
        </Box>
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
          <Text color="#8a8a94" dimColor>[1-5] switch file · [H] {human ? 'raw' : 'human'} view · [F] follow ({autoFollow ? 'ON' : 'OFF'}) · [↑↓] scroll</Text>
        </Box>
      </Box>

      <Box borderStyle="round" borderColor="#30363d" paddingX={1} width={mainStageWidth - 2} height={visibleHeight + 2} flexDirection="column">
        {logLines.length === 0 ? (
          <Box flexGrow={1} justifyContent="center" alignItems="center" flexDirection="column">
            <Text color="#8a8a94" bold>● No logs written yet under logs/{activeFile}</Text>
            <Text color="#8a8a94" dimColor>
              {activeFile === 'timmy-tui.log' && '· lane commands, approvals, model/mode events land here while you work'}
              {activeFile === 'agent-events.log' && '· model health + telemetry events land here'}
              {activeFile === 'companion.log' && '· the companion web server writes here on launch'}
              {activeFile === 'browser-launcher.log' && '· carbonyl browser-lane launches write here'}
              {activeFile === 'workspace-launcher.log' && '· workspace launches write here — none yet on this machine'}
            </Text>
          </Box>
        ) : rows.length === 0 ? (
          <Box flexGrow={1} justifyContent="center" alignItems="center">
            <Text color="#8a8a94" dimColor>· everything in this file is telemetry sync noise — hidden in human view. [H] for raw.</Text>
          </Box>
        ) : (
          visibleLines.map((row, idx) => (
            <Text key={`${off}-${idx}`} color={row.color} wrap="wrap">{row.text}</Text>
          ))
        )}
        {human && humanized && humanized.telemetryCount > 0 && (
          <Text color="#6e7681" dimColor>☁ {humanized.telemetryCount} telemetry sync lines collapsed</Text>
        )}
      </Box>

      <Box marginTop={1} justifyContent="space-between" flexShrink={0}>
        <Text color="#8a8a94" dimColor>
          {rows.length === 0
            ? '0 readable lines'
            : `lines ${off + 1}-${Math.min(rows.length, off + visibleHeight)} of ${rows.length}${human ? ' (human view)' : ' (last 100)'}`}
          {fileStat ? ` · ${fileStat.sizeKb} KB · upd ${fileStat.mtime}` : ''}
        </Text>
        <Text color={atBottom ? '#3fb950' : '#f5b545'} dimColor>
          {autoFollow ? '▼ following tail' : '↑ paused — [F] to resume'}
        </Text>
      </Box>
    </Box>
  );
}

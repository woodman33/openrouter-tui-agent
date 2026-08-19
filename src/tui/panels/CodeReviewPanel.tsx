import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useWindowSize } from 'ink';
import chalk from 'chalk';
import { theme } from '../theme.js';
import { execSync, exec } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { getResponsiveLayout } from '../utils/responsive.js';
import http from 'http';
import { PrimaryButton, SecondaryButton, WarningButton } from '../components/DesignSystem.js';
import { truncateVisible } from '../utils/text.js';

interface CodeReviewPanelProps {
  agent: any;
  setInspector: (data: any) => void;
  focusArea?: 'nav' | 'stage';
}

function checkUrlHealth(url: string, timeoutMs = 600): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const req = http.request(
        {
          method: 'HEAD',
          hostname: parsedUrl.hostname,
          port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 80,
          path: parsedUrl.pathname,
          timeout: timeoutMs,
        },
        (res) => {
          resolve(res.statusCode ? res.statusCode >= 200 && res.statusCode < 400 : false);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

export function CodeReviewPanel({ agent, setInspector, focusArea = 'stage' }: CodeReviewPanelProps) {
  const { columns: width, rows: height } = useWindowSize();
  const terminalHeight = height || 24;
  const isSmallScreen = terminalHeight < 36;

  // Binary detection & health states
  const [carbonylInstalled, setCarbonylInstalled] = useState(false);
  const [tmuxInstalled, setTmuxInstalled] = useState(false);
  const [browserRunning, setBrowserRunning] = useState<boolean | null>(null);

  // Fallback states
  const [isTmuxExpanded, setIsTmuxExpanded] = useState(false);
  const [tmuxSessionExists, setTmuxSessionExists] = useState(false);
  const [tmuxLastOutput, setTmuxLastOutput] = useState<string>('No recent activity.');

  // Workspace Launcher active selection
  const [activeBtnIdx, setActiveBtnIdx] = useState(0);
  const [outputLog, setOutputLog] = useState<string>('Select an action to launch work surface.');
  const [inputCmd, setInputCmd] = useState('/workspace browser');

  const companionPort = (global as any).companionServer?.port || 3001;
  const companionUrl = `http://localhost:${companionPort}`;

  const buttons = [
    { label: 'Open In-Pane Browser', key: 'carbonyl', desc: 'carbonyl Chromium lane (headless in terminal)' },
    { label: 'Open Browser Companion', key: 'browser', desc: 'Browser mirror surface' },
    { label: 'Open Local Files', key: 'files', desc: 'Workspace root explorer' },
    { label: 'View Logs', key: 'logs', desc: 'Bounded event logs' },
    { label: 'Show tmux Fallback', key: 'tmux', desc: 'Persistent run fallback' }
  ];

  const checkTmuxSession = () => {
    if (!tmuxInstalled) return;
    try {
      execSync('tmux has-session -t timmy-run 2>/dev/null');
      setTmuxSessionExists(true);
      const lastLine = execSync('tmux capture-pane -t timmy-run -p | tail -n 5 | grep -v "^$" | tail -n 1 2>/dev/null').toString().trim();
      if (lastLine) setTmuxLastOutput(lastLine);
    } catch {
      setTmuxSessionExists(false);
      setTmuxLastOutput('No active session.');
    }
  };

  // Detect binaries and setup
  useEffect(() => {
    try {
      execSync('command -v carbonyl', { stdio: 'ignore' });
      setCarbonylInstalled(true);
    } catch {
      setCarbonylInstalled(existsSync(join(homedir(), '.local', 'bin', 'carbonyl')));
    }

    try {
      execSync('command -v tmux', { stdio: 'ignore' });
      setTmuxInstalled(true);
    } catch {
      setTmuxInstalled(false);
    }

    checkUrlHealth(companionUrl).then(healthy => {
      setBrowserRunning(healthy);
    });
  }, []);

  useEffect(() => {
    checkTmuxSession();
  }, [tmuxInstalled]);

  // Dynamic next step state / inspector
  const updateInspectorData = () => {
    const btn = buttons[activeBtnIdx] || buttons[0];
    setInspector({
      title: 'TIMMY WORKSPACE OPERATOR',
      subtitle: 'VERIFIABLE PARALLEL LAUNCHER',
      type: 'Workspace Shell',
      status: 'READY',
      risk: 'LOW',
      scope: `workspace.launcher.${btn.key}`,
      details: [
        `• Selected Launcher: ${btn.label}`,
        `• carbonyl status: ${carbonylInstalled ? 'READY' : 'MISSING'}`,
        `• tmux status: ${tmuxInstalled ? 'READY' : 'MISSING'}`,
        `• Companion: ${browserRunning ? 'RUNNING' : 'NOT RUNNING'}`
      ]
    });
  };

  useEffect(() => {
    updateInspectorData();
  }, [activeBtnIdx, carbonylInstalled, tmuxInstalled, browserRunning]);

  // Main input cmd sync
  useEffect(() => {
    if (buttons[activeBtnIdx]) {
      const btn = buttons[activeBtnIdx];
      if (btn.key === 'files') {
        setInputCmd('/files');
      } else if (btn.key === 'logs') {
        setInputCmd('/logs');
      } else if (btn.key === 'tmux') {
        setInputCmd('/workspace tmux');
      } else if (btn.key === 'browser') {
        setInputCmd('/workspace browser');
      } else {
        setInputCmd(`/workspace launch ${btn.key}`);
      }
    }
  }, [activeBtnIdx]);

  const copyTmuxCommand = () => {
    try {
      execSync('echo "tmux attach -t timmy-run" | pbcopy');
      setOutputLog('✓ Attach command copied to clipboard: tmux attach -t timmy-run');
    } catch {
      setOutputLog('✕ Clipboard copy failed.');
    }
  };

  const killTmuxSession = () => {
    try {
      execSync('tmux kill-session -t timmy-run 2>/dev/null');
      checkTmuxSession();
      setOutputLog('✓ Active tmux fallback session killed successfully.');
    } catch (e: any) {
      setOutputLog(`✕ Kill command failed: ${e.message}`);
    }
  };

  // Key navigation engine
  useInput((char, key) => {
    if (focusArea !== 'stage') return;

    if (key.leftArrow || key.upArrow) {
      setActiveBtnIdx(prev => Math.max(0, prev - 1));
      return;
    }
    if (key.rightArrow || key.downArrow || key.tab) {
      setActiveBtnIdx(prev => Math.min(4, prev + 1));
      return;
    }

    if (key.return) {
      const keyStr = buttons[activeBtnIdx]?.key;
      if (!keyStr) return;

      if (keyStr === 'carbonyl') {
        if (carbonylInstalled) {
          agent.emit('workspace:add-browser-pane', companionUrl);
          setOutputLog(`✓ Opening carbonyl in-pane browser lane at ${companionUrl}`);
        } else {
          setOutputLog('✕ carbonyl not found. Install: https://github.com/fathyb/carbonyl/releases');
        }
      } else if (keyStr === 'browser') {
        checkUrlHealth(companionUrl).then(healthy => {
          setBrowserRunning(healthy);
          if (healthy) {
            setOutputLog('✓ Port active. Launching companion interface in browser...');
            exec(`open ${companionUrl}`, {});
          } else {
            setOutputLog('✕ Browser companion is not running. Start it first, then retry.');
          }
        });
      } else if (keyStr === 'files') {
        agent.emit('mode:change', 'files');
      } else if (keyStr === 'logs') {
        agent.emit('mode:change', 'logs');
      } else if (keyStr === 'tmux') {
        setIsTmuxExpanded(prev => !prev);
        if (!tmuxSessionExists && tmuxInstalled) {
          setOutputLog('✓ Initializing background tmux session...');
          try {
            execSync('tmux new-session -d -s timmy-run 2>/dev/null || true', { stdio: 'ignore' });
            checkTmuxSession();
            setOutputLog('✓ tmux fallback initialized. Details expanded below.');
          } catch (e: any) {
            setOutputLog(`✕ Failed to initialize tmux: ${e.message}`);
          }
        } else {
          setOutputLog('✓ Toggled tmux fallback details card view.');
        }
      }
    }

    if (char.toLowerCase() === 'c' && tmuxSessionExists) {
      copyTmuxCommand();
    } else if (char.toLowerCase() === 'k' && tmuxSessionExists) {
      killTmuxSession();
    }
  });

  // Responsive width calculation — match layout.tsx breakpoints
  const terminalWidth = width || 80;
  const { mainStageWidth, isCompact } = getResponsiveLayout(terminalWidth);

  const renderRow = (idx: number) => {
    const isSelected = idx === activeBtnIdx;
    const btn = buttons[idx];
    const marker = isSelected ? '▶ ' : '  ';
    
    let labelColor = theme.textPrimary;
    if (isSelected) {
      labelColor = theme.success;
    } else {
      if (btn.key === 'carbonyl') labelColor = theme.brand;
      else if (btn.key === 'browser') labelColor = theme.info;
      else if (btn.key === 'files') labelColor = theme.brand;
      else if (btn.key === 'logs') labelColor = theme.success;
      else if (btn.key === 'tmux') labelColor = theme.warning;
    }

    let statusText = 'READY';
    let statusColor = theme.success;
    if (btn.key === 'carbonyl') {
      statusText = carbonylInstalled ? 'READY' : 'MISSING';
      statusColor = carbonylInstalled ? theme.success : theme.error;
    } else if (btn.key === 'browser') {
      statusText = browserRunning ? 'RUNNING' : 'NOT RUNNING';
      statusColor = browserRunning ? theme.success : theme.warning;
    } else if (btn.key === 'tmux') {
      statusText = tmuxInstalled ? 'READY' : 'MISSING';
      statusColor = tmuxInstalled ? theme.success : theme.error;
    }

    const prefixStr = isSelected ? '┃ ' : '│ ';
    const prefixColor = isSelected ? theme.success : theme.textTertiary;
    
    const rowWidth = mainStageWidth - 6;
    const col1Width = 3;
    const col3Width = 16;
    const showDesc = rowWidth > 55;
    const col2Width = showDesc ? 26 : Math.max(10, rowWidth - col1Width - col3Width - 2);
    const col4Width = showDesc ? Math.max(10, rowWidth - col1Width - col2Width - col3Width) : 0;

    const truncatedLabel = truncateVisible(marker + btn.label, col2Width - 1);
    const truncatedStatus = truncateVisible(`[ ${statusText} ]`, col3Width - 1);
    const truncatedDesc = showDesc ? truncateVisible(btn.desc, col4Width - 1) : '';

    return (
      <Box key={btn.key} flexDirection="row" marginBottom={1} width={rowWidth}>
        <Box width={col1Width} flexShrink={0}>
          <Text color={prefixColor}>{prefixStr}</Text>
        </Box>
        <Box width={col2Width} flexShrink={0}>
          <Text bold={isSelected} color={labelColor}>{truncatedLabel}</Text>
        </Box>
        <Box width={col3Width} flexShrink={0}>
          <Text bold color={statusColor}>{truncatedStatus}</Text>
        </Box>
        {showDesc && (
          <Box width={col4Width} flexGrow={1} flexShrink={1}>
            <Text color={isSelected ? theme.textPrimary : theme.textSecondary}>{truncatedDesc}</Text>
          </Box>
        )}
      </Box>
    );
  };

  const activeBtn = buttons[activeBtnIdx] || buttons[0];
  let detailedExplain = '';
  let detailedAction = `[Enter] ${activeBtn.label}`;
  
  if (activeBtn.key === 'carbonyl') {
    detailedExplain = 'Spawns a carbonyl session (real Chromium renderer) as a tracked TIMMY lane inside your active multiplexer backend. Browsing happens headlessly in the terminal.';
  } else if (activeBtn.key === 'browser') {
    detailedExplain = 'Opens the Browser Companion. It mirrors chat, logs, workspace status, and receipts.';
  } else if (activeBtn.key === 'files') {
    detailedExplain = 'Opens the safe Workspace Root browser.';
  } else if (activeBtn.key === 'logs') {
    detailedExplain = 'Opens bounded local logs without corrupting the terminal.';
  } else if (activeBtn.key === 'tmux') {
    detailedExplain = 'tmux keeps a recoverable terminal session alive. It may not open a visual UI.';
  }

  return (
    <Box flexDirection="column" width={mainStageWidth} paddingX={1} flexGrow={1} flexShrink={1}>
      
      {/* 1. Header Explainer */}
      <Box borderStyle="single" borderColor={theme.borderDefault} paddingX={2} marginBottom={isSmallScreen ? 0 : 1} flexDirection="column" width={mainStageWidth - 2} flexShrink={0}>
        <Text bold color={theme.brand}>TIMMY Workspace</Text>
        <Text color={theme.textSecondary}>Choose where work happens. carbonyl renders a real browser in a pane. Browser Companion mirrors TIMMY. tmux is fallback persistence.</Text>
      </Box>

      {/* 2. Main Command List */}
      <Box borderStyle="round" borderColor={theme.borderDefault} paddingX={2} marginBottom={isSmallScreen ? 0 : 1} flexDirection="column" width={mainStageWidth - 2}>
        {buttons.map((_, idx) => renderRow(idx))}
      </Box>

      {/* 3. Detail Panel */}
      <Box borderStyle="round" borderColor={focusArea === 'stage' ? theme.success : theme.borderDefault} paddingX={2} marginBottom={isSmallScreen ? 0 : 1} flexDirection="column" width={mainStageWidth - 2}>
        <Text bold color={theme.brand}>Selected:</Text>
        <Text bold color={theme.textPrimary}>{activeBtn.label}</Text>
        
        <Box marginTop={1} flexDirection="column">
          <Text bold color={theme.textSecondary}>What it does:</Text>
          <Text color={theme.textPrimary}>{detailedExplain}</Text>
        </Box>

        {activeBtn.key === 'carbonyl' && (
          <Box marginTop={1} flexDirection="column">
            <Text bold color={theme.textSecondary}>Target URL:</Text>
            <Text color={theme.info}>{companionUrl}</Text>
          </Box>
        )}

        {activeBtn.key === 'tmux' && (
          <Box marginTop={1} flexDirection="column">
            <Text bold color={theme.textSecondary}>Attach command:</Text>
            <Text color={theme.info} bold>tmux attach -t timmy-run</Text>
            {isTmuxExpanded && tmuxInstalled && (
              <Box flexDirection="column" borderStyle="single" borderColor={theme.warning} paddingX={2} marginY={1}>
                <Text color={theme.textPrimary}> • Session Name  : <Text color={theme.textPrimary} bold>timmy-run</Text></Text>
                <Text color={theme.textPrimary}> • Status        : {tmuxSessionExists ? <Text color={theme.success} bold>READY</Text> : <Text color={theme.textSecondary}>STANDBY</Text>}</Text>
                <Text color={theme.textPrimary}> • Last Output   : <Text color={theme.textSecondary} italic>"{truncateVisible(tmuxLastOutput, Math.max(10, mainStageWidth - 30))}"</Text></Text>
              </Box>
            )}
          </Box>
        )}

        <Box marginTop={1} flexDirection="row" justifyContent="flex-start">
          <Text bold color={theme.success}>{detailedAction} </Text>
          {activeBtn.key === 'tmux' && tmuxSessionExists && (
            <Text color={theme.textSecondary}> | Press [C] to Copy Attach Command | Press [K] to Kill Session</Text>
          )}
        </Box>
      </Box>

      {/* 4. Gated OpenHands Status Pill */}
      <Box paddingX={2} marginBottom={isSmallScreen ? 0 : 1} width={mainStageWidth - 2} flexShrink={0}>
        <Text color={theme.textSecondary}>OpenHands Runner: not configured</Text>
      </Box>

      {/* 5. Diagnostics Log verifier */}
      <Box borderStyle="single" borderColor={theme.borderDefault} paddingX={2} width={mainStageWidth - 2} flexShrink={0} marginBottom={isSmallScreen ? 0 : 1}>
        <Text color={theme.textSecondary}>{outputLog}</Text>
        <Text color={theme.textSecondary}>Press arrows / Tab to navigate. Enter selects surface.</Text>
      </Box>

      {/* 6. Universal bottom input prompt */}
      <Box borderStyle="single" borderColor={focusArea === 'stage' ? theme.brand : theme.borderDefault} paddingX={1} width={mainStageWidth - 2} flexShrink={0}>
        <Text color={theme.textSecondary}>[ workspace ] </Text>
        <Text color={theme.info}>▶ </Text>
        <Text color={theme.textPrimary}>{inputCmd}</Text>
        <Text color={theme.textSecondary}>█</Text>
      </Box>
    </Box>
  );
}

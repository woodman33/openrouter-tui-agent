import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useWindowSize } from 'ink';
import { useFocus, panelMayAct } from '../hooks/useKeyDispatcher.js';
import { theme } from '../theme.js';
import { GlowBorder } from '../components/GlowBorder.js';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { getResponsiveLayout } from '../utils/responsive.js';
import { setLogsEnabled } from '../../utils/logger.js';

// ── Local helper: strict truncation ────────────────────────────────────────
function ellipsize(text: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';
  if (!text) return '';
  if (text.length <= maxWidth) return text;
  if (maxWidth <= 3) return text.slice(0, maxWidth);
  return text.slice(0, maxWidth - 2) + '..';  // 2-char suffix so labels stay readable
}

// ── Pad/right-align a string to exactly `width` chars ──────────────────────
function padRight(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  return text + ' '.repeat(width - text.length);
}

function padLeft(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  return ' '.repeat(width - text.length) + text;
}

interface OptionsPanelProps {
  agent: any;
  setInspector: (data: any) => void;
  focusArea?: 'nav' | 'stage';
}

interface DropdownOption {
  key: string;
  label: string;
  choices: string[];
  current: string;
  desc: string;
}

export function OptionsPanel({ agent, setInspector, focusArea = 'stage' }: OptionsPanelProps) {
  const { columns: width, rows: height } = useWindowSize();
  const terminalHeight = height || 24;
  const isSmallScreen = terminalHeight < 30;
  const [rmuxInstalled, setRmuxInstalled] = useState(false);
  const [tmuxInstalled, setTmuxInstalled] = useState(false);
  const [carbonylInstalled, setCarbonylInstalled] = useState(false);
  const [inputCmd, setInputCmd] = useState('/options toggle animations');

  // Detect binaries
  useEffect(() => {
    try {
      execSync('command -v rmux', { stdio: 'ignore' });
      setRmuxInstalled(true);
    } catch {
      setRmuxInstalled(existsSync(join(homedir(), '.local', 'bin', 'rmux')));
    }

    try {
      execSync('command -v tmux', { stdio: 'ignore' });
      setTmuxInstalled(true);
    } catch {
      setTmuxInstalled(false);
    }

    try {
      execSync('command -v carbonyl', { stdio: 'ignore' });
      setCarbonylInstalled(true);
    } catch {
      setCarbonylInstalled(existsSync(join(homedir(), '.local', 'bin', 'carbonyl')));
    }
  }, []);

  // Sync the global file-logging gate with the agent setting on mount
  useEffect(() => {
    setLogsEnabled(agent.logsEnabled !== false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  // Initialize and keep options in sync
  useEffect(() => {
    const rmuxStatus = rmuxInstalled ? 'DETECTED' : 'MISSING';
    const tmuxStatus = tmuxInstalled ? 'DETECTED' : 'MISSING';
    const carbonylStatus = carbonylInstalled ? 'DETECTED' : 'MISSING';
    const currentModel = agent.model || 'not set';
    const currentMux = process.env.TIMMY_MULTIPLEXER || 'tmux';

    setOptions([
      { key: 'animations', label: 'Animations', choices: ['ON', 'OFF'], current: process.env.TIMMY_DISABLE_ANIMATION === '1' ? 'OFF' : 'ON', desc: 'Visual motion indicators' },
      { key: 'devmode', label: 'Developer Mode', choices: ['ON', 'OFF'], current: agent.developerMode ? 'ON' : 'OFF', desc: 'Show developer utilities' },
      { key: 'autohide', label: 'Sidebar Auto-hide', choices: ['ON', 'OFF'], current: agent.sidebarAutoHide ? 'ON' : 'OFF', desc: 'Auto hide left nav column' },
      { key: 'autoopen', label: 'Browser Auto-open', choices: ['ON', 'OFF'], current: agent.browserAutoOpen ? 'ON' : 'OFF', desc: 'Open browser companion' },
      { key: 'theme', label: 'Theme', choices: ['Timmy Amber', 'Timmy Blue', 'Timmy Green'], current: process.env.TIMMY_THEME === 'blue' ? 'Timmy Blue' : (process.env.TIMMY_THEME === 'green' ? 'Timmy Green' : 'Timmy Amber'), desc: 'Color palette and accents' },
      { key: 'model', label: 'OpenRouter Model', choices: [currentModel], current: currentModel, desc: 'Active model for workflows' },
      { key: 'multiplexer', label: 'Multiplexer', choices: ['tmux', 'zellij', 'rmux'], current: currentMux, desc: 'Terminal multiplexer backend (restart required)' },
      { key: 'rmuxPath', label: 'rmux Path', choices: [rmuxStatus], current: rmuxStatus, desc: 'tmux-compatible multiplexer (agent lanes)' },
      { key: 'tmuxPath', label: 'tmux Path', choices: [tmuxStatus], current: tmuxStatus, desc: 'Local tmux binary' },
      { key: 'carbonylPath', label: 'carbonyl Path', choices: [carbonylStatus], current: carbonylStatus, desc: 'Headless Chromium for in-pane browser lanes' },
      { key: 'logs', label: 'Logs', choices: ['ON', 'OFF'], current: agent.logsEnabled !== false ? 'ON' : 'OFF', desc: 'Write bounded local logs' }
    ]);
  }, [rmuxInstalled, tmuxInstalled, carbonylInstalled, agent.model, agent.developerMode, agent.sidebarAutoHide, agent.browserAutoOpen, agent.logsEnabled]);

  const updateInspectorData = (opt: DropdownOption, status: string) => {
    if (!opt) return;
    setInspector({
      title: `Setting: ${opt.label.toUpperCase()}`,
      subtitle: 'TIMMY TUI CONFIGURATION UTILITY',
      type: 'Option Selector',
      status,
      risk: 'LOW',
      scope: `options.config.${opt.key}`,
      details: [
        `• Option description: ${opt.desc}`,
        `• Current value: ${opt.current}`,
        `• rmux status: ${rmuxInstalled ? '🟢 INSTALLED' : '🔴 NOT INSTALLED'}`,
        `• tmux status: ${tmuxInstalled ? '🟢 ACTIVE' : '🔴 NOT INSTALLED'}`,
        `• carbonyl status: ${carbonylInstalled ? '🟢 INSTALLED' : '🔴 NOT INSTALLED'}`,
        `• Allowed choices: ${opt.choices.join(', ')}`
      ]
    });
  };

  // Sync footer + inspector when selected row changes
  useEffect(() => {
    if (options.length > 0 && options[activeIdx]) {
      const opt = options[activeIdx];
      updateInspectorData(opt, 'READY');
      setInputCmd(`/options toggle ${opt.key} to ${opt.current}`);
    }
  }, [activeIdx, options]);

  const __focus = useFocus();
  useInput((char, key) => {
    if (!panelMayAct(__focus, 'input:options')) return;
    if (focusArea !== 'stage') return;
    if (options.length === 0) return;
    const activeOpt = options[activeIdx];

    if (key.upArrow) {
      setActiveIdx(prev => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow) {
      setActiveIdx(prev => Math.min(options.length - 1, prev + 1));
      return;
    }

    const isSpace = char === ' ';
    const isEnter = key.return;
    const isLeft = key.leftArrow;
    const isRight = key.rightArrow;

    if (isSpace || isEnter || isLeft || isRight) {
      if (activeOpt.choices.length <= 1) return; // Read-only

      const currentIdx = activeOpt.choices.indexOf(activeOpt.current);
      let nextIdx = currentIdx;

      const isBinary = activeOpt.choices.length === 2;

      if (isSpace) {
        if (!isBinary) return; // Space only toggles binary options
        nextIdx = (currentIdx + 1) % activeOpt.choices.length;
      } else if (isEnter) {
        nextIdx = (currentIdx + 1) % activeOpt.choices.length;
      } else if (isLeft) {
        nextIdx = (currentIdx - 1 + activeOpt.choices.length) % activeOpt.choices.length;
      } else if (isRight) {
        nextIdx = (currentIdx + 1) % activeOpt.choices.length;
      }

      const nextChoice = activeOpt.choices[nextIdx];

      // Apply runtime changes instantly
      if (activeOpt.key === 'animations') {
        process.env.TIMMY_DISABLE_ANIMATION = nextChoice === 'OFF' ? '1' : '0';
      } else if (activeOpt.key === 'devmode') {
        agent.developerMode = nextChoice === 'ON';
      } else if (activeOpt.key === 'theme') {
        if (nextChoice === 'Timmy Blue') {
          process.env.TIMMY_THEME = 'blue';
        } else if (nextChoice === 'Timmy Green') {
          process.env.TIMMY_THEME = 'green';
        } else {
          process.env.TIMMY_THEME = 'amber';
        }
      } else if (activeOpt.key === 'autohide') {
        agent.sidebarAutoHide = nextChoice === 'ON';
      } else if (activeOpt.key === 'autoopen') {
        agent.browserAutoOpen = nextChoice === 'ON';
      } else if (activeOpt.key === 'multiplexer') {
        process.env.TIMMY_MULTIPLEXER = nextChoice;
        // Show restart notice
        setInputCmd(`/options toggle multiplexer to ${nextChoice} — RESTART REQUIRED`);
      } else if (activeOpt.key === 'logs') {
        agent.logsEnabled = nextChoice === 'ON';
        setLogsEnabled(agent.logsEnabled);
      }

      setOptions(prev => prev.map((o, idx) => {
        if (idx === activeIdx) {
          const updated = { ...o, current: nextChoice };
          updateInspectorData(updated, 'SAVED');
          return updated;
        }
        return o;
      }));

      setInputCmd(`/options toggle ${activeOpt.key} to ${nextChoice}`);
    }
  });

  // Responsive width calculation — match layout.tsx breakpoints
  const terminalWidth = width || 80;
  const { mainStageWidth, isCompact } = getResponsiveLayout(terminalWidth);

  // ── Deterministic column widths ──────────────────────────────────────────
  // Available row width inside the GlowBorder (account for border + padding)
  const rowWidth = Math.max(30, mainStageWidth - 8);

  // Fixed column allocation:
  //   selector(2) + label(col1) + gap(1) + desc(col2) + gap(1) + value(col3)
  const SELECTOR_W = 2;
  const VALUE_W = Math.min(16, Math.max(8, Math.floor(rowWidth * 0.2)));
  const remainAfterValue = rowWidth - SELECTOR_W - VALUE_W - 2; // 2 gaps

  // Show description only if there's enough room (>= 10 chars for desc)
  const showDesc = remainAfterValue > 28;
  const LABEL_W = showDesc
    ? Math.min(20, Math.floor(remainAfterValue * 0.45))
    : remainAfterValue;
  const DESC_W = showDesc
    ? remainAfterValue - LABEL_W
    : 0;

  // ── Value display formatter ──────────────────────────────────────────────
  function formatValue(opt: DropdownOption): string {
    const raw = opt.current;

    // Guard against undefined/null/empty
    if (raw == null || raw === '' || raw === 'undefined') return '[NOT SET]';

    // Path detection keys
    if (opt.key === 'rmuxPath' || opt.key === 'tmuxPath' || opt.key === 'carbonylPath') {
      const upper = raw.toUpperCase();
      if (upper === 'DETECTED') return '[DETECTED]';
      if (upper === 'MISSING') return '[MISSING]';
      return `[${upper}]`;
    }

    // Binary ON/OFF
    if (opt.choices.length === 2 && (opt.choices.includes('ON') && opt.choices.includes('OFF'))) {
      return raw === 'ON' ? '[ON]' : '[OFF]';
    }

    // Multiplexer selection
    if (opt.key === 'multiplexer') {
      return `[${raw}]`;
    }

    // Everything else (theme, model, etc.)
    return `[${raw}]`;
  }

  return (
    <Box flexDirection="column" width={mainStageWidth} paddingX={1} flexGrow={1} flexShrink={1}>
      {/* Header Banner */}
      <Box borderStyle="single" borderColor={theme.borderDefault} paddingX={2} marginBottom={isSmallScreen ? 0 : 1} flexDirection="column" flexShrink={0}>
        <Text bold color={theme.brand}>⚙️  TIMMY Settings & Options</Text>
        {!isCompact && (
          <Text color={theme.textSecondary}>Change simple local settings. Runtime secrets and bindings are untouched.</Text>
        )}
      </Box>

      {/* Dynamic Settings List */}
      <GlowBorder color={theme.borderDefault} width={Math.max(20, mainStageWidth - 2)} label="💻 COMPACT CONFIGURATION DECK">
        <Box flexDirection="column" paddingX={1} flexGrow={1} marginY={1}>
          {options.map((opt, idx) => {
            const isSelected = idx === activeIdx;

            // Build each column with strict truncation
            const selectorStr = isSelected ? '▶ ' : '  ';
            const labelStr = ellipsize(opt.label, LABEL_W);
            const descStr = showDesc ? ellipsize(opt.desc, DESC_W) : '';
            const valStr = ellipsize(formatValue(opt), VALUE_W);

            // Color coding for values
            let valColor = theme.info;
            if (isSelected) valColor = theme.brand;
            const rawVal = formatValue(opt);
            if (rawVal === '[ON]' || rawVal === '[DETECTED]') valColor = isSelected ? theme.success : theme.success;
            else if (rawVal === '[OFF]' || rawVal === '[MISSING]') valColor = isSelected ? theme.error : theme.error;
            else if (rawVal === '[NOT SET]') valColor = theme.textSecondary;

            return (
              <Box key={opt.key} flexDirection="row" height={1}>
                {/* Selector */}
                <Box width={SELECTOR_W} flexShrink={0}>
                  <Text color={isSelected ? theme.brand : theme.textSecondary} bold={isSelected}>
                    {selectorStr}
                  </Text>
                </Box>

                {/* Label */}
                <Box width={LABEL_W} flexShrink={0}>
                  <Text color={isSelected ? theme.textPrimary : theme.textSecondary} bold={isSelected}>
                    {padRight(labelStr, LABEL_W)}
                  </Text>
                </Box>

                {/* Gap */}
                <Box width={1} flexShrink={0}><Text> </Text></Box>

                {/* Description (hidden at narrow widths) */}
                {showDesc && (
                  <Box width={DESC_W} flexShrink={0}>
                    <Text color={isSelected ? theme.textPrimary : theme.textSecondary}>
                      {padRight(descStr, DESC_W)}
                    </Text>
                  </Box>
                )}

                {/* Gap */}
                <Box width={1} flexShrink={0}><Text> </Text></Box>

                {/* Value (right-aligned, never overflows) */}
                <Box width={VALUE_W} flexShrink={0} justifyContent="flex-end">
                  <Text bold color={valColor}>
                    {valStr}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>
      </GlowBorder>

      {/* Auth & Authority Panel */}
      <Box borderStyle="single" borderColor={theme.brand} paddingX={2} marginBottom={isSmallScreen ? 0 : 1} flexDirection="column" flexShrink={0}>
        <Text bold color={theme.brand}>🛡️  Auth & Authority</Text>
        <Box flexDirection="column" marginTop={1}>
          {[
            { label: 'Human Auth', value: 'Local', color: theme.textPrimary },
            { label: 'AgentPass', value: 'Active', color: theme.success },
            { label: 'Passports', value: 'Enabled', color: theme.info },
            { label: 'Visas', value: 'Enabled', color: theme.info },
            { label: 'Stamps', value: 'Enabled', color: theme.info },
            { label: 'Receipts', value: 'Local', color: theme.success },
          ].map((row) => (
            <Box key={row.label} flexDirection="row" height={1}>
              <Box width={Math.min(20, Math.floor(rowWidth * 0.4))} flexShrink={0}>
                <Text color={theme.textSecondary}> • {row.label}:</Text>
              </Box>
              <Box flexGrow={1} justifyContent="flex-end">
                <Text bold color={row.color}>{row.value}</Text>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Active configuration prompt box - Universal bottom input */}
      <Box borderStyle="single" borderColor={focusArea === 'stage' ? theme.brand : theme.borderDefault} paddingX={1} marginTop={isSmallScreen ? 0 : 1} flexShrink={0}>
        <Text color={theme.textSecondary}>[ options ] </Text>
        <Text color={theme.info}>▶ </Text>
        <Text color={theme.textPrimary} wrap="truncate">{inputCmd}</Text>
        <Text color={theme.textSecondary}>█</Text>
      </Box>
    </Box>
  );
}

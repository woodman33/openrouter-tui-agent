import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useWindowSize } from 'ink';
import { theme } from '../theme.js';
import { GlowBorder } from '../components/GlowBorder.js';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { truncateVisible } from '../utils/text.js';

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
  const [cmuxInstalled, setCmuxInstalled] = useState(false);
  const [tmuxInstalled, setTmuxInstalled] = useState(false);
  const [inputCmd, setInputCmd] = useState('/options toggle animations');

  // Detect binaries
  useEffect(() => {
    let cmuxFound = false;
    try {
      execSync('command -v cmux', { stdio: 'ignore' });
      cmuxFound = true;
    } catch {
      cmuxFound = false;
    }

    if (!cmuxFound) {
      cmuxFound = existsSync('/opt/homebrew/bin/cmux') || 
                  existsSync('/Applications/cmux.app') || 
                  existsSync(join(homedir(), 'Applications', 'cmux.app'));
    }
    setCmuxInstalled(cmuxFound);

    try {
      execSync('command -v tmux', { stdio: 'ignore' });
      setTmuxInstalled(true);
    } catch {
      setTmuxInstalled(false);
    }
  }, []);

  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  // Initialize and keep options in sync
  useEffect(() => {
    const cmuxStatus = cmuxInstalled ? 'detected' : 'missing';
    const tmuxStatus = tmuxInstalled ? 'detected' : 'missing';

    setOptions([
      { key: 'animations', label: 'Animations', choices: ['ON', 'OFF'], current: process.env.TIMMY_DISABLE_ANIMATION === '1' ? 'OFF' : 'ON', desc: 'Visual motion and state indicators style' },
      { key: 'devmode', label: 'Developer Mode', choices: ['ON', 'OFF'], current: agent.developerMode ? 'ON' : 'OFF', desc: 'Toggle Discovery, Teams, and Logs in Left Nav' },
      { key: 'autohide', label: 'Sidebar Auto-hide', choices: ['ON', 'OFF'], current: agent.sidebarAutoHide ? 'ON' : 'OFF', desc: 'Auto hide left navigation column when workspace is active' },
      { key: 'autoopen', label: 'Browser Auto-open', choices: ['ON', 'OFF'], current: agent.browserAutoOpen ? 'ON' : 'OFF', desc: 'Automatically open browser companion' },
      { key: 'theme', label: 'Theme', choices: ['Timmy Amber', 'Timmy Blue', 'Timmy Green'], current: process.env.TIMMY_THEME === 'blue' ? 'Timmy Blue' : (process.env.TIMMY_THEME === 'green' ? 'Timmy Green' : 'Timmy Amber'), desc: 'Global border color palette and accents' },
      { key: 'model', label: 'OpenRouter Model', choices: [agent.model], current: agent.model, desc: 'Active model for cognitive workflows' },
      { key: 'cmuxPath', label: 'cmux Path', choices: [cmuxStatus], current: cmuxStatus, desc: 'Path to native cmux desktop companion' },
      { key: 'tmuxPath', label: 'tmux Path', choices: [tmuxStatus], current: tmuxStatus, desc: 'Path to local tmux binary' },
      { key: 'logs', label: 'Logs', choices: ['ON', 'OFF'], current: agent.logsEnabled !== false ? 'ON' : 'OFF', desc: 'Toggle write logs utility' }
    ]);
  }, [cmuxInstalled, tmuxInstalled, agent.model, agent.developerMode, agent.sidebarAutoHide, agent.browserAutoOpen, agent.logsEnabled]);

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
        `• cmux status: ${cmuxInstalled ? '🟢 INSTALLED' : '🔴 NOT INSTALLED'}`,
        `• tmux status: ${tmuxInstalled ? '🟢 ACTIVE' : '🔴 NOT INSTALLED'}`,
        `• Allowed choices: ${opt.choices.join(', ')}`
      ]
    });
  };

  useEffect(() => {
    if (options.length > 0 && options[activeIdx]) {
      updateInspectorData(options[activeIdx], 'READY');
      setInputCmd(`/options toggle ${options[activeIdx].key}`);
    }
  }, [activeIdx]);

  useInput((char, key) => {
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
      } else if (activeOpt.key === 'logs') {
        agent.logsEnabled = nextChoice === 'ON';
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

  // Strict cap on main stage width to prevent stretching awkwardly in wide screens
  const panelWidth = Math.max(20, (width || 80) - 28);
  const mainStageWidth = Math.min(84, Math.floor(panelWidth * 0.95));

  return (
    <Box flexDirection="column" width={mainStageWidth} paddingX={1} flexGrow={1} flexShrink={1}>
      {/* Header Banner */}
      <Box borderStyle="single" borderColor="#30363d" paddingX={2} marginBottom={isSmallScreen ? 0 : 1} flexDirection="column" width={mainStageWidth - 2} flexShrink={0}>
        <Text bold color="#a98bff">⚙️  TIMMY Settings & Options</Text>
        <Text color="#8b949e">Change simple local settings. Runtime secrets and bindings are untouched.</Text>
      </Box>

      {/* Dynamic Settings List */}
      <GlowBorder color={theme.borderDefault} width={mainStageWidth - 2} label="💻 COMPACT CONFIGURATION DECK">
        <Box flexDirection="column" paddingX={1} flexGrow={1} marginY={1}>
          {options.map((opt, idx) => {
            const isSelected = idx === activeIdx;
            const rowWidth = mainStageWidth - 8;
            const col3Width = 12;
            const showDesc = rowWidth > 45;
            const col1Width = showDesc ? 22 : Math.max(10, rowWidth - col3Width - 2);
            const col2Width = showDesc ? (rowWidth - col1Width - col3Width) : 0;

            // Make sure binary toggles only show ON/OFF and path detection only shows DETECTED/MISSING
            let displayValue = opt.current;
            if (opt.key === 'cmuxPath' || opt.key === 'tmuxPath') {
              displayValue = opt.current.toUpperCase(); // DETECTED or MISSING
            }
            const valText = `[${displayValue}]`;
            
            const truncatedLabel = truncateVisible(opt.label, col1Width - 3);
            const labelStr = (isSelected ? '▶ ' : '  ') + truncatedLabel + ':';
            const truncatedDesc = showDesc ? truncateVisible(opt.desc, col2Width - 1) : '';
            const truncatedValText = truncateVisible(valText, col3Width - 1);

            return (
              <Box key={opt.key} flexDirection="row" width={rowWidth} marginY={0}>
                {/* Column 1: Label */}
                <Box width={col1Width} flexShrink={0}>
                  <Text color={isSelected ? '#d2a8ff' : '#8b949e'} bold={isSelected}>
                    {labelStr}
                  </Text>
                </Box>
                
                {/* Column 2: Description */}
                {showDesc && (
                  <Box width={col2Width} flexGrow={1} flexShrink={1}>
                    <Text color={isSelected ? '#ffffff' : '#8b949e'} dimColor={!isSelected}>
                      {truncatedDesc}
                    </Text>
                  </Box>
                )}

                {/* Column 3: Value/Status (Right-aligned) */}
                <Box width={col3Width} justifyContent="flex-end" flexShrink={0}>
                  <Text bold color={isSelected ? '#d2a8ff' : '#79c0ff'}>
                    {truncatedValText}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>
      </GlowBorder>

      {/* Auth & Authority Panel */}
      <Box borderStyle="single" borderColor="#d2a8ff" paddingX={2} marginBottom={isSmallScreen ? 0 : 1} flexDirection="column" width={mainStageWidth - 2} flexShrink={0}>
        <Text bold color="#d2a8ff">🛡️  Auth & Authority</Text>
        <Box flexDirection="column" marginTop={1}>
          <Box justifyContent="space-between" width={mainStageWidth - 8}>
            <Text color="#8b949e"> • Human Auth:</Text>
            <Text bold color="#e6edf3">Local (future SSO/SSO)</Text>
          </Box>
          <Box justifyContent="space-between" width={mainStageWidth - 8}>
            <Text color="#8b949e"> • AgentPass:</Text>
            <Text bold color="#3fb950">Active</Text>
          </Box>
          <Box justifyContent="space-between" width={mainStageWidth - 8}>
            <Text color="#8b949e"> • Passports:</Text>
            <Text bold color="#79c0ff">Enabled</Text>
          </Box>
          <Box justifyContent="space-between" width={mainStageWidth - 8}>
            <Text color="#8b949e"> • Visas:</Text>
            <Text bold color="#79c0ff">Enabled</Text>
          </Box>
          <Box justifyContent="space-between" width={mainStageWidth - 8}>
            <Text color="#8b949e"> • Stamps:</Text>
            <Text bold color="#79c0ff">Enabled</Text>
          </Box>
          <Box justifyContent="space-between" width={mainStageWidth - 8}>
            <Text color="#8b949e"> • Receipts:</Text>
            <Text bold color="#3fb950">Local</Text>
          </Box>
        </Box>
      </Box>

      {/* Active configuration prompt box - Universal bottom input */}
      <Box borderStyle="single" borderColor={focusArea === 'stage' ? "#a98bff" : "#30363d"} paddingX={1} marginTop={isSmallScreen ? 0 : 1} width={mainStageWidth - 2} flexShrink={0}>
        <Text color="#8b949e">[ options ] </Text>
        <Text color="#79c0ff">▶ </Text>
        <Text color="#ffffff">{inputCmd}</Text>
        <Text color="#8b949e">█</Text>
      </Box>
    </Box>
  );
}

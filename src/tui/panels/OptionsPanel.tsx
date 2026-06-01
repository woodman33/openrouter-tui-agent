import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useWindowSize } from 'ink';
import { theme } from '../theme.js';
import { GlowBorder } from '../components/GlowBorder.js';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface OptionsPanelProps {
  agent: any;
  setInspector: (data: any) => void;
}

interface DropdownOption {
  key: string;
  label: string;
  choices: string[];
  current: string;
  desc: string;
}

export function OptionsPanel({ agent, setInspector }: OptionsPanelProps) {
  const { columns: width } = useWindowSize();
  const [cmuxInstalled, setCmuxInstalled] = useState(false);
  const [tmuxInstalled, setTmuxInstalled] = useState(false);

  const [options, setOptions] = useState<DropdownOption[]>([
    { key: 'theme', label: 'Theme Palette', choices: ['Timmy Amber', 'Cyberpunk Neo', 'Monochrome Matrix', 'Sunset Aurora'], current: 'Timmy Amber', desc: 'Global border color palette and accents' },
    { key: 'animation', label: 'Animation Mode', choices: ['Blinking Mascot', 'Pulse Glow', 'Disabled'], current: 'Blinking Mascot', desc: 'Visual motion and state indicators style' },
    { key: 'mascot', label: 'Mascot Persona', choices: ['Nerdy Quartermaster', 'Strict Auditor'], current: 'Nerdy Quartermaster', desc: 'TIMMY Quartermaster tone and voice' },
    { key: 'density', label: 'Layout Density', choices: ['Spacious', 'Compact'], current: 'Spacious', desc: 'Whitespace padding and Stage grid ratios' },
    { key: 'openrouter', label: 'OpenRouter SDK', choices: ['Active Pipeline', 'Mock Dry-run'], current: 'Active Pipeline', desc: 'Configure Multi-model routing & fallbacks' },
    { key: 'pi', label: 'Pi Agent Sync', choices: ['Durable DO Active', 'Offline Cache'], current: 'Durable DO Active', desc: 'Coordinate subagent task routing and telemetry sync' },
    { key: 'hermes', label: 'Hermes Planner', choices: ['Deep Research', 'Disabled'], current: 'Deep Research', desc: 'Deep safety review audits and structural plans' },
    { key: 'mcporter', label: 'MCPorter Sandbox', choices: ['Gated Daytona VM', 'Local Dryrun'], current: 'Gated Daytona VM', desc: 'MCP servers isolation boundaries enforcement' },
    { key: 'cmuxtmux', label: 'cmux/tmux Binaries', choices: ['Found paths', 'Default search'], current: 'Found paths', desc: 'Binaries connection path lookup strategy' },
    { key: 'proof', label: 'Proof Style', choices: ['Verifiable Receipt', 'Raw Telemetry Logs'], current: 'Verifiable Receipt', desc: 'Telemetry record structure layout format' },
    { key: 'devmode', label: 'Developer Mode', choices: ['Disabled', 'Enabled'], current: agent.developerMode ? 'Enabled' : 'Disabled', desc: 'Toggle Discovery and Teams screens in Left Nav' }
  ]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverChoiceIdx, setPopoverChoiceIdx] = useState(0);

  // System detection on mount
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

  const updateInspectorData = (opt: DropdownOption, status: string) => {
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
    updateInspectorData(options[activeIdx], 'READY');
  }, [activeIdx, cmuxInstalled, tmuxInstalled]);

  useInput((char, key) => {
    if (popoverOpen) {
      if (key.upArrow) {
        setPopoverChoiceIdx(prev => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        const activeOpt = options[activeIdx];
        setPopoverChoiceIdx(prev => Math.min(activeOpt.choices.length - 1, prev + 1));
        return;
      }
      if (key.escape) {
        setPopoverOpen(false);
        updateInspectorData(options[activeIdx], 'READY');
        return;
      }
      if (key.return) {
        const activeOpt = options[activeIdx];
        const nextChoice = activeOpt.choices[popoverChoiceIdx];
        
        // Apply choices
        if (activeOpt.key === 'devmode') {
          agent.developerMode = nextChoice === 'Enabled';
        } else if (activeOpt.key === 'theme') {
          if (nextChoice === 'Cyberpunk Neo') {
            process.env.TIMMY_THEME = 'cyberpunk';
          } else if (nextChoice === 'Monochrome Matrix') {
            process.env.TIMMY_THEME = 'matrix';
          } else if (nextChoice === 'Sunset Aurora') {
            process.env.TIMMY_THEME = 'sunset';
          } else {
            process.env.TIMMY_THEME = 'amber';
          }
        }

        setOptions(prev => prev.map((o, idx) => {
          if (idx === activeIdx) {
            const updated = { ...o, current: nextChoice };
            updateInspectorData(updated, 'SAVED');
            return updated;
          }
          return o;
        }));

        setPopoverOpen(false);
      }
      return;
    }

    if (key.upArrow) {
      setActiveIdx(prev => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow) {
      setActiveIdx(prev => Math.min(options.length - 1, prev + 1));
      return;
    }

    if (key.return) {
      const activeOpt = options[activeIdx];
      const currentIdx = activeOpt.choices.indexOf(activeOpt.current);
      setPopoverChoiceIdx(currentIdx !== -1 ? currentIdx : 0);
      setPopoverOpen(true);
      updateInspectorData(activeOpt, 'SELECTING');
    }
  });

  const panelWidth = Math.max(20, (width || 80) - 54);
  const mainStageWidth = Math.floor(panelWidth * 0.95);

  const activeOpt = options[activeIdx];

  return (
    <Box flexDirection="column" width={mainStageWidth} paddingX={1}>
      {/* Dynamic Settings List */}
      <GlowBorder color={theme.borderDefault} width={mainStageWidth - 2} label="💻 COMPACT CONFIGURATION DECK">
        <Box flexDirection="column" paddingX={1} flexGrow={1}>
          {options.map((opt, idx) => {
            const isSelected = idx === activeIdx;
            return (
              <Box key={opt.key} justifyContent="space-between" width={mainStageWidth - 8} marginY={0}>
                <Box flexDirection="row">
                  <Text color={isSelected ? '#d2a8ff' : '#8b949e'} bold={isSelected}>
                    {isSelected ? '▶ ' : '  '}
                    {opt.label}:
                  </Text>
                  <Text color={isSelected ? '#ffffff' : '#8b949e'} dimColor={!isSelected}>   {opt.desc}</Text>
                </Box>
                <Text bold color={isSelected ? '#d2a8ff' : '#79c0ff'}>
                  [{opt.current}]
                </Text>
              </Box>
            );
          })}
        </Box>
      </GlowBorder>

      {/* Popover Selection Box */}
      {popoverOpen && (
        <Box 
          position="absolute"
          top={1} 
          left={8} 
          borderStyle="double" 
          borderColor="#d2a8ff" 
          paddingX={2} 
          flexDirection="column" 
          width={Math.max(30, Math.floor(mainStageWidth * 0.7))}
          height={Math.max(6, activeOpt.choices.length + 3)}
        >
          <Text bold color="#d2a8ff">🏛️ SELECT: {activeOpt.label.toUpperCase()}</Text>
          <Text color="#8b949e">──────────────────────────────</Text>
          {activeOpt.choices.map((choice, cIdx) => {
            const isChoiceSelected = cIdx === popoverChoiceIdx;
            return (
              <Text key={choice} color={isChoiceSelected ? '#3fb950' : '#e6edf3'} bold={isChoiceSelected}>
                {isChoiceSelected ? '▶ ' : '  '}
                {choice}
              </Text>
            );
          })}
          <Text color="#8b949e">──────────────────────────────</Text>
          <Text color="#8b949e" dimColor>Arrows select | Enter apply | Esc exit</Text>
        </Box>
      )}

      {/* Subsystem status tagger */}
      <Box marginTop={1} borderStyle="single" borderColor="#30363d" paddingX={2} width={mainStageWidth - 2} flexDirection="row" justifyContent="space-between">
        <Text color="#8b949e">cmux status: {cmuxInstalled ? <Text color="#3fb950" bold>FOUND</Text> : <Text color="#8b949e" dimColor>MISSING</Text>}</Text>
        <Text color="#8b949e">tmux status: {tmuxInstalled ? <Text color="#3fb950" bold>FOUND</Text> : <Text color="#8b949e" dimColor>MISSING</Text>}</Text>
      </Box>
    </Box>
  );
}

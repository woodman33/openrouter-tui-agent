import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { execFileSync } from 'child_process';
import type { Agent } from '../../agent/core.js';
import { PanelFrame } from '../components/PanelFrame.js';
import { EmptyState } from '../components/EmptyState.js';

interface BrowsePanelProps {
  agent: Agent;
  setInspector?: (s: string | null) => void;
  focusArea?: string;
  inputLocked?: boolean;
}

/**
 * BROWSE — dual-pane web workspace. Left: your carbonyl (Chromium-in-terminal)
 * browser lanes. Right: the LIVE pane output. [t] sends keystrokes/commands
 * straight into the browser pane; heavier automation (playwright / puppeteer /
 * chrome-devtools CLIs) gets delegated through LANES as deterministic profiles.
 */
export function BrowsePanel({ agent, inputLocked }: BrowsePanelProps) {
  const [idx, setIdx] = useState(0);
  const [capture, setCapture] = useState<string[]>([]);
  const [spawning, setSpawning] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [cmdDraft, setCmdDraft] = useState('');

  const lanes = agent.tmuxSessions.filter(s => s.name.startsWith('Browser:'));
  const sel = lanes[Math.min(idx, Math.max(0, lanes.length - 1))];

  useEffect(() => {
    const load = () => {
      const current = agent.tmuxSessions.filter(s => s.name.startsWith('Browser:'));
      const s = current[Math.min(idx, Math.max(0, current.length - 1))];
      if (!s) { setCapture([]); return; }
      try {
        const out = execFileSync('tmux', ['capture-pane', '-pt', `ortui-${s.id}`], { encoding: 'utf8', stdio: 'pipe' });
        setCapture(out.split('\n').slice(-20));
      } catch { setCapture(['[pane not running]']); }
    };
    load();
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, [idx, agent.tmuxSessions.length]);

  useInput((char, key) => {
    if (spawning) {
      if (key.escape) { setSpawning(false); setUrlDraft(''); return; }
      if (key.return) {
        agent.addBrowserPane(urlDraft.trim() || 'https://openrouter.ai');
        setSpawning(false);
        setUrlDraft('');
        return;
      }
      if (key.backspace || key.delete) { setUrlDraft(d => d.slice(0, -1)); return; }
      if (char && !key.ctrl && !key.meta) setUrlDraft(d => d + char);
      return;
    }
    if (typing) {
      if (key.escape) { setTyping(false); setCmdDraft(''); return; }
      if (key.return) {
        if (sel && cmdDraft.trim()) agent.sendTmuxCommand(sel.id, cmdDraft.trim(), true);
        setTyping(false);
        setCmdDraft('');
        return;
      }
      if (key.backspace || key.delete) { setCmdDraft(d => d.slice(0, -1)); return; }
      if (char && !key.ctrl && !key.meta) setCmdDraft(d => d + char);
      return;
    }
    if (key.upArrow) { setIdx(i => Math.max(0, i - 1)); return; }
    if (key.downArrow) { setIdx(i => Math.min(Math.max(0, lanes.length - 1), i + 1)); return; }
    const c = char.toLowerCase();
    if (c === 'b') { setSpawning(true); return; }
    if (c === 't' && sel) { setTyping(true); return; }
    if (c === 'k' && sel) { agent.removeTmuxSession(sel.id); setIdx(i => Math.max(0, i - 1)); return; }
  }, { isActive: !inputLocked });

  return (
    <PanelFrame
      icon="🌐"
      title="BROWSE — DUAL-PANE WEB WORKSPACE"
      status={`${lanes.length} browser pane${lanes.length === 1 ? '' : 's'}`}
      statusColor="#79c0ff"
      explain="Chromium in the terminal via carbonyl. Type into the pane, or delegate playwright/puppeteer/devtools automation through LANES."
      hints={[
        { key: 'b', label: 'new pane (url)' },
        { key: 't', label: 'type into pane' },
        { key: 'k', label: 'kill pane' }
      ]}
    >
      {lanes.length === 0 ? (
        <EmptyState
          lines={[
            'no browser panes yet.',
            '[b] spawns carbonyl on any URL — the browser lives in the terminal,',
            'streamed through the multiplexer like any other lane.'
          ]}
        />
      ) : (
        <Box flexDirection="row" flexGrow={1}>
          <Box flexDirection="column" width="34%" paddingRight={1} borderStyle="single" borderColor="#21262d">
            {lanes.map((l, i) => (
              <Text key={l.id} color={i === Math.min(idx, lanes.length - 1) ? '#d2a8ff' : '#e6edf3'} bold={i === Math.min(idx, lanes.length - 1)} wrap="truncate">
                {i === Math.min(idx, lanes.length - 1) ? '▶ ' : '  '}🌐 {l.name.replace('Browser: ', '')}
              </Text>
            ))}
          </Box>
          <Box flexDirection="column" flexGrow={1} paddingLeft={1}>
            <Text bold color="#79c0ff" wrap="truncate">live · {sel?.name}</Text>
            {capture.map((line, i) => (
              <Text key={i} color="#9aa4b2" wrap="truncate">{line || ' '}</Text>
            ))}
            {spawning && (
              <Box marginTop={1} borderStyle="single" borderColor="#79c0ff" paddingX={1}>
                <Text color="#79c0ff">url: {urlDraft || 'https://'}█</Text>
              </Box>
            )}
            {typing && (
              <Box marginTop={1} borderStyle="single" borderColor="#79c0ff" paddingX={1}>
                <Text color="#79c0ff">→ pane: {cmdDraft}█</Text>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </PanelFrame>
  );
}

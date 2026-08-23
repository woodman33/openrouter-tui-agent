import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useFocus, panelMayAct } from '../hooks/useKeyDispatcher.js';
import { execFileSync } from 'child_process';
import type { Agent } from '../../agent/core.js';
import { PanelFrame } from '../components/PanelFrame.js';
import { EmptyState } from '../components/EmptyState.js';
import { stripAnsi } from '../utils/text.js';
import { theme } from '../theme.js';

interface BrowsePanelProps {
  agent: Agent;
  setInspector?: (s: string | null) => void;
  zone?: number;
  setZone?: (z: number) => void;
  setModalInput?: (b: boolean) => void;
  inputLocked?: boolean;
}

/**
 * BROWSE — dual-pane web workspace. Left: your carbonyl (Chromium-in-terminal)
 * browser lanes. Right: the LIVE pane output. [t] sends keystrokes/commands
 * straight into the browser pane; heavier automation (playwright / puppeteer /
 * chrome-devtools CLIs) gets delegated through LANES as deterministic profiles.
 */
export function BrowsePanel({ agent, zone = 0, setZone, setModalInput, inputLocked }: BrowsePanelProps) {
  const [idx, setIdx] = useState(0);
  const [capture, setCapture] = useState<string[]>([]);
  const [spawning, setSpawning] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [cmdDraft, setCmdDraft] = useState('');
  const [noCarb, setNoCarb] = useState(false);
  const [carbHint, setCarbHint] = useState(false);

  useEffect(() => {
    try { execFileSync('sh', ['-c', 'command -v carbonyl'], { stdio: 'ignore' }); setNoCarb(false); }
    catch { setNoCarb(true); }
  }, []);

  const lanes = agent.tmuxSessions.filter(s => s.name.startsWith('Browser:'));
  const sel = lanes[Math.min(idx, Math.max(0, lanes.length - 1))];

  useEffect(() => {
    const load = () => {
      const current = agent.tmuxSessions.filter(s => s.name.startsWith('Browser:'));
      const s = current[Math.min(idx, Math.max(0, current.length - 1))];
      if (!s) { setCapture([]); return; }
      try {
        const out = execFileSync('tmux', ['capture-pane', '-pt', `ortui-${s.id}`], { encoding: 'utf8', stdio: 'pipe' });
        setCapture(out.split('\n').map(stripAnsi).slice(-20));
      } catch { setCapture(['[pane not running]']); }
    };
    load();
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, [idx, agent.tmuxSessions.length]);

  const __focus = useFocus();
  useInput((char, key) => {
    if (!panelMayAct(__focus, 'input:browse')) return;
    if (zone < 0) return; // nav owns the keyboard
    if (spawning) {
      if (key.escape) { setSpawning(false); setUrlDraft(''); __focus.release('input:browse'); return; }
      if (key.return) {
        agent.addBrowserPane(urlDraft.trim() || 'https://openrouter.ai');
        setSpawning(false);
        setUrlDraft('');
        __focus.release('input:browse');
        return;
      }
      if (key.backspace || key.delete) { setUrlDraft(d => d.slice(0, -1)); return; }
      if (char && !key.ctrl && !key.meta) setUrlDraft(d => d + char);
      return;
    }
    if (typing) {
      if (key.escape) { setTyping(false); setCmdDraft(''); __focus.release('input:browse'); return; }
      if (key.return) {
        if (sel && cmdDraft.trim()) agent.sendTmuxCommand(sel.id, cmdDraft.trim(), true);
        setTyping(false);
        setCmdDraft('');
        __focus.release('input:browse');
        return;
      }
      if (key.backspace || key.delete) { setCmdDraft(d => d.slice(0, -1)); return; }
      if (char && !key.ctrl && !key.meta) setCmdDraft(d => d + char);
      return;
    }
    if (key.upArrow) { setIdx(i => Math.max(0, i - 1)); return; }
    if (key.downArrow) { setIdx(i => Math.min(Math.max(0, lanes.length - 1), i + 1)); return; }
    // ONE GRAMMAR: ←→ move between panes (nav ↔ list ↔ live pane)
    if (key.leftArrow) { setZone?.(Math.max(-1, zone - 1)); return; }
    if (key.rightArrow) { setZone?.(Math.min(1, zone + 1)); return; }
    const c = char.toLowerCase();
    if (c === 'n') {
      if (noCarb) { setCarbHint(true); return; }
      setCarbHint(false);
      setSpawning(true);
      __focus.claim('input:browse');
      return;
    }
    if (c === 't' && sel) { setTyping(true); __focus.claim('input:browse'); return; }
    if (c === 'k' && sel) { agent.removeTmuxSession(sel.id); setIdx(i => Math.max(0, i - 1)); return; }
  }, { isActive: !inputLocked });

  return (
    <PanelFrame
      icon="🌐"
      title="BROWSE — DUAL-PANE WEB WORKSPACE"
      status={`${lanes.length} browser pane${lanes.length === 1 ? '' : 's'}`}
      statusColor={theme.info}
      explain="Chromium in the terminal via carbonyl. Type into the pane, or delegate playwright/puppeteer/devtools automation through LANES."
      hints={[
        { key: 'n', label: 'new pane (url)' },
        { key: 't', label: 'type into pane' },
        { key: 'k', label: 'kill pane' }
      ]}
    >
      {carbHint && (
        <Box flexDirection="column" borderStyle="single" borderColor={theme.warning} paddingX={1} marginBottom={1}>
          <Text bold color={theme.warning}>carbonyl (chromium-in-terminal) not found on PATH</Text>
          <Text color={theme.textSecondary}>install it and [n] works. Meanwhile: SLATE [v] and any addBrowserPane call</Text>
          <Text color={theme.textSecondary}>open browser panes through the agent, and LANES covers CLI agents.</Text>
        </Box>
      )}
      {lanes.length === 0 ? (
        <EmptyState
          lines={[
            'no browser panes yet.',
            '[n] spawns carbonyl on any URL — the browser lives in the terminal,',
            'streamed through the multiplexer like any other lane.'
          ]}
        />
      ) : (
        <Box flexDirection="row" flexGrow={1}>
          <Box flexDirection="column" width="34%" paddingRight={1} borderStyle="single" borderColor={zone === 0 ? theme.brand : theme.borderDefault}>
            {lanes.map((l, i) => (
              <Text key={l.id} color={i === Math.min(idx, lanes.length - 1) ? theme.brand : theme.textPrimary} bold={i === Math.min(idx, lanes.length - 1)} wrap="truncate">
                {i === Math.min(idx, lanes.length - 1) ? '▶ ' : '  '}🌐 {l.name.replace('Browser: ', '')}
              </Text>
            ))}
          </Box>
          <Box flexDirection="column" flexGrow={1} paddingLeft={1}>
            <Text bold color={theme.info} wrap="truncate">live · {sel?.name}</Text>
            {capture.map((line, i) => (
              <Text key={i} color={theme.textSecondary} wrap="truncate">{line || ' '}</Text>
            ))}
            {spawning && (
              <Box marginTop={1} borderStyle="single" borderColor={theme.info} paddingX={1}>
                <Text color={theme.info}>url: {urlDraft || 'https://'}█</Text>
              </Box>
            )}
            {typing && (
              <Box marginTop={1} borderStyle="single" borderColor={theme.info} paddingX={1}>
                <Text color={theme.info}>→ pane: {cmdDraft}█</Text>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </PanelFrame>
  );
}

import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { execFileSync } from 'child_process';
import type { Agent } from '../../agent/core.js';
import { PanelFrame } from '../components/PanelFrame.js';
import { LANE_RUNNERS, DEFAULT_LANE_BINDINGS } from '../../agent/lanes.js';

interface LanesPanelProps {
  agent: Agent;
  setInspector?: (s: string | null) => void;
  focusArea?: string;
  inputLocked?: boolean;
}

/**
 * LANES — the multi-agent workspace, for real. Every pane is a live
 * multiplexer session: you see its actual output, delegate real tasks,
 * approve risky commands, spawn and kill. No simulated states anywhere.
 */
export function LanesPanel({ agent, inputLocked }: LanesPanelProps) {
  const [idx, setIdx] = useState(0);
  const [capture, setCapture] = useState<string[]>([]);
  const [alive, setAlive] = useState<Record<string, boolean>>({});
  const [installed, setInstalled] = useState<Record<string, boolean | null>>({});
  const [tasking, setTasking] = useState(false);
  const [draft, setDraft] = useState('');

  const lanes = agent.tmuxSessions;
  const blocked = (agent as any).lastBlockedCommands as Map<string, string> | undefined;

  useEffect(() => {
    const load = () => {
      const nextAlive: Record<string, boolean> = {};
      const nextInst: Record<string, boolean | null> = {};
      for (const l of lanes) {
        try { execFileSync('tmux', ['has-session', '-t', `ortui-${l.id}`], { stdio: 'ignore' }); nextAlive[l.id] = true; }
        catch { nextAlive[l.id] = false; }
        const runner = LANE_RUNNERS[DEFAULT_LANE_BINDINGS[l.id]];
        if (!runner) nextInst[l.id] = null;
        else {
          try { execFileSync('sh', ['-c', `command -v ${runner.cmd}`], { stdio: 'ignore' }); nextInst[l.id] = true; }
          catch { nextInst[l.id] = false; }
        }
      }
      setAlive(nextAlive);
      setInstalled(nextInst);
      const sel = lanes[Math.min(idx, Math.max(0, lanes.length - 1))];
      if (sel && nextAlive[sel.id]) {
        try {
          const out = execFileSync('tmux', ['capture-pane', '-pt', `ortui-${sel.id}`], { encoding: 'utf8', stdio: 'pipe' });
          setCapture(out.split('\n').filter((l, i, a) => !(i > a.length - 8 && l.trim() === '')).slice(-20));
        } catch { setCapture(['[capture failed]']); }
      } else {
        setCapture([]);
      }
    };
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [idx, lanes]);

  const selIdx = Math.min(idx, Math.max(0, lanes.length - 1));
  const sel = lanes[selIdx];
  const selBlocked = sel ? blocked?.get(sel.id) : undefined;
  const aliveCount = lanes.filter(l => alive[l.id]).length;
  const blockedCount = lanes.filter(l => blocked?.has(l.id)).length;

  useInput((char, key) => {
    if (tasking) {
      if (key.escape) { setTasking(false); setDraft(''); return; }
      if (key.return) {
        if (sel && draft.trim()) agent.sendTmuxCommand(sel.id, draft.trim());
        setTasking(false);
        setDraft('');
        return;
      }
      if (key.backspace || key.delete) { setDraft(d => d.slice(0, -1)); return; }
      if (char && !key.ctrl && !key.meta) setDraft(d => d + char);
      return;
    }
    if (key.upArrow) { setIdx(i => Math.max(0, i - 1)); return; }
    if (key.downArrow) { setIdx(i => Math.min(Math.max(0, lanes.length - 1), i + 1)); return; }
    const c = char.toLowerCase();
    if (c === 's' && sel) { agent.addTmuxSession(sel.name, sel.model); return; }
    if (c === 'k' && sel) { agent.removeTmuxSession(sel.id); setIdx(i => Math.max(0, i - 1)); return; }
    if (c === 'g' && sel && selBlocked) { agent.sendTmuxCommand(sel.id, selBlocked, true); return; }
    if (c === 't' || key.return) { setTasking(true); return; }
  }, { isActive: !inputLocked });

  return (
    <PanelFrame
      icon="🧑🤝‍🧑"
      title="LANES — LIVE AGENT PANES"
      status={`${aliveCount}/${lanes.length} alive${blockedCount ? ` · ${blockedCount} waiting on you` : ''}`}
      statusColor={blockedCount ? '#f5b545' : '#3fb950'}
      explain="Real multiplexer sessions — you're watching their actual terminals. Delegate a task; risky commands stop for your approval."
      hints={[
        { key: '↑↓', label: 'lane' },
        { key: '↵/t', label: 'delegate task' },
        { key: 'g', label: 'approve blocked' },
        { key: 's', label: 'spawn' },
        { key: 'k', label: 'kill' }
      ]}
    >
      <Box flexDirection="row" flexGrow={1}>
        {/* lane roster */}
        <Box flexDirection="column" width="38%" paddingRight={1} borderStyle="single" borderColor="#30363d">
          {lanes.map((l, i) => {
            const isSel = i === selIdx;
            const runner = LANE_RUNNERS[DEFAULT_LANE_BINDINGS[l.id]];
            const isBlocked = blocked?.has(l.id);
            const glyph = isBlocked ? '⚠' : alive[l.id] ? '●' : '○';
            const color = isBlocked ? '#f5b545' : alive[l.id] ? '#3fb950' : '#8b949e';
            return (
              <Box key={l.id} flexDirection="column" marginBottom={1}>
                <Text color={isSel ? '#d2a8ff' : color} bold={isSel} wrap="truncate">
                  {isSel ? '▶ ' : '  '}{glyph} {l.name}
                </Text>
                <Text color="#a5b0bc" wrap="truncate">
                    {'   '}{runner?.blurb || runner?.label || 'shell'}{installed[l.id] === false ? ' · not installed' : ''}{alive[l.id] ? '' : ' · not running'}
                </Text>
              </Box>
            );
          })}
        </Box>
        {/* live pane output */}
        <Box flexDirection="column" flexGrow={1} paddingLeft={1}>
          {sel ? (
            <>
              <Text bold color="#d2a8ff" wrap="truncate">live · ortui-{sel.id} · {sel.name}</Text>
              {selBlocked && (
                <Box flexDirection="column" borderStyle="double" borderColor="#f5b545" paddingX={1} marginTop={1}>
                  <Text bold color="#f5b545">⚠ BLOCKED — waiting on you: {selBlocked}</Text>
                  <Text color="#a5b0bc">[g] approve & run · anything else leaves it parked</Text>
                </Box>
              )}
              {alive[sel.id] ? (
                capture.map((line, i) => (
                  <Text key={i} color="#9aa4b2" wrap="truncate">{line || ' '}</Text>
                ))
              ) : (
                <Box flexDirection="column" marginTop={1}>
                  <Text color="#8b949e">pane not running.</Text>
                  <Text color="#8b949e">[s] spawns it — you'll watch it boot here, live.</Text>
                </Box>
              )}
              {tasking && (
                <Box marginTop={1}>
                  <Text color="#79c0ff">task → {sel.name}: {draft}█</Text>
                </Box>
              )}
            </>
          ) : (
            <Text color="#8b949e">no lanes yet — the chat home screen boots the default five.</Text>
          )}
        </Box>
      </Box>
    </PanelFrame>
  );
}

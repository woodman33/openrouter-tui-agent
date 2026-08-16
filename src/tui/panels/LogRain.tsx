import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { humanizeLines, relTime, type HumanEvent } from '../../utils/humanlog.js';

interface LogRainProps {
  height: number;
  focused: boolean;
}

const REFRESH_MS = 2000;
const MAX_LINES = 120;

/**
 * LogRain — the right-column live stream, in HUMAN words. Newest events land
 * at the TOP and rain downward (opposite of the chat, which rises). Raw
 * telemetry is counted, never printed; machine noise is filtered out.
 * Focus with Tab; ↓ digs into history, ↑ returns to the live edge.
 */
export function LogRain({ height, focused }: LogRainProps) {
  const [rain, setRain] = useState<HumanEvent[]>([]);
  const [telCount, setTelCount] = useState(0);
  const [offset, setOffset] = useState(0);

  const load = () => {
    try {
      const merged: string[] = [];
      for (const f of ['timmy-tui.log', 'agent-events.log']) {
        const p = join('logs', f);
        if (existsSync(p)) merged.push(...readFileSync(p, 'utf-8').split('\n').filter(Boolean));
      }
      const evFile = join('.timmy', 'runs', 'events.jsonl');
      if (existsSync(evFile)) merged.push(...readFileSync(evFile, 'utf-8').split('\n').filter(Boolean));
      const { events, telemetryCount } = humanizeLines(merged);
      setRain(events.reverse().slice(0, MAX_LINES));
      setTelCount(telemetryCount);
    } catch {
      // never crash the TUI on log IO
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  useInput((_char, key) => {
    if (key.downArrow) setOffset(o => Math.min(Math.max(0, rain.length - 1), o + 1));
    if (key.upArrow) setOffset(o => Math.max(0, o - 1));
  }, { isActive: focused });

  const visible = rain.slice(offset, offset + Math.max(3, height - 3));
  const live = offset === 0;

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={focused ? '#a98bff' : '#30363d'} paddingX={1} flexShrink={0} height={height}>
      <Box justifyContent="space-between">
        <Text bold color={focused ? '#d2a8ff' : '#a5b0bc'}>⛆ WHAT'S HAPPENING ↓</Text>
        <Text color={live ? '#3fb950' : '#f5b540'}>{live ? '▼ live' : `⏸ +${offset}`}</Text>
      </Box>
      {visible.length === 0 ? (
        <Box flexDirection="column" marginTop={1}>
          <Text color="#8b949e">quiet…</Text>
          <Text color="#8b949e">events rain here</Text>
          <Text color="#8b949e">as they happen:</Text>
          <Text color="#8b949e">runs · models · gens</Text>
          <Text color="#8b949e">lanes · approvals</Text>
        </Box>
      ) : (
        visible.map((ev, i) => (
          <Text key={`${offset}-${i}`} color={i > 9 ? '#8b949e' : ev.color} wrap="truncate">
            {relTime(ev.ts)} {ev.icon} {ev.text.length > 56 ? ev.text.slice(0, 53) + '…' : ev.text}
          </Text>
        ))
      )}
      {telCount > 0 && (
        <Text color="#8b949e">☁ telemetry ×{telCount} synced (hidden)</Text>
      )}
    </Box>
  );
}

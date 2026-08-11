import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface LogRainProps {
  height: number;
  focused: boolean;
}

const REFRESH_MS = 2000;
const MAX_LINES = 150;

function rainColor(line: string): string {
  if (line.includes('[ERROR]') || line.includes('failed')) return '#ff6b6b';
  if (line.includes('[WARN]')) return '#f5b545';
  if (line.includes('receipt') || line.includes('model.')) return '#79c0ff';
  if (line.includes('Telemetry') || line.includes('spool')) return '#6e7681';
  return '#9aa4b2';
}

/**
 * LogRain — the right-column live log stream. Newest entries land at the TOP
 * and rain downward (opposite temporal direction from the chat, which rises).
 * Focus it with Tab; ↓ digs into history, ↑ returns to the live edge.
 */
export function LogRain({ height, focused }: LogRainProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);

  const load = () => {
    try {
      const merged: string[] = [];
      for (const f of ['timmy-tui.log', 'agent-events.log']) {
        const p = join('logs', f);
        if (existsSync(p)) {
          merged.push(...readFileSync(p, 'utf-8').split('\n').filter(Boolean));
        }
      }
      setLines(merged.slice(-MAX_LINES).reverse());
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
    if (key.downArrow) {
      setOffset(o => Math.min(Math.max(0, lines.length - 1), o + 1));
    }
    if (key.upArrow) {
      setOffset(o => Math.max(0, o - 1));
    }
  }, { isActive: focused });

  const visible = lines.slice(offset, offset + Math.max(3, height - 2));
  const live = offset === 0;

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={focused ? '#a98bff' : '#30363d'} paddingX={1} flexShrink={0} height={height}>
      <Box justifyContent="space-between">
        <Text bold color={focused ? '#d2a8ff' : '#8a8a94'}>⛆ LIVE LOGS ↓</Text>
        <Text color={live ? '#3fb950' : '#f5b540'}>{live ? '▼ live' : `⏸ +${offset}`}</Text>
      </Box>
      {visible.length === 0 ? (
        <Text color="#6e7681" dimColor>· waiting for session events…</Text>
      ) : (
        visible.map((line, i) => (
          <Text key={`${offset}-${i}`} color={rainColor(line)} wrap="truncate">
            {line.length > 90 ? line.slice(0, 87) + '…' : line}
          </Text>
        ))
      )}
    </Box>
  );
}

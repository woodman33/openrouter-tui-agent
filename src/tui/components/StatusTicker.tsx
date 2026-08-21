import React, { useEffect, useState } from 'react';
import { Text } from 'ink';
import { readEvents } from '../../utils/eventbus.js';
import { theme } from '../theme.js';
import { tickerLine } from '../utils/ergonomics.js';

// v1.0.1: the ambient reverse LogRain no longer rides along in the chat
// pane — this one-line ticker is the only live surface outside TELEMETRY.
export function StatusTicker({ width }: { width: number }) {
  const [last, setLast] = useState<{ kind: string; snippet: string } | null>(null);
  useEffect(() => {
    const load = () => {
      try {
        const evs = readEvents(1);
        if (evs.length) {
          const e = evs[evs.length - 1];
          const payload = e.payload && typeof e.payload === 'object' ? JSON.stringify(e.payload) : '';
          setLast({ kind: String(e.kind), snippet: payload.slice(2, 48) });
        }
      } catch { /* bus unreadable */ }
    };
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, []);
  return <Text color={theme.textTertiary} wrap="truncate">{tickerLine(last, width)}</Text>;
}

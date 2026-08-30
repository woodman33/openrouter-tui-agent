// WALNUT receipt rain — right column of the counterflow chat (work order
// p12; DESIGN.md §2.3 seal = proof only, §3.4 density, §4 one signature per
// surface, §8 motion = arrival highlight then settle). Receipts enter at the
// BOTTOM and flow UP — the opposite current to the chat's top-down flow.
// Ambient evidence, not a log viewer: no expansion, no scrollback controls;
// full inspection stays at :4310. READ-ONLY (§1): chain is only read.
import React, { useEffect, useRef, useState } from 'react';
import { Box, Text } from 'ink';
import { readChain, type Receipt } from '../../utils/receipts.js';
import { theme } from '../theme.js';

export function ReceiptRain({ height }: { height: number }) {
  const [drops, setDrops] = useState<Receipt[]>([]);
  const arrived = useRef<Record<string, number>>({});
  const [, force] = useState(0);

  useEffect(() => {
    const load = (): void => {
      const chain = readChain('runs');
      setDrops(prev => {
        const lastNew = chain[chain.length - 1];
        const lastOld = prev[prev.length - 1];
        if (lastNew && lastNew.hash !== lastOld?.hash) {
          const now = Date.now();
          for (const r of chain) if (!arrived.current[r.hash]) arrived.current[r.hash] = now;
          force(x => x + 1); // re-render so the 1.2s highlight can settle
        }
        return chain;
      });
    };
    load();
    const t = setInterval(load, 700); // <1s from disk to rain (acceptance)
    return () => clearInterval(t);
  }, []);

  const rows = Math.max(3, Math.floor((height - 2) / 4));
  const visible = drops.slice(-rows); // newest at the BOTTOM edge

  return (
    <Box flexDirection="column" justifyContent="flex-end" height={height} overflow="hidden">
      {visible.length === 0 && (
        <Text color={theme.textMuted}>· rain idle — receipts land here as runs seal</Text>
      )}
      {visible.map(r => {
        const age = Date.now() - (arrived.current[r.hash] ?? 0);
        const fresh = age < 1200; // one brief highlight, then settle (§8)
        const subject = String(r.subject ?? 'receipt');
        return (
          <Box key={r.hash} flexDirection="column">
            <Text wrap="truncate" color={fresh ? theme.textPrimary : theme.textSecondary}>
              {subject.length > 40 ? subject.slice(0, 37) + '…' : subject}
            </Text>
            <Text color={theme.seal}>{String(r.hash).slice(7, 15)}…</Text>
            <Text color={theme.textMuted} wrap="truncate">· {r.kind} · {String(r.ts).slice(11, 19)}</Text>
            <Text> </Text>
          </Box>
        );
      })}
    </Box>
  );
}

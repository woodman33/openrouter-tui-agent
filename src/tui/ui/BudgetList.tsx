// DESIGN.md §3.4 — density budget. A card shows at most `max` list items
// (default 7) before the overflow line. No wall-of-text panes; truncation is
// never silent (§8). Overflow line names the count and the scroll key.
import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

export function BudgetList<T>({
  items, max = 7, render, overflowHint = '[↓] scroll', offset = 0,
}: {
  items: readonly T[];
  max?: number;
  render: (item: T, index: number) => React.ReactNode;
  overflowHint?: string;
  offset?: number;
}) {
  const window = items.slice(offset, offset + max);
  const hidden = items.length - offset - window.length;
  return (
    <Box flexDirection="column">
      {window.map((item, i) => (
        <Box key={offset + i}>{render(item, offset + i)}</Box>
      ))}
      {hidden > 0 ? (
        <Text color={theme.textMuted}>…and {hidden} more · {overflowHint}</Text>
      ) : null}
    </Box>
  );
}

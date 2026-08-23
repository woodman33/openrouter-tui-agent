// DESIGN.md §3.7 — empty states are designed, not blank. Muted one-liner:
// what will appear here + the key that causes it, joined with `·`.
// e.g. <EmptyState line="no lanes running" action="[n] spawn one" />
import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

export function EmptyState({ line, action }: { line: string; action?: string }) {
  return (
    <Box paddingY={1}>
      <Text color={theme.textMuted}>
        {line}
        {action ? ` · ${action}` : ''}
      </Text>
    </Box>
  );
}

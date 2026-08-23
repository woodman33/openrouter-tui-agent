// DESIGN.md §3.5 — inner divider `── label ──…`. Replaces nested borders:
// max border depth is 2, so regions inside a <Card> separate with this rule.
import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

export function SectionRule({ label }: { label?: string }) {
  return (
    <Box flexDirection="row">
      <Text color={theme.textMuted}>{label ? `── ${label} ` : '── '}</Text>
      <Box
        flexGrow={1}
        borderStyle="single"
        borderColor={theme.line}
        borderTop={false}
        borderLeft={false}
        borderRight={false}
      />
    </Box>
  );
}

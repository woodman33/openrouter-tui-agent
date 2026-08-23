// DESIGN.md §6 — label/value row. Label muted lowercase, value primary,
// optional unit muted. labelWidth aligns columns of metrics tabularly.
import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

export function Metric({
  label, value, unit, labelWidth = 14,
}: { label: string; value: string | number; unit?: string; labelWidth?: number }) {
  return (
    <Box>
      <Box width={labelWidth}>
        <Text color={theme.textMuted}>{label.toLowerCase()}</Text>
      </Box>
      <Text color={theme.textPrimary}>{String(value)}</Text>
      {unit ? <Text color={theme.textMuted}> {unit}</Text> : null}
    </Box>
  );
}

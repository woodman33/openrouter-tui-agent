import React from 'react';
import { Box, Text } from 'ink';

export interface KeyHint {
  key: string;
  label: string;
}

// Contextual key hints, always visible at the bottom of every panel.
export function KeyHintBar({ hints }: { hints: KeyHint[] }) {
  return (
    <Box marginTop={1} flexShrink={0}>
      <Text color="#a5b0bc" wrap="truncate">
        {hints.map(h => `[${h.key}] ${h.label}`).join(' · ')}
      </Text>
    </Box>
  );
}

import React from 'react';
import { Box, Text } from 'ink';

// Honest empty state: what this screen shows + the first action to take.
export function EmptyState({ lines, extra }: { lines: string[]; extra?: string }) {
  return (
    <Box flexDirection="column" flexGrow={1} justifyContent="center" alignItems="center">
      {lines.map((l, i) => (
        <Text key={i} color="#6e7681" dimColor>{l}</Text>
      ))}
      {extra ? <Text color="#d29922">{extra}</Text> : null}
    </Box>
  );
}

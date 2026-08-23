// DESIGN.md §6 — key/label pair: `[g] approve`. Copy voice (§5.4): the label
// says what happens, plain lowercase verb. Secondary/muted coloring only.
import React from 'react';
import { Text } from 'ink';
import { theme } from '../theme.js';

export function KeyHint({ keys, label }: { keys: string; label: string }) {
  return (
    <Text>
      <Text color={theme.textSecondary}>[{keys}]</Text>
      <Text color={theme.textMuted}> {label}</Text>
    </Text>
  );
}

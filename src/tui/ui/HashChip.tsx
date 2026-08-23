// DESIGN.md §2.4 Proof register — the ONLY bold green in the app.
// Hashes render truncated `abc123f8…` (full on focus). sealed=true means
// cryptographically verified — never pass sealed for mere success.
import React from 'react';
import { Text } from 'ink';
import { theme } from '../theme.js';

export function HashChip({
  hash, sealed = false, full = false,
}: { hash: string; sealed?: boolean; full?: boolean }) {
  const shown = full || hash.length <= 9 ? hash : `${hash.slice(0, 8)}…`;
  return sealed ? (
    <Text color={theme.seal} bold>✓ {shown}</Text>
  ) : (
    <Text color={theme.textMuted}>{shown}</Text>
  );
}

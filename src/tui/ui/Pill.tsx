// DESIGN.md §6 — status pill. kind carries the ONLY meaning (§2.3):
// seal = cryptographic proof · warn = queued/pending/cost · danger = fail ·
// accent = live/interactive · muted = idle. Panels never color pills directly.
import React from 'react';
import { Text } from 'ink';
import { theme } from '../theme.js';

export type PillKind = 'seal' | 'warn' | 'danger' | 'accent' | 'muted';

const KIND_COLOR: Record<PillKind, string> = {
  seal: theme.seal,
  warn: theme.warn,
  danger: theme.danger,
  accent: theme.accent,
  muted: theme.textMuted,
};

export function Pill({ kind, label }: { kind: PillKind; label: string }) {
  return (
    <Text color={KIND_COLOR[kind]} bold={kind === 'seal'}>
      [{label}]
    </Text>
  );
}

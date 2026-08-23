import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';
import { truncateVisible } from '../utils/text.js';
import { usePulse } from '../hooks/usePulse.js';

const SPINNER_FRAMES = ['|', '/', '-', '\\'];
const BAR_FRAMES = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

export function Spinner({ color = theme.accent, label }: { color?: string; label?: string }) {
  const frame = usePulse(120);
  const glyph = SPINNER_FRAMES[frame % SPINNER_FRAMES.length];

  return (
    <Box>
      <Text color={color} bold>{glyph}</Text>
      {label && <Text color={theme.textSecondary}> {label}</Text>}
    </Box>
  );
}

export function SignalBars({ width = 10, color = theme.accent, active = true }: { width?: number; color?: string; active?: boolean }) {
  const frame = usePulse(active ? 110 : 700);
  const safeWidth = Math.max(1, Math.floor(width));
  const bars = Array.from({ length: safeWidth }, (_, index) => {
    if (!active) return '▁';
    return BAR_FRAMES[(frame + index) % BAR_FRAMES.length];
  }).join('');

  return <Text color={active ? color : theme.textMuted}>{bars}</Text>;
}

export function ShimmerText({
  text,
  color = theme.textSecondary,
  highlight = theme.textPrimary,
  width,
}: {
  text: string;
  color?: string;
  highlight?: string;
  width?: number;
}) {
  const frame = usePulse(160);
  const safeText = width ? truncateVisible(text, width) : text;
  const chars = Array.from(safeText);

  return (
    <Text>
      {chars.map((char, index) => (
        <Text key={`${char}-${index}`} color={index % Math.max(1, chars.length) === frame % Math.max(1, chars.length) ? highlight : color}>
          {char}
        </Text>
      ))}
    </Text>
  );
}

export function StatusPill({
  label,
  value,
  color = theme.accent,
  width = 22,
  active = false,
}: {
  label: string;
  value: string;
  color?: string;
  width?: number;
  active?: boolean;
}) {
  const safeWidth = Math.max(12, width);
  const labelWidth = Math.max(4, Math.floor(safeWidth * 0.42));
  const valueWidth = Math.max(4, safeWidth - labelWidth - 3);

  return (
    <Box borderStyle="single" borderColor={active ? color : theme.line} paddingX={1} width={safeWidth}>
      <Text color={theme.textPrimary}>{truncateVisible(label, labelWidth)}</Text>
      <Text color={theme.textMuted}> </Text>
      <Text color={color} bold={active} wrap="truncate">{truncateVisible(value, valueWidth)}</Text>
    </Box>
  );
}

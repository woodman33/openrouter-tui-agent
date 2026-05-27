import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import chalk from 'chalk';

interface ProgressBarProps {
  value: number; // 0-1
  width?: number;
  label?: string;
  showPercent?: boolean;
  color?: string;
}

export function ProgressBar({ value, width = 30, label, showPercent = true, color = '#5e6ad2' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const filled = Math.round(clamped * width);
  const empty = width - filled;

  const bar = chalk.hex(color)('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  const pct = showPercent ? ` ${Math.round(clamped * 100)}%` : '';

  return (
    <Box>
      <Text>{bar}{pct}</Text>
      {label && <Text dimColor> {label}</Text>}
    </Box>
  );
}

export function IndeterminateBar({ width = 30, label }: { width?: number; label?: string }) {
  const [pos, setPos] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPos(p => (p + 1) % width);
    }, 100);
    return () => clearInterval(interval);
  }, [width]);

  const chars = '░'.repeat(width).split('');
  const dotWidth = 4;
  for (let i = 0; i < dotWidth; i++) {
    const idx = (pos + i) % width;
    chars[idx] = '█';
  }

  return (
    <Box>
      <Text>{chalk.hex('#5e6ad2')(chars.join(''))}</Text>
      {label && <Text dimColor> {label}</Text>}
    </Box>
  );
}

import React from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';

interface GlowBorderProps {
  children?: React.ReactNode;
  color?: string;
  width?: number;
  label?: string;
}

export function GlowBorder({ children, color = '#5e6ad2', width = 40, label }: GlowBorderProps) {
  const topBorder = `╭${'─'.repeat(width - 2)}╮`;
  const bottomBorder = `╰${'─'.repeat(width - 2)}╯`;

  const glowColor = chalk.hex(color);
  const dimGlow = chalk.hex(color).dim;
  const faintGlow = chalk.hex(color).dim.italic;

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Text>{dimGlow(topBorder.charAt(0))}{label ? glowColor(`─ ${label} `) : null}{dimGlow(topBorder.slice(label ? label.length + 4 : 1))}</Text>
      {children}
      <Text>{faintGlow(bottomBorder)}</Text>
    </Box>
  );
}

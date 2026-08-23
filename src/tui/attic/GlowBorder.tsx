import React from 'react';
import { Box, Text } from 'ink';
import { truncateVisible } from '../utils/text.js';
import { theme } from '../theme.js';

interface GlowBorderProps {
  children?: React.ReactNode;
  color?: string;
  width?: number;
  height?: number;
  label?: string;
  borderStyle?: "single" | "double" | "round" | "bold" | "singleDouble" | "doubleSingle" | "classic" | undefined;
}

export function GlowBorder({ children, color = theme.accent, width = 40, height, label, borderStyle = 'round' }: GlowBorderProps) {
  const safeWidth = Math.max(8, Math.floor(width));
  const safeHeight = height ? Math.max(3, Math.floor(height)) : undefined;
  const innerWidth = Math.max(4, safeWidth - 2);
  const labelText = label ? truncateVisible(label, Math.max(1, innerWidth - 2)) : '';

  return (
    <Box
      flexDirection="column"
      width={safeWidth}
      height={safeHeight}
      minHeight={safeHeight ? undefined : 3}
      flexGrow={safeHeight ? 0 : 1}
      flexShrink={1}
      borderStyle={borderStyle}
      borderColor={color}
      overflowY="hidden"
    >
      {labelText && (
        <Box width={innerWidth} paddingX={1} flexShrink={0}>
          <Text color={color} bold wrap="truncate">{labelText}</Text>
        </Box>
      )}
      <Box flexDirection="column" width={innerWidth} flexGrow={1} flexShrink={1} overflowY="hidden">
        {children}
      </Box>
    </Box>
  );
}

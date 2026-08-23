import React from 'react';
import { Text, Box } from 'ink';
import { theme } from '../theme.js';

interface ModelBadgeProps {
  model: string;
  current?: boolean;
  maxWidth?: number;
}

export function ModelBadge({ model, current, maxWidth }: ModelBadgeProps) {
  let shortModel = model.split('/').pop() || model;
  if (maxWidth && shortModel.length > maxWidth) {
    shortModel = shortModel.slice(0, maxWidth - 3) + '...';
  }

  const providerColor = (() => {
    const m = model.toLowerCase();
    if (m.includes('anthropic') || m.includes('claude')) return theme.warn;
    if (m.includes('openai') || m.includes('gpt')) return theme.accent;
    if (m.includes('google') || m.includes('gemini')) return theme.accent;
    if (m.includes('meta') || m.includes('llama')) return theme.accent;
    if (m.includes('mistral')) return theme.danger;
    if (m.includes('deepseek')) return theme.accent;
    return theme.textSecondary;
  })();

  return (
    <Box borderStyle={current ? 'double' : 'single'} borderColor={providerColor}>
      <Text color={providerColor} bold={current}>
        {current ? '● ' : '○ '}{shortModel}
      </Text>
    </Box>
  );
}

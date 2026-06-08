import React from 'react';
import { Text, Box } from 'ink';

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
    if (m.includes('anthropic') || m.includes('claude')) return '#d29922';
    if (m.includes('openai') || m.includes('gpt')) return '#3fb950';
    if (m.includes('google') || m.includes('gemini')) return '#58a6ff';
    if (m.includes('meta') || m.includes('llama')) return '#a5d6ff';
    if (m.includes('mistral')) return '#f85149';
    if (m.includes('deepseek')) return '#d2a8ff';
    return '#8b949e';
  })();

  return (
    <Box borderStyle={current ? 'double' : 'single'} borderColor={providerColor}>
      <Text color={providerColor} bold={current}>
        {current ? '● ' : '○ '}{shortModel}
      </Text>
    </Box>
  );
}

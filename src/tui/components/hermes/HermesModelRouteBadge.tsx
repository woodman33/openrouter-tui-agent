import React from 'react';
import { Box, Text } from 'ink';
import type { HermesModelUsage } from '../../../hermes/events.js';
import type { HermesConnectionStatus } from '../../../hermes/client.js';

interface HermesModelRouteBadgeProps {
  status: HermesConnectionStatus;
  model?: string;
  provider?: string;
  usage: HermesModelUsage;
  sessionId: string | null;
}

const STATUS_COLORS: Record<HermesConnectionStatus, string> = {
  disconnected: '#8b949e',
  connecting: '#d29922',
  ready: '#3fb950',
  closed: '#8b949e',
  error: '#f85149',
};

export function HermesModelRouteBadge({
  status,
  model,
  provider,
  usage,
  sessionId,
}: HermesModelRouteBadgeProps) {
  const tokens =
    usage.totalTokens ??
    (usage.inputTokens !== undefined || usage.outputTokens !== undefined
      ? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)
      : undefined);

  return (
    <Box>
      <Text bold color={STATUS_COLORS[status]}>
        ● {status.toUpperCase()}
      </Text>
      <Text color="#8b949e"> | </Text>
      <Text color="#a5d6ff" wrap="truncate">
        {model ?? 'model: n/a'}
      </Text>
      {provider && (
        <>
          <Text color="#8b949e"> via </Text>
          <Text color="#79c0ff">{provider}</Text>
        </>
      )}
      <Text color="#8b949e"> | </Text>
      <Text color="#e6edf3">
        {tokens !== undefined ? `${tokens} tok` : 'usage n/a'}
        {usage.costUsd !== undefined ? ` $${usage.costUsd.toFixed(4)}` : ''}
      </Text>
      {sessionId && (
        <>
          <Text color="#8b949e"> | sess </Text>
          <Text color="#d2a8ff">{sessionId.slice(0, 8)}</Text>
        </>
      )}
    </Box>
  );
}

import React from 'react';
import { Box, Text } from 'ink';
import type { HermesModelUsage } from '../../hermes/events.js';
import type { HermesConnectionStatus } from '../../hermes/client.js';
import { theme } from '../theme.js';

interface HermesModelRouteBadgeProps {
  status: HermesConnectionStatus;
  model?: string;
  provider?: string;
  usage: HermesModelUsage;
  sessionId: string | null;
}

const STATUS_COLORS: Record<HermesConnectionStatus, string> = {
  disconnected: theme.textSecondary,
  connecting: theme.warn,
  ready: theme.accent,
  closed: theme.textSecondary,
  error: theme.danger,
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
      <Text color={theme.textSecondary}> | </Text>
      <Text color={theme.accent} wrap="truncate">
        {model ?? 'model: n/a'}
      </Text>
      {provider && (
        <>
          <Text color={theme.textSecondary}> via </Text>
          <Text color={theme.accent}>{provider}</Text>
        </>
      )}
      <Text color={theme.textSecondary}> | </Text>
      <Text color={theme.textPrimary}>
        {tokens !== undefined ? `${tokens} tok` : 'usage n/a'}
        {usage.costUsd !== undefined ? ` $${usage.costUsd.toFixed(4)}` : ''}
      </Text>
      {sessionId && (
        <>
          <Text color={theme.textSecondary}> | sess </Text>
          <Text color={theme.accent}>{sessionId.slice(0, 8)}</Text>
        </>
      )}
    </Box>
  );
}

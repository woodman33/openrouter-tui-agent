import React from 'react';
import { Box, Text } from 'ink';
import type { HermesApproval } from '../../hermes/events.js';
import { theme } from '../theme.js';

interface HermesApprovalInboxProps {
  approvals: HermesApproval[];
  selectedIndex: number;
  focused: boolean;
  width: number;
}

const KIND_COLORS: Record<HermesApproval['kind'], string> = {
  approval: theme.warn,
  clarify: theme.accent,
  sudo: theme.danger,
  secret: theme.danger,
};

const VISIBLE_ROWS = 4;

export function HermesApprovalInbox({
  approvals,
  selectedIndex,
  focused,
  width,
}: HermesApprovalInboxProps) {
  const open = approvals.filter((a) => a.status === 'open');
  const messageWidth = Math.max(10, width - 24);
  // Window the list around the selection so the highlighted row — the one
  // a/r/t act on — is always the one visible.
  const clampedIndex = Math.min(selectedIndex, Math.max(0, open.length - 1));
  const windowStart = Math.min(
    Math.max(0, clampedIndex - (VISIBLE_ROWS - 1)),
    Math.max(0, open.length - VISIBLE_ROWS),
  );
  const visible = open.slice(windowStart, windowStart + VISIBLE_ROWS);

  return (
    <Box
      flexDirection="column"
      borderStyle={open.length > 0 ? 'double' : 'single'}
      borderColor={focused ? theme.warn : open.length > 0 ? theme.warn : theme.line}
      paddingX={1}
    >
      <Box justifyContent="space-between">
        <Text bold color={theme.warn}>APPROVAL INBOX</Text>
        <Text color={theme.textSecondary}>
          {open.length === 0
            ? 'no pending requests'
            : `${open.length} waiting${open.length > VISIBLE_ROWS ? ` (showing ${windowStart + 1}-${windowStart + visible.length})` : ''}`}
        </Text>
      </Box>
      {visible.map((approval, idx) => {
        const isSelected = focused && windowStart + idx === clampedIndex;
        return (
          <Box key={approval.id}>
            <Text bold={isSelected} color={isSelected ? theme.textPrimary : KIND_COLORS[approval.kind]}>
              {isSelected ? '▶ ' : '  '}
              [{approval.kind.toUpperCase().padEnd(8)}]
            </Text>
            <Text color={isSelected ? theme.textPrimary : theme.textSecondary} wrap="truncate">
              {' '}
              {approval.message.replace(/\s+/g, ' ').slice(0, messageWidth)}
            </Text>
          </Box>
        );
      })}
      {open.length > 0 && (
        <Text color={theme.textSecondary} dimColor>
          a approve | r reject | t type answer{focused ? '' : ' | Tab to focus inbox'}
        </Text>
      )}
    </Box>
  );
}

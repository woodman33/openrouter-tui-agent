import React from 'react';
import { Box, Text } from 'ink';
import type { HermesEvent } from '../../../hermes/events.js';
import { theme } from '../../theme.js';

interface HermesRunTimelineProps {
  events: HermesEvent[];
  /** Rows available for event lines (already excludes chrome). */
  visibleRows: number;
  width: number;
  /** 0 = pinned to the newest events; N = scrolled back N rows. */
  scrollBack: number;
  focused: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  'message.delta': theme.textSecondary,
  'message.complete': theme.success,
  'tool.start': theme.info,
  'tool.progress': theme.info,
  'tool.complete': theme.info,
  'tool.error': theme.error,
  'approval.request': theme.warning,
  'approval.response': theme.brand,
  'clarify.request': theme.warning,
  'clarify.response': theme.brand,
  'sudo.request': theme.error,
  'sudo.response': theme.brand,
  'secret.request': theme.error,
  'secret.response': theme.brand,
  'model.switch': theme.info,
  'provider.route': theme.info,
  'quota.warning': theme.warning,
  'run.error': theme.error,
};

function summarize(event: HermesEvent, maxLen: number): string {
  const p = event.payload;
  const candidate =
    (typeof p.text === 'string' && p.text) ||
    (typeof p.delta === 'string' && p.delta) ||
    (typeof p.command === 'string' && p.command) ||
    (typeof p.prompt === 'string' && p.prompt) ||
    (typeof p.name === 'string' && p.name) ||
    (typeof p.message === 'string' && p.message) ||
    (typeof p.model === 'string' && p.model) ||
    (typeof p.responseSummary === 'string' && p.responseSummary) ||
    '';
  const flat = candidate.replace(/\s+/g, ' ').trim();
  return flat.length > maxLen ? `${flat.slice(0, Math.max(0, maxLen - 1))}…` : flat;
}

function timeOf(event: HermesEvent): string {
  const t = new Date(event.timestamp);
  return Number.isNaN(t.getTime()) ? '--:--:--' : t.toISOString().slice(11, 19);
}

export function HermesRunTimeline({
  events,
  visibleRows,
  width,
  scrollBack,
  focused,
}: HermesRunTimelineProps) {
  const rows = Math.max(1, visibleRows);
  const end = Math.max(0, events.length - scrollBack);
  const start = Math.max(0, end - rows);
  const window = events.slice(start, end);
  const summaryWidth = Math.max(10, width - 30);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={focused ? theme.info : theme.borderDefault}
      paddingX={1}
      flexGrow={1}
    >
      <Box justifyContent="space-between">
        <Text bold color={theme.info}>RUN TIMELINE</Text>
        <Text color={theme.textSecondary}>
          {events.length === 0
            ? 'no events'
            : `events ${start + 1}-${end} of ${events.length}${scrollBack > 0 ? ' (scrolled)' : ''}`}
        </Text>
      </Box>
      {window.length === 0 ? (
        <Text color={theme.textSecondary} dimColor>
          Waiting for gateway events — connect and submit a prompt.
        </Text>
      ) : (
        window.map((event) => (
          <Box key={event.id}>
            <Text color={theme.textSecondary}>{timeOf(event)} </Text>
            <Text bold color={TYPE_COLORS[event.type] ?? theme.textPrimary}>
              {event.type.padEnd(18).slice(0, 18)}
            </Text>
            <Text color={event.severity === 'error' ? theme.error : theme.textPrimary} wrap="truncate">
              {' '}
              {summarize(event, summaryWidth)}
            </Text>
          </Box>
        ))
      )}
    </Box>
  );
}

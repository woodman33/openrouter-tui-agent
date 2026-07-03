import React from 'react';
import { Box, Text } from 'ink';
import type { HermesEvent } from '../../../hermes/events.js';

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
  'message.delta': '#8b949e',
  'message.complete': '#3fb950',
  'tool.start': '#79c0ff',
  'tool.progress': '#79c0ff',
  'tool.complete': '#58a6ff',
  'tool.error': '#f85149',
  'approval.request': '#d29922',
  'approval.response': '#d2a8ff',
  'clarify.request': '#d29922',
  'clarify.response': '#d2a8ff',
  'sudo.request': '#ff7b72',
  'sudo.response': '#d2a8ff',
  'secret.request': '#ff7b72',
  'secret.response': '#d2a8ff',
  'model.switch': '#a5d6ff',
  'provider.route': '#a5d6ff',
  'quota.warning': '#d29922',
  'run.error': '#f85149',
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
      borderColor={focused ? '#79c0ff' : '#30363d'}
      paddingX={1}
      flexGrow={1}
    >
      <Box justifyContent="space-between">
        <Text bold color="#79c0ff">RUN TIMELINE</Text>
        <Text color="#8b949e">
          {events.length === 0
            ? 'no events'
            : `events ${start + 1}-${end} of ${events.length}${scrollBack > 0 ? ' (scrolled)' : ''}`}
        </Text>
      </Box>
      {window.length === 0 ? (
        <Text color="#8b949e" dimColor>
          Waiting for gateway events — connect and submit a prompt.
        </Text>
      ) : (
        window.map((event) => (
          <Box key={event.id}>
            <Text color="#8b949e">{timeOf(event)} </Text>
            <Text bold color={TYPE_COLORS[event.type] ?? '#e6edf3'}>
              {event.type.padEnd(18).slice(0, 18)}
            </Text>
            <Text color={event.severity === 'error' ? '#f85149' : '#e6edf3'} wrap="truncate">
              {' '}
              {summarize(event, summaryWidth)}
            </Text>
          </Box>
        ))
      )}
    </Box>
  );
}

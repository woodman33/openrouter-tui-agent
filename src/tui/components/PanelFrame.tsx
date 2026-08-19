import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { KeyHintBar, type KeyHint } from './KeyHintBar.js';
import { theme } from '../theme.js';
import { statusGlyph, type TimmyStatus } from './StatusGlyph.js';

interface PanelFrameProps {
  icon: string;
  title: string;
  status?: string;
  /** Semantic status from the single glyph map — same glyph/color everywhere. */
  statusKind?: TimmyStatus;
  statusColor?: string;
  explain?: string;
  hints: KeyHint[];
  children: React.ReactNode;
}

// Consistent chrome for every tab: 1px hairline border, title + live status
// strip, one-line plain-English explainer, content, contextual key hints.
// All column math derives from stdout dimensions — no hardcoded buffers, so
// split tmux panes and small viewports shrink gutters instead of wrapping
// box-drawing characters.
export function PanelFrame({ icon, title, status, statusKind, statusColor, explain, hints, children }: PanelFrameProps) {
  const cols = useStdout().stdout?.columns ?? 80;
  const gutter = cols >= 100 ? 2 : 1;
  const g = statusKind ? statusGlyph(statusKind) : null;
  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="single" borderColor={theme.borderDefault} paddingX={gutter}>
      <Box flexDirection="column" marginBottom={1} flexShrink={0}>
        <Box justifyContent="space-between">
          <Text bold color={theme.brand} wrap="truncate">{icon} {title}</Text>
          {g || status ? (
            <Text color={statusColor ?? (g ? g.color : theme.textSecondary)} wrap="truncate">
              {g ? `${g.glyph} ${g.label}` : ''}{g && status ? ' · ' : ''}{status ?? ''}
            </Text>
          ) : null}
        </Box>
        {explain ? <Text color={theme.textTertiary} wrap="truncate">{explain}</Text> : null}
      </Box>
      {children}
      <KeyHintBar hints={hints} />
    </Box>
  );
}

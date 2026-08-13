import React from 'react';
import { Box, Text } from 'ink';
import { KeyHintBar, type KeyHint } from './KeyHintBar.js';

interface PanelFrameProps {
  icon: string;
  title: string;
  status?: string;
  statusColor?: string;
  explain?: string;
  hints: KeyHint[];
  children: React.ReactNode;
}

// Consistent chrome for the rebuilt tabs: title + live status strip,
// one-line plain-English explainer, content, contextual key hints.
export function PanelFrame({ icon, title, status, statusColor, explain, hints, children }: PanelFrameProps) {
  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box flexDirection="column" marginBottom={1} flexShrink={0}>
        <Box justifyContent="space-between">
          <Text bold color="#d2a8ff">{icon} {title}</Text>
          {status ? <Text color={statusColor || '#8a8a94'}>{status}</Text> : null}
        </Box>
        {explain ? <Text color="#8b949e" dimColor>{explain}</Text> : null}
      </Box>
      {children}
      <KeyHintBar hints={hints} />
    </Box>
  );
}

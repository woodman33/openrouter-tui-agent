import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';
import { truncateVisible, scrollVisibleLeft } from '../utils/text.js';
import { usePulse } from '../hooks/usePulse.js';

interface ButtonProps {
  label: string;
  selected?: boolean;
  color?: string;
  width?: number;
}

// Pulse = dim toggle on the SAME token (palette-strict: no second hex).
export function PrimaryButton({ label, selected = false, color = theme.accent, width }: ButtonProps) {
  const pulse = usePulse(400);
  const displayLabel = label.startsWith('[') && label.endsWith(']') ? label : `[${label}]`;
  return (
    <Box borderStyle="single" borderColor={selected ? color : theme.line} paddingX={2} marginX={1} width={width}>
      <Text bold={selected} dimColor={selected && pulse % 2 === 1} color={selected ? color : theme.textSecondary}>
        {selected ? '▶ ' : '  '}{displayLabel}
      </Text>
    </Box>
  );
}

export function SecondaryButton({ label, selected = false, color = theme.accent, width }: ButtonProps) {
  const pulse = usePulse(400);
  const displayLabel = label.startsWith('[') && label.endsWith(']') ? label : `[${label}]`;
  return (
    <Box borderStyle="single" borderColor={selected ? color : theme.line} paddingX={2} marginX={1} width={width}>
      <Text dimColor={selected && pulse % 2 === 1} color={selected ? color : theme.textSecondary} bold={selected}>
        {selected ? '▶ ' : '  '}{displayLabel}
      </Text>
    </Box>
  );
}

export function DangerButton({ label, selected = false, width }: ButtonProps) {
  const pulse = usePulse(400);
  const displayLabel = label.startsWith('[') && label.endsWith(']') ? label : `[${label}]`;
  return (
    <Box borderStyle="single" borderColor={selected ? theme.danger : theme.line} paddingX={2} marginX={1} width={width}>
      <Text bold={selected} dimColor={selected && pulse % 2 === 1} color={selected ? theme.danger : theme.textSecondary}>
        {selected ? '▶ ' : '  '}{displayLabel}
      </Text>
    </Box>
  );
}

export function WarningButton({ label, selected = false, width }: ButtonProps) {
  const pulse = usePulse(400);
  const displayLabel = label.startsWith('[') && label.endsWith(']') ? label : `[${label}]`;
  return (
    <Box borderStyle="single" borderColor={selected ? theme.warn : theme.line} paddingX={2} marginX={1} width={width}>
      <Text bold={selected} dimColor={selected && pulse % 2 === 1} color={selected ? theme.warn : theme.textSecondary}>
        {selected ? '▶ ' : '  '}{displayLabel}
      </Text>
    </Box>
  );
}

export function DisabledButton({ label }: ButtonProps) {
  const displayLabel = label.startsWith('[') && label.endsWith(']') ? label : `[${label}]`;
  return (
    <Box borderStyle="single" borderColor={theme.line} paddingX={1} marginX={1}>
      <Text color={theme.textMuted}>
        {displayLabel} (Planned)
      </Text>
    </Box>
  );
}


interface TextInputBarProps {
  label: string;
  value: string;
  focused?: boolean;
  width?: number;
}

export function TextInputBar({ label, value, focused = false, width = 60 }: TextInputBarProps) {
  const borderCol = focused ? theme.accent : theme.line;
  return (
    <Box borderStyle="single" borderColor={borderCol} paddingX={1} width={width} flexShrink={0}>
      <Text color={theme.textSecondary}>[{label}] </Text>
      <Text color={theme.accent}>▶ </Text>
      <Text color={theme.textPrimary} wrap="truncate">{scrollVisibleLeft(value, Math.max(1, width - label.length - 8))}</Text>
      <Text color={theme.accent}>█</Text>
    </Box>
  );
}

interface StepPipelineProps {
  steps: string[];
  activeIdx: number;
  activeColor?: string;
}

export function StepPipeline({ steps, activeIdx, activeColor = theme.warn }: StepPipelineProps) {
  return (
    <Box flexDirection="row" paddingX={1} marginY={1}>
      {steps.map((step, idx) => {
        const isCurrent = idx === activeIdx;
        const isPast = idx < activeIdx;
        let color = theme.textMuted;
        if (isCurrent) color = activeColor;
        else if (isPast) color = theme.accent;

        const prefix = isPast ? '✔ ' : isCurrent ? '● ' : '○ ';

        return (
          <Box key={step} flexDirection="row" alignItems="center">
            <Text bold={isCurrent} color={color}>
              {prefix}{step}
            </Text>
            {idx < steps.length - 1 && (
              <Text color={theme.line}> ➔ </Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

interface InfoCardProps {
  title: string;
  details: string[];
  color?: string;
}

export function InfoCard({ title, details, color = theme.accent }: InfoCardProps) {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor={theme.line} paddingX={2} paddingY={1} marginBottom={1}>
      <Text bold color={color}>{title}</Text>
      {details.map((line, idx) => (
        <Text key={idx} color={theme.textPrimary}>{line}</Text>
      ))}
    </Box>
  );
}

interface ResultCardProps {
  title: string;
  fields: Record<string, string>;
  color?: string;
}

export function ResultCard({ title, fields, color = theme.accent }: ResultCardProps) {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor={theme.line} paddingX={2} paddingY={1} marginBottom={1}>
      <Text bold color={color}>{title}</Text>
      {Object.entries(fields).map(([k, v]) => (
        <Text key={k} color={theme.textSecondary}>
          {k}: <Text color={theme.textPrimary}>{v}</Text>
        </Text>
      ))}
    </Box>
  );
}

interface CompactInspectorProps {
  fields: Record<string, string>;
}

export function CompactInspector({ fields }: CompactInspectorProps) {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor={theme.line} paddingX={1}>
      {Object.entries(fields).slice(0, 6).map(([k, v]) => (
        <Text key={k} color={theme.textSecondary}>
          {k}: <Text color={theme.textPrimary} wrap="truncate">{v}</Text>
        </Text>
      ))}
    </Box>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Box flexGrow={1} flexDirection="column" justifyContent="center" alignItems="center" paddingY={2}>
      <Text color={theme.textMuted}>◌ {message}</Text>
    </Box>
  );
}

interface ActionRowProps {
  actions: { key: string; desc: string }[];
}

export function ActionRow({ actions }: ActionRowProps) {
  return (
    <Box flexDirection="row" flexWrap="wrap" paddingX={1} marginY={1}>
      {actions.map((act, idx) => (
        <Box key={act.key} marginRight={4}>
          <Text color={theme.textSecondary}>
            <Text bold color={theme.accent}>{act.key}</Text>: {act.desc}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

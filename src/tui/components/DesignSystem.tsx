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
export function PrimaryButton({ label, selected = false, color = theme.success, width }: ButtonProps) {
  const pulse = usePulse(400);
  const displayLabel = label.startsWith('[') && label.endsWith(']') ? label : `[${label}]`;
  return (
    <Box borderStyle="single" borderColor={selected ? color : theme.borderDefault} paddingX={2} marginX={1} width={width}>
      <Text bold={selected} dimColor={selected && pulse % 2 === 1} color={selected ? color : theme.textSecondary}>
        {selected ? '▶ ' : '  '}{displayLabel}
      </Text>
    </Box>
  );
}

export function SecondaryButton({ label, selected = false, color = theme.info, width }: ButtonProps) {
  const pulse = usePulse(400);
  const displayLabel = label.startsWith('[') && label.endsWith(']') ? label : `[${label}]`;
  return (
    <Box borderStyle="single" borderColor={selected ? color : theme.borderDefault} paddingX={2} marginX={1} width={width}>
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
    <Box borderStyle="single" borderColor={selected ? theme.error : theme.borderDefault} paddingX={2} marginX={1} width={width}>
      <Text bold={selected} dimColor={selected && pulse % 2 === 1} color={selected ? theme.error : theme.textSecondary}>
        {selected ? '▶ ' : '  '}{displayLabel}
      </Text>
    </Box>
  );
}

export function WarningButton({ label, selected = false, width }: ButtonProps) {
  const pulse = usePulse(400);
  const displayLabel = label.startsWith('[') && label.endsWith(']') ? label : `[${label}]`;
  return (
    <Box borderStyle="single" borderColor={selected ? theme.warning : theme.borderDefault} paddingX={2} marginX={1} width={width}>
      <Text bold={selected} dimColor={selected && pulse % 2 === 1} color={selected ? theme.warning : theme.textSecondary}>
        {selected ? '▶ ' : '  '}{displayLabel}
      </Text>
    </Box>
  );
}

export function DisabledButton({ label }: ButtonProps) {
  const displayLabel = label.startsWith('[') && label.endsWith(']') ? label : `[${label}]`;
  return (
    <Box borderStyle="single" borderColor={theme.borderDefault} paddingX={1} marginX={1}>
      <Text color={theme.textTertiary}>
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
  const borderCol = focused ? theme.focus : theme.borderDefault;
  return (
    <Box borderStyle="single" borderColor={borderCol} paddingX={1} width={width} flexShrink={0}>
      <Text color={theme.textSecondary}>[{label}] </Text>
      <Text color={theme.focus}>▶ </Text>
      <Text color={theme.textPrimary} wrap="truncate">{scrollVisibleLeft(value, Math.max(1, width - label.length - 8))}</Text>
      <Text color={theme.brand}>█</Text>
    </Box>
  );
}

interface StepPipelineProps {
  steps: string[];
  activeIdx: number;
  activeColor?: string;
}

export function StepPipeline({ steps, activeIdx, activeColor = theme.warning }: StepPipelineProps) {
  return (
    <Box flexDirection="row" paddingX={1} marginY={1}>
      {steps.map((step, idx) => {
        const isCurrent = idx === activeIdx;
        const isPast = idx < activeIdx;
        let color = theme.textTertiary;
        if (isCurrent) color = activeColor;
        else if (isPast) color = theme.success;

        const prefix = isPast ? '✔ ' : isCurrent ? '● ' : '○ ';

        return (
          <Box key={step} flexDirection="row" alignItems="center">
            <Text bold={isCurrent} color={color}>
              {prefix}{step}
            </Text>
            {idx < steps.length - 1 && (
              <Text color={theme.borderDefault}> ➔ </Text>
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

export function InfoCard({ title, details, color = theme.brand }: InfoCardProps) {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor={theme.borderDefault} paddingX={2} paddingY={1} marginBottom={1}>
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

export function ResultCard({ title, fields, color = theme.info }: ResultCardProps) {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor={theme.borderDefault} paddingX={2} paddingY={1} marginBottom={1}>
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
    <Box flexDirection="column" borderStyle="single" borderColor={theme.borderDefault} paddingX={1}>
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
      <Text color={theme.textTertiary}>◌ {message}</Text>
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
            <Text bold color={theme.info}>{act.key}</Text>: {act.desc}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

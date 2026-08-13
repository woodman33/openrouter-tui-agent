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

export function PrimaryButton({ label, selected = false, color = '#3fb950', width }: ButtonProps) {
  const pulse = usePulse(400);
  const displayLabel = label.startsWith('[') && label.endsWith(']') ? label : `[${label}]`;
  const activeColor = selected ? (pulse % 2 === 0 ? '#3fb950' : '#47d65c') : '#30363d';
  return (
    <Box borderStyle="single" borderColor={activeColor} paddingX={2} marginX={1} width={width}>
      <Text bold={selected} color={selected ? activeColor : '#8b949e'}>
        {selected ? '▶ ' : '  '}{displayLabel}
      </Text>
    </Box>
  );
}

export function SecondaryButton({ label, selected = false, color = '#30363d', width }: ButtonProps) {
  const pulse = usePulse(400);
  const displayLabel = label.startsWith('[') && label.endsWith(']') ? label : `[${label}]`;
  const activeColor = selected ? (pulse % 2 === 0 ? '#58a6ff' : '#79c0ff') : '#30363d';
  const textColor = selected ? activeColor : '#8b949e';
  return (
    <Box borderStyle="single" borderColor={activeColor} paddingX={2} marginX={1} width={width}>
      <Text color={textColor} bold={selected}>
        {selected ? '▶ ' : '  '}{displayLabel}
      </Text>
    </Box>
  );
}

export function DangerButton({ label, selected = false, width }: ButtonProps) {
  const pulse = usePulse(400);
  const displayLabel = label.startsWith('[') && label.endsWith(']') ? label : `[${label}]`;
  const activeColor = selected ? (pulse % 2 === 0 ? '#f85149' : '#ff7b72') : '#30363d';
  const textColor = selected ? activeColor : '#8b949e';
  return (
    <Box borderStyle="single" borderColor={activeColor} paddingX={2} marginX={1} width={width}>
      <Text bold={selected} color={textColor}>
        {selected ? '▶ ' : '  '}{displayLabel}
      </Text>
    </Box>
  );
}

export function WarningButton({ label, selected = false, width }: ButtonProps) {
  const pulse = usePulse(400);
  const displayLabel = label.startsWith('[') && label.endsWith(']') ? label : `[${label}]`;
  const activeColor = selected ? (pulse % 2 === 0 ? '#d29922' : '#f5b545') : '#30363d';
  const textColor = selected ? activeColor : '#8b949e';
  return (
    <Box borderStyle="single" borderColor={activeColor} paddingX={2} marginX={1} width={width}>
      <Text bold={selected} color={textColor}>
        {selected ? '▶ ' : '  '}{displayLabel}
      </Text>
    </Box>
  );
}

export function DisabledButton({ label }: ButtonProps) {
  const displayLabel = label.startsWith('[') && label.endsWith(']') ? label : `[${label}]`;
  return (
    <Box borderStyle="single" borderColor="#30363d" paddingX={1} marginX={1}>
      <Text color="#484f58">
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
  const borderCol = focused ? '#a98bff' : '#30363d';
  return (
    <Box borderStyle="single" borderColor={borderCol} paddingX={1} width={width} flexShrink={0}>
      <Text color="#8b949e">[{label}] </Text>
      <Text color="#4f9cff">▶ </Text>
      <Text color="#e6edf3" wrap="truncate">{scrollVisibleLeft(value, Math.max(1, width - label.length - 8))}</Text>
      <Text color="#a98bff">█</Text>
    </Box>
  );
}

interface StepPipelineProps {
  steps: string[];
  activeIdx: number;
  activeColor?: string;
}

export function StepPipeline({ steps, activeIdx, activeColor = '#d29922' }: StepPipelineProps) {
  return (
    <Box flexDirection="row" paddingX={1} marginY={1}>
      {steps.map((step, idx) => {
        const isCurrent = idx === activeIdx;
        const isPast = idx < activeIdx;
        let color = '#8b949e';
        if (isCurrent) color = activeColor;
        else if (isPast) color = '#3fb950';

        const prefix = isPast ? '✔ ' : isCurrent ? '● ' : '○ ';

        return (
          <Box key={step} flexDirection="row" alignItems="center">
            <Text bold={isCurrent} color={color}>
              {prefix}{step}
            </Text>
            {idx < steps.length - 1 && (
              <Text color="#30363d"> ➔ </Text>
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

export function InfoCard({ title, details, color = '#5e6ad2' }: InfoCardProps) {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor="#30363d" paddingX={2} paddingY={1} marginBottom={1}>
      <Text bold color={color}>{title}</Text>
      {details.map((line, idx) => (
        <Text key={idx} color="#e6edf3">{line}</Text>
      ))}
    </Box>
  );
}

interface ResultCardProps {
  title: string;
  fields: Record<string, string>;
  color?: string;
}

export function ResultCard({ title, fields, color = '#58a6ff' }: ResultCardProps) {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor="#30363d" paddingX={2} paddingY={1} marginBottom={1}>
      <Text bold color={color}>{title}</Text>
      {Object.entries(fields).map(([k, v]) => (
        <Text key={k} color="#8b949e">
          {k}: <Text color="#e6edf3">{v}</Text>
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
    <Box flexDirection="column" borderStyle="single" borderColor="#30363d" paddingX={1}>
      {Object.entries(fields).slice(0, 6).map(([k, v]) => (
        <Text key={k} color="#8b949e">
          {k}: <Text color="#e6edf3" wrap="truncate">{v}</Text>
        </Text>
      ))}
    </Box>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Box flexGrow={1} flexDirection="column" justifyContent="center" alignItems="center" paddingY={2}>
      <Text color="#8b949e">◌ {message}</Text>
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
          <Text color="#8b949e">
            <Text bold color="#79c0ff">{act.key}</Text>: {act.desc}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

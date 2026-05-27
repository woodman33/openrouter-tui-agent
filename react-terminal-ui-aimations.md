import { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'ghost';
  isFocused?: boolean;
}

function Button({ label, onClick, variant = 'primary', isFocused }: ButtonProps) {
  const colors = {
    primary: { bg: '#7D56F4', fg: '#FFF', border: '#5B21B6' },
    danger:  { bg: '#DC2626', fg: '#FFF', border: '#991B1B' },
    ghost:   { bg: 'transparent', fg: '#A1A1AA', border: '#3F3F46' },
  };
  
  const c = colors[variant];
  
  return (
    <Box
      paddingX={2}
      paddingY={1}
      borderStyle={isFocused ? 'double' : 'round'}
      borderColor={isFocused ? '#FFF' : c.border}
      backgroundColor={isFocused ? c.bg : isFocused ? c.bg : c.bg}
    >
      <Text color={c.fg} bold={isFocused}>
        {isFocused ? '▶ ' : '  '}{label}
      </Text>
    </Box>
  );
}

// Button group with arrow key navigation
function ConfirmationDialog({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) {
  const [focusedIdx, setFocusedIdx] = useState(0);
  const buttons = [
    { label: 'Apply Changes', action: onConfirm, variant: 'primary' as const },
    { label: 'Cancel', action: onCancel, variant: 'ghost' as const },
    { label: 'Reject', action: onCancel, variant: 'danger' as const },
  ];

  useInput((input, key) => {
    if (key.leftArrow) setFocusedIdx(i => Math.max(0, i - 1));
    if (key.rightArrow) setFocusedIdx(i => Math.min(buttons.length - 1, i + 1));
    if (key.return) buttons[focusedIdx].action();
  });

  return (
    <Box flexDirection="row" gap={1} padding={1}>
      {buttons.map((btn, i) => (
        <Button
          key={btn.label}
          label={btn.label}
          variant={btn.variant}
          isFocused={i === focusedIdx}
          onClick={btn.action}
        />
      ))}
    </Box>
  );
}
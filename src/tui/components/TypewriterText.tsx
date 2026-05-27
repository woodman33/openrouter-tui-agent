import React, { useState, useEffect, useRef } from 'react';
import { Text } from 'ink';

interface TypewriterTextProps {
  text: string;
  speed?: number; // ms per character
  complete?: boolean;
  color?: string;
  onDone?: () => void;
}

export function TypewriterText({ text, speed = 30, complete = false, color, onDone }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    if (complete) {
      setDisplayed(text);
      idx.current = text.length;
      return;
    }

    idx.current = 0;
    setDisplayed('');

    const interval = setInterval(() => {
      idx.current++;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(interval);
        onDone?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, complete]);

  return <Text wrap="wrap" color={color}>{displayed}</Text>;
}

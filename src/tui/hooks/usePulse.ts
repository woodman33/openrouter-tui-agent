import { useEffect, useState } from 'react';

export function usePulse(intervalMs = 140): number {
  const [frame, setFrame] = useState(0);

  const disabled = 
    typeof process !== 'undefined' && 
    (process.env.TIMMY_DISABLE_ANIMATION === '1' || process.env.CI === 'true' || process.env.NODE_ENV === 'test');

  useEffect(() => {
    if (disabled) return;

    const timer = setInterval(() => {
      setFrame((current) => (current + 1) % 100000);
    }, Math.max(80, intervalMs));

    return () => clearInterval(timer);
  }, [intervalMs, disabled]);

  return frame;
}


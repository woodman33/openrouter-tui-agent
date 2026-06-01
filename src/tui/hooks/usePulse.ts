import { useEffect, useState } from 'react';

export function usePulse(intervalMs = 140): number {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((current) => (current + 1) % 100000);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return frame;
}

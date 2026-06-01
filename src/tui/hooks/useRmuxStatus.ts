import { useEffect, useState } from 'react';
import { detectRmux, type RmuxCapabilityStatus } from '../../utils/rmux.js';

export function useRmuxStatus(): RmuxCapabilityStatus | null {
  const [status, setStatus] = useState<RmuxCapabilityStatus | null>(null);

  useEffect(() => {
    setStatus(detectRmux());
  }, []);

  return status;
}

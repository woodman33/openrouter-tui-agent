import { useEffect, useState } from 'react';
import { getWorkspaceEvidenceStatus, type WorkspaceEvidenceStatus } from '../../utils/workspace-evidence.js';

export function useWorkspaceEvidence(refreshMs = 1500): WorkspaceEvidenceStatus | null {
  const [status, setStatus] = useState<WorkspaceEvidenceStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      const next = getWorkspaceEvidenceStatus();
      if (mounted) setStatus(next);
    };

    refresh();
    const timer = setInterval(refresh, refreshMs);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [refreshMs]);

  return status;
}

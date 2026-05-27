import React, { useEffect } from 'react';
import type { Agent } from '../../agent/core.js';
import type { Message } from '../../types/index.js';

interface UseCompanionSyncProps {
  agent: Agent;
  messages: Message[];
  activeRunId?: string;
  activeReceiptUrl?: string;
}

export function useCompanionSync({
  agent,
  messages,
  activeRunId,
  activeReceiptUrl
}: UseCompanionSyncProps) {
  // Sync agent instance
  useEffect(() => {
    const globalServer = (global as any).companionServer;
    if (globalServer) {
      try {
        globalServer.agent = agent;
        if (activeRunId) globalServer.activeRunId = activeRunId;
        if (activeReceiptUrl) globalServer.activeReceiptUrl = activeReceiptUrl;
      } catch {
        // Guard against any companion server property assignment crashes
      }
    }
  }, [agent, activeRunId, activeReceiptUrl]);

  // Sync message history dynamically
  useEffect(() => {
    const globalServer = (global as any).companionServer;
    if (globalServer) {
      try {
        globalServer.lastHistory = messages;
        if (typeof globalServer.sendUpdate === 'function') {
          globalServer.sendUpdate('sync', messages);
        }
      } catch {
        // Guard against companion broadcast failures
      }
    }
  }, [messages]);

  // Sync tmux sessions dynamically
  useEffect(() => {
    const syncTmuxToCompanion = () => {
      const globalServer = (global as any).companionServer;
      if (globalServer) {
        try {
          globalServer.lastTmux = agent.tmuxSessions;
          if (typeof globalServer.sendUpdate === 'function') {
            globalServer.sendUpdate('tmux', agent.tmuxSessions);
          }
        } catch {
          // Guard against companion broadcast failures
        }
      }
    };

    syncTmuxToCompanion();
    agent.on('tmux:update' as any, syncTmuxToCompanion);

    return () => {
      agent.off('tmux:update' as any, syncTmuxToCompanion);
    };
  }, [agent]);
}

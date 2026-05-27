import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useWindowSize } from 'ink';
import type { Agent } from '../../agent/core.js';
import { GlowBorder } from '../components/GlowBorder.js';
import { theme } from '../theme.js';

interface WorkspacePanelProps {
  agent: Agent;
}

interface Pane {
  id: string;
  name: string;
  model: string;
  status: 'IDLE' | 'INDEXING' | 'RUNNING TESTS' | 'BUILDING' | 'CRASHED';
  logs: string[];
}

export function WorkspacePanel({ agent }: WorkspacePanelProps) {
  const { columns: width, rows: height } = useWindowSize();
  const [activePaneIdx, setActivePaneIdx] = useState(0);
  const [_, forceUpdate] = useState(0);

  // Initialize panes mapped dynamically from agent's central tmux sessions
  const [panes, setPanes] = useState<Pane[]>(() => {
    return agent.tmuxSessions.map(s => ({
      id: s.id,
      name: s.name,
      model: s.model,
      status: 'IDLE',
      logs: [`[System] Telemetry DO spawned session "${s.name}"`, '> █']
    }));
  });

  const [inputs, setInputs] = useState<string[]>(() => {
    return Array(agent.tmuxSessions.length + 2).fill('');
  });

  // Synchronize dynamic updates with the agent's central tmux sessions and logs
  useEffect(() => {
    const syncSessions = () => {
      setPanes(prevPanes => {
        const activeSessions = agent.tmuxSessions;
        return activeSessions.map((s) => {
          const existing = prevPanes.find(p => p.id === s.id || p.name === s.name);
          return {
            id: s.id,
            name: s.name,
            model: s.model,
            status: (existing ? existing.status : 'IDLE') as any,
            logs: existing ? existing.logs : [`[System] Telemetry DO spawned session "${s.name}"`, '> █']
          };
        });
      });

      setInputs(prev => {
        const needed = agent.tmuxSessions.length;
        if (prev.length < needed) {
          const next = [...prev];
          while (next.length < needed + 2) {
            next.push('');
          }
          return next;
        }
        return prev;
      });

      forceUpdate(n => n + 1);
    };

    // Listen to real captured tmux log streams pushed by the Agent loop
    const handleTmuxLog = (data: { sessionId: string; logs: string[] }) => {
      setPanes(prevPanes => {
        return prevPanes.map(p => {
          if (p.id === data.sessionId) {
            return { ...p, logs: data.logs };
          }
          return p;
        });
      });
      forceUpdate(n => n + 1);
    };

    agent.on('tmux:update' as any, syncSessions);
    agent.on('tmux:log' as any, handleTmuxLog);
    
    syncSessions();

    return () => {
      agent.off('tmux:update' as any, syncSessions);
      agent.off('tmux:log' as any, handleTmuxLog);
    };
  }, [agent]);

  useInput((char, key) => {
    // 1. Focus Rotation via Ctrl+T
    if (key.ctrl && char === 't') {
      setActivePaneIdx(prev => (prev + 1) % Math.max(1, panes.length));
      return;
    }

    // 2. Add Pane with "+"
    if (char === '+' || char === '=') {
      const nextName = `AgentPane_${agent.tmuxSessions.length + 1}`;
      agent.addTmuxSession(nextName, 'claude-opus-4.7');
      setInputs(prev => [...prev, '']);
      return;
    }

    // 3. Subtract Pane with "-"
    if (char === '-' || char === '_') {
      if (panes.length > 1) {
        const targetId = panes[activePaneIdx]?.id || '1';
        agent.removeTmuxSession(targetId);
        setActivePaneIdx(prev => Math.max(0, prev - 1));
      }
      return;
    }

    // 4. Quadrant Specific typing
    if (panes.length === 0) return;

    const safeInputIdx = Math.min(activePaneIdx, inputs.length - 1);

    if (key.return || char === '\r' || char === '\n') {
      const activeInput = (inputs[safeInputIdx] || '').trim();
      if (!activeInput) return;

      const targetPane = panes[activePaneIdx];
      if (targetPane) {
        // Administrative Privilege Escalation
        if (activeInput.toLowerCase() === 'approval.grant') {
          const lastBlocked = agent.lastBlockedCommands.get(targetPane.id);
          if (lastBlocked) {
            agent.sendTmuxCommand(targetPane.id, lastBlocked, true); // approved = true
            agent.lastBlockedCommands.delete(targetPane.id);
          }
        } else {
          // Route direct keys execution into real background tmux session
          agent.sendTmuxCommand(targetPane.id, activeInput);
        }
      }

      // Clear input
      setInputs(prev => {
        const copy = [...prev];
        if (copy[safeInputIdx] !== undefined) {
          copy[safeInputIdx] = '';
        }
        return copy;
      });

    } else if (key.backspace || key.delete) {
      setInputs(prev => {
        const copy = [...prev];
        const val = copy[safeInputIdx] || '';
        copy[safeInputIdx] = val.slice(0, -1);
        return copy;
      });
    } else if (char && char !== '\t' && char !== '\r' && char !== '\n' && !key.ctrl && !key.meta) {
      setInputs(prev => {
        const copy = [...prev];
        const val = copy[safeInputIdx] || '';
        copy[safeInputIdx] = val + char;
        return copy;
      });
    }
  });

  const terminalWidth = width || 80;
  const terminalHeight = height || 24;
  const leftPanelWidth = Math.max(20, terminalWidth - 36);
  
  const numCols = panes.length <= 1 ? 1 : 2;
  const numRows = Math.ceil(panes.length / numCols);
  
  const safeNumCols = Math.max(1, numCols);
  const safeNumRows = Math.max(1, numRows);
  const paneWidth = Math.max(10, Math.floor((leftPanelWidth - (safeNumCols * 2)) / safeNumCols));
  const paneHeight = Math.max(3, Math.floor((terminalHeight - 8) / safeNumRows));

  const paneRows: Pane[][] = [];
  for (let i = 0; i < panes.length; i += numCols) {
    paneRows.push(panes.slice(i, i + numCols));
  }

  return (
    <Box flexDirection="column" flexGrow={1} width={leftPanelWidth}>
      {/* Header Info */}
      <Box marginBottom={1} justifyContent="space-between">
        <Box>
          <Text bold color="#d2a8ff">🖥️ Multi-Panel Hyper-Grid Workspace</Text>
          <Text color={theme.textSecondary}> — Coordinated Tmux Background Clusters</Text>
        </Box>
        <Box>
          <Text color={theme.textTertiary} dimColor>
            [Ctrl+T]: Cycle Focus  [+]: Add Pane  [-]: Kill Focused
          </Text>
        </Box>
      </Box>

      {/* Dynamic Pane Grid Layout */}
      {panes.length === 0 ? (
        <Box flexGrow={1} justifyContent="center" alignItems="center" borderStyle="single" borderColor={theme.borderDefault}>
          <Text color={theme.textTertiary}>No active tmux session clusters. Press [+] to spin up an agent pane.</Text>
        </Box>
      ) : (
        <Box flexDirection="column" flexGrow={1}>
          {paneRows.map((rowPanes, rowIndex) => (
            <Box key={rowIndex} flexDirection="row" justifyContent="space-between" marginBottom={rowIndex < paneRows.length - 1 ? 1 : 0}>
              {rowPanes.map((pane, colIndex) => {
                const globalIdx = rowIndex * numCols + colIndex;
                const isFocused = globalIdx === activePaneIdx;
                const borderColor = isFocused ? "#d2a8ff" : theme.borderDefault;
                const inputVal = inputs[globalIdx] || '';

                return (
                  <Box key={pane.id} width={paneWidth} height={paneHeight}>
                    <GlowBorder color={borderColor} width={paneWidth} label={`🖥️ ${pane.name.toUpperCase()} (ortui-${pane.id})`}>
                      <Box flexDirection="column" paddingX={1} height={paneHeight - 2} overflowY="hidden">
                        {pane.logs.slice(-Math.max(1, paneHeight - 4)).map((log, i) => (
                          <Text key={i} color={log.startsWith('>') ? "#79c0ff" : log.includes('⚠️') ? "#ff7b72" : theme.textSecondary} wrap="truncate">
                            {log}
                          </Text>
                        ))}
                        
                        {/* Active Input Line inside Pane */}
                        <Box marginTop={1} flexDirection="row">
                          <Text color={isFocused ? "#d2a8ff" : theme.textTertiary}>{isFocused ? '▶ ' : '> '}</Text>
                          <Text color={theme.textPrimary}>{isFocused ? inputVal : ''}</Text>
                          {isFocused && <Text color="#8b949e">█</Text>}
                        </Box>
                      </Box>
                    </GlowBorder>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

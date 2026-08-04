import React, { useState, useEffect } from 'react';
import { Box, Text, useWindowSize, useInput } from 'ink';
import type { Agent } from '../../agent/core.js';
import { GlowBorder } from '../components/GlowBorder.js';
import { theme } from '../theme.js';
import { truncateVisible } from '../utils/text.js';

interface WorkspacePanelProps {
  agent: Agent;
  setInspector: (data: any) => void;
}

interface TimmyTeam {
  key: string;
  name: string;
  agents: number;
  passport: string;
  visas: string[];
  riskCeiling: 'LOW' | 'MEDIUM' | 'HIGH';
  mutateSystem: boolean;
  desc: string;
}

/**
 * Attention model (borrowed from amux's "ring on panes whose agent needs
 * input"): a lane rings when it holds a pending approval. The ring resolves
 * the moment approval is granted or the lane is closed.
 */
interface LaneAttention {
  id: string;
  name: string;
  needsAttention: boolean;
  blockedCommand?: string;
}

export function WorkspacePanel({ agent, setInspector }: WorkspacePanelProps) {
  const { columns: width, rows: height } = useWindowSize();
  const terminalWidth = width || 80;
  const terminalHeight = height || 24;
  const panelWidth = Math.max(20, terminalWidth - 54); // Account for left nav and right inspector
  const mainStageWidth = Math.floor(panelWidth * 0.95);

  const [activeIdx, setActiveIdx] = useState(0);
  const [laneAttention, setLaneAttention] = useState<LaneAttention[]>([]);
  const [view, setView] = useState<'swarms' | 'lanes'>('swarms');
  const [laneIdx, setLaneIdx] = useState(0);
  const [teams, setTeams] = useState<TimmyTeam[]>([
    {
      key: 'coding',
      name: 'Coding Swarm',
      agents: 3,
      passport: 'AgentPass_Coding_v2',
      visas: ['fs.read', 'fs.write', 'cmd.exec'],
      riskCeiling: 'MEDIUM',
      mutateSystem: true,
      desc: 'Compiles dist/ workspace code and writes code changes.'
    },
    {
      key: 'research',
      name: 'Research Swarm',
      agents: 2,
      passport: 'AgentPass_Research_v1',
      visas: ['http.fetch', 'literature.search'],
      riskCeiling: 'LOW',
      mutateSystem: false,
      desc: 'Performs scientific database crawls and gathers evidence.'
    },
    {
      key: 'ops',
      name: 'Operations Swarm',
      agents: 1,
      passport: 'AgentPass_Ops_v1',
      visas: ['telemetry.send', 'svix.webhook'],
      riskCeiling: 'LOW',
      mutateSystem: false,
      desc: 'Controls edge Durable Object telemetry pulses.'
    }
  ]);

  // ── Attention poller ─────────────────────────────────────────────────────
  // lastBlockedCommands is the single source of truth for "which pane needs
  // human eyes" — populated by every multiplexer backend when a command hits
  // the approval gate, cleared on grant or session close.
  useEffect(() => {
    const refresh = () => {
      const next: LaneAttention[] = agent.tmuxSessions.map(s => {
        const blocked = agent.lastBlockedCommands.get(s.id);
        return {
          id: s.id,
          name: s.name,
          needsAttention: Boolean(blocked),
          blockedCommand: blocked,
        };
      });
      setLaneAttention(next);
    };
    refresh();
    const interval = setInterval(refresh, 500);
    return () => clearInterval(interval);
  }, [agent]);

  const attentionCount = laneAttention.filter(l => l.needsAttention).length;

  const updateInspectorData = (team: TimmyTeam) => {
    setInspector({
      title: `Team Policy: ${team.name.toUpperCase()}`,
      subtitle: 'TIMMY SWARM SECURITY BLUEPRINT',
      type: 'AgentPass Group',
      status: 'ENFORCED',
      risk: team.riskCeiling,
      scope: `team.authority.${team.key}`,
      details: [
        `Passport Auth: ${team.passport}`,
        `Visas: ${team.visas.join(', ')}`,
        `System Mutation: ${team.mutateSystem ? 'ALLOWED (Active sandboxing)' : 'DENIED (Strict read-only)'}`,
        `Visa Expiry: Permanent telemetric visa`,
        `Assigned Agents: ${team.agents} active threads`,
        `Risk Ceiling Constraint: ${team.riskCeiling} Gated`
      ]
    });
  };

  const updateLaneInspector = (lane: LaneAttention) => {
    setInspector({
      title: `Lane: ${lane.name.toUpperCase()}`,
      subtitle: 'MULTIPLEXER SESSION STATUS',
      type: 'Agent Lane',
      status: lane.needsAttention ? 'NEEDS ATTENTION' : 'RUNNING',
      risk: lane.needsAttention ? 'HIGH' : 'LOW',
      scope: `lane.session.${lane.id}`,
      details: lane.needsAttention
        ? [
            `⚠️ Pending approval on this lane.`,
            `Blocked command:`,
            `  ${lane.blockedCommand}`,
            ``,
            `Press [g] to grant approval and release execution.`,
          ]
        : [
            `Session id: ortui-${lane.id}`,
            `No pending approvals — lane is flowing.`,
          ]
    });
  };

  useEffect(() => {
    if (view === 'swarms') updateInspectorData(teams[activeIdx]);
    else if (laneAttention[laneIdx]) updateLaneInspector(laneAttention[laneIdx]);
  }, [activeIdx, laneIdx, view, laneAttention]);

  useInput((char, key) => {
    // Tab toggles Swarms ↔ Lanes
    if (key.tab) {
      setView(v => (v === 'swarms' ? 'lanes' : 'swarms'));
      return;
    }

    if (view === 'swarms') {
      if (key.upArrow) {
        setActiveIdx(prev => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        setActiveIdx(prev => Math.min(teams.length - 1, prev + 1));
        return;
      }
      if (key.leftArrow) {
        setTeams(prev => prev.map((t, idx) => idx === activeIdx ? { ...t, agents: Math.max(1, t.agents - 1) } : t));
        return;
      }
      if (key.rightArrow) {
        setTeams(prev => prev.map((t, idx) => idx === activeIdx ? { ...t, agents: Math.min(10, t.agents + 1) } : t));
        return;
      }
      return;
    }

    // Lanes view navigation
    if (view === 'lanes') {
      if (key.upArrow) {
        setLaneIdx(prev => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        setLaneIdx(prev => Math.min(laneAttention.length - 1, prev + 1));
        return;
      }
      // [g] grant approval for the selected lane
      if (char.toLowerCase() === 'g') {
        const lane = laneAttention[laneIdx];
        if (lane?.needsAttention && lane.blockedCommand) {
          agent.sendTmuxCommand(lane.id, lane.blockedCommand, true);
        }
        return;
      }
    }
  });

  const totalAgents = teams.reduce((acc, t) => acc + t.agents, 0);

  return (
    <Box flexDirection="column" width={mainStageWidth} paddingX={1}>
      {/* Blueprint Header */}
      <Box borderStyle="single" borderColor="#30363d" paddingX={2} marginBottom={1} flexDirection="column" width={mainStageWidth - 2}>
        <Text bold color="#d2a8ff">📋  TIMMY Swarm Blueprint Configuration</Text>
        <Text color="#8b949e">
          "Quartermaster guide: Adjust active agent allocations for each Swarm below. Press Tab to inspect live lanes — any lane with a pending approval rings for attention."
        </Text>
      </Box>

      {/* Attention banner — only shows when lanes need eyes (amux ring model) */}
      {attentionCount > 0 ? (
        <Box borderStyle="single" borderColor="#ff7b72" paddingX={2} marginBottom={1} justifyContent="space-between" width={mainStageWidth - 2}>
          <Text bold color="#ff7b72">● ATTENTION REQUIRED</Text>
          <Text color="#e6edf3">
            {attentionCount} lane{attentionCount === 1 ? '' : 's'} waiting on approval — [Tab] → Lanes, [g] to grant
          </Text>
        </Box>
      ) : (
        <Box borderStyle="single" borderColor="#3fb950" paddingX={2} marginBottom={1} justifyContent="space-between" width={mainStageWidth - 2}>
          <Text bold color="#3fb950">✓ TIMMY Swarm Blueprint: STABLE STATE</Text>
          <Text color="#e6edf3">
            Total Threads: <Text color="#79c0ff" bold>{totalAgents} Agents</Text> | Lanes: <Text color="#3fb950" bold>{laneAttention.length} clear</Text>
          </Text>
        </Box>
      )}

      {/* View toggle header */}
      <Box width={mainStageWidth - 2} marginBottom={1}>
        <Text bold color={view === 'swarms' ? '#d2a8ff' : '#8b949e'}>[1] Swarms  </Text>
        <Text bold color={view === 'lanes' ? '#d2a8ff' : '#8b949e'}>[2] Live Lanes  </Text>
        <Text color="#6e7681">(Tab toggles)</Text>
      </Box>

      {/* ── SWARMS VIEW ─────────────────────────────────────────────────── */}
      {view === 'swarms' && (
        <Box flexDirection="column" width={mainStageWidth - 2}>
          {teams.map((team, idx) => {
            const isSelected = idx === activeIdx;
            const cardColor = isSelected ? '#d2a8ff' : theme.borderDefault;
            return (
              <Box key={team.key} marginBottom={1} width={mainStageWidth - 2}>
                <GlowBorder color={cardColor} width={mainStageWidth - 2} label={isSelected ? `▶ ${team.name.toUpperCase()}` : `  ${team.name.toUpperCase()}`} borderStyle="round">
                  <Box paddingX={1} flexDirection="column" width={mainStageWidth - 6}>
                    <Box justifyContent="space-between" width={mainStageWidth - 8}>
                      <Text bold color={isSelected ? '#d2a8ff' : '#e6edf3'}>{truncateVisible(team.desc, Math.max(10, mainStageWidth - 24))}</Text>
                      <Box>
                        {isSelected && <Text color="#d2a8ff" bold>&lt; </Text>}
                        <Text bold color="#58a6ff">{team.agents} Agents</Text>
                        {isSelected && <Text color="#d2a8ff" bold> &gt;</Text>}
                      </Box>
                    </Box>
                    <Box flexDirection={mainStageWidth < 70 ? "column" : "row"} marginTop={1} justifyContent="space-between" width={mainStageWidth - 8}>
                      <Text color="#8b949e" dimColor>Passport: <Text bold color="#e6edf3">{truncateVisible(team.passport, 22)}</Text></Text>
                      <Text color="#8b949e" dimColor>Visas: <Text bold color="#79c0ff">{truncateVisible(team.visas.join(','), 18)}</Text></Text>
                      <Text color="#8b949e" dimColor>Mutate: <Text bold color={team.mutateSystem ? '#3fb950' : '#f85149'}>{team.mutateSystem ? 'YES' : 'NO'}</Text></Text>
                      <Text color="#8b949e" dimColor>Risk: <Text bold color={team.riskCeiling === 'HIGH' ? '#f85149' : team.riskCeiling === 'MEDIUM' ? '#d29922' : '#3fb950'}>{team.riskCeiling}</Text></Text>
                    </Box>
                  </Box>
                </GlowBorder>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ── LANES VIEW (attention model) ────────────────────────────────── */}
      {view === 'lanes' && (
        <Box flexDirection="column" width={mainStageWidth - 2}>
          {laneAttention.map((lane, idx) => {
            const isSelected = idx === laneIdx;
            const needs = lane.needsAttention;
            const rowColor = needs ? '#ff7b72' : isSelected ? '#d2a8ff' : '#e6edf3';
            return (
              <Box key={lane.id} marginBottom={1} width={mainStageWidth - 2} borderStyle="round" borderColor={needs ? '#ff7b72' : isSelected ? '#d2a8ff' : '#30363d'} paddingX={1}>
                <Box justifyContent="space-between" width={mainStageWidth - 8}>
                  <Box>
                    <Text color={needs ? '#ff7b72' : '#3fb950'} bold>{needs ? '● ' : '○ '}</Text>
                    <Text bold={isSelected} color={rowColor}>
                      {isSelected ? '▶ ' : '  '}{truncateVisible(lane.name, Math.max(10, mainStageWidth - 40))}
                    </Text>
                  </Box>
                  <Text bold color={needs ? '#ff7b72' : '#3fb950'}>
                    {needs ? '[NEEDS APPROVAL]' : '[FLOWING]'}
                  </Text>
                </Box>
                {needs && isSelected && (
                  <Box marginTop={0}>
                    <Text color="#d29922" wrap="truncate">  ⤷ blocked: {truncateVisible(lane.blockedCommand || '', Math.max(10, mainStageWidth - 16))}  — press [g] to grant</Text>
                  </Box>
                )}
              </Box>
            );
          })}
          {laneAttention.length === 0 && (
            <Box borderStyle="single" borderColor="#30363d" paddingX={2} width={mainStageWidth - 2}>
              <Text color="#8b949e">No active lanes. Sessions appear here when the multiplexer boots them.</Text>
            </Box>
          )}
        </Box>
      )}

      {/* Guide Ticker */}
      <Box marginTop={1}>
        <Text color="#8b949e" dimColor>
          {view === 'swarms'
            ? 'Arrows Up/Down switch teams. ←/→ adjust agent counts. [Tab] → Live Lanes.'
            : 'Arrows Up/Down switch lanes. [g] grants approval on selected lane. [Tab] → Swarms.'}
        </Text>
      </Box>
    </Box>
  );
}

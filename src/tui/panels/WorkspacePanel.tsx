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

export function WorkspacePanel({ agent, setInspector }: WorkspacePanelProps) {
  const { columns: width, rows: height } = useWindowSize();
  const terminalWidth = width || 80;
  const terminalHeight = height || 24;
  const panelWidth = Math.max(20, terminalWidth - 54); // Account for left nav and right inspector
  const mainStageWidth = Math.floor(panelWidth * 0.95);

  const [activeIdx, setActiveIdx] = useState(0);
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

  useEffect(() => {
    updateInspectorData(teams[activeIdx]);
  }, [activeIdx]);

  useInput((char, key) => {
    if (key.upArrow) {
      setActiveIdx(prev => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow) {
      setActiveIdx(prev => Math.min(teams.length - 1, prev + 1));
      return;
    }

    // Left/Right arrow keys adjust agents counts dynamically
    const selectedTeam = teams[activeIdx];
    if (key.leftArrow) {
      setTeams(prev => prev.map((t, idx) => {
        if (idx === activeIdx) {
          const updated = { ...t, agents: Math.max(1, t.agents - 1) };
          updateInspectorData(updated);
          return updated;
        }
        return t;
      }));
      return;
    }
    if (key.rightArrow) {
      setTeams(prev => prev.map((t, idx) => {
        if (idx === activeIdx) {
          const updated = { ...t, agents: Math.min(10, t.agents + 1) };
          updateInspectorData(updated);
          return updated;
        }
        return t;
      }));
      return;
    }
  });

  const totalAgents = teams.reduce((acc, t) => acc + t.agents, 0);

  return (
    <Box flexDirection="column" width={mainStageWidth} paddingX={1}>
      {/* Blueprint Header */}
      <Box borderStyle="single" borderColor="#30363d" paddingX={2} marginBottom={1} flexDirection="column" width={mainStageWidth - 2}>
        <Text bold color="#d2a8ff">📋  TIMMY Swarm Blueprint Configuration</Text>
        <Text color="#8b949e">
          "Quartermaster guide: Adjust active agent allocations for each Swarm below. Coding Swarm visas allow direct file writes in safe sandbox boundaries, while Research and Operations Swarms run strictly read-only."
        </Text>
      </Box>

      {/* Ratios balance indicator */}
      <Box borderStyle="single" borderColor="#3fb950" paddingX={2} marginBottom={1} justifyContent="space-between" width={mainStageWidth - 2}>
        <Text bold color="#3fb950">✓ TIMMY Swarm Blueprint: STABLE STATE</Text>
        <Text color="#e6edf3">
          Total Swarm Thread Count: <Text color="#79c0ff" bold>{totalAgents} Agents</Text> | Active Visa Tunnels: <Text color="#3fb950" bold>3 Enforced</Text>
        </Text>
      </Box>

      {/* Teams cards stack */}
      <Box flexDirection="column" width={mainStageWidth - 2}>
        {teams.map((team, idx) => {
          const isSelected = idx === activeIdx;
          const cardColor = isSelected ? '#d2a8ff' : theme.borderDefault;
          
          return (
            <Box key={team.key} marginBottom={1} width={mainStageWidth - 2}>
              <GlowBorder 
                color={cardColor} 
                width={mainStageWidth - 2} 
                label={isSelected ? `▶ ${team.name.toUpperCase()}` : `  ${team.name.toUpperCase()}`}
                borderStyle={isSelected ? 'double' : 'round'}
              >
                <Box paddingX={1} flexDirection="column" width={mainStageWidth - 6}>
                  <Box justifyContent="space-between" width={mainStageWidth - 8}>
                    <Text bold color={isSelected ? '#d2a8ff' : '#e6edf3'}>{team.desc}</Text>
                    <Box>
                      {isSelected && <Text color="#d2a8ff" bold>&lt; </Text>}
                      <Text bold color="#58a6ff">{team.agents} Agents</Text>
                      {isSelected && <Text color="#d2a8ff" bold> &gt;</Text>}
                    </Box>
                  </Box>

                  <Box flexDirection="row" marginTop={1} justifyContent="space-between" width={mainStageWidth - 8}>
                    <Text color="#8b949e" dimColor>Passport: <Text bold color="#e6edf3">{team.passport}</Text></Text>
                    <Text color="#8b949e" dimColor>Visas: <Text bold color="#79c0ff">{team.visas.join(', ')}</Text></Text>
                    <Text color="#8b949e" dimColor>Mutate System: <Text bold color={team.mutateSystem ? '#3fb950' : '#f85149'}>{team.mutateSystem ? 'ALLOWED' : 'DENIED'}</Text></Text>
                    <Text color="#8b949e" dimColor>Risk Ceiling: <Text bold color={team.riskCeiling === 'HIGH' ? '#f85149' : team.riskCeiling === 'MEDIUM' ? '#d29922' : '#3fb950'}>{team.riskCeiling}</Text></Text>
                  </Box>
                </Box>
              </GlowBorder>
            </Box>
          );
        })}
      </Box>

      {/* Guide Ticker */}
      <Box marginTop={1}>
        <Text color="#8b949e" dimColor>
          Use Arrows Up/Down to switch teams. Left/Right arrow keys adjust agents counts dynamically.
        </Text>
      </Box>
    </Box>
  );
}

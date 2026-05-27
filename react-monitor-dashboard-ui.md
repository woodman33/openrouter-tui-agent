import { Box, Text, useStdout } from 'ink';
import { useEffect, useState } from 'react';
import Spinner from 'ink-spinner';
import { useStore } from '../store/agentStore'; // Zustand

function AgentMonitor() {
  const agents = useStore(s => s.agents);
  const totalCost = useStore(s => s.totalCost);
  const { stdout } = useStdout();

  return (
    <Box 
      flexDirection="column" 
      width={35} 
      height="100%" 
      borderStyle="round"
      borderColor="#30363D"
      paddingX={1}
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="#7D56F4">
          ◈ MISSION CONTROL
        </Text>
      </Box>

      {/* Agent List */}
      {agents.map(agent => (
        <Box key={agent.id} flexDirection="column" marginBottom={1}>
          <Box flexDirection="row" justifyContent="space-between">
            <Text bold color={agent.status === 'error' ? 'red' : '#C9D1D9'}>
              {agent.status === 'thinking' ? <Spinner type="dots" /> : '◆'}
              {' '}{agent.name}
            </Text>
            <Text dimColor color="#8B949E">
              {agent.model.split('/')[1]}
            </Text>
          </Box>
          
          {/* Sub-status */}
          <Box paddingLeft={2}>
            <Text dimColor color="#484F58">
              {agent.currentTool ? `→ ${agent.currentTool}` : agent.lastAction}
            </Text>
          </Box>
          
          {/* Token bar */}
          <Box paddingLeft={2}>
            <Box width={20}>
              <Text color="#58A6FF">
                {'█'.repeat(Math.floor(agent.contextUsed / agent.contextLimit * 20))}
                {'░'.repeat(20 - Math.floor(agent.contextUsed / agent.contextLimit * 20))}
              </Text>
            </Box>
            <Text dimColor> {Math.round(agent.contextUsed / 1024)}K</Text>
          </Box>
        </Box>
      ))}

      {/* Divider */}
      <Box marginY={1}>
        <Text color="#30363D">{'─'.repeat(30)}</Text>
      </Box>

      {/* Cost Footer */}
      <Box flexDirection="column">
        <Box justifyContent="space-between">
          <Text dimColor>Session Cost:</Text>
          <Text bold color="#3FB950">${totalCost.toFixed(4)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text dimColor>Requests:</Text>
          <Text>{agents.reduce((a, b) => a + b.requestCount, 0)}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text dimColor>Latency:</Text>
          <Text>{agents[0]?.avgLatency}ms avg</Text>
        </Box>
      </Box>
    </Box>
  );
}
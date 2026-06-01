import React, { useState, useEffect } from 'react';
import { Box, Text, useWindowSize, useInput } from 'ink';
import type { Agent } from '../../agent/core.js';
import { GlowBorder } from '../components/GlowBorder.js';
import { theme } from '../theme.js';
import { truncateVisible } from '../utils/text.js';

interface DashboardPanelProps {
  agent: Agent;
  setInspector: (data: any) => void;
}

interface CapabilityItem {
  key: string;
  name: string;
  category: 'CORE' | 'EDGE' | 'SANDBOX' | 'FUTURE';
  status: 'ACTIVE' | 'AVAILABLE' | 'LOCKED';
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  scope: string;
  tier: string;
  description: string;
  details: string[];
}

export function DashboardPanel({ agent: _agent, setInspector }: DashboardPanelProps) {
  const { columns: width, rows: height } = useWindowSize();
  const terminalWidth = width || 80;
  const terminalHeight = height || 24;
  
  // Fit Main Stage width nicely (width minus left/right columns)
  const panelWidth = Math.max(20, terminalWidth - 54);
  const bodyHeight = Math.max(8, terminalHeight - 9);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const capabilities: CapabilityItem[] = [
    {
      key: 'mcp-tools',
      name: 'MCP Tools Engine',
      category: 'CORE',
      status: 'ACTIVE',
      risk: 'LOW',
      scope: 'mcp.tools.*',
      tier: 'Enterprise',
      description: 'Dynamic server connection and raw capability schema parser.',
      details: [
        '• Scans raw tools schemas cleanly',
        '• Maps custom dynamic CLI APIs',
        '• Validated runtime sandbox boundaries',
        '• Automated parameter schema checks'
      ]
    },
    {
      key: 'timmy-porter',
      name: 'TIMMY Porter Scanner',
      category: 'CORE',
      status: 'ACTIVE',
      risk: 'MEDIUM',
      scope: 'porter.import.*',
      tier: 'Standard',
      description: 'Ingests external capability URLs step-by-step.',
      details: [
        '• Enrolls URL descriptors safely',
        '• Restricts direct system executions',
        '• Proposes strict AgentPass visas',
        '• Dry-run scanning capability'
      ]
    },
    {
      key: 'acp-bridge',
      name: 'ACP Agent Bridge',
      category: 'EDGE',
      status: 'ACTIVE',
      risk: 'LOW',
      scope: 'acp.bridge.*',
      tier: 'Pro',
      description: 'Cross-swarm integration WebSocket bridge.',
      details: [
        '• Handles live websocket sync triggers',
        '• Maps parallel execution payloads',
        '• Binds external swarms securely',
        '• Secure telemetry push tunnels'
      ]
    },
    {
      key: 'agentpass',
      name: 'AgentPass Passport',
      category: 'CORE',
      status: 'ACTIVE',
      risk: 'LOW',
      scope: 'agentpass.auth',
      tier: 'Enterprise',
      description: 'Verifies credentials claims and excludes key leakage.',
      details: [
        '• Strict JTI claim token validations',
        '• Excludes credentials pathing details',
        '• Local sandbox policy gates',
        '• Restricts credential environment prints'
      ]
    },
    {
      key: 'rmux-recorder',
      name: 'RMUX Flight Recorder',
      category: 'SANDBOX',
      status: 'AVAILABLE',
      risk: 'MEDIUM',
      scope: 'rmux.recording',
      tier: 'Pro',
      description: 'Spatial terminal workspace video/command flight recorder.',
      details: [
        '• Records terminal flight data securely',
        '• Synced to edge evidence DO',
        '• Encrypted local session storage',
        '• Playback schema tracking'
      ]
    },
    {
      key: 'cf-edge',
      name: 'Cloudflare DO Embassy',
      category: 'EDGE',
      status: 'ACTIVE',
      risk: 'LOW',
      scope: 'cf.durable.objects',
      tier: 'Enterprise',
      description: 'Edge network serverless Embassy database storage.',
      details: [
        '• persistent edge database bound',
        '• SQLite transaction D1 datalake sync',
        '• Encrypted session state archives',
        '• High performance (low latency edge)'
      ]
    },
    {
      key: 'context-packs',
      name: 'TIMMY Context Packs',
      category: 'CORE',
      status: 'ACTIVE',
      risk: 'LOW',
      scope: 'context.registry',
      tier: 'Standard',
      description: 'Dynamic team blueprint configuration pack registry.',
      details: [
        '• Gathers workspace blueprint rules',
        '• Packages swarm security bounds',
        '• Tamper-proof context hashes',
        '• Enrollable via Porter URLs'
      ]
    },
    {
      key: 'receipts',
      name: 'Receipts Ledger',
      category: 'EDGE',
      status: 'ACTIVE',
      risk: 'LOW',
      scope: 'agentrun.receipts',
      tier: 'Standard',
      description: 'Tamper-evident operational receipt manifest system.',
      details: [
        '• Cryptographic manifest signature',
        '• Synced to edge Embassy ledger',
        '• Secure exportable receipt logs',
        '• Verified visa trace indices'
      ]
    }
  ];

  const updateInspectorData = (item: CapabilityItem) => {
    setInspector({
      title: `Capability: ${item.name.toUpperCase()}`,
      subtitle: 'TIMMY SYSTEMS WEB NODE DETAILS',
      type: 'Systems Web Node',
      status: item.status,
      risk: item.risk,
      scope: item.scope,
      details: [
        `Category: ${item.category}`,
        `Service Tier: ${item.tier}`,
        `Description: ${item.description}`,
        ...item.details
      ]
    });
  };

  useEffect(() => {
    updateInspectorData(capabilities[selectedIndex]);
  }, [selectedIndex]);

  useInput((char, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex(prev => Math.min(capabilities.length - 1, prev + 1));
      return;
    }
  });

  const selectedItem = capabilities[selectedIndex];
  const contentHeight = Math.max(1, bodyHeight - 4);

  return (
    <Box flexDirection="column" flexGrow={1} width={panelWidth}>
      {/* Stage Title */}
      <Box height={1} justifyContent="space-between" width={panelWidth - 2}>
        <Box>
          <Text bold color="#d29922">📟  Systems Web Capability Map</Text>
        </Box>
      </Box>

      {/* Systems Status Ticker */}
      <Box width={panelWidth - 2} marginTop={1} borderStyle="single" borderColor="#30363d" paddingX={1}>
        <Text color="#8b949e">
          "Quartermaster here: Navigate Systems Web capabilities below. Detailed specs, safety scopes, and risk tiers are piped straight to your Trust Inspector on the right in real-time."
        </Text>
      </Box>

      {/* Main Split Layout */}
      <Box flexDirection="column" width={panelWidth - 2} height={bodyHeight} marginTop={1}>
        <GlowBorder 
          color="#d29922" 
          width={panelWidth - 2} 
          height={bodyHeight} 
          label="⚡ INSTALLED SYSTEM CAPABILITIES" 
        >
          <Box flexDirection="column" paddingX={1} height={contentHeight} overflowY="hidden">
            {capabilities.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              const statusColor = item.status === 'ACTIVE' ? '#3fb950' : item.status === 'AVAILABLE' ? '#79c0ff' : '#8b949e';
              return (
                <Box key={item.key} marginBottom={1} justifyContent="space-between" width={panelWidth - 6}>
                  <Text color={isSelected ? "#d29922" : "#e6edf3"} bold={isSelected}>
                    {isSelected ? '▶ ' : '  '}
                    {truncateVisible(item.name, panelWidth - 24)}
                  </Text>
                  <Box>
                    <Text bold color={statusColor}>[{item.status}] </Text>
                    <Text bold color={theme.textTertiary}>({item.category})</Text>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </GlowBorder>
      </Box>

      {/* Quick Specs overview inside Stage */}
      <Box marginTop={1} borderStyle="single" borderColor="#30363d" paddingX={1} width={panelWidth - 2} flexDirection="column">
        <Text color="#e6edf3" bold>🔌 Highlighted Specs Preview:</Text>
        <Text color="#8b949e" wrap="truncate">
          Description: {selectedItem.description}
        </Text>
      </Box>
    </Box>
  );
}


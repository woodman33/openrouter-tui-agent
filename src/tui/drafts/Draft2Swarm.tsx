import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

interface Draft2Props {
  activeTab: number;
  setActiveTab: (t: number) => void;
  width?: number;
  height?: number;
}

export function Draft2Swarm({ activeTab, setActiveTab, width = 120, height = 34 }: Draft2Props) {
  const [activeLaneFilter, setActiveLaneFilter] = useState(0);
  const [selectedTaskIdx, setSelectedTaskIdx] = useState(1);
  const [showDescriptor, setShowDescriptor] = useState(true);
  const [tailLocked, setTailLocked] = useState(true);
  const [tick, setTick] = useState(0);

  const laneFilters = ['[● ALL LANES]', '[⚡ lane-alpha: opencode]', '[⚡ lane-beta: hermes]', '[🛡 gate-keeper: timmy]', '[+ Spawn]'];
  const tabs = [
    { key: '1', label: 'COCKPIT', icon: '◈', badge: 'IDLE' },
    { key: '2', label: 'LANES',   icon: '☷', badge: '3 ACTIVE' },
    { key: '3', label: 'GENS',    icon: '✦', badge: 'READY' },
    { key: '4', label: 'SLATE',   icon: '▣', badge: '6 FPS' },
    { key: '5', label: 'BROWSE',  icon: '◉', badge: '1 TAB' },
    { key: '6', label: 'AUDIT',   icon: '🛡', badge: 'SEALED' },
  ];

  const tasks = [
    { id: 'TSK-101', agent: 'opencode', title: 'Refactor Cloudflare worker routing table', status: 'RUNNING', progress: '78%' },
    { id: 'TSK-102', agent: 'hermes',   title: 'Verify Merkle tree signature receipt #948', status: 'GATE BLOCKED', progress: '99%' },
    { id: 'TSK-103', agent: 'pi-agent', title: 'Compile Rive graphics for terminal companion', status: 'SUCCESS', progress: '100%' },
  ];

  // Upward streaming stdout logs (counter direction)
  const upwardLogs = [
    { seq: '#840', src: 'lane-alpha', txt: '[opencode] patched src/companion/cloudflare-worker.ts (+42 -8)', ok: true },
    { seq: '#839', src: 'gate-keeper', txt: '[GATE] Intercepted exec: `wrangler deploy --env prod` [AUTH REQUIRED]', ok: false },
    { seq: '#838', src: 'lane-beta', txt: '[hermes] Generated cryptographic receipt manifest 0x9b4f2c', ok: true },
    { seq: '#837', src: 'lane-alpha', txt: '[opencode] Running vitest run tests/fusion-receipt.test.ts', ok: true },
    { seq: '#836', src: 'pi-agent', txt: '[pi-agent] Canvas buffer attached to ws://127.0.0.1:8787', ok: true },
  ];

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 700);
    return () => clearInterval(timer);
  }, []);

  useInput((input, key) => {
    if (key.rightArrow || input === '\t') {
      setActiveLaneFilter(f => (f + 1) % laneFilters.length);
    } else if (key.leftArrow) {
      setActiveLaneFilter(f => (f - 1 + laneFilters.length) % laneFilters.length);
    } else if (key.downArrow) {
      setSelectedTaskIdx(t => Math.min(tasks.length - 1, t + 1));
    } else if (key.upArrow) {
      setSelectedTaskIdx(t => Math.max(0, t - 1));
    } else if (input === 'h' || input === 'H') {
      setShowDescriptor(d => !d);
    } else if (input === 'l' || input === 'L') {
      setTailLocked(tl => !tl);
    }
  });

  const leftPaneW = Math.floor((width - 24) * 0.55);
  const rightPaneW = Math.max(30, width - 24 - leftPaneW - 4);

  return (
    <Box flexDirection="column" width={width} height={height} borderStyle="round" borderColor="#3ddc84">
      {/* Top Segmented Selector Ribbon for Swarm Filters */}
      <Box justifyContent="space-between" paddingX={1} borderStyle="single" borderColor="#1c232c">
        <Box gap={1}>
          <Text color="#3ddc84" bold>☷ SWARM COMMANDER</Text>
          <Text color="#5a6470">|</Text>
          <Text color="#8892a0">Filter:</Text>
          {laneFilters.map((f, idx) => (
            <Text key={f} color={activeLaneFilter === idx ? '#3ddc84' : '#5a6470'} bold={activeLaneFilter === idx}>
              {f}
            </Text>
          ))}
        </Box>
        <Box gap={1}>
          <Text color="#8892a0">Lanes Alive:</Text>
          <Text color="#3ddc84">3/3</Text>
          <Text color="#5a6470">|</Text>
          <Text color="#e6b800">Gates: 1 Pending</Text>
        </Box>
      </Box>

      {/* Main Dual-Pane Matrix with Left Standing Rail */}
      <Box flexGrow={1} flexDirection="row">
        {/* Left Standing Menu (6 Tabs) */}
        <Box flexDirection="column" width={22} borderStyle="single" borderColor="#1c232c" paddingX={1}>
          <Box marginBottom={1}>
            <Text color="#5a6470" bold>── AGENT BUS ──</Text>
          </Box>
          {tabs.map((tab, idx) => {
            const isSelected = activeTab === idx;
            return (
              <Box
                key={tab.key}
                justifyContent="space-between"
                paddingX={1}
                borderStyle={isSelected ? 'single' : undefined}
                borderColor={isSelected ? '#3ddc84' : undefined}
              >
                <Text color={isSelected ? '#3ddc84' : '#8892a0'} bold={isSelected}>
                  [{tab.key}] {tab.icon} {tab.label}
                </Text>
                <Text color={isSelected ? '#3ddc84' : '#5a6470'}>
                  {tab.badge}
                </Text>
              </Box>
            );
          })}
          <Box marginTop={1} flexDirection="column" borderStyle="single" borderColor="#161c22" padding={1}>
            <Text color="#5a6470">MUX: tmux 3.4</Text>
            <Text color="#5a6470">ROUTER: round-robin</Text>
            <Text color="#3ddc84">POLICY: balanced</Text>
          </Box>
        </Box>

        {/* Left Pane: Multi-Agent Swimlanes & Kanban Pipeline */}
        <Box flexDirection="column" width={leftPaneW} borderStyle="single" borderColor="#1c232c" paddingX={1}>
          <Box justifyContent="space-between" borderStyle="single" borderColor="#161c22" paddingX={1}>
            <Text color="#e8ecf0" bold>▼ AGENT WORKFLOW PIPELINE (TOP-DOWN CARDS)</Text>
            <Text color="#8892a0">[↑↓] Select Task</Text>
          </Box>

          <Box flexDirection="column" flexGrow={1} gap={1} marginTop={1}>
            {tasks.map((task, idx) => {
              const isSelected = selectedTaskIdx === idx;
              return (
                <Box
                  key={task.id}
                  flexDirection="column"
                  borderStyle="single"
                  borderColor={isSelected ? '#3ddc84' : '#2c3540'}
                  paddingX={1}
                >
                  <Box justifyContent="space-between">
                    <Text color="#3ddc84" bold>{task.id} · [{task.agent}]</Text>
                    <Text color={task.status === 'GATE BLOCKED' ? '#e6b800' : task.status === 'RUNNING' ? '#4aa8ff' : '#3ddc84'} bold>
                      {task.status} ({task.progress})
                    </Text>
                  </Box>
                  <Text color="#e8ecf0">{task.title}</Text>
                  {isSelected && task.status === 'GATE BLOCKED' && (
                    <Box marginTop={1} borderStyle="single" borderColor="#e6b800" paddingX={1} justifyContent="space-between">
                      <Text color="#e6b800">⚠️ Risk: Deploying without sealed receipt</Text>
                      <Box gap={1}>
                        <Text color="#3ddc84" bold>[A] Approve</Text>
                        <Text color="#ff4444" bold>[K] Deny</Text>
                      </Box>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>

          <Box borderStyle="single" borderColor="#2c3540" paddingX={1}>
            <Text color="#8892a0">Quick Action: </Text>
            <Text color="#3ddc84">[S] Spawn Lane </Text>
            <Text color="#ffaa33">[D] Delegate Task </Text>
            <Text color="#4aa8ff">[T] Attach Terminal </Text>
          </Box>
        </Box>

        {/* Right Pane: Logs Flowing Upward (Bottom-Up Daemon Output Stream) */}
        <Box flexDirection="column" width={rightPaneW} borderStyle="single" borderColor="#1c232c" paddingX={1}>
          <Box justifyContent="space-between" borderStyle="single" borderColor="#161c22" paddingX={1}>
            <Text color="#e8ecf0" bold>▲ UNIFIED DAEMON TAIL</Text>
            <Text color={tailLocked ? '#3ddc84' : '#e6b800'}>{tailLocked ? '[LOCKED ⇊]' : '[FREE SCROLL]'}</Text>
          </Box>

          <Box marginTop={1} flexDirection="column" flexGrow={1} justifyContent="flex-end" gap={0}>
            {upwardLogs.map((log, i) => (
              <Box key={i} marginY={0}>
                <Text color="#5a6470">{log.seq} </Text>
                <Text color={log.ok ? '#3ddc84' : '#e6b800'} wrap="truncate-end">
                  {log.txt}
                </Text>
              </Box>
            ))}
          </Box>

          <Box flexDirection="row" justifyContent="space-between" borderStyle="round" borderColor="#1c232c" paddingX={1} marginTop={1}>
            <Text color="#8892a0">Stdout Rate: <Text color="#3ddc84">14.8 KB/s</Text></Text>
            <Text color="#ffaa33">[L] Toggle Tail Lock</Text>
          </Box>
        </Box>
      </Box>

      {/* Bottom Contextual Descriptor */}
      <Box flexDirection="column" borderStyle="single" borderColor="#1c232c" paddingX={1}>
        <Box justifyContent="space-between">
          <Box gap={1}>
            <Text color="#8892a0" bold>HOTKEYS:</Text>
            <Text color="#3ddc84">[A] Approve Gate</Text>
            <Text color="#ff4444">[K] Kill Session</Text>
            <Text color="#4aa8ff">[Tab] Cycle Filters</Text>
          </Box>
          <Text color="#3ddc84">[H] {showDescriptor ? 'Hide Help' : 'Show Help'}</Text>
        </Box>
        {showDescriptor && (
          <Box marginTop={0}>
            <Text color="#5a6470" italic>
              💡 Tab 2 Swarm: Top filter ribbon updates active agent view. Left pane shows task cards; right pane streams live tmux stdout upward.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

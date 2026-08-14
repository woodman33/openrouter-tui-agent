import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

interface Draft3Props {
  activeTab: number;
  setActiveTab: (t: number) => void;
  width?: number;
  height?: number;
}

export function Draft3Studio({ activeTab, setActiveTab, width = 120, height = 34 }: Draft3Props) {
  const [selectedAction, setSelectedAction] = useState(0);
  const [selectedFileTab, setSelectedFileTab] = useState(0);
  const [compactNav, setCompactNav] = useState(false);
  const [showDescriptor, setShowDescriptor] = useState(true);
  const [tick, setTick] = useState(0);

  const fileTabs = ['[worker.ts]', '[companion.tsx]', '[rive-canvas.riv]', '[wrangler.jsonc]'];
  const actions = ['[▶ Live Render]', '[⚡ Deploy to Worker]', '[💾 Merkle Snapshot]', '[🔍 Diff Viewer]'];
  const tabs = [
    { key: '1', label: 'COCKPIT', icon: '◈', desc: 'Main agent loop' },
    { key: '2', label: 'LANES',   icon: '☷', desc: 'Swarm processes' },
    { key: '3', label: 'GENS',    icon: '✦', desc: 'Artifact studio' },
    { key: '4', label: 'SLATE',   icon: '▣', desc: 'Visual graphics' },
    { key: '5', label: 'BROWSE',  icon: '◉', desc: 'Headless DOM' },
    { key: '6', label: 'AUDIT',   icon: '🛡', desc: 'Trust & receipts' },
  ];

  // Inverted artifact build timeline (top-to-bottom descending)
  const buildTimeline = [
    { id: '#G-941', target: 'worker.ts', status: 'SYNTHESIZED', cost: '$0.012', speed: '94 tok/s', color: '#3ddc84' },
    { id: '#G-940', target: 'rive-canvas.riv', status: 'COMPILED', cost: '$0.004', speed: 'RIVE-WASM', color: '#ffaa33' },
    { id: '#G-939', target: 'companion.tsx', status: 'VERIFIED', cost: '$0.008', speed: '120 tok/s', color: '#4aa8ff' },
    { id: '#G-938', target: 'schema.zod.ts', status: 'SEALED', cost: '$0.002', speed: '210 tok/s', color: '#3ddc84' },
    { id: '#G-937', target: 'wrangler.jsonc', status: 'OK', cost: '$0.001', speed: '340 tok/s', color: '#8892a0' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 600);
    return () => clearInterval(timer);
  }, []);

  useInput((input, key) => {
    if (key.rightArrow || input === '\t') {
      setSelectedAction(a => (a + 1) % actions.length);
    } else if (key.leftArrow) {
      setSelectedAction(a => (a - 1 + actions.length) % actions.length);
    } else if (input === '1' || input === '2' || input === '3' || input === '4') {
      const idx = parseInt(input, 10) - 1;
      if (idx < fileTabs.length) setSelectedFileTab(idx);
    } else if (input === 'c' || input === 'C') {
      setCompactNav(c => !c);
    } else if (input === 'h' || input === 'H') {
      setShowDescriptor(d => !d);
    }
  });

  const navW = compactNav ? 8 : 22;
  const leftPaneW = Math.floor((width - navW - 2) * 0.58);
  const rightPaneW = Math.max(30, width - navW - leftPaneW - 4);

  return (
    <Box flexDirection="column" width={width} height={height} borderStyle="round" borderColor="#ff007f">
      {/* Top Studio Toolbar */}
      <Box justifyContent="space-between" paddingX={1} borderStyle="single" borderColor="#1c232c">
        <Box gap={1}>
          <Text color="#ff007f" bold>✦ ARTIFACT & CODE STUDIO</Text>
          <Text color="#5a6470">|</Text>
          <Text color="#8892a0">Target:</Text>
          <Text color="#e8ecf0" bold>Cloudflare Worker + Rive WebGL</Text>
          <Text color="#5a6470">|</Text>
          <Text color="#ffaa33">AST: Valid</Text>
        </Box>
        <Box gap={1}>
          <Text color="#8892a0">Rive Engine:</Text>
          <Text color="#3ddc84">● 60 FPS (State: Streaming)</Text>
          <Text color="#5a6470">|</Text>
          <Text color="#ff007f">[C] {compactNav ? 'Expand Nav' : 'Collapse Nav'}</Text>
        </Box>
      </Box>

      {/* Main Dual-Pane Matrix */}
      <Box flexGrow={1} flexDirection="row">
        {/* Left Standing Menu with Collapsible Descriptors */}
        <Box flexDirection="column" width={navW} borderStyle="single" borderColor="#1c232c" paddingX={compactNav ? 0 : 1}>
          {!compactNav && (
            <Box marginBottom={1}>
              <Text color="#5a6470" bold>── STUDIO TABS ──</Text>
            </Box>
          )}
          {tabs.map((tab, idx) => {
            const isSelected = activeTab === idx;
            return (
              <Box
                key={tab.key}
                flexDirection="column"
                paddingX={compactNav ? 1 : 1}
                marginY={0}
                borderStyle={isSelected ? 'single' : undefined}
                borderColor={isSelected ? '#ff007f' : undefined}
              >
                <Box justifyContent={compactNav ? 'center' : 'space-between'}>
                  <Text color={isSelected ? '#ff007f' : '#8892a0'} bold={isSelected}>
                    {tab.icon} {!compactNav && tab.label}
                  </Text>
                </Box>
                {!compactNav && showDescriptor && (
                  <Text color="#5a6470">{tab.desc}</Text>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Left Pane: Code & AST Canvas */}
        <Box flexDirection="column" width={leftPaneW} borderStyle="single" borderColor="#1c232c" paddingX={1}>
          {/* File Selector Tabs */}
          <Box gap={1} borderStyle="single" borderColor="#161c22" paddingX={1}>
            {fileTabs.map((ft, idx) => (
              <Text key={ft} color={selectedFileTab === idx ? '#ff007f' : '#8892a0'} bold={selectedFileTab === idx}>
                {ft}
              </Text>
            ))}
          </Box>

          {/* Syntax Highlighted Code / AST Canvas */}
          <Box flexDirection="column" flexGrow={1} borderStyle="single" borderColor="#2c3540" paddingX={1} marginTop={1}>
            <Text color="#5a6470">// Generated Cloudflare Worker Companion Bridge</Text>
            <Text color="#4aa8ff">import <Text color="#e8ecf0">&#123; Agent &#125;</Text> from <Text color="#3ddc84">'@cloudflare/flagship'</Text>;</Text>
            <Text color="#4aa8ff">import <Text color="#e8ecf0">&#123; RiveCanvas &#125;</Text> from <Text color="#3ddc84">'@rive-app/canvas'</Text>;</Text>
            <Text color="#e8ecf0" />
            <Text color="#ffaa33">export default &#123;</Text>
            <Text color="#e8ecf0">  async <Text color="#ff007f">fetch</Text>(req: Request, env: Env): Promise&lt;Response&gt; &#123;</Text>
            <Text color="#e8ecf0">    const agent = new Agent(&#123; mode: <Text color="#3ddc84">'autonomous'</Text> &#125;);</Text>
            <Text color="#e8ecf0">    const telemetry = await agent.sealReceipt();</Text>
            <Text color="#e8ecf0">    return Response.json(&#123; ok: true, hash: telemetry.merkleRoot &#125;);</Text>
            <Text color="#ffaa33">  &#125;</Text>
            <Text color="#ffaa33">&#125;;</Text>
          </Box>
        </Box>

        {/* Right Pane: Inverse Build Pipeline & Cost Meter */}
        <Box flexDirection="column" width={rightPaneW} borderStyle="single" borderColor="#1c232c" paddingX={1}>
          <Box justifyContent="space-between" borderStyle="single" borderColor="#161c22" paddingX={1}>
            <Text color="#ff007f" bold>▲ REVERSE BUILD PIPELINE</Text>
            <Text color="#3ddc84">NEWEST ↑</Text>
          </Box>

          <Box marginTop={1} flexDirection="column" flexGrow={1} gap={0}>
            {buildTimeline.map((item, idx) => (
              <Box key={idx} justifyContent="space-between" marginY={0}>
                <Text color="#8892a0">{item.id} {item.target}</Text>
                <Text color={item.color} bold>{item.status}</Text>
                <Text color="#5a6470">{item.cost}</Text>
              </Box>
            ))}
          </Box>

          <Box flexDirection="column" borderStyle="round" borderColor="#1c232c" paddingX={1} marginTop={1}>
            <Text color="#8892a0">Total Generation Cost: <Text color="#3ddc84">$0.027</Text></Text>
            <Text color="#8892a0">Synthesis Velocity: <Text color="#ffaa33">184 tokens/sec</Text></Text>
            <Text color="#5a6470">AST Tree Nodes: 42 (No syntax errors)</Text>
          </Box>
        </Box>
      </Box>

      {/* Bottom Dual-Tier Action Matrix */}
      <Box flexDirection="column" borderStyle="single" borderColor="#1c232c" paddingX={1}>
        <Box justifyContent="space-between">
          <Box gap={1}>
            <Text color="#8892a0" bold>ACTION MATRIX:</Text>
            {actions.map((act, idx) => (
              <Text key={act} color={selectedAction === idx ? '#ff007f' : '#5a6470'} bold={selectedAction === idx}>
                {act}
              </Text>
            ))}
          </Box>
          <Text color="#ff007f">[H] {showDescriptor ? 'Hide Help' : 'Show Help'}</Text>
        </Box>
        {showDescriptor && (
          <Box marginTop={0}>
            <Text color="#5a6470" italic>
              💡 Tab 3 Studio: Left pane edits code & preview AST. Right pane displays generation lifecycle in reverse chronological order.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

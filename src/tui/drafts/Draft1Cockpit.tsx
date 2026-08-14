import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

interface Draft1Props {
  activeTab: number;
  setActiveTab: (t: number) => void;
  width?: number;
  height?: number;
}

export function Draft1Cockpit({ activeTab, setActiveTab, width = 120, height = 34 }: Draft1Props) {
  const [prompt, setPrompt] = useState('Build a Cloudflare Worker with Rive canvas companion');
  const [presetIndex, setPresetIndex] = useState(0);
  const [showDescriptor, setShowDescriptor] = useState(true);
  const [reasoningExpanded, setReasoningExpanded] = useState(true);
  const [tick, setTick] = useState(0);

  const presets = ['[F1: Autonomous Architect]', '[F2: Security Gatekeeper]', '[F3: TUI Specialist]', '[F4: Sandbox Benchmark]'];
  const tabs = [
    { key: '1', label: 'COCKPIT', icon: '◈', badge: 'ACTIVE' },
    { key: '2', label: 'LANES',   icon: '☷', badge: '4 RUN' },
    { key: '3', label: 'GENS',    icon: '✦', badge: '12 OK' },
    { key: '4', label: 'SLATE',   icon: '▣', badge: 'RIVE' },
    { key: '5', label: 'BROWSE',  icon: '◉', badge: 'CDP' },
    { key: '6', label: 'AUDIT',   icon: '🛡', badge: 'SEAL' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 800);
    return () => clearInterval(timer);
  }, []);

  useInput((input, key) => {
    if (key.rightArrow || input === '\t') {
      setPresetIndex((i) => (i + 1) % presets.length);
    } else if (key.leftArrow) {
      setPresetIndex((i) => (i - 1 + presets.length) % presets.length);
    } else if (input === 'h' || input === 'H') {
      setShowDescriptor((prev) => !prev);
    } else if (input === 'e' || input === 'E') {
      setReasoningExpanded((prev) => !prev);
    }
  });

  const leftPaneW = Math.floor((width - 24) * 0.58);
  const rightPaneW = Math.max(30, width - 24 - leftPaneW - 4);

  // Logs flowing top-down in reverse order (newest on top)
  const reverseLogs = [
    { time: '22:47:18', level: 'SYS', msg: 'Cloudflare KV session snapshot sealed [0x8f2a]', color: '#3ddc84' },
    { time: '22:47:12', level: 'NET', msg: 'OpenRouter stream token burst (482 t/s)', color: '#ffaa33' },
    { time: '22:47:05', level: 'MCP', msg: 'mcporter connected: chrome-devtools @ stdio', color: '#4aa8ff' },
    { time: '22:46:58', level: 'GPU', msg: 'Rive state machine runtime initialized 60fps', color: '#e8ecf0' },
    { time: '22:46:40', level: 'CF ', msg: 'Worker edge route /api/agent-bridge registered', color: '#e6b800' },
    { time: '22:46:22', level: 'AUTH', msg: 'Dual-key cryptographic nonce verified', color: '#3ddc84' },
    { time: '22:46:01', level: 'INIT', msg: 'TIMMY Agent Trust OS v0.4.0 boot sequence OK', color: '#8892a0' }
  ];

  return (
    <Box flexDirection="column" width={width} height={height} borderStyle="round" borderColor="#ffaa33">
      {/* Top Universal App Header */}
      <Box justifyContent="space-between" paddingX={1} borderStyle="single" borderColor="#1c232c">
        <Box gap={1}>
          <Text color="#ffaa33" bold>◈ TIMMY COCKPIT</Text>
          <Text color="#5a6470">|</Text>
          <Text color="#8892a0">Model:</Text>
          <Text color="#3ddc84" bold>anthropic/claude-3.7-sonnet</Text>
          <Text color="#5a6470">|</Text>
          <Text color="#8892a0">Status:</Text>
          <Text color={tick % 2 === 0 ? '#3ddc84' : '#ffaa33'}>● STREAMING</Text>
        </Box>
        <Box gap={1}>
          <Text color="#8892a0">Session:</Text>
          <Text color="#e8ecf0">#ortui-live-942</Text>
          <Text color="#5a6470">|</Text>
          <Text color="#8892a0">Tokens:</Text>
          <Text color="#ffaa33">18.4k ($0.052)</Text>
        </Box>
      </Box>

      {/* Main Dual-Pane Section with Left Standing Rail */}
      <Box flexGrow={1} flexDirection="row">
        {/* Left Standing Menu (6 Tabs) */}
        <Box flexDirection="column" width={22} borderStyle="single" borderColor="#1c232c" paddingX={1}>
          <Box marginBottom={1}>
            <Text color="#5a6470" bold>── NAVIGATION ──</Text>
          </Box>
          {tabs.map((tab, idx) => {
            const isSelected = activeTab === idx;
            return (
              <Box
                key={tab.key}
                justifyContent="space-between"
                paddingX={1}
                marginY={0}
                borderStyle={isSelected ? 'single' : undefined}
                borderColor={isSelected ? '#ffaa33' : undefined}
              >
                <Text color={isSelected ? '#ffaa33' : '#8892a0'} bold={isSelected}>
                  [{tab.key}] {tab.icon} {tab.label}
                </Text>
                <Text color={isSelected ? '#3ddc84' : '#5a6470'}>
                  {tab.badge}
                </Text>
              </Box>
            );
          })}
          <Box marginTop={1} flexDirection="column" borderStyle="single" borderColor="#161c22" padding={1}>
            <Text color="#5a6470">SPEED: 64 t/s</Text>
            <Text color="#5a6470">LATENCY: 184ms</Text>
            <Text color="#3ddc84">SANDBOX: VERCEL</Text>
          </Box>
        </Box>

        {/* Left Workflow Pane: Chat Stream & Thought Matrix */}
        <Box flexDirection="column" width={leftPaneW} borderStyle="single" borderColor="#1c232c" paddingX={1}>
          <Box justifyContent="space-between" borderStyle="single" borderColor="#161c22" paddingX={1}>
            <Text color="#e8ecf0" bold>▼ CHAT STREAM (FORWARD CHRONOLOGY)</Text>
            <Text color="#ffaa33">[E] Toggle Thoughts</Text>
          </Box>

          {/* Chat Messages */}
          <Box flexDirection="column" flexGrow={1} gap={1} marginTop={1}>
            {/* User message */}
            <Box flexDirection="column" borderStyle="single" borderColor="#2c3540" paddingX={1}>
              <Text color="#ffc966" bold>👤 USER (You):</Text>
              <Text color="#e8ecf0">Build an ink TUI panel that coordinates live Cloudflare sandbox evals.</Text>
            </Box>

            {/* Assistant reasoning expandable block */}
            {reasoningExpanded && (
              <Box flexDirection="column" borderStyle="round" borderColor="#3b4252" paddingX={1}>
                <Text color="#5a6470" italic>◒ Thought Process (Expanded - 310ms):</Text>
                <Text color="#8892a0">1. Scaffold Cloudflare sandbox container with @cloudflare/sandbox</Text>
                <Text color="#8892a0">2. Wire dual-stream stdout into Ink Layout with reverse log waterfall</Text>
                <Text color="#8892a0">3. Mount Rive companion websocket on localhost:8787</Text>
              </Box>
            )}

            {/* Assistant Response Bubble */}
            <Box flexDirection="column" borderStyle="single" borderColor="#1f2937" paddingX={1}>
              <Text color="#3ddc84" bold>🤖 TIMMY AGENT:</Text>
              <Text color="#d0d6dd">
                I have provisioned the Cloudflare Sandbox environment and configured the reverse telemetry stream. The dual-pane layout is bound to hotkey matrix [1-6].
              </Text>
              <Box marginTop={1} borderStyle="single" borderColor="#ffaa33" paddingX={1}>
                <Text color="#ffaa33">⚙ RUNNING TOOL: `mcp_cloudflare_sandbox_eval(run_id="run_99")`</Text>
              </Box>
            </Box>
          </Box>

          {/* User Input Bar */}
          <Box borderStyle="single" borderColor="#ffaa33" paddingX={1} marginTop={1}>
            <Text color="#ffaa33" bold>❯ </Text>
            <Text color="#e8ecf0">{prompt}</Text>
            <Text color="#ffaa33">█</Text>
          </Box>
        </Box>

        {/* Right Pane: Logs Flowing in Opposite Direction (Top-to-Bottom Reverse Waterfall) */}
        <Box flexDirection="column" width={rightPaneW} borderStyle="single" borderColor="#1c232c" paddingX={1}>
          <Box justifyContent="space-between" borderStyle="single" borderColor="#161c22" paddingX={1}>
            <Text color="#4aa8ff" bold>▲ REVERSE TELEMETRY STREAM</Text>
            <Text color="#3ddc84">⚡ LIVE INVERSE</Text>
          </Box>
          <Box marginTop={1} flexDirection="column" flexGrow={1} gap={0}>
            {reverseLogs.map((log, i) => (
              <Box key={i} justifyContent="space-between" marginY={0}>
                <Text color="#5a6470">[{log.time}] </Text>
                <Text color={log.color} wrap="truncate-end">
                  ↑ {log.msg}
                </Text>
              </Box>
            ))}
          </Box>

          {/* Realtime Stats Box */}
          <Box flexDirection="column" borderStyle="round" borderColor="#1c232c" paddingX={1} marginTop={1}>
            <Text color="#8892a0">Telemetry Ingestion: <Text color="#3ddc84">100% OK</Text></Text>
            <Text color="#8892a0">Buffer: <Text color="#ffaa33">1,420 lines</Text> | Drop: <Text color="#3ddc84">0%</Text></Text>
            <Text color="#5a6470">Sparkline: ▃▄▆█▇▆▅▃▂ </Text>
          </Box>
        </Box>
      </Box>

      {/* Bottom Contextual Ribbon (Preset Selectors & Dynamic Disappearing Descriptor) */}
      <Box flexDirection="column" borderStyle="single" borderColor="#1c232c" paddingX={1}>
        <Box justifyContent="space-between">
          <Box gap={1}>
            <Text color="#8892a0" bold>SELECTORS:</Text>
            {presets.map((p, idx) => {
              const isSel = presetIndex === idx;
              return (
                <Text key={p} color={isSel ? '#3ddc84' : '#5a6470'} bold={isSel}>
                  {p}
                </Text>
              );
            })}
          </Box>
          <Text color="#ffaa33">[H] {showDescriptor ? 'Hide Hints' : 'Show Hints'}</Text>
        </Box>

        {showDescriptor && (
          <Box marginTop={0} justifyContent="space-between">
            <Text color="#5a6470" italic>
              💡 Tab 1 Cockpit: Real-time agent chat on left, inverted event waterfall on right. [Tab / Arrows] cycle presets.
            </Text>
            <Text color="#3ddc84">Ready</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

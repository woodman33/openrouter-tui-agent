import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

interface Draft4Props {
  activeTab: number;
  setActiveTab: (t: number) => void;
  width?: number;
  height?: number;
}

export function Draft4Browser({ activeTab, setActiveTab, width = 120, height = 34 }: Draft4Props) {
  const [selectedElement, setSelectedElement] = useState(1);
  const [url, setUrl] = useState('https://dash.cloudflare.com/workers-and-pages');
  const [activeAction, setActiveAction] = useState(0);
  const [showDescriptor, setShowDescriptor] = useState(true);
  const [tick, setTick] = useState(0);

  const browserActions = ['[◀ Back]', '[▶ Fwd]', '[↻ Reload]', '[📸 Screenshot]', '[🍪 Cookies]', '[📱 1280x800]'];
  const tabs = [
    { key: '1', label: 'COCKPIT', icon: '◈', badge: 'IDLE' },
    { key: '2', label: 'LANES',   icon: '☷', badge: 'MUX' },
    { key: '3', label: 'GENS',    icon: '✦', badge: 'DIFF' },
    { key: '4', label: 'SLATE',   icon: '▣', badge: 'WASM' },
    { key: '5', label: 'BROWSE',  icon: '◉', badge: 'CDP 9222' },
    { key: '6', label: 'AUDIT',   icon: '🛡', badge: 'SEALED' },
  ];

  const domElements = [
    { id: '#nav-header', tag: 'HEADER', text: 'Cloudflare Dashboard / Workers', depth: 0 },
    { id: '#btn-create-app', tag: 'BUTTON', text: 'Create Application (+)', depth: 1 },
    { id: '#worker-card-1', tag: 'DIV', text: 'timmy-trust-worker (Running - 12.4k req/s)', depth: 1 },
    { id: '#btn-quick-deploy', tag: 'BUTTON', text: 'Quick Deploy [ACTIVE TARGET]', depth: 2 },
    { id: '#kv-storage-tab', tag: 'A', text: 'KV & D1 Databases (3 Bound)', depth: 1 },
  ];

  // Upward streaming Chrome DevTools Protocol network frames
  const cdpLogs = [
    { id: 'REQ-409', method: 'GET', url: '/api/v4/accounts/workers/scripts', status: '200 OK', latency: '42ms', color: '#3ddc84' },
    { id: 'WS -102', method: 'WS',  url: 'wss://dash.cloudflare.com/live-tail', status: '101 UPGRADE', latency: '12ms', color: '#4aa8ff' },
    { id: 'DOM-881', method: 'CDP', url: 'Page.screencastFrameAck(sessionId="s1")', status: 'ACK 60FPS', latency: '16ms', color: '#e8ecf0' },
    { id: 'REQ-408', method: 'POST', url: '/api/v4/workers/receipt-verify', status: '204 NO CONTENT', latency: '88ms', color: '#3ddc84' },
    { id: 'REQ-407', method: 'GET', url: '/static/dashboard.bundle.js', status: '304 CACHED', latency: '4ms', color: '#8892a0' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 650);
    return () => clearInterval(timer);
  }, []);

  useInput((input, key) => {
    if (key.downArrow) {
      setSelectedElement(e => Math.min(domElements.length - 1, e + 1));
    } else if (key.upArrow) {
      setSelectedElement(e => Math.max(0, e - 1));
    } else if (key.rightArrow || input === '\t') {
      setActiveAction(a => (a + 1) % browserActions.length);
    } else if (key.leftArrow) {
      setActiveAction(a => (a - 1 + browserActions.length) % browserActions.length);
    } else if (input === 'h' || input === 'H') {
      setShowDescriptor(d => !d);
    }
  });

  const leftPaneW = Math.floor((width - 24) * 0.56);
  const rightPaneW = Math.max(30, width - 24 - leftPaneW - 4);

  return (
    <Box flexDirection="column" width={width} height={height} borderStyle="round" borderColor="#4aa8ff">
      {/* Top Browser Navigation Ribbon */}
      <Box justifyContent="space-between" paddingX={1} borderStyle="single" borderColor="#1c232c">
        <Box gap={1}>
          <Text color="#4aa8ff" bold>◉ BROWSE / CDP ENGINE</Text>
          <Text color="#5a6470">|</Text>
          {browserActions.map((act, idx) => (
            <Text key={act} color={activeAction === idx ? '#4aa8ff' : '#5a6470'} bold={activeAction === idx}>
              {act}
            </Text>
          ))}
        </Box>
        <Box gap={1}>
          <Text color="#8892a0">CDP Port:</Text>
          <Text color="#3ddc84">127.0.0.1:9222</Text>
          <Text color="#5a6470">|</Text>
          <Text color="#4aa8ff">Carbonyl: Active</Text>
        </Box>
      </Box>

      {/* URL Address Bar */}
      <Box borderStyle="single" borderColor="#161c22" paddingX={1}>
        <Text color="#4aa8ff">🔒 https:// </Text>
        <Text color="#e8ecf0" bold>{url}</Text>
      </Box>

      {/* Main Dual-Pane Matrix with Left Standing Rail */}
      <Box flexGrow={1} flexDirection="row">
        {/* Left Standing Menu (6 Tabs) */}
        <Box flexDirection="column" width={22} borderStyle="single" borderColor="#1c232c" paddingX={1}>
          <Box marginBottom={1}>
            <Text color="#5a6470" bold>── BROWSE RAILS ──</Text>
          </Box>
          {tabs.map((tab, idx) => {
            const isSelected = activeTab === idx;
            return (
              <Box
                key={tab.key}
                justifyContent="space-between"
                paddingX={1}
                borderStyle={isSelected ? 'single' : undefined}
                borderColor={isSelected ? '#4aa8ff' : undefined}
              >
                <Text color={isSelected ? '#4aa8ff' : '#8892a0'} bold={isSelected}>
                  [{tab.key}] {tab.icon} {tab.label}
                </Text>
                <Text color={isSelected ? '#3ddc84' : '#5a6470'}>
                  {tab.badge}
                </Text>
              </Box>
            );
          })}
          <Box marginTop={1} flexDirection="column" borderStyle="single" borderColor="#161c22" padding={1}>
            <Text color="#5a6470">RENDER: WebGL</Text>
            <Text color="#5a6470">COOKIES: 14 saved</Text>
            <Text color="#3ddc84">HEADLESS: NO</Text>
          </Box>
        </Box>

        {/* Left Pane: Terminal Browser Viewport & DOM Hierarchy */}
        <Box flexDirection="column" width={leftPaneW} borderStyle="single" borderColor="#1c232c" paddingX={1}>
          <Box justifyContent="space-between" borderStyle="single" borderColor="#161c22" paddingX={1}>
            <Text color="#e8ecf0" bold>▼ DOM ACCESSIBILITY & VIEWPORT TREE</Text>
            <Text color="#8892a0">[↑↓] Select Target Element</Text>
          </Box>

          <Box flexDirection="column" flexGrow={1} gap={1} marginTop={1}>
            {domElements.map((el, idx) => {
              const isSelected = selectedElement === idx;
              const indent = '  '.repeat(el.depth);
              return (
                <Box
                  key={el.id}
                  flexDirection="row"
                  justifyContent="space-between"
                  borderStyle="single"
                  borderColor={isSelected ? '#4aa8ff' : '#2c3540'}
                  paddingX={1}
                >
                  <Text color={isSelected ? '#4aa8ff' : '#e8ecf0'} bold={isSelected}>
                    {indent}⟨{el.tag}⟩ {el.text}
                  </Text>
                  <Text color={isSelected ? '#3ddc84' : '#5a6470'}>{el.id}</Text>
                </Box>
              );
            })}
          </Box>

          {/* Interactive Element Actions */}
          <Box borderStyle="single" borderColor="#4aa8ff" paddingX={1} justifyContent="space-between">
            <Text color="#8892a0">Target: <Text color="#4aa8ff" bold>{domElements[selectedElement]?.id}</Text></Text>
            <Box gap={1}>
              <Text color="#3ddc84" bold>[C] Click</Text>
              <Text color="#ffaa33" bold>[T] Type</Text>
              <Text color="#ff007f" bold>[S] Scroll</Text>
            </Box>
          </Box>
        </Box>

        {/* Right Pane: Upward Streaming Chrome DevTools Protocol & Network Inspector */}
        <Box flexDirection="column" width={rightPaneW} borderStyle="single" borderColor="#1c232c" paddingX={1}>
          <Box justifyContent="space-between" borderStyle="single" borderColor="#161c22" paddingX={1}>
            <Text color="#4aa8ff" bold>▲ NETWORK / CDP LOGS</Text>
            <Text color="#3ddc84">COUNTER STREAM ↑</Text>
          </Box>

          <Box marginTop={1} flexDirection="column" flexGrow={1} justifyContent="flex-end" gap={0}>
            {cdpLogs.map((log, i) => (
              <Box key={i} marginY={0} justifyContent="space-between">
                <Text color="#5a6470">{log.id} [{log.method}]</Text>
                <Text color={log.color} wrap="truncate-end">{log.url}</Text>
                <Text color="#3ddc84">{log.latency}</Text>
              </Box>
            ))}
          </Box>

          <Box flexDirection="column" borderStyle="round" borderColor="#1c232c" paddingX={1} marginTop={1}>
            <Text color="#8892a0">Frames Received: <Text color="#3ddc84">2,840</Text></Text>
            <Text color="#8892a0">Bandwidth: <Text color="#ffaa33">1.2 MB/s</Text> | DOM Nodes: 184</Text>
          </Box>
        </Box>
      </Box>

      {/* Bottom Contextual Descriptor */}
      <Box flexDirection="column" borderStyle="single" borderColor="#1c232c" paddingX={1}>
        <Box justifyContent="space-between">
          <Box gap={1}>
            <Text color="#8892a0" bold>CDP COMMANDS:</Text>
            <Text color="#4aa8ff">[C] Click Element</Text>
            <Text color="#ffaa33">[T] Input Text</Text>
            <Text color="#3ddc84">[📸] Capture Screenshot</Text>
          </Box>
          <Text color="#4aa8ff">[H] {showDescriptor ? 'Hide Help' : 'Show Help'}</Text>
        </Box>
        {showDescriptor && (
          <Box marginTop={0}>
            <Text color="#5a6470" italic>
              💡 Tab 5 Browse: Direct Chrome DevTools Protocol bridge. Left pane selects DOM elements; right pane streams network & CDP traffic upward.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

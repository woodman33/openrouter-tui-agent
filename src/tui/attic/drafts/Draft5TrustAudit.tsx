import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useFocus, panelMayAct } from '../../hooks/useKeyDispatcher.js';
import { theme } from '../../theme.js';

interface Draft5Props {
  activeTab: number;
  setActiveTab: (t: number) => void;
  width?: number;
  height?: number;
}

export function Draft5TrustAudit({ activeTab, setActiveTab, width = 120, height = 34 }: Draft5Props) {
  const [securityLevel, setSecurityLevel] = useState(2); // 0: Permissive, 1: Balanced, 2: Strict, 3: Sovereign
  const [selectedReceipt, setSelectedReceipt] = useState(0);
  const [showDescriptor, setShowDescriptor] = useState(true);
  const [tick, setTick] = useState(0);

  const securityModes = ['[1: Permissive]', '[2: Balanced]', '[3: Strict (Active)]', '[4: Sovereign]'];
  const tabs = [
    { key: '1', label: 'COCKPIT', icon: '◈', badge: 'IDLE' },
    { key: '2', label: 'LANES',   icon: '☷', badge: 'MUX' },
    { key: '3', label: 'GENS',    icon: '✦', badge: 'DIFF' },
    { key: '4', label: 'SLATE',   icon: '▣', badge: 'WASM' },
    { key: '5', label: 'BROWSE',  icon: '◉', badge: 'CDP' },
    { key: '6', label: 'AUDIT',   icon: '🛡', badge: '100% SEALED' },
  ];

  const quarantineItems = [
    { id: 'AUTH-902', action: 'Write to production .env', risk: 'CRITICAL', agent: 'opencode', tool: 'write_file' },
    { id: 'AUTH-901', action: 'Execute `rm -rf ./cache && wrangler deploy`', risk: 'HIGH', agent: 'hermes', tool: 'run_command' },
    { id: 'AUTH-900', action: 'Dispatch Svix webhook event to external endpoint', risk: 'MEDIUM', agent: 'timmy-core', tool: 'svix_post' },
  ];

  // Reverse Merkle receipt tree (newest at top)
  const receipts = [
    { id: 'RCP-892', root: '0x7f2a...991c', status: 'SEALED', policy: 'EU AI Act Art. 12', time: '22:47:10', color: theme.accent },
    { id: 'RCP-891', root: '0x3c1d...440e', status: 'VERIFIED', policy: 'Dual-Key Nonce', time: '22:46:50', color: theme.accent },
    { id: 'RCP-890', root: '0x99bb...112a', status: 'QUARANTINED', policy: 'Write Sandbox Gate', time: '22:46:12', color: theme.warn },
    { id: 'RCP-889', root: '0x55ef...8831', status: 'SEALED', policy: 'Svix Webhook Trace', time: '22:45:30', color: theme.accent },
  ];

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 750);
    return () => clearInterval(timer);
  }, []);

  const __focus = useFocus();
  useInput((input, key) => {
    if (!panelMayAct(__focus, 'input:draft5')) return;
    if (key.rightArrow || input === '\t') {
      setSecurityLevel(s => (s + 1) % securityModes.length);
    } else if (key.leftArrow) {
      setSecurityLevel(s => (s - 1 + securityModes.length) % securityModes.length);
    } else if (key.downArrow) {
      setSelectedReceipt(r => Math.min(receipts.length - 1, r + 1));
    } else if (key.upArrow) {
      setSelectedReceipt(r => Math.max(0, r - 1));
    } else if (input === 'h' || input === 'H') {
      setShowDescriptor(d => !d);
    }
  });

  const leftPaneW = Math.floor((width - 24) * 0.55);
  const rightPaneW = Math.max(30, width - 24 - leftPaneW - 4);

  return (
    <Box flexDirection="column" width={width} height={height} borderStyle="round" borderColor={theme.warn}>
      {/* Top Security & Policy Slider Ribbon */}
      <Box justifyContent="space-between" paddingX={1} borderStyle="single" borderColor={theme.line}>
        <Box gap={1}>
          <Text color={theme.warn} bold>🛡 TIMMY AGENT TRUST OS</Text>
          <Text color={theme.textMuted}>|</Text>
          <Text color={theme.textSecondary}>Posture:</Text>
          {securityModes.map((m, idx) => (
            <Text key={m} color={securityLevel === idx ? theme.warn : theme.textMuted} bold={securityLevel === idx}>
              {m}
            </Text>
          ))}
        </Box>
        <Box gap={1}>
          <Text color={theme.textSecondary}>Merkle Root:</Text>
          <Text color={theme.accent}>0x7f2a...991c</Text>
          <Text color={theme.textMuted}>|</Text>
          <Text color={theme.warn}>Quarantine: 3</Text>
        </Box>
      </Box>

      {/* Main Dual-Pane Section with Left Standing Rail */}
      <Box flexGrow={1} flexDirection="row">
        {/* Left Standing Menu (6 Tabs) */}
        <Box flexDirection="column" width={22} borderStyle="single" borderColor={theme.line} paddingX={1}>
          <Box marginBottom={1}>
            <Text color={theme.textMuted} bold>── TRUST SYSTEM ──</Text>
          </Box>
          {tabs.map((tab, idx) => {
            const isSelected = activeTab === idx;
            return (
              <Box
                key={tab.key}
                justifyContent="space-between"
                paddingX={1}
                borderStyle={isSelected ? 'single' : undefined}
                borderColor={isSelected ? theme.warn : undefined}
              >
                <Text color={isSelected ? theme.warn : theme.textSecondary} bold={isSelected}>
                  [{tab.key}] {tab.icon} {tab.label}
                </Text>
                <Text color={isSelected ? theme.accent : theme.textMuted}>
                  {tab.badge}
                </Text>
              </Box>
            );
          })}
          <Box marginTop={1} flexDirection="column" borderStyle="single" borderColor={theme.surfaceRaised} padding={1}>
            <Text color={theme.textMuted}>ENCLAVE: Nitro</Text>
            <Text color={theme.textMuted}>SVIX: Connected</Text>
            <Text color={theme.accent}>HASH: SHA-256</Text>
          </Box>
        </Box>

        {/* Left Pane: Security Quarantine & Policy Gates */}
        <Box flexDirection="column" width={leftPaneW} borderStyle="single" borderColor={theme.line} paddingX={1}>
          <Box justifyContent="space-between" borderStyle="single" borderColor={theme.surfaceRaised} paddingX={1}>
            <Text color={theme.textPrimary} bold>▼ SECURITY QUARANTINE & GATE APPROVAL</Text>
            <Text color={theme.warn}>3 INTERCEPTED</Text>
          </Box>

          <Box flexDirection="column" flexGrow={1} gap={1} marginTop={1}>
            {quarantineItems.map((item, idx) => (
              <Box key={item.id} flexDirection="column" borderStyle="single" borderColor={item.risk === 'CRITICAL' ? theme.danger : theme.warn} paddingX={1}>
                <Box justifyContent="space-between">
                  <Text color={theme.textPrimary} bold>{item.id} · [{item.agent}]</Text>
                  <Text color={item.risk === 'CRITICAL' ? theme.danger : theme.warn} bold>RISK: {item.risk}</Text>
                </Box>
                <Text color={theme.textPrimary}>{item.action}</Text>
                <Box marginTop={1} justifyContent="space-between">
                  <Text color={theme.textMuted}>Tool: {item.tool}</Text>
                  <Box gap={1}>
                    <Text color={theme.accent} bold>[Y] Seal & Run</Text>
                    <Text color={theme.danger} bold>[N] Deny</Text>
                    <Text color={theme.accent} bold>[S] Cloudflare Sandbox</Text>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          <Box borderStyle="single" borderColor={theme.surfaceRaised} paddingX={1}>
            <Text color={theme.textSecondary}>Policy Rule: </Text>
            <Text color={theme.accent}>Require Dual-Key Nonce for production file writes</Text>
          </Box>
        </Box>

        {/* Right Pane: Reverse Cryptographic Merkle Receipts */}
        <Box flexDirection="column" width={rightPaneW} borderStyle="single" borderColor={theme.line} paddingX={1}>
          <Box justifyContent="space-between" borderStyle="single" borderColor={theme.surfaceRaised} paddingX={1}>
            <Text color={theme.warn} bold>▲ REVERSE RECEIPT LEDGER</Text>
            <Text color={theme.accent}>IMMUTABLE ↑</Text>
          </Box>

          <Box marginTop={1} flexDirection="column" flexGrow={1} gap={0}>
            {receipts.map((r, i) => (
              <Box key={r.id} flexDirection="column" borderStyle="single" borderColor={theme.line} paddingX={1} marginY={0}>
                <Box justifyContent="space-between">
                  <Text color={theme.textPrimary} bold>{r.id}</Text>
                  <Text color={r.color} bold>{r.status}</Text>
                </Box>
                <Text color={theme.textMuted}>Root: {r.root}</Text>
                <Text color={theme.textSecondary}>Policy: {r.policy} ({r.time})</Text>
              </Box>
            ))}
          </Box>

          <Box flexDirection="column" borderStyle="round" borderColor={theme.line} paddingX={1} marginTop={1}>
            <Text color={theme.textSecondary}>Sealed Receipts: <Text color={theme.accent}>142 total</Text></Text>
            <Text color={theme.textSecondary}>Svix Signature: <Text color={theme.accent}>Valid (ECDSA P-256)</Text></Text>
          </Box>
        </Box>
      </Box>

      {/* Bottom Contextual Descriptor */}
      <Box flexDirection="column" borderStyle="single" borderColor={theme.line} paddingX={1}>
        <Box justifyContent="space-between">
          <Box gap={1}>
            <Text color={theme.textSecondary} bold>GOVERNANCE:</Text>
            <Text color={theme.accent}>[Y] Sign & Seal</Text>
            <Text color={theme.danger}>[N] Quarantine</Text>
            <Text color={theme.accent}>[E] Export Audit ZIP</Text>
          </Box>
          <Text color={theme.warn}>[H] {showDescriptor ? 'Hide Help' : 'Show Help'}</Text>
        </Box>
        {showDescriptor && (
          <Box marginTop={0}>
            <Text color={theme.textMuted} italic>
              💡 Tab 6 Audit: Left pane reviews intercepted actions & policy gates; right pane streams sealed Merkle receipts in reverse order.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

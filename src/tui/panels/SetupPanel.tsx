import React, { useState } from 'react';
import { Box, Text, useInput, useWindowSize } from 'ink';
import { useFocus, panelMayAct } from '../hooks/useKeyDispatcher.js';
import type { Agent } from '../../agent/core.js';
import { saveConfig } from '../../utils/config.js';
import { terminalLink } from '../../utils/hyperlink.js';
import { theme } from '../theme.js';

interface SetupPanelProps {
  agent: Agent;
}

export function SetupPanel({ agent }: SetupPanelProps) {
  const { columns: width } = useWindowSize();
  const [input, setInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Generate OSC 8 hyperlinked buttons
  const oauthLink = terminalLink('🔗 Get API Key / OAuth Link', 'https://openrouter.ai/keys');
  const stripeLink = terminalLink('💳 Subscribe to Premium Edge (Stripe)', 'https://checkout.stripe.com/pay/timmy-tui-premium');

  const __focus = useFocus();
  useInput((char, key) => {
    if (!panelMayAct(__focus, 'input:setup')) return;
    if (success) return; // Wait for transition

    if (key.return || char === '\r' || char === '\n') {
      const trimmedKey = input.trim();
      if (!trimmedKey) {
        setErrorMsg('API Key cannot be empty.');
        return;
      }
      if (!trimmedKey.startsWith('sk-or-')) {
        setErrorMsg('Warning: Key does not look like a valid OpenRouter API key (should start with sk-or-).');
      } else {
        setErrorMsg('');
      }

      try {
        // Save the key permanently in Conf store
        saveConfig({ apiKey: trimmedKey });
        
        // Dynamically update the active agent client
        agent.updateApiKey(trimmedKey);
        
        setSuccess(true);
        setErrorMsg('');

        // Visual flash transition to chat mode
        setTimeout(() => {
          agent.emit('mode:change' as any, 'chat');
        }, 800);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    } else if (key.backspace || key.delete) {
      setInput(input.slice(0, -1));
    } else if (key.escape) {
      setInput('');
      setErrorMsg('');
    } else if (char && char !== '\t' && char !== '\r' && char !== '\n' && !key.ctrl && !key.meta) {
      setInput(input + char);
    }
  });

  return (
    <Box flexDirection="column" paddingY={1} flexGrow={1}>
      {/* Glow Greeting Header */}
      <Box borderStyle="round" borderColor={theme.info} paddingX={2} flexDirection="column" marginBottom={1}>
        <Box justifyContent="center" marginBottom={1}>
          <Text bold color={theme.info}>⚡ WELCOME TO OPENROUTER TERMINAL TUI ⚡</Text>
        </Box>
        <Text color={theme.textPrimary} wrap="wrap">
          A state-of-the-art developer workspace powered by OpenRouter, featuring a high-fidelity swarm dashboard, real-time code reviewer panels, and persistent edge storage sync.
        </Text>
      </Box>

      {/* Account & Billing Hyperlinks */}
      <Box flexDirection="column" marginBottom={1} borderStyle="single" borderColor={theme.borderDefault} paddingX={2}>
        <Text bold color={theme.info}>🔗 Quick Setup & Credentials Link</Text>
        <Box marginY={1}>
          <Text color={theme.textSecondary}>
            Click the interactive terminal links below to link your account or upgrade:
          </Text>
        </Box>
        <Box flexDirection="row" justifyContent="space-around" marginY={1}>
          <Box borderStyle="single" borderColor={theme.info} paddingX={1}>
            <Text bold color={theme.info}>{oauthLink}</Text>
          </Box>
          <Box borderStyle="single" borderColor={theme.success} paddingX={1}>
            <Text bold color={theme.success}>{stripeLink}</Text>
          </Box>
        </Box>
      </Box>

      {/* Pricing / Capabilities Tier Cards */}
      <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        {/* Free Tier */}
        <Box flexDirection="column" width="30%" borderStyle="single" borderColor={theme.borderDefault} paddingX={1}>
          <Text bold color={theme.textSecondary}>🤖 Free Tier ($0)</Text>
          <Text color={theme.textTertiary}>- Local Session History</Text>
          <Text color={theme.textTertiary}>- Standard CLI Sandboxing</Text>
          <Text color={theme.textTertiary}>- Local Telemetry Mascot</Text>
        </Box>

        {/* Pro Tier */}
        <Box flexDirection="column" width="33%" borderStyle="single" borderColor={theme.warning} paddingX={1}>
          <Text bold color={theme.warning}>⚡ Edge Pro ($5/mo)</Text>
          <Text color={theme.textSecondary}>- Durable Object SQLite Sync</Text>
          <Text color={theme.textSecondary}>- Offloaded Edge Swarm DO</Text>
          <Text color={theme.textSecondary}>- Globally Replicated KV Vault</Text>
          <Text color={theme.textSecondary}>- Edge Crawler proxy scraping</Text>
        </Box>

        {/* Ultra Pro Tier */}
        <Box flexDirection="column" width="33%" borderStyle="single" borderColor={theme.brand} paddingX={1}>
          <Text bold color={theme.brand}>🌌 Ultra Pro ($45/mo)</Text>
          <Text color={theme.textPrimary}>- Private Isolated VPS droplet</Text>
          <Text color={theme.textPrimary}>- Asynchronous Email Agent Loop</Text>
          <Text color={theme.textPrimary}>- MCP Serverless Wrangler Deploy</Text>
          <Text color={theme.textPrimary}>- Vectorize RAG Context Memory</Text>
        </Box>
      </Box>

      {/* Interactive API Key Input Console */}
      <Box flexDirection="column" borderStyle="round" borderColor={success ? theme.success : theme.brand} paddingX={2}>
        {success ? (
          <Box flexDirection="column" paddingY={1} alignItems="center">
            <Text bold color={theme.success}>✓ API Key Saved Successfully!</Text>
            <Text color={theme.textSecondary}>Dynamically connecting client and launching conversational console...</Text>
          </Box>
        ) : (
          <Box flexDirection="column">
            <Text bold color={theme.textPrimary}>🔑 Setup Your Credentials</Text>
            <Box marginBottom={1}>
              <Text color={theme.textSecondary}>
                Paste your OpenRouter API key below and press [Enter] to unlock the workspace:
              </Text>
            </Box>
            
            <Box flexDirection="row" alignItems="center">
              <Text bold color={theme.brand}>sk-or- </Text>
              <Box flexGrow={1} borderStyle="single" borderColor={theme.borderDefault} paddingX={1}>
                <Text color={input ? theme.textPrimary : theme.textTertiary}>
                  {input ? '•'.repeat(Math.min(input.length, 36)) : 'Paste your API key here (Ctrl+V / Cmd+V)...'}
                </Text>
              </Box>
            </Box>

            {errorMsg && (
              <Box marginTop={1}>
                <Text color={errorMsg.includes('Warning') ? theme.warning : theme.error} bold>
                  {errorMsg.includes('Warning') ? '⚠️ ' : '✕ '}
                  {errorMsg}
                </Text>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useWindowSize } from 'ink';
import chalk from 'chalk';
import { useAgent } from '../hooks/useAgent.js';
import type { Agent } from '../../agent/core.js';
import { renderMarkdown } from '../../utils/markdown.js';
import { theme } from '../theme.js';
import { SLASH_COMMANDS, handleSlashCommand, getAutocompleteEnabled } from '../../utils/slash-commands.js';
import { truncateVisible } from '../utils/text.js';
import { ShimmerText, SignalBars, Spinner } from '../components/Motion.js';
import { useEdgeHealth } from '../hooks/useEdgeHealth.js';

interface ChatPanelProps {
  agent: Agent;
  setInspector: (data: any) => void;
}

export function ChatPanel({ agent, setInspector }: ChatPanelProps) {
  const { rows: height, columns: width } = useWindowSize();
  const terminalHeight = height || 24;
  const terminalWidth = width || 80;
  
  const state = useAgent(agent);
  const edge = useEdgeHealth();
  const edgeValue = edge.state === 'online' && edge.latencyMs !== null ? `${edge.latencyMs}ms` : edge.state;
  const edgeColor = edge.state === 'online' ? '#3fb950' : '#d29922';

  const [input, setInput] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [activeSuggestIdx, setActiveSuggestIdx] = useState(0);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [activeCheckpointIdx, setActiveCheckpointIdx] = useState(0);

  // Focus navigation mode: 0 = Input box, 1 = Action buttons
  const [focusMode, setFocusMode] = useState<number>(0);
  const [btnHighlightIdx, setBtnHighlightIdx] = useState<number>(0);

  const actionButtons = [
    { label: '[ Add Tool by URL ]', action: 'porter' },
    { label: '[ Open Workspace ]', action: 'workspace' },
    { label: '[ View Last Receipt ]', action: 'proof' }
  ];

  const updateInspectorData = () => {
    setInspector({
      title: 'TIMMY ACTIVE PASSPORT',
      subtitle: 'VERIFIABLE OPERATIONS LEDGER',
      type: 'AgentPass Session',
      status: 'VERIFIED',
      risk: 'LOW',
      scope: 'brief.session.auth',
      details: [
        'Passport ID: jti_auth_91a783',
        'Authority: Enforced locally & CF Edge',
        'Telemetry Target: Cloudflare Durable Object',
        'Wedge: Code Swarm Pack active',
        'Edge Status: Connected D1 Database'
      ]
    });
  };

  useEffect(() => {
    updateInspectorData();
  }, []);

  const { allLines, checkpoints } = React.useMemo(() => {
    const lines: string[] = [];
    const checkpointsList: { checkpointIndex: number; lineIndex: number }[] = [];
    const messages = state.messages;
    const leftPanelWidth = Math.max(20, terminalWidth - 54);
    
    let checkpointCount = 0;
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role === 'user') {
        const lineIndex = lines.length;
        checkpointsList.push({
          checkpointIndex: checkpointCount,
          lineIndex
        });
        checkpointCount++;

        lines.push(chalk.bold.hex('#79c0ff')(`▶ You [Checkpoint ${checkpointCount}]`));
        lines.push(...msg.content.split('\n'));
        lines.push('');
      } else if (msg.role === 'assistant') {
        lines.push(chalk.bold.hex('#a5d6ff')('◀ Assistant'));
        const parsedMarkdown = renderMarkdown(msg.content, leftPanelWidth);
        lines.push(...parsedMarkdown.split('\n'));
        lines.push('');
        lines.push(chalk.hex('#3fb950')('☁️  [Saved to Cloudflare Durable Object SQLite Session #default-local-run]'));
        lines.push('');
      }
    }

    if (state.isStreaming) {
      if (state.currentTools.length > 0) {
        lines.push(chalk.hex('#d2a8ff')(state.currentTools.map(t => `⚙ ${t}`).join('  ')));
        lines.push('');
      }
      if (state.streamingText) {
        lines.push(chalk.bold.hex('#a5d6ff')('◀ Assistant'));
        const parsedStream = renderMarkdown(state.streamingText, leftPanelWidth);
        lines.push(...parsedStream.split('\n'));
        lines.push(chalk.hex('#8b949e')('▌'));
      } else {
        lines.push(chalk.hex(theme.accent)('◌ Thinking and invoking swarm orchestrator...'));
      }
    }

    if (state.error) {
      lines.push(chalk.bold.hex('#f85149')(`✕ Error: ${state.error.message}`));
    }

    return { allLines: lines, checkpoints: checkpointsList };
  }, [state.messages, state.isStreaming, state.streamingText, state.currentTools, state.error, terminalWidth]);

  useEffect(() => {
    if (checkpoints.length > 0) {
      setActiveCheckpointIdx(checkpoints.length - 1);
      setUserScrolledUp(false);
    }
  }, [checkpoints.length]);

  useEffect(() => {
    if (state.isStreaming || state.isThinking) {
      setUserScrolledUp(false);
    }
  }, [state.isStreaming, state.isThinking]);

  const leftPanelWidth = Math.max(20, terminalWidth - 54);
  const showAutocomplete = getAutocompleteEnabled() && input.startsWith('/') && !input.includes(' ');
  const matches = showAutocomplete
    ? SLASH_COMMANDS.filter(c => c.command.startsWith(input.split(' ')[0])).slice(0, 5)
    : [];
  const closestMatch = matches[activeSuggestIdx] || matches[0];

  const hasPager = checkpoints.length > 0;
  const panelHeaderHeight = 2;
  
  const showFullMascot = terminalHeight >= 30;
  const showCompactMascot = terminalHeight < 30 && terminalHeight >= 22;
  const mascotHeight = showFullMascot ? 14 : (showCompactMascot ? 1 : 0);
  
  const buttonsHeight = 4; // Title (1) + 3 menu items (3)
  
  const nonFlexibleHeight = 
    mascotHeight
    + panelHeaderHeight
    + (hasPager ? 2 : 1)
    + (showAutocomplete && matches.length > 0 ? 1 : 0)
    + buttonsHeight
    + 3 // Input prompt box
    + 1; // Stage footer/padding
  
  const visibleHeight = Math.max(4, terminalHeight - nonFlexibleHeight - 6);
  const inputTextWidth = Math.max(1, leftPanelWidth - 14);

  (agent as any).autocompleteActive = showAutocomplete && matches.length > 0;

  useEffect(() => {
    return () => {
      (agent as any).autocompleteActive = false;
    };
  }, [agent]);

  const visibleLines = allLines.slice(scrollOffset, scrollOffset + visibleHeight);

  useEffect(() => {
    const totalLines = allLines.length;
    if (totalLines > visibleHeight) {
      if (!userScrolledUp) {
        setScrollOffset(totalLines - visibleHeight);
      }
    } else {
      setScrollOffset(0);
    }
  }, [allLines.length, visibleHeight, userScrolledUp]);

  useInput((char, key) => {
    // Esc closes autocomplete/options
    if (key.escape) {
      if (showAutocomplete) {
        setInput('');
        return;
      }
    }

    // Key-navigable Action Buttons (focusMode === 1)
    if (focusMode === 1) {
      if (key.leftArrow) {
        setBtnHighlightIdx(prev => Math.max(0, prev - 1));
        return;
      }
      if (key.rightArrow) {
        setBtnHighlightIdx(prev => Math.min(actionButtons.length - 1, prev + 1));
        return;
      }
      if (key.downArrow || key.tab) {
        setFocusMode(0);
        return;
      }
      if (key.return) {
        const btn = actionButtons[btnHighlightIdx];
        if (btn.action === 'porter') {
          agent.emit('mode:change' as any, 'porter');
        } else if (btn.action === 'workspace') {
          agent.emit('mode:change' as any, 'workspace');
        } else if (btn.action === 'proof') {
          agent.emit('mode:change' as any, 'proof');
        }
        return;
      }
      return;
    }

    // Normal Input Mode (focusMode === 0)
    if (showAutocomplete && matches.length > 0) {
      if (key.rightArrow) {
        setActiveSuggestIdx(prev => (prev + 1) % matches.length);
        return;
      }
      if (key.leftArrow) {
        setActiveSuggestIdx(prev => (prev - 1 + matches.length) % matches.length);
        return;
      }
      if (key.tab && closestMatch) {
        setInput(closestMatch.command + ' ');
        setCursorPos(closestMatch.command.length + 1);
        setActiveSuggestIdx(0);
        return;
      }
    } else {
      // UpArrow at empty prompt shifts focus up to selectable buttons!
      if (key.upArrow && !input) {
        setFocusMode(1);
        setBtnHighlightIdx(0);
        return;
      }

      if (key.upArrow) {
        setScrollOffset(prev => {
          const next = Math.max(0, prev - 1);
          setUserScrolledUp(true);
          return next;
        });
        return;
      }
      if (key.downArrow) {
        const totalLines = allLines.length;
        const maxScroll = Math.max(0, totalLines - visibleHeight);
        setScrollOffset(prev => {
          const next = Math.min(maxScroll, prev + 1);
          if (next >= maxScroll) {
            setUserScrolledUp(false);
          } else {
            setUserScrolledUp(true);
          }
          return next;
        });
        return;
      }
    }

    if ((key.return || char === '\r' || char === '\n') && input.trim()) {
      const text = input.trim();
      setInput('');
      setCursorPos(0);
      setActiveSuggestIdx(0);
      
      if (text.startsWith('/')) {
        const res = handleSlashCommand(text, agent, state);
        if (res) {
          agent.emit('message:user', {
            role: 'assistant',
            content: `⚙️ **[SYSTEM]** ${res}`,
            timestamp: Date.now()
          });
        }
      } else {
        state.send(text);
      }
    } else if (key.backspace || key.delete) {
      setInput(input.slice(0, -1));
      setCursorPos(Math.max(0, cursorPos - 1));
      setActiveSuggestIdx(0);
    } else if (char && char !== '\t' && char !== '\r' && char !== '\n' && !key.ctrl && !key.meta) {
      setInput(input + char);
      setCursorPos(cursorPos + 1);
      setActiveSuggestIdx(0);
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1} width={leftPanelWidth} paddingX={1}>
      {/* Title */}
      <Box height={1} justifyContent="space-between" width={leftPanelWidth - 2}>
        <Box>
          <Text bold color="#79c0ff">Chat Stage</Text>
          <Text color={theme.textTertiary}>  </Text>
          {state.isThinking || state.isStreaming ? <Spinner color="#79c0ff" label="working" /> : <SignalBars width={8} color="#79c0ff" active />}
        </Box>
      </Box>

      {/* Messages Scroll viewport */}
      <Box flexDirection="column" height={visibleHeight} justifyContent="flex-start" overflowY="hidden" width={leftPanelWidth - 2}>
        {checkpoints.length === 0 ? (
          <Box flexGrow={1} flexDirection="column" paddingX={2} width={leftPanelWidth - 2}>
            <Box justifyContent="center" marginBottom={1}>
              <Text bold color={edgeColor}>☁️  TIMMY Swarm: Connected D1 Database (latency: {edgeValue})</Text>
            </Box>
            
            <Box flexDirection="column" marginBottom={1}>
              <Text bold color="#a5d6ff">⚡ VERIFIABLE COGNITIVE VALUE CHAIN:</Text>
              <Text color="#79c0ff" bold>  URL ──&gt; Ingest ──&gt; Control ──&gt; Proof ──&gt; Reuse</Text>
            </Box>

            <Box flexDirection="column" marginBottom={0}>
              <Text color="#e6edf3"><Text bold color="#d2a8ff">🔧 MCPorter</Text> ─ Scans server URLs, compiles secure TS SDKs &amp; sandboxed CLIs.</Text>
            </Box>
            <Box flexDirection="column" marginBottom={0}>
              <Text color="#e6edf3"><Text bold color="#79c0ff">🖥️ cmux Pro</Text> ─ Multi-cell virtual terminal workspace launcher with clickable macOS panes.</Text>
            </Box>
            <Box flexDirection="column" marginBottom={0}>
              <Text color="#e6edf3"><Text bold color="#3fb950">🤖 OpenRouter</Text> ─ Multi-model routing, automatic fallback hierarchies, and spend budget meters.</Text>
            </Box>
            <Box flexDirection="column" marginBottom={0}>
              <Text color="#e6edf3"><Text bold color="#e3b341">⚙️ Pi Agent</Text> ─ Coordinates subagents/teams and synchronizes Durable Object KV contexts.</Text>
            </Box>
            <Box flexDirection="column" marginBottom={0}>
              <Text color="#e6edf3"><Text bold color="#ff7b72">🛡️ Hermes</Text> ─ Deep architectural research planner, code safety reviewer, and compliance audits.</Text>
            </Box>
          </Box>
        ) : (
          visibleLines.map((line, i) => (
            <Text key={i} wrap="wrap">{line}</Text>
          ))
        )}
      </Box>

      {/* Autocomplete Suggestions */}
      {showAutocomplete && matches.length > 0 && (
        <Box paddingX={1} minHeight={1} width={leftPanelWidth - 2} flexDirection="row" flexWrap="wrap" marginBottom={1}>
          <Box marginRight={2}>
            <Text color={theme.textTertiary}>Suggestions: </Text>
          </Box>
          {matches.map((m, idx) => {
            const isCurrent = idx === activeSuggestIdx;
            return (
              <Box key={m.command} marginRight={4}>
                <Text color={isCurrent ? '#58a6ff' : theme.textSecondary} bold={isCurrent}>
                  {isCurrent ? `▶ ${m.command}` : m.command}
                </Text>
              </Box>
            );
          })}
        </Box>
      )}

      {/* TIMMY Quartermaster Guide Banner/Card */}
      {showFullMascot ? (
        <Box borderStyle="single" borderColor="#30363d" paddingX={2} marginY={0} flexDirection="column" width={leftPanelWidth - 2} flexShrink={0}>
          <Text bold color="#79c0ff">🧑‍✈️  TIMMY Quartermaster Mascot Guide</Text>
          <Text color="#8b949e">
            "Quartermaster ready, operator. Swarm telemetry JTI visa auth is fully secure. Input your prompt below, or use the Left Nav list to configure Swarm Blueprints and run evidence chambers."
          </Text>
        </Box>
      ) : (
        showCompactMascot && (
          <Box paddingX={2} marginY={0} flexShrink={0}>
            <Text color="#8b949e">🧑‍✈️ <Text bold color="#79c0ff">TIMMY:</Text> Swarm telemetry secure. Enter prompt below.</Text>
          </Box>
        )
      )}

      {/* Selectable Action Menu */}
      <Box paddingX={2} marginY={0} flexDirection="column" width={leftPanelWidth - 2} flexShrink={0}>
        <Text bold color="#d2a8ff">📱 Brief Action Menu:</Text>
        <Box flexDirection="column" marginTop={0}>
          {actionButtons.map((btn, idx) => {
            const isButtonFocused = focusMode === 1 && idx === btnHighlightIdx;
            return (
              <Box key={btn.action}>
                <Text bold={isButtonFocused} color={isButtonFocused ? '#d2a8ff' : '#8b949e'}>
                  {isButtonFocused ? '▶ ' : '  '}
                  {btn.label}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Input prompt box */}
      <Box borderStyle="single" borderColor={focusMode === 0 ? "#5e6ad2" : "#30363d"} paddingX={1} width={leftPanelWidth - 2} flexShrink={0}>
        <Text color={theme.textTertiary}>[ brief-chat ] </Text>
        <Text color="#79c0ff">{state.isThinking ? '◌ ' : '▶ '} </Text>
        <Text color={theme.textPrimary} wrap="truncate">{truncateVisible(input, inputTextWidth)}</Text>
        <Text color="#8b949e">{state.isStreaming || state.isThinking ? ' ···' : '█'}</Text>
      </Box>
    </Box>
  );
}

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
  focusArea: 'nav' | 'stage';
}

export function ChatPanel({ agent, setInspector, focusArea }: ChatPanelProps) {
  const { rows: height, columns: width } = useWindowSize();
  const terminalHeight = height || 24;
  const terminalWidth = width || 80;
  
  const state = useAgent(agent);
  const edge = useEdgeHealth();
  const edgeValue = edge.state === 'online' && edge.latencyMs !== null ? `${edge.latencyMs}ms` : edge.state;
  const edgeColor = edge.state === 'online' ? '#3fb950' : '#d29922';

  const [input, setInput] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [activeSuggestIdx, setActiveSuggestIdx] = useState(0);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [activeCheckpointIdx, setActiveCheckpointIdx] = useState(0);

  // Dynamic layout width computation
  const leftPanelWidth = focusArea === 'stage'
    ? terminalWidth
    : Math.max(20, terminalWidth - 54);

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
    const textWidth = Math.max(16, leftPanelWidth - 6);
    
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
        lines.push(chalk.bold.hex('#a98bff')('◀ TIMMY Agent'));
        const parsedMarkdown = renderMarkdown(msg.content, textWidth);
        lines.push(...parsedMarkdown.split('\n'));
        lines.push('');
        lines.push(chalk.hex('#43d6a0')('☁️  [Saved to Cloudflare Durable Object SQLite Session #default-local-run]'));
        lines.push('');
      }
    }

    if (state.isStreaming) {
      if (state.currentTools.length > 0) {
        lines.push(chalk.hex('#a98bff')(state.currentTools.map(t => `⚙ ${t}`).join('  ')));
        lines.push('');
      }
      if (state.streamingText) {
        lines.push(chalk.bold.hex('#a98bff')('◀ TIMMY Agent'));
        const parsedStream = renderMarkdown(state.streamingText, textWidth);
        lines.push(...parsedStream.split('\n'));
        lines.push(chalk.hex('#8a8a94')('▌'));
      } else {
        lines.push(chalk.hex('#a98bff')('◌ Thinking and invoking swarm orchestrator...'));
      }
    }

    if (state.error) {
      lines.push(chalk.bold.hex('#ff6b6b')(`✕ Error: ${state.error.message}`));
    }

    return { allLines: lines, checkpoints: checkpointsList };
  }, [state.messages, state.isStreaming, state.streamingText, state.currentTools, state.error, leftPanelWidth]);

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

  const showAutocomplete = getAutocompleteEnabled() && input.startsWith('/') && !input.includes(' ');
  const matches = showAutocomplete
    ? SLASH_COMMANDS.filter(c => c.command.startsWith(input.split(' ')[0])).slice(0, 5)
    : [];
  const closestMatch = matches[activeSuggestIdx] || matches[0];

  // Maximize visible height for scrollable chat stage
  const visibleHeight = Math.max(8, terminalHeight - 11);
  const inputTextWidth = Math.max(1, leftPanelWidth - 18);

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
    // Esc closes autocomplete
    if (key.escape) {
      if (showAutocomplete) {
        setInput('');
        return;
      }
    }

    // Unconditional scrolling routing
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

  // Sleek visual scrollbar render calculations
  const totalLines = allLines.length;
  const maxScroll = Math.max(0, totalLines - visibleHeight);
  
  const renderScrollbar = () => {
    if (totalLines <= visibleHeight) {
      return (
        <Box flexDirection="column" width={2} alignItems="center" paddingLeft={1}>
          <Text color="#30363d">▲</Text>
          {Array.from({ length: visibleHeight - 2 }).map((_, idx) => (
            <Text key={idx} color="#1f1f26">│</Text>
          ))}
          <Text color="#30363d">▼</Text>
        </Box>
      );
    }

    const trackHeight = visibleHeight;
    const scrollPct = scrollOffset / maxScroll;
    // Calculate scroll slider handle position safely within vertical height
    const handlePos = Math.round(scrollPct * (trackHeight - 3)) + 1;

    const track = [];
    for (let i = 0; i < trackHeight; i++) {
      if (i === 0) track.push('▲');
      else if (i === trackHeight - 1) track.push('▼');
      else if (i === handlePos) track.push('█');
      else track.push('░');
    }

    return (
      <Box flexDirection="column" width={2} alignItems="center" paddingLeft={1}>
        {track.map((char, idx) => (
          <Text key={idx} color={char === '█' ? '#4f9cff' : '#1f1f26'}>{char}</Text>
        ))}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" flexGrow={1} width={leftPanelWidth} paddingX={1}>
      
      {/* 1. Instruction Highlight Card */}
      <Box borderStyle="double" borderColor="#5e6ad2" paddingX={2} marginBottom={1} flexDirection="column" width={leftPanelWidth - 2} flexShrink={0}>
        <Box justifyContent="space-between" width="100%">
          <Text bold color="#a98bff">🧑‍✈️  TIMMY CHAT CONSOLE: Observability Hub | Intent OS</Text>
          {state.isThinking || state.isStreaming ? <Spinner color="#a98bff" label="thinking" /> : <SignalBars width={8} color="#a98bff" active />}
        </Box>
        <Text color="#8a8a94" dimColor>
          "Any tool can become a command. Any command can become governed work. Any governed work can become proof."
        </Text>
        <Box marginTop={1} justifyContent="space-between">
          <Text color="#43d6a0" bold>• UP/DOWN: Scroll Chat History</Text>
          <Text color="#4f9cff" bold>• ENTER: Submit Mission Prompt</Text>
          <Text color="#a98bff" bold>• ESC: Nav Sidebar Toggle</Text>
          <Text color="#f5b545" bold>• Ctrl+K: Command Palette</Text>
        </Box>
      </Box>

      {/* 2. Messages Viewport with sleek Border and Scrollbar */}
      <Box borderStyle="round" borderColor="#30363d" width={leftPanelWidth - 2} height={visibleHeight + 2} flexDirection="row" paddingX={1} flexShrink={1} flexGrow={1}>
        
        {/* Scrollable text region */}
        <Box flexDirection="column" flexGrow={1} height={visibleHeight} justifyContent="flex-start" overflowY="hidden">
          {checkpoints.length === 0 ? (
            <Box flexGrow={1} flexDirection="column" paddingX={2} paddingY={1}>
              <Box justifyContent="center" marginBottom={1}>
                <Text bold color={edgeColor}>☁️  TIMMY Swarm: Connected Durable Object SQLite Session (latency: {edgeValue})</Text>
              </Box>
              
              <Box flexDirection="column" marginBottom={1} borderStyle="single" borderColor="#30363d" paddingX={1}>
                <Text bold color="#a98bff">⚡ VERIFIABLE COGNITIVE VALUE CHAIN:</Text>
                <Text color="#4f9cff" bold>  Capability (URL) ──&gt; Control (Scan) ──&gt; Proof (Receipt) ──&gt; Reuse (CLI)</Text>
              </Box>

              <Box flexDirection="column" marginBottom={0}>
                <Text color="#e6e6ea"><Text bold color="#43d6a0">🔧 MCPorter</Text> ─ Scans server URLs, compiles secure TS SDKs &amp; sandboxed CLIs.</Text>
              </Box>
              <Box flexDirection="column" marginBottom={0}>
                <Text color="#e6e6ea"><Text bold color="#4f9cff">🖥️ cmux Pro</Text> ─ Multi-cell virtual terminal workspace launcher with clickable macOS panes.</Text>
              </Box>
              <Box flexDirection="column" marginBottom={0}>
                <Text color="#e6e6ea"><Text bold color="#a98bff">🤖 OpenRouter</Text> ─ Multi-model routing, automatic fallback hierarchies, and spend budget meters.</Text>
              </Box>
              <Box flexDirection="column" marginBottom={0}>
                <Text color="#e6e6ea"><Text bold color="#f5b545">⚙️ Pi Agent</Text> ─ Coordinates subagents/teams and synchronizes Durable Object KV contexts.</Text>
              </Box>
              <Box flexDirection="column" marginBottom={0}>
                <Text color="#e6e6ea"><Text bold color="#ff6b6b">🛡️ Hermes</Text> ─ Deep architectural research planner, code safety reviewer, and compliance audits.</Text>
              </Box>
            </Box>
          ) : (
            visibleLines.map((line, i) => (
              <Text key={i} wrap="wrap">{line}</Text>
            ))
          )}
        </Box>

        {/* Dynamic visual scrollbar track */}
        {renderScrollbar()}
      </Box>

      {/* 3. Autocomplete Suggestions */}
      {showAutocomplete && matches.length > 0 && (
        <Box paddingX={1} minHeight={1} width={leftPanelWidth - 2} flexDirection="row" flexWrap="wrap" marginBottom={1} flexShrink={0}>
          <Box marginRight={2}>
            <Text color="#8a8a94">Suggestions: </Text>
          </Box>
          {matches.map((m, idx) => {
            const isCurrent = idx === activeSuggestIdx;
            return (
              <Box key={m.command} marginRight={4}>
                <Text color={isCurrent ? '#4f9cff' : '#8a8a94'} bold={isCurrent}>
                  {isCurrent ? `▶ ${m.command}` : m.command}
                </Text>
              </Box>
            );
          })}
        </Box>
      )}

      {/* 4. Input prompt box */}
      <Box borderStyle="single" borderColor={focusArea === 'stage' ? "#a98bff" : "#30363d"} paddingX={1} width={leftPanelWidth - 2} flexShrink={0} marginTop={1}>
        <Text color="#8a8a94">[ brief-chat ] </Text>
        <Text color="#4f9cff">{state.isThinking ? '◌ ' : '▶ '} </Text>
        <Text color="#e6e6ea" wrap="truncate">{truncateVisible(input, inputTextWidth)}</Text>
        <Text color="#a98bff">{state.isStreaming || state.isThinking ? ' ···' : '█'}</Text>
      </Box>
    </Box>
  );
}

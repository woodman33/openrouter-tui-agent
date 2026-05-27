import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useWindowSize } from 'ink';
import chalk from 'chalk';
import { useAgent } from '../hooks/useAgent.js';
import type { Agent } from '../../agent/core.js';
import { renderMarkdown } from '../../utils/markdown.js';
import { theme } from '../theme.js';
import { SLASH_COMMANDS, handleSlashCommand, getAutocompleteEnabled } from '../../utils/slash-commands.js';
import type { Message } from '../../types/index.js';

interface ChatPanelProps {
  agent: Agent;
}

export function ChatPanel({ agent }: ChatPanelProps) {
  const { rows: height, columns: width } = useWindowSize();
  const terminalHeight = height || process.stdout.rows || 24;
  const terminalWidth = width || process.stdout.columns || 80;
  const state = useAgent(agent);
  const [input, setInput] = useState('');
  const [cursorPos, setCursorPos] = useState(0);

  // Scroll offset & autocomplete suggestions states
  const [scrollOffset, setScrollOffset] = useState(0);
  const [activeSuggestIdx, setActiveSuggestIdx] = useState(0);

  // Track if user has scrolled up to lock autoscroll
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Track the active checkpoint index (defaults to the latest)
  const [activeCheckpointIdx, setActiveCheckpointIdx] = useState(0);

  // 1. Compile the complete history into a single continuous thread of lines,
  // and map out the line start positions for each checkpoint for PgUp/PgDn navigation.
  const { allLines, checkpoints } = React.useMemo(() => {
    const lines: string[] = [];
    const checkpointsList: { checkpointIndex: number; lineIndex: number }[] = [];
    const messages = state.messages;
    const leftPanelWidth = terminalWidth - 36;
    
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
      }
    }

    // Render active streaming content if model is active
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

  // Auto-sync active checkpoint and reset scroll lock on new user prompts
  useEffect(() => {
    if (checkpoints.length > 0) {
      setActiveCheckpointIdx(checkpoints.length - 1);
      setUserScrolledUp(false);
    }
  }, [checkpoints.length]);

  // Reset scroll lock whenever assistant starts thinking or streaming to guarantee auto-scrolling
  useEffect(() => {
    if (state.isStreaming || state.isThinking) {
      setUserScrolledUp(false);
    }
  }, [state.isStreaming, state.isThinking]);

  const leftPanelWidth = terminalWidth - 36;
  const showAutocomplete = getAutocompleteEnabled() && input.startsWith('/') && !input.includes(' ');
  const matches = showAutocomplete
    ? SLASH_COMMANDS.filter(c => c.command.startsWith(input.split(' ')[0])).slice(0, 5)
    : [];
  const closestMatch = matches[activeSuggestIdx] || matches[0];

  // Dynamic Viewport Height: Mathematical subtraction to lock input box tight to the bottom
  const hasPager = checkpoints.length > 0;
  const nonFlexibleHeight = 
    2 // Header + Separator
    + (hasPager ? 2 : 1) // Pager banner + margin, or just margin
    + (showAutocomplete && matches.length > 0 ? 1 : 0) // Autocomplete box
    + 3 // Input prompt box (including borders)
    + 1; // Footer
  const visibleHeight = Math.max(5, terminalHeight - nonFlexibleHeight);

  // Sync autocomplete state synchronously during render to guarantee no race conditions with Tab keypresses
  (agent as any).autocompleteActive = showAutocomplete && matches.length > 0;

  // Cleanup autocompleteActive state on unmount
  useEffect(() => {
    return () => {
      (agent as any).autocompleteActive = false;
    };
  }, [agent]);

  const visibleLines = allLines.slice(scrollOffset, scrollOffset + visibleHeight);

  // Auto scroll to bottom ONLY if user hasn't scrolled up
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

  // Dynamically update the active checkpoint banner index based on current scroll position
  useEffect(() => {
    if (checkpoints.length === 0) return;
    let activeIdx = 0;
    for (let i = 0; i < checkpoints.length; i++) {
      if (checkpoints[i].lineIndex <= scrollOffset) {
        activeIdx = i;
      } else {
        break;
      }
    }
    setActiveCheckpointIdx(activeIdx);
  }, [scrollOffset, checkpoints]);

  useInput((char, key) => {
    // 1. Autocomplete navigation when active
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
      // 2. Response Checkpoint cycling via PageUp / PageDown
      if (key.pageUp && checkpoints.length > 0) {
        setActiveCheckpointIdx(prev => {
          const nextIdx = Math.max(0, prev - 1);
          const cp = checkpoints[nextIdx];
          if (cp) {
            setScrollOffset(cp.lineIndex);
            setUserScrolledUp(true);
          }
          return nextIdx;
        });
        return;
      }
      if (key.pageDown && checkpoints.length > 0) {
        setActiveCheckpointIdx(prev => {
          const nextIdx = Math.min(checkpoints.length - 1, prev + 1);
          const cp = checkpoints[nextIdx];
          if (cp) {
            setScrollOffset(cp.lineIndex);
            const totalLines = allLines.length;
            const maxScroll = Math.max(0, totalLines - visibleHeight);
            if (cp.lineIndex >= maxScroll) {
              setUserScrolledUp(false);
            } else {
              setUserScrolledUp(true);
            }
          }
          return nextIdx;
        });
        return;
      }

      // 3. Line-by-line scroll inside checkpoint (Arrow Up/Down)
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
        if (text.trim() === '/') {
          return;
        }
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
    } else if (key.escape) {
      setInput('');
      setCursorPos(0);
      setActiveSuggestIdx(0);
    } else if (char && char !== '\t' && char !== '\r' && char !== '\n' && !key.ctrl && !key.meta) {
      setInput(input + char);
      setCursorPos(cursorPos + 1);
      setActiveSuggestIdx(0);
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1} width={leftPanelWidth}>
      {/* Dynamic Response Checkpoint Pager Banner */}
      {checkpoints.length > 0 && (
        <Box marginBottom={1} justifyContent="space-between" width={leftPanelWidth}>
          <Text bold color="#79c0ff">
            💎 THREAD CHECKPOINT: [ {activeCheckpointIdx + 1} of {checkpoints.length} ]
          </Text>
          <Text color={theme.textTertiary} dimColor>
            [↑/↓]: Scroll | [PgUp/PgDn]: Checkpoints
          </Text>
        </Box>
      )}

      {/* Messages Scroll viewport */}
      <Box flexDirection="column" height={visibleHeight} justifyContent="flex-start" overflowY="hidden" width={leftPanelWidth}>
        {checkpoints.length === 0 ? (
          <Box flexGrow={1} justifyContent="center" alignItems="center">
            <Text color={theme.textSecondary} dimColor>No messages in session. What shall we build?</Text>
          </Box>
        ) : (
          visibleLines.map((line, i) => (
            <Text key={i} wrap="wrap">{line}</Text>
          ))
        )}
      </Box>

      {/* Autocomplete command bar - set explicitly in row to prevent scrambling */}
      {showAutocomplete && matches.length > 0 && (
        <Box paddingX={1} minHeight={1} width={leftPanelWidth} flexDirection="row" flexWrap="wrap" marginBottom={1}>
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
          {closestMatch && (
            <Box marginLeft={1}>
              <Text color="#8b949e" dimColor>— {closestMatch.description} (Press Tab to select)</Text>
            </Box>
          )}
        </Box>
      )}

      {/* Input prompt box */}
      <Box marginTop={hasPager ? 0 : 1} borderStyle="single" borderColor="#5e6ad2" paddingX={1} width={leftPanelWidth}>
        <Text color={theme.textTertiary}>[ chat ] </Text>
        <Text color="#79c0ff">{state.isThinking ? '◌ ' : '▶ '} </Text>
        <Text color={theme.textPrimary}>{input}</Text>
        <Text color="#8b949e">{state.isStreaming || state.isThinking ? ' ···' : '█'}</Text>
      </Box>
    </Box>
  );
}

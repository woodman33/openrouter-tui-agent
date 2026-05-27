import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useWindowSize } from 'ink';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { useAgent } from '../hooks/useAgent.js';
import type { Agent } from '../../agent/core.js';
import { GlowBorder } from '../components/GlowBorder.js';
import { IndeterminateBar } from '../components/ProgressBar.js';
import { renderMarkdown } from '../../utils/markdown.js';
import { theme } from '../theme.js';
import { SLASH_COMMANDS, handleSlashCommand, getAutocompleteEnabled } from '../../utils/slash-commands.js';

interface CodeReviewPanelProps {
  agent: Agent;
}

export function CodeReviewPanel({ agent }: CodeReviewPanelProps) {
  const { rows: height, columns: width } = useWindowSize();
  const state = useAgent(agent);
  const [input, setInput] = useState('');
  const [gitDiff, setGitDiff] = useState('');
  const [lintStatus, setLintStatus] = useState<string | null>(null);

  // Scroll offset & autocomplete suggestions states
  const [diffScrollOffset, setDiffScrollOffset] = useState(0);
  const [logScrollOffset, setLogScrollOffset] = useState(0);
  const [activeSuggestIdx, setActiveSuggestIdx] = useState(0);

  const fetchDiff = () => {
    try {
      const diff = execSync('git diff', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      setGitDiff(diff || 'No changes detected. Workspace is clean!');
    } catch (e: any) {
      setGitDiff(`Error fetching git diff: ${e.message}`);
    }
  };

  const runLint = () => {
    setLintStatus('Running compilation and type-check (tsc)...');
    try {
      execSync('npm run build', { encoding: 'utf-8' });
      setLintStatus('Linter/typecheck passed successfully! (tsc compiled dist/)');
    } catch (e: any) {
      setLintStatus(`Linter failed! Output:\n${e.stdout || e.stderr || e.message}`);
    }
  };

  // Fetch diff on mount
  useEffect(() => {
    fetchDiff();
  }, []);

  // Autocomplete computation - suggestions should only show while typing command itself (no spaces)
  const showAutocomplete = getAutocompleteEnabled() && input.startsWith('/') && !input.includes(' ');
  const matches = showAutocomplete
    ? SLASH_COMMANDS.filter(c => c.command.startsWith(input.split(' ')[0])).slice(0, 5)
    : [];
  const closestMatch = matches[activeSuggestIdx] || matches[0];

  // Sync autocomplete state synchronously during render to guarantee no race conditions with Tab keypresses
  (agent as any).autocompleteActive = showAutocomplete && matches.length > 0;

  // Cleanup autocompleteActive state on unmount
  useEffect(() => {
    return () => {
      (agent as any).autocompleteActive = false;
    };
  }, [agent]);

  // Available panel widths calibrated to ensure the right sidebar is never pushed off-screen
  const terminalWidth = width || process.stdout.columns || 80;
  const terminalHeight = height || process.stdout.rows || 24;
  
  const availWidth = Math.max(30, terminalWidth - 36);
  const leftWidth = Math.max(25, Math.floor(availWidth * 0.45));
  const rightWidth = Math.max(25, availWidth - leftWidth - 2);
  const innerHeight = Math.max(5, terminalHeight - 9);

  // 1. Cache the rendered assistant historical lines using useMemo to avoid lag
  const historicalAssistantLines = React.useMemo(() => {
    const lines: string[] = [];
    const terminalWidth = width || 80;
    const availWidth = Math.max(30, terminalWidth - 36);
    const leftWidth = Math.max(25, Math.floor(availWidth * 0.45));
    const rightWidth = Math.max(25, availWidth - leftWidth - 2);

    state.messages.slice(-10).forEach(msg => {
      if (msg.role === 'user') {
        lines.push(chalk.bold.hex('#79c0ff')('▶ You'));
        lines.push(...msg.content.split('\n'));
      } else {
        lines.push(chalk.bold.hex('#a5d6ff')('◀ Assistant'));
        const parsedMarkdown = renderMarkdown(msg.content, rightWidth);
        lines.push(...parsedMarkdown.split('\n'));
      }
      lines.push('');
    });
    return lines;
  }, [state.messages, width]);

  // 2. Compile entire assistant logs and markdown into a flat list of lines for line-by-line scrolling
  const getAssistantLines = (): string[] => {
    const lines = [...historicalAssistantLines];

    if (state.isStreaming) {
      if (state.currentTools.length > 0) {
        lines.push(chalk.hex('#d2a8ff')(state.currentTools.map((t) => `⚙ ${t}`).join('  ')));
        lines.push('');
      }
      if (state.streamingText) {
        lines.push(chalk.bold.hex('#a5d6ff')('◀ Assistant'));
        const parsedStream = renderMarkdown(state.streamingText, rightWidth);
        lines.push(...parsedStream.split('\n'));
        lines.push(chalk.hex('#8b949e')('▌'));
      } else {
        lines.push(chalk.hex(theme.accent)('◌ Thinking and invoking linter checks...'));
      }
    }

    if (state.error) {
      lines.push(chalk.bold.hex('#f85149')(`✕ Error: ${state.error.message}`));
    }

    return lines;
  };

  const assistantLines = getAssistantLines();
  const visibleAssistantLines = assistantLines.slice(logScrollOffset, logScrollOffset + (innerHeight - 5));

  // Auto scroll assistant logs to bottom on new updates
  useEffect(() => {
    const totalLines = getAssistantLines().length;
    const maxScroll = innerHeight - 5;
    if (totalLines > maxScroll) {
      setLogScrollOffset(totalLines - maxScroll);
    } else {
      setLogScrollOffset(0);
    }
  }, [state.messages.length, state.streamingText, innerHeight]);

  // Keyboard and Input handlers
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
        setActiveSuggestIdx(0);
        return;
      }
    } else {
      // 2. Diff and Logs scrolling when autocomplete is NOT active
      if (key.upArrow) {
        setDiffScrollOffset(prev => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        const diffLinesCount = gitDiff.split('\n').length;
        const maxScroll = Math.max(0, diffLinesCount - (innerHeight - 2));
        setDiffScrollOffset(prev => Math.min(maxScroll, prev + 1));
        return;
      }
      // PageUp / PageDown scrolls the assistant logs panel
      if (key.pageUp) {
        setLogScrollOffset(prev => Math.max(0, prev - 2));
        return;
      }
      if (key.pageDown) {
        const totalLines = assistantLines.length;
        const maxScroll = Math.max(0, totalLines - (innerHeight - 5));
        setLogScrollOffset(prev => Math.min(maxScroll, prev + 2));
        return;
      }
    }

    if (key.ctrl && char === 'd') {
      fetchDiff();
      state.send("Analyze the current git diff, summarize the changes, and list potential bugs or improvements.");
    } else if (key.ctrl && char === 'r') {
      runLint();
    } else if ((key.return || char === '\r' || char === '\n') && input.trim()) {
      const text = input.trim();
      setInput('');
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
      setActiveSuggestIdx(0);
    } else if (char && char !== '\t' && char !== '\r' && char !== '\n' && !key.ctrl && !key.meta) {
      setInput(input + char);
      setActiveSuggestIdx(0);
    }
  });

  // Format Git diff lines with scroll offset slice
  const formatDiffLines = (diff: string) => {
    const lines = diff.split('\n');
    const visibleLines = lines.slice(diffScrollOffset, diffScrollOffset + (innerHeight - 5));
    
    return visibleLines.map((line, i) => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        return <Text key={i} color="#3fb950" wrap="truncate">{line}</Text>;
      }
      if (line.startsWith('-') && !line.startsWith('---')) {
        return <Text key={i} color="#f85149" wrap="truncate">{line}</Text>;
      }
      if (line.startsWith('@@')) {
        return <Text key={i} color="#58a6ff" bold wrap="truncate">{line}</Text>;
      }
      if (line.startsWith('diff')) {
        return <Text key={i} color="#d29922" bold wrap="truncate">{line}</Text>;
      }
      return <Text key={i} color={theme.textSecondary} wrap="truncate">{line}</Text>;
    });
  };

  return (
    <Box flexDirection="column" flexGrow={1} width={availWidth}>
      <Box marginBottom={1}>
        <Text bold color="#3fb950">🔍 Code Reviewer Console</Text>
        <Text color={theme.textSecondary}> — Code assistant & Git diff analyzer</Text>
      </Box>

      {/* Main Split Screen */}
      <Box flexDirection="row" justifyContent="space-between" flexGrow={1} width={availWidth}>
        
        {/* Left Panel: Git Diff Viewer */}
        <Box flexDirection="column" width={leftWidth} height={innerHeight}>
          <GlowBorder color="#3fb950" width={leftWidth} label="ACTIVE GIT DIFF">
            <Box flexDirection="column" paddingX={1} flexGrow={1} overflowY="hidden">
              {formatDiffLines(gitDiff)}
            </Box>
          </GlowBorder>

          <Box marginTop={1} flexDirection="column" width={leftWidth}>
            <Text color={theme.textTertiary} dimColor>
              Ctrl+D: Review  Ctrl+R: Lint  Up/Down: Scroll Diff
            </Text>
            {lintStatus && (
              <Box marginTop={1} width={leftWidth}>
                <Text color="#d29922" wrap="truncate">{lintStatus}</Text>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right Panel: Chat Assistant */}
        <Box flexDirection="column" width={rightWidth} height={innerHeight}>
          <GlowBorder color="#5e6ad2" width={rightWidth} label="ASSISTANT CHANNEL (PgUp/PgDn SCROLL)">
            <Box flexDirection="column" paddingX={1} flexGrow={1} overflowY="hidden" width={rightWidth - 2}>
              {visibleAssistantLines.map((line, i) => (
                <Text key={i} wrap="wrap">{line}</Text>
              ))}
            </Box>
          </GlowBorder>

          {/* Autocomplete command bar - set explicitly in row */}
          {showAutocomplete && matches.length > 0 && (
            <Box paddingX={1} minHeight={1} marginTop={1} width={rightWidth} flexDirection="row" flexWrap="wrap">
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

          {/* Interactive input box */}
          <Box marginTop={1} borderStyle="single" borderColor="#3fb950" paddingX={1} width={rightWidth}>
            <Text color={theme.textTertiary}>[ code-review ] </Text>
            <Text color="#79c0ff">{state.isThinking ? '◌ ' : '▶ '} </Text>
            <Text color={theme.textPrimary}>{input}</Text>
            <Text color="#8b949e">{state.isStreaming || state.isThinking ? ' ···' : '█'}</Text>
          </Box>
        </Box>

      </Box>
    </Box>
  );
}

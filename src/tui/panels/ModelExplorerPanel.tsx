import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useWindowSize } from 'ink';
import { useAgent } from '../hooks/useAgent.js';
import type { Agent } from '../../agent/core.js';
import { fetchModels, type OpenRouterModel } from '../../agent/openrouter-client.js';
import { GlowBorder } from '../components/GlowBorder.js';
import { theme } from '../theme.js';

interface ModelExplorerPanelProps {
  agent: Agent;
}

export function ModelExplorerPanel({ agent }: ModelExplorerPanelProps) {
  const { rows: height, columns: width } = useWindowSize();
  const state = useAgent(agent);

  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Popup confirmation states
  const [confirmingModel, setConfirmingModel] = useState<OpenRouterModel | null>(null);
  const [confirmIndex, setConfirmIndex] = useState(0); // 0 = Cancel, 1 = Confirm

  useEffect(() => {
    fetchModels()
      .then((m) => {
        setModels(m);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = models.filter((m) =>
    m.id.toLowerCase().includes(search.toLowerCase()) ||
    (m.name && m.name.toLowerCase().includes(search.toLowerCase()))
  );

  const terminalWidth = width || 80;
  const terminalHeight = height || 24;
  const leftPanelWidth = Math.max(20, terminalWidth - 36);
  const listHeight = Math.max(5, terminalHeight - (confirmingModel ? 18 : 12)); 

  // Keep index in bounds of filtered models
  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, selectedIndex]);

  // Adjust scroll offset to keep selected index in the viewport
  useEffect(() => {
    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + listHeight) {
      setScrollOffset(selectedIndex - listHeight + 1);
    }
  }, [selectedIndex, scrollOffset, listHeight]);

  const visibleModels = filtered.slice(scrollOffset, scrollOffset + listHeight);

  useInput((char, key) => {
    if (confirmingModel) {
      if (key.leftArrow || key.upArrow) {
        setConfirmIndex(0);
      } else if (key.rightArrow || key.downArrow) {
        setConfirmIndex(1);
      } else if (key.return || char === '\r' || char === '\n') {
        if (confirmIndex === 1) {
          state.switchModel(confirmingModel.id);
          setStatusMessage(`Successfully set model to: ${confirmingModel.id}`);
          setTimeout(() => setStatusMessage(null), 3000);
        } else {
          setStatusMessage(`Cancelled model switch.`);
          setTimeout(() => setStatusMessage(null), 2000);
        }
        setConfirmingModel(null);
      } else if (key.escape) {
        setConfirmingModel(null);
      }
      return;
    }

    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(filtered.length - 1, i + 1));
      setStatusMessage(null);
    } else if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      setStatusMessage(null);
    } else if (key.return || char === '\r' || char === '\n') {
      const selectedModel = filtered[selectedIndex];
      if (selectedModel) {
        setConfirmingModel(selectedModel);
        setConfirmIndex(0); // Default cursor to CANCEL
        setStatusMessage(null);
      }
    } else if (key.backspace || key.delete) {
      setSearch((s) => s.slice(0, -1));
      setSelectedIndex(0);
      setScrollOffset(0);
      setStatusMessage(null);
    } else if (key.escape) {
      setSearch('');
      setSelectedIndex(0);
      setScrollOffset(0);
      setStatusMessage(null);
    } else if (char && char !== '\t' && char !== '\r' && char !== '\n' && !key.ctrl && !key.meta) {
      setSearch((s) => s + char);
      setSelectedIndex(0);
      setScrollOffset(0);
      setStatusMessage(null);
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1} width={leftPanelWidth}>
      <Box marginBottom={1}>
        <Text bold color="#58a6ff">🧠 OpenRouter Model Explorer</Text>
        <Text color={theme.textSecondary}> — Browse & Select Active Model</Text>
      </Box>

      {loading ? (
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text color="#58a6ff" bold>Loading available models from OpenRouter...</Text>
        </Box>
      ) : (
        <Box flexDirection="column" flexGrow={1}>
          <GlowBorder color="#58a6ff" width={leftPanelWidth} label={`Models (${filtered.length}) — Page ${Math.floor(scrollOffset / listHeight) + 1}`}>
            <Box flexDirection="column" paddingX={1} height={listHeight} overflowY="hidden">
              {visibleModels.length === 0 ? (
                <Text color={theme.textTertiary}>No models match your search query.</Text>
              ) : (
                visibleModels.map((m, idx) => {
                  const globalIdx = scrollOffset + idx;
                  const isSelected = globalIdx === selectedIndex;
                  const isActive = m.id === state.model;
                  const promptPrice = (parseFloat(m.pricing.prompt) * 1e6).toFixed(2);
                  const completionPrice = (parseFloat(m.pricing.completion) * 1e6).toFixed(2);
                  
                  const ctxStr = `| ${Math.round(m.context_length / 1000)}k ctx`;
                  const priceStr = `$${promptPrice}/$${completionPrice} M`;
                  
                  // Compute dynamic idWidth to guarantee absolutely zero wrapping
                  // Available width is leftPanelWidth minus margins/borders (approx 6 cols)
                  const idWidth = Math.max(10, leftPanelWidth - ctxStr.length - priceStr.length - 10);
                  const truncatedId = m.id.length > idWidth 
                    ? m.id.slice(0, idWidth - 3) + '...' 
                    : m.id.padEnd(idWidth);

                  return (
                    <Box key={m.id} justifyContent="space-between" paddingX={1}>
                      <Box>
                        <Text color={isSelected ? '#58a6ff' : isActive ? '#3fb950' : theme.textPrimary} bold={isSelected || isActive}>
                          {isSelected ? '▶ ' : isActive ? '● ' : '  '}
                          {truncatedId}
                        </Text>
                        <Text color={theme.textTertiary} dimColor>
                          {" "}{ctxStr}
                        </Text>
                      </Box>
                      <Box>
                        <Text color="#3fb950">{priceStr}</Text>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </GlowBorder>

          {/* Confirmation Overlay dialogue card */}
          {confirmingModel && (
            <Box borderStyle="round" borderColor="#d29922" paddingX={2} paddingY={1} flexDirection="column" marginTop={1} width={leftPanelWidth}>
              <Box justifyContent="center" marginBottom={1}>
                <Text bold color="#d29922">⚠️  MODEL SWITCH CONFIRMATION  ⚠️</Text>
              </Box>
              <Text color={theme.textPrimary}>Are you sure you want to switch the active model to:</Text>
              <Text color="#58a6ff" bold>{confirmingModel.id}</Text>
              
              <Box flexDirection="row" marginTop={1} justifyContent="center">
                <Box borderStyle="single" borderColor={confirmIndex === 0 ? "#f85149" : "#30363d"} paddingX={2} marginRight={2}>
                  <Text bold={confirmIndex === 0} color={confirmIndex === 0 ? "#f85149" : theme.textSecondary}>[ Cancel ]</Text>
                </Box>
                <Box borderStyle="single" borderColor={confirmIndex === 1 ? "#3fb950" : "#30363d"} paddingX={2}>
                  <Text bold={confirmIndex === 1} color={confirmIndex === 1 ? "#3fb950" : theme.textSecondary}>[ Confirm ]</Text>
                </Box>
              </Box>
            </Box>
          )}

          {/* Search box & Status */}
          <Box flexDirection="column" marginTop={1}>
            <Box borderStyle="round" borderColor="#58a6ff" paddingX={1} width={leftPanelWidth}>
              <Text color="#58a6ff" bold>Search Active Model: </Text>
              <Text color={theme.textPrimary}>{search}</Text>
              <Text color="#8b949e">█</Text>
            </Box>

            <Box height={1} marginTop={1} paddingX={1}>
              {statusMessage ? (
                <Text color={statusMessage.includes('Cancelled') ? '#f85149' : '#3fb950'} bold>
                  {statusMessage.includes('Cancelled') ? '✕ ' : '✓ '}
                  {statusMessage}
                </Text>
              ) : (
                <Text color={theme.textTertiary} dimColor>
                  {confirmingModel 
                    ? "Use ←/→ to select Cancel/Confirm, Enter to submit, Escape to go back." 
                    : "Use ↑/↓ to browse, Enter to select active model, Type to search."}
                </Text>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

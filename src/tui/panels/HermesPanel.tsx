// Hermes run cockpit (docs/HERMES_TIMMY_ADDITIONS.md MVP):
// connect → session → prompt → mirrored event timeline → approvals → receipt.
// TIMMY stays usable with no Hermes configured: the panel renders a clear
// disconnected state with the env hint instead of failing. Mirror state lives
// in a process-lifetime singleton, so leaving and re-entering this mode never
// interrupts a live run.

import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, useWindowSize } from 'ink';
import type { Agent } from '../../agent/core.js';
import type { HermesApproval } from '../../hermes/events.js';
import { useHermesEventStream } from '../hooks/useHermesEventStream.js';
import { HermesRunTimeline } from '../components/hermes/HermesRunTimeline.js';
import { HermesApprovalInbox } from '../components/hermes/HermesApprovalInbox.js';
import { HermesModelRouteBadge } from '../components/hermes/HermesModelRouteBadge.js';

interface HermesPanelProps {
  agent: Agent;
  setInspector: (data: any) => void;
  focusArea: 'nav' | 'stage';
  /** True while a global overlay (command palette) owns the keyboard. */
  inputLocked?: boolean;
}

type InputMode = 'none' | 'prompt' | 'respond';
type Section = 'timeline' | 'inbox';

export function HermesPanel({
  agent: _agent,
  setInspector,
  focusArea,
  inputLocked = false,
}: HermesPanelProps) {
  const { columns, rows } = useWindowSize();
  const terminalWidth = columns || 80;
  const terminalHeight = rows || 24;

  const hermes = useHermesEventStream();
  const { snapshot } = hermes;

  const [inputMode, setInputMode] = useState<InputMode>('none');
  const [inputBuffer, setInputBuffer] = useState('');
  const [section, setSection] = useState<Section>('timeline');
  const [selectedApprovalIdx, setSelectedApprovalIdx] = useState(0);
  const [scrollBack, setScrollBack] = useState(0);
  // The request being answered is PINNED when 't' is pressed; the answer is
  // only ever delivered to this request (the mirror re-checks it is still
  // open at send time). Masking follows the pinned request, not selection.
  const [respondTarget, setRespondTarget] = useState<HermesApproval | null>(null);

  const openApprovals = snapshot.openApprovals;
  const selectedApproval =
    openApprovals[Math.min(selectedApprovalIdx, Math.max(0, openApprovals.length - 1))];
  const timelineRows = Math.max(4, terminalHeight - 24);

  // Keep the inbox selection valid as requests open/close underneath it.
  useEffect(() => {
    setSelectedApprovalIdx((prev) => Math.min(prev, Math.max(0, openApprovals.length - 1)));
    if (openApprovals.length === 0 && section === 'inbox') setSection('timeline');
  }, [openApprovals.length, section]);

  useEffect(() => {
    setInspector({
      title: 'HERMES MIRROR',
      subtitle: 'Gateway event mirror',
      type: 'Hermes TUI Gateway',
      status: hermes.status.toUpperCase(),
      risk: openApprovals.length > 0 ? 'MEDIUM' : 'LOW',
      scope: 'hermes.gateway.mirror',
      details: [
        `• Transport: ${hermes.configMode === 'none' ? 'not configured' : hermes.configMode}`,
        `• Session: ${hermes.sessionId ? hermes.sessionId.slice(0, 12) : 'none'}`,
        `• Run: ${snapshot.run ? `${snapshot.run.id.slice(0, 16)} (${snapshot.run.status})` : 'none'}`,
        `• Events: ${snapshot.eventCount} | tools: ${snapshot.toolCallCount} | approvals: ${snapshot.approvalCount}`,
        `• Event log: .timmy/hermes-events.jsonl`,
        `• Receipt: ${snapshot.run?.receiptPath ? 'written' : 'press x to export'}`,
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hermes.status,
    hermes.sessionId,
    snapshot.run?.status,
    snapshot.run?.receiptPath,
    snapshot.eventCount,
    openApprovals.length,
  ]);

  useInput((input, key) => {
    if (inputLocked || focusArea !== 'stage') return;

    if (inputMode !== 'none') {
      if (key.return) {
        const text = inputBuffer;
        const mode = inputMode;
        const target = respondTarget;
        setInputBuffer('');
        setInputMode('none');
        setRespondTarget(null);
        if (!text.trim()) return;
        if (mode === 'prompt') {
          void hermes.submitPrompt(text);
        } else if (mode === 'respond' && target) {
          void hermes.answer(target.id, text);
        }
        return;
      }
      if (key.escape) {
        setInputMode('none');
        setInputBuffer('');
        setRespondTarget(null);
        return;
      }
      if (key.backspace || key.delete) {
        setInputBuffer((prev) => prev.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta && !key.tab && !key.upArrow && !key.downArrow) {
        setInputBuffer((prev) => prev + input);
      }
      return;
    }

    if (input === 'c') {
      hermes.connect();
      return;
    }
    if (input === 's') {
      void hermes.startSession();
      return;
    }
    if (input === 'p') {
      setInputMode('prompt');
      setInputBuffer('');
      return;
    }
    if (input === 'x') {
      hermes.exportReceipt();
      return;
    }
    if (key.tab) {
      if (openApprovals.length > 0) {
        setSection((prev) => (prev === 'timeline' ? 'inbox' : 'timeline'));
        setSelectedApprovalIdx(0);
      }
      return;
    }
    if (section === 'inbox' && openApprovals.length > 0) {
      if (key.upArrow) {
        setSelectedApprovalIdx((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedApprovalIdx((prev) => Math.min(openApprovals.length - 1, prev + 1));
        return;
      }
      if (input === 'a' && selectedApproval) {
        void hermes.approve(selectedApproval.id);
        return;
      }
      if (input === 'r' && selectedApproval) {
        void hermes.reject(selectedApproval.id);
        return;
      }
      if (input === 't' && selectedApproval) {
        setRespondTarget(selectedApproval);
        setInputMode('respond');
        setInputBuffer('');
        return;
      }
      return;
    }
    // Timeline section scrolling (clamped so the window never goes blank).
    const maxScrollBack = Math.max(0, snapshot.events.length - timelineRows);
    if (key.upArrow) {
      setScrollBack((prev) => Math.min(maxScrollBack, prev + 1));
      return;
    }
    if (key.downArrow) {
      setScrollBack((prev) => Math.max(0, prev - 1));
      return;
    }
  });

  const contentWidth = Math.max(40, terminalWidth - 60);
  const maskInput =
    inputMode === 'respond' &&
    (respondTarget?.kind === 'secret' || respondTarget?.kind === 'sudo');
  const streamTail = snapshot.streamText.replace(/\s+/g, ' ').slice(-Math.max(20, contentWidth));

  const notConfigured = hermes.configMode === 'none';

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Status header */}
      <Box borderStyle="single" borderColor="#30363d" paddingX={1} justifyContent="space-between">
        <HermesModelRouteBadge
          status={hermes.status}
          model={snapshot.model ?? snapshot.run?.model}
          provider={snapshot.provider ?? snapshot.run?.provider}
          usage={snapshot.usage}
          sessionId={hermes.sessionId}
        />
        {snapshot.run && (
          <Text color="#8b949e">
            run <Text color="#d2a8ff">{snapshot.run.id.slice(0, 18)}</Text>{' '}
            <Text bold color={snapshot.run.status === 'failed' ? '#f85149' : '#3fb950'}>
              [{snapshot.run.status.toUpperCase()}]
            </Text>
          </Text>
        )}
      </Box>

      {notConfigured && (
        <Box borderStyle="round" borderColor="#d29922" paddingX={1} flexDirection="column">
          <Text bold color="#d29922">HERMES NOT CONFIGURED — TIMMY keeps working without it.</Text>
          <Text color="#e6edf3">{hermes.configHint}</Text>
          <Text color="#8b949e" dimColor>
            Example: TIMMY_HERMES_CMD="hermes gateway" or TIMMY_HERMES_URL=ws://127.0.0.1:8080/api/ws
          </Text>
        </Box>
      )}

      <HermesRunTimeline
        events={snapshot.events}
        visibleRows={timelineRows}
        width={terminalWidth - 30}
        scrollBack={scrollBack}
        focused={section === 'timeline' && focusArea === 'stage'}
      />

      <HermesApprovalInbox
        approvals={snapshot.approvals}
        selectedIndex={selectedApprovalIdx}
        focused={section === 'inbox' && focusArea === 'stage'}
        width={terminalWidth - 30}
      />

      {/* Assistant stream tail */}
      {streamTail && (
        <Box paddingX={1}>
          <Text color="#8b949e">assistant: </Text>
          <Text color="#e6edf3" wrap="truncate">{streamTail}</Text>
        </Box>
      )}

      {/* Input line */}
      <Box borderStyle="single" borderColor={inputMode !== 'none' ? '#3fb950' : '#30363d'} paddingX={1}>
        {inputMode === 'none' ? (
          <Text color="#8b949e" wrap="truncate">
            c connect | s session | p prompt | Tab inbox | ↑↓ scroll | x export receipt
          </Text>
        ) : (
          <>
            <Text bold color="#3fb950">
              {inputMode === 'prompt' ? 'PROMPT> ' : `ANSWER (${respondTarget?.kind ?? '?'})> `}
            </Text>
            <Text color="#e6edf3" wrap="truncate">
              {maskInput ? '•'.repeat(inputBuffer.length) : inputBuffer}
            </Text>
            <Text color="#8b949e">▌ </Text>
            <Text color="#8b949e" dimColor>Enter send | Esc cancel + nav</Text>
          </>
        )}
      </Box>

      {/* Status footer */}
      <Box paddingX={1} justifyContent="space-between">
        <Text color={hermes.lastError ? '#f85149' : '#8b949e'} wrap="truncate">
          {hermes.lastError ??
            hermes.infoMessage ??
            snapshot.statusLine ??
            hermes.statusDetail ??
            (hermes.status === 'ready' ? 'gateway ready' : '')}
        </Text>
        {hermes.failedWrites > 0 && (
          <Text bold color="#f85149">⚠ {hermes.failedWrites} log write failures</Text>
        )}
      </Box>
    </Box>
  );
}

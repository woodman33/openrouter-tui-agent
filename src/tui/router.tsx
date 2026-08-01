import React from 'react';
import { ChatPanel } from './panels/ChatPanel.js';
import { WorkspacePanel } from './panels/WorkspacePanel.js';
import { LogsPanel } from './panels/LogsPanel.js';
import { HermesPanel } from './panels/HermesPanel.js';
import type { Agent } from '../agent/core.js';

export type Mode = 'brief' | 'hermes' | 'workspace' | 'logs';

export const MODES: Mode[] = ['brief', 'hermes', 'workspace', 'logs'];

interface ModeRouterProps {
  mode: Mode;
  agent: Agent;
  setInspector: (data: any) => void;
  focusArea: 'nav' | 'stage';
  /** True while a global overlay (command palette) owns the keyboard. */
  inputLocked?: boolean;
}

export function ModeRouter({ mode, agent, setInspector, focusArea, inputLocked }: ModeRouterProps) {
  switch (mode) {
    case 'brief':
      return <ChatPanel agent={agent} setInspector={setInspector} focusArea={focusArea} />;
    case 'hermes':
      return <HermesPanel agent={agent} setInspector={setInspector} focusArea={focusArea} inputLocked={inputLocked} />;
    case 'workspace':
      return <WorkspacePanel agent={agent} setInspector={setInspector} />;
    case 'logs':
      return <LogsPanel agent={agent} setInspector={setInspector} focusArea={focusArea} />;
    default:
      return <ChatPanel agent={agent} setInspector={setInspector} focusArea={focusArea} />;
  }
}

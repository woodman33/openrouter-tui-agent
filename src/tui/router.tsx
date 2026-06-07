import React from 'react';
import { ChatPanel } from './panels/ChatPanel.js';
import { DashboardPanel } from './panels/DashboardPanel.js';
import { WorkspacePanel } from './panels/WorkspacePanel.js';
import { CodeReviewPanel } from './panels/CodeReviewPanel.js';
import { ModelExplorerPanel } from './panels/ModelExplorerPanel.js';
import { PorterPanel } from './panels/PorterPanel.js';
import { OptionsPanel } from './panels/OptionsPanel.js';
import { LogsPanel } from './panels/LogsPanel.js';
import { FilesPanel } from './panels/FilesPanel.js';
import type { Agent } from '../agent/core.js';

export type Mode = 'brief' | 'files' | 'porter' | 'workspace' | 'proof' | 'options' | 'discovery' | 'teams' | 'logs';

export const MODES: Mode[] = ['brief', 'files', 'porter', 'workspace', 'proof', 'options', 'discovery', 'teams', 'logs'];

interface ModeRouterProps {
  mode: Mode;
  agent: Agent;
  setInspector: (data: any) => void;
  focusArea: 'nav' | 'stage';
}

export function ModeRouter({ mode, agent, setInspector, focusArea }: ModeRouterProps) {
  switch (mode) {
    case 'brief':
      return <ChatPanel agent={agent} setInspector={setInspector} focusArea={focusArea} />;
    case 'files':
      return <FilesPanel agent={agent} setInspector={setInspector} focusArea={focusArea} />;
    case 'discovery':
      return <DashboardPanel agent={agent} setInspector={setInspector} />;
    case 'teams':
      return <WorkspacePanel agent={agent} setInspector={setInspector} />;
    case 'workspace':
      return <CodeReviewPanel agent={agent} setInspector={setInspector} focusArea={focusArea} />;
    case 'proof':
      return <ModelExplorerPanel agent={agent} setInspector={setInspector} focusArea={focusArea} />;
    case 'porter':
      return <PorterPanel agent={agent} setInspector={setInspector} focusArea={focusArea} />;
    case 'options':
      return <OptionsPanel agent={agent} setInspector={setInspector} focusArea={focusArea} />;
    case 'logs':
      return <LogsPanel agent={agent} setInspector={setInspector} focusArea={focusArea} />;
    default:
      return <ChatPanel agent={agent} setInspector={setInspector} focusArea={focusArea} />;
  }
}


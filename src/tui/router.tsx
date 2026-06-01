import React from 'react';
import { ChatPanel } from './panels/ChatPanel.js';
import { DashboardPanel } from './panels/DashboardPanel.js';
import { WorkspacePanel } from './panels/WorkspacePanel.js';
import { CodeReviewPanel } from './panels/CodeReviewPanel.js';
import { ModelExplorerPanel } from './panels/ModelExplorerPanel.js';
import { PorterPanel } from './panels/PorterPanel.js';
import { OptionsPanel } from './panels/OptionsPanel.js';
import type { Agent } from '../agent/core.js';

export type Mode = 'brief' | 'discovery' | 'teams' | 'workspace' | 'proof' | 'porter' | 'options';

export const MODES: Mode[] = ['brief', 'discovery', 'teams', 'workspace', 'proof', 'porter', 'options'];

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
    case 'discovery':
      return <DashboardPanel agent={agent} setInspector={setInspector} />;
    case 'teams':
      return <WorkspacePanel agent={agent} setInspector={setInspector} />;
    case 'workspace':
      return <CodeReviewPanel agent={agent} setInspector={setInspector} />;
    case 'proof':
      return <ModelExplorerPanel agent={agent} setInspector={setInspector} />;
    case 'porter':
      return <PorterPanel agent={agent} setInspector={setInspector} />;
    case 'options':
      return <OptionsPanel agent={agent} setInspector={setInspector} />;
    default:
      return <ChatPanel agent={agent} setInspector={setInspector} focusArea={focusArea} />;
  }
}


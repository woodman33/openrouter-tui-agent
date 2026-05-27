import React from 'react';
import { ChatPanel } from './panels/ChatPanel.js';
import { CodeReviewPanel } from './panels/CodeReviewPanel.js';
import { DashboardPanel } from './panels/DashboardPanel.js';
import { ModelExplorerPanel } from './panels/ModelExplorerPanel.js';
import { SetupPanel } from './panels/SetupPanel.js';
import { WorkspacePanel } from './panels/WorkspacePanel.js';
import type { Agent } from '../agent/core.js';

export type Mode = 'chat' | 'code-review' | 'dashboard' | 'model-explorer' | 'setup' | 'workspace';

export const MODES: Mode[] = ['chat', 'code-review', 'dashboard', 'model-explorer', 'workspace'];

interface ModeRouterProps {
  mode: Mode;
  agent: Agent;
}

export function ModeRouter({ mode, agent }: ModeRouterProps) {
  switch (mode) {
    case 'chat':
      return <ChatPanel agent={agent} />;
    case 'code-review':
      return <CodeReviewPanel agent={agent} />;
    case 'dashboard':
      return <DashboardPanel agent={agent} />;
    case 'model-explorer':
      return <ModelExplorerPanel agent={agent} />;
    case 'setup':
      return <SetupPanel agent={agent} />;
    case 'workspace':
      return <WorkspacePanel agent={agent} />;
    default:
      return <ChatPanel agent={agent} />;
  }
}

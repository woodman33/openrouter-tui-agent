import React from 'react';
import { ChatPanel } from './panels/ChatPanel.js';
import { LogsPanel } from './panels/LogsPanel.js';
import { LanesPanel } from './panels/LanesPanel.js';
import { GensPanel } from './panels/GensPanel.js';
import { SlatePanel } from './panels/SlatePanel.js';
import { BrowsePanel } from './panels/BrowsePanel.js';
import { FilesPanel } from './panels/FilesPanel.js';
import type { Agent } from '../agent/core.js';

export type Mode = 'brief' | 'lanes' | 'gens' | 'slate' | 'browse' | 'logs' | 'files';

export const MODES: Mode[] = ['brief', 'lanes', 'gens', 'slate', 'browse', 'logs', 'files'];

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
    case 'lanes':
      return <LanesPanel agent={agent} setInspector={setInspector} focusArea={focusArea} inputLocked={inputLocked} />;
    case 'gens':
      return <GensPanel agent={agent} setInspector={setInspector} focusArea={focusArea} inputLocked={inputLocked} />;
    case 'slate':
      return <SlatePanel agent={agent} setInspector={setInspector} focusArea={focusArea} inputLocked={inputLocked} />;
    case 'browse':
      return <BrowsePanel agent={agent} setInspector={setInspector} focusArea={focusArea} inputLocked={inputLocked} />;
    case 'logs':
      return <LogsPanel agent={agent} setInspector={setInspector} focusArea={focusArea} />;
    case 'files':
      return <FilesPanel agent={agent} setInspector={setInspector} focusArea={focusArea} />;
    default:
      return <ChatPanel agent={agent} setInspector={setInspector} focusArea={focusArea} />;
  }
}

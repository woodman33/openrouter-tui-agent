import React from 'react';
import { ChatPanel } from './ChatPanel.js';
import { LogsPanel } from '../panels/LogsPanel.js';
import { LanesPanel } from '../panels/LanesPanel.js';
import { GensPanel } from '../panels/GensPanel.js';
import { SlatePanel } from '../panels/SlatePanel.js';
import { ClipPanel } from '../panels/ClipPanel.js';
import { BrowsePanel } from '../panels/BrowsePanel.js';
import { ProjectsPanel } from '../panels/ProjectsPanel.js';
import type { Agent } from '../../agent/core.js';

export type Mode = 'brief' | 'lanes' | 'gens' | 'slate' | 'clip' | 'browse' | 'logs' | 'files';

export const MODES: Mode[] = ['brief', 'lanes', 'gens', 'slate', 'clip', 'browse', 'logs', 'files'];

interface ModeRouterProps {
  mode: Mode;
  agent: Agent;
  setInspector: (data: any) => void;
  /** -1 = left nav focused; 0..n = stage pane index (panels own their panes). */
  zone: number;
  setZone: (z: number) => void;
  /** Panels report modal text-entry so global Tab/numbers stand down. */
  setModalInput: (b: boolean) => void;
  /** True while a global overlay (command palette) owns the keyboard. */
  inputLocked?: boolean;
}

export function ModeRouter({ mode, agent, setInspector, zone, setZone, setModalInput, inputLocked }: ModeRouterProps) {
  switch (mode) {
    case 'brief':
      return <ChatPanel agent={agent} setInspector={setInspector} zone={zone} setZone={setZone} />;
    case 'lanes':
      return <LanesPanel agent={agent} setInspector={setInspector} zone={zone} setZone={setZone} setModalInput={setModalInput} inputLocked={inputLocked} />;
    case 'gens':
      return <GensPanel agent={agent} setInspector={setInspector} zone={zone} setZone={setZone} setModalInput={setModalInput} inputLocked={inputLocked} />;
    case 'slate':
      return <SlatePanel agent={agent} setInspector={setInspector} zone={zone} setZone={setZone} setModalInput={setModalInput} inputLocked={inputLocked} />;
    case 'clip':
      return <ClipPanel agent={agent} setInspector={setInspector} zone={zone} setZone={setZone} setModalInput={setModalInput} inputLocked={inputLocked} />;
    case 'browse':
      return <BrowsePanel agent={agent} setInspector={setInspector} zone={zone} setZone={setZone} setModalInput={setModalInput} inputLocked={inputLocked} />;
    case 'logs':
      return <LogsPanel agent={agent} setInspector={setInspector} zone={zone} setZone={setZone} />;
    case 'files':
      return <ProjectsPanel agent={agent} setInspector={setInspector} zone={zone} setZone={setZone} inputLocked={inputLocked} />;
    default:
      return <ChatPanel agent={agent} setInspector={setInspector} zone={zone} setZone={setZone} />;
  }
}

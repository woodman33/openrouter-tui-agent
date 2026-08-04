import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { detectRmux, type RmuxCapabilityStatus } from './rmux.js';

export interface TmuxPaneInfo {
  session: string;
  window: string;
  pane: string;
  active: boolean;
  currentPath: string;
  command: string;
}

export interface TmuxSessionInfo {
  name: string;
  attached: boolean;
  windows: number;
  panes: TmuxPaneInfo[];
}

export interface TmuxPaletteStatus {
  installed: boolean;
  path: string | null;
  timmyPaletteInstalled: boolean;
  bindingHint: string;
}

export interface ZellijStatus {
  installed: boolean;
  cliPath: string | null;
  version: string | null;
  required: false;
  role: string;
}

export interface WorkspaceEvidenceStatus {
  tmux: {
    installed: boolean;
    version: string | null;
    sessions: TmuxSessionInfo[];
  };
  rmux: RmuxCapabilityStatus;
  palette: TmuxPaletteStatus;
  zellij: ZellijStatus;
}

function safeExecFile(command: string, args: string[], timeout = 800): string | null {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout,
    });
  } catch {
    return null;
  }
}

function parseBooleanFlag(value: string): boolean {
  return value === '1' || value.toLowerCase() === 'true';
}

export function listTmuxSessions(): TmuxSessionInfo[] {
  const sessionsOutput = safeExecFile('tmux', ['list-sessions', '-F', '#{session_name}|#{session_attached}|#{session_windows}']);
  if (!sessionsOutput) return [];

  const sessions = sessionsOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, attached, windows] = line.split('|');
      return {
        name,
        attached: parseBooleanFlag(attached || '0'),
        windows: Number(windows || 0),
        panes: [] as TmuxPaneInfo[],
      };
    });

  const panesOutput = safeExecFile('tmux', [
    'list-panes',
    '-a',
    '-F',
    '#{session_name}|#{window_index}|#{pane_index}|#{pane_active}|#{pane_current_path}|#{pane_current_command}',
  ]);

  if (!panesOutput) return sessions;

  const panes = panesOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [session, window, pane, active, currentPath, command] = line.split('|');
      return {
        session,
        window,
        pane,
        active: parseBooleanFlag(active || '0'),
        currentPath: currentPath || '',
        command: command || '',
      };
    });

  const bySession = new Map(sessions.map((session) => [session.name, session]));
  for (const pane of panes) {
    const session = bySession.get(pane.session);
    if (session) session.panes.push(pane);
  }

  return sessions;
}

export function detectTmuxPalette(): TmuxPaletteStatus {
  const palettePath = join(homedir(), 'Sites', 'tmux-palette', 'bin', 'tmux-palette.sh');
  const timmyPalettePath = join(homedir(), '.config', 'tmux-palette', 'palettes', 'timmy.json');
  return {
    installed: existsSync(palettePath),
    path: existsSync(palettePath) ? palettePath : null,
    timmyPaletteInstalled: existsSync(timmyPalettePath),
    bindingHint: 'Ctrl+Space main, Alt+t TIMMY',
  };
}

export function detectZellij(): ZellijStatus {
  const cliPath = safeExecFile('sh', ['-lc', 'command -v zellij'], 500)?.trim() || null;
  const version = cliPath ? safeExecFile('zellij', ['--version'], 800)?.trim() || null : null;

  return {
    installed: !!cliPath,
    cliPath,
    version,
    required: false,
    role: 'optional WASM-plugin multiplexer for KDL-layout agent workspaces',
  };
}

export function getWorkspaceEvidenceStatus(): WorkspaceEvidenceStatus {
  const tmuxVersion = spawnSync('tmux', ['-V'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 800,
  });

  return {
    tmux: {
      installed: tmuxVersion.status === 0,
      version: tmuxVersion.status === 0 ? (tmuxVersion.stdout || tmuxVersion.stderr).trim() : null,
      sessions: listTmuxSessions(),
    },
    rmux: detectRmux(),
    palette: detectTmuxPalette(),
    zellij: detectZellij(),
  };
}

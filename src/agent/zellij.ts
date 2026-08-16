import { execSync, execFileSync } from 'child_process';
import { MultiplexerManager } from './multiplexer.js';
import { classifyCommand } from '../utils/safety.js';
import type { Agent } from './core.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ZellijManager implements MultiplexerManager {
  private agent: Agent;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastOutputs: Map<string, string[]> = new Map();
  private activeCommands: Map<string, {
    rawCommand: string;
    sessionId: string;
    startedAt: string;
  }> = new Map();
  private _resolvedLayoutName: string = 'layout-timmy';
  private _spawnSupported: boolean = true;

  constructor(agent: Agent) {
    this.agent = agent;
  }

  /**
   * hasTty — zellij requires a controlling terminal even for detached spawn.
   * In headless contexts (test sandboxes, CI, some SSH pipes) there is no TTY
   * and zellij panics with "could not enable raw mode: Device not configured".
   */
  static hasTty(): boolean {
    return Boolean(process.stdout.isTTY && process.stdin.isTTY);
  }

  init() {
    this.ensureLayoutAndPlugins();
    this.cleanupOrphaned();
    // Pre-spawn standard sessions/panes
    for (const session of this.agent.tmuxSessions) {
      this.spawnSession(session.id);
    }
    const pollMs = process.env.TIMMY_ZELLIJ_POLL_MS ? parseInt(process.env.TIMMY_ZELLIJ_POLL_MS, 10) : 500;
    this.pollInterval = setInterval(() => this.poll(), pollMs);
  }

  /**
   * Ensure layout-timmy.kdl is registered in ~/.config/zellij/layouts/, where
   * zellij actually looks for named layouts (it cannot load layouts from a repo).
   *
   * If WASM plugins are missing, writes a minimal layout variant without them,
   * so the demo still runs on a fresh zellij install. All calls have timeouts
   * so a slow zellij never blocks the Ink renderer.
   */
  ensureLayoutAndPlugins(): void {
    try {
      const home = os.homedir();
      const zellijLayoutsDir = path.join(home, '.config', 'zellij', 'layouts');
      // Zellij 0.44+ uses Application Support directory for plugins on macOS
      const zellijPluginsDir = path.join(home, 'Library', 'Application Support', 'org.Zellij-Contributors.Zellij', 'plugins');
      const legacyPluginsDir = path.join(home, '.config', 'zellij', 'plugins');

      // Find the KDL source (repo or built package)
      const candidates = [
        path.resolve(process.cwd(), 'src/agent/layouts/layout-timmy.kdl'),
        path.resolve(__dirname, 'layouts/layout-timmy.kdl'),
        path.resolve(__dirname, '../src/agent/layouts/layout-timmy.kdl'),
        path.resolve(__dirname, '../../src/agent/layouts/layout-timmy.kdl'),
      ];
      const sourceKdl = candidates.find(p => fs.existsSync(p));
      if (!sourceKdl) {
        console.warn('[TIMMY] layout-timmy.kdl not found; zellij will use default layout.');
        this._resolvedLayoutName = '';
        return;
      }

      // Check for required WASM plugins
      const requiredPlugins = [
        'zellij-forgot.wasm',
        'zellij-harpoon.wasm',
        'zellij-jdt.wasm',
        'lazy-zellij.wasm',
      ];
      let pluginsMissing = false;
      if (!fs.existsSync(zellijPluginsDir)) {
        // Check legacy location as fallback
        if (!fs.existsSync(legacyPluginsDir)) {
          pluginsMissing = true;
        } else {
          const installed = fs.readdirSync(legacyPluginsDir);
          pluginsMissing = requiredPlugins.some(p => !installed.includes(p));
        }
      } else {
        const installed = fs.readdirSync(zellijPluginsDir);
        pluginsMissing = requiredPlugins.some(p => !installed.includes(p));
      }

      if (!fs.existsSync(zellijLayoutsDir)) {
        fs.mkdirSync(zellijLayoutsDir, { recursive: true });
      }

      let kdlContent = fs.readFileSync(sourceKdl, 'utf8');
      const layoutName = pluginsMissing ? 'layout-timmy-minimal' : 'layout-timmy';
      if (pluginsMissing) {
        // Strip plugin panes so the layout parses without WASM files
        kdlContent = kdlContent.replace(/pane size=\d+ borderless=true \{\s*plugin location="file:[^"]+"\s*\}/gs, '');
        kdlContent = kdlContent.replace(/plugins \{[^}]*\}/gs, '');
        // Fallback comment so users know why the layout is minimal
        console.warn('[TIMMY] zellij WASM plugins not installed; wrote layout-timmy-minimal.kdl without plugin panes.');
        console.warn('[TIMMY] To enable the full layout, install plugins to ~/.config/zellij/plugins/ then re-run TIMMY.');
      }

      const targetPath = path.join(zellijLayoutsDir, `${layoutName}.kdl`);
      fs.writeFileSync(targetPath, kdlContent, 'utf8');
      this._resolvedLayoutName = layoutName;
    } catch (e) {
      console.warn('[TIMMY] zellij layout install failed, falling back to defaults:', e);
      this._resolvedLayoutName = '';
    }
  }

  cleanupOrphaned() {
    try {
      // `zellij kill-all-sessions -y` hangs when no sessions exist in some versions.
      // Probe first with list-sessions; skip kill if empty.
      const out = execSync('zellij list-sessions 2>/dev/null', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 }) || '';
      const active = out.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('No'));
      if (active.length === 0) return;
      execSync('zellij kill-all-sessions -y', { stdio: 'ignore', timeout: 3000 });
    } catch {
      // Ignore if no zellij sessions are running or zellij is missing
    }
  }

  spawnSession(id: string) {
    const sName = `ortui-${id}`;
    const layout = this._resolvedLayoutName;
    // Zellij requires a TTY even when detached; execSync has none. Wrap in
    // `script` (BSD) to allocate a pseudo-tty so the server doesn't panic
    // with "could not enable raw mode: Device not configured".
    const scriptWrap = (cmd: string) => `script -q /dev/null ${cmd}`;
    if (layout) {
      try {
        execSync(scriptWrap(`zellij -s ${sName} options --default-layout ${layout} -d`), { stdio: 'ignore', timeout: 5000 });
        this.lastOutputs.set(id, []);
        return;
      } catch {
        // fall through to plain session below
      }
    }
    try {
      execSync(scriptWrap(`zellij -s ${sName} -d`), { stdio: 'ignore', timeout: 5000 });
      this.lastOutputs.set(id, []);
    } catch {
      // Spawn failed — likely no TTY (headless driver). Surface a clear status.
      this._spawnSupported = false;
      console.warn('[TIMMY] zellij detached spawn failed (no TTY). Run TIMMY from a real terminal to use the zellij backend; falling back to observable-only lane state.');
    }
  }

  killSession(id: string) {
    const sName = `ortui-${id}`;
    try {
      execSync(`zellij kill-session ${sName}`, { stdio: 'ignore', timeout: 3000 });
      this.lastOutputs.delete(id);
    } catch {}
  }

  getCwd(id: string): string {
    return process.cwd();
  }

  capturePane(id: string): string[] {
    const sName = `ortui-${id}`;
    if (!this._spawnSupported) {
      return [
        `[Zellij Lane] "${sName}" (detached spawn unavailable without TTY)`,
        'Run TIMMY from an interactive terminal to activate this backend.',
        'tmux and rmux backends work headlessly.'
      ];
    }
    try {
      const output = execSync(`zellij -s ${sName} action dump-screen`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 });
      return output.split('\n').filter(Boolean);
    } catch {
      return [
        `[Zellij System] Active session "${sName}" telemetry listening...`,
        `[Plugins] harpoon, jdt, lazy-zellij, zellij-forgot active (minimal fallback if not installed).`
      ];
    }
  }

  async sendCommand(id: string, command: string, approved = false) {
    const safety = classifyCommand(command);

    if (safety.approvalRequired && !approved) {
      const runId = this.agent.currentRunId;
      this.agent.lastBlockedCommands.set(id, command);

      this.agent.emit('approval.required', {
        runId,
        sessionId: id,
        sessionName: this.agent.tmuxSessions.find(s => s.id === id)?.name || 'Unknown',
        command,
        riskLevel: safety.riskLevel,
        reason: safety.reason || 'Command requires explicit approval'
      });

      const prev = this.lastOutputs.get(id) || [];
      this.lastOutputs.set(id, [
        ...prev,
        `⚠️ [APPROVAL REQUIRED] ${safety.reason}`,
        `Type "approval.grant" to authorize and execute.`
      ]);
      this.agent.emit('tmux:update');
      return;
    }

    const sName = `ortui-${id}`;
    try {
      const runId = this.agent.currentRunId;
      const session = this.agent.tmuxSessions.find(s => s.id === id);
      const sessionName = session ? session.name : 'Unknown';

      if (approved) {
        this.agent.lastBlockedCommands.delete(id);

        this.agent.emit('approval.granted' as any, {
          runId,
          sessionId: id,
          sessionName,
          command,
          timestamp: new Date().toISOString()
        });
      }

      const commandId = `cmd_${Math.random().toString(36).substring(2, 9)}`;
      const startedAt = new Date().toISOString();
      const wrappedCommand = `( ${command} ); printf "\\nTIMMY_EXIT_CODE:${commandId}:%s\\n" "$?"`;

      this.activeCommands.set(commandId, {
        rawCommand: command,
        sessionId: id,
        startedAt
      });

      this.agent.emit('tmux.command.sent', {
        runId,
        sessionId: id,
        sessionName,
        command,
        cwd: this.getCwd(id),
        timestamp: startedAt
      });

      // Send input keys into Zellij session
      const escaped = wrappedCommand.replace(/"/g, '\\"');
      execSync(`zellij -s ${sName} action write-chars "${escaped}\n"`, { stdio: 'ignore', timeout: 3000 });
    } catch {}
  }

  pollSession(id: string) {
    const currentLines = this.capturePane(id);
    const prevLines = this.lastOutputs.get(id) || [];

    let newLines: string[] = [];
    if (currentLines.length > prevLines.length) {
      newLines = currentLines.slice(prevLines.length);
    } else {
      newLines = currentLines;
    }

    const session = this.agent.tmuxSessions.find(s => s.id === id);
    const sessionName = session ? session.name : 'Unknown';
    const runId = this.agent.currentRunId;

    for (const line of newLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const exitCodeMatch = trimmed.match(/TIMMY_EXIT_CODE:([^:]+):(\d+)/);
      if (exitCodeMatch) {
        const cmdId = exitCodeMatch[1];
        const exitCode = parseInt(exitCodeMatch[2], 10);
        const success = exitCode === 0;

        const cmdData = this.activeCommands.get(cmdId);
        if (cmdData) {
          this.activeCommands.delete(cmdId);
          this.agent.emit('command.finished' as any, {
            runId,
            sessionId: id,
            sessionName,
            commandId: cmdId,
            command: cmdData.rawCommand,
            cwd: this.getCwd(id),
            exitCode,
            success,
            timestamp: new Date().toISOString()
          });
        }
        continue;
      }

      this.agent.emit('tmux.output.line', {
        runId,
        sessionId: id,
        sessionName,
        line: trimmed,
        timestamp: new Date().toISOString()
      });
    }

    this.lastOutputs.set(id, currentLines);
    const cleanLines = currentLines.filter(line => !line.includes('TIMMY_EXIT_CODE:'));
    this.agent.emit('tmux:log', {
      sessionId: id,
      logs: cleanLines
    });
  }

  poll() {
    for (const session of this.agent.tmuxSessions) {
      this.pollSession(session.id);
    }
  }

  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.cleanupOrphaned();
  }
}

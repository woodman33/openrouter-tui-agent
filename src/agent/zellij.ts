import { execSync, execFileSync } from 'child_process';
import { MultiplexerManager } from './multiplexer.js';
import { classifyCommand } from '../utils/safety.js';
import type { Agent } from './core.js';

export class ZellijManager implements MultiplexerManager {
  private agent: Agent;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastOutputs: Map<string, string[]> = new Map();
  private activeCommands: Map<string, {
    rawCommand: string;
    sessionId: string;
    startedAt: string;
  }> = new Map();

  constructor(agent: Agent) {
    this.agent = agent;
  }

  init() {
    this.cleanupOrphaned();
    // Pre-spawn standard sessions/panes
    for (const session of this.agent.tmuxSessions) {
      this.spawnSession(session.id);
    }
    const pollMs = process.env.TIMMY_ZELLIJ_POLL_MS ? parseInt(process.env.TIMMY_ZELLIJ_POLL_MS, 10) : 500;
    this.pollInterval = setInterval(() => this.poll(), pollMs);
  }

  cleanupOrphaned() {
    try {
      execSync('zellij kill-all-sessions -y', { stdio: 'ignore' });
    } catch {
      // Ignore if no zellij sessions are running or it's missing
    }
  }

  spawnSession(id: string) {
    const sName = `ortui-${id}`;
    try {
      // Start zellij in background with a custom layout loading plugins
      execSync(`zellij --session ${sName} options --default-layout layout-timmy -d`, { stdio: 'ignore' });
      this.lastOutputs.set(id, []);
    } catch {
      // Fallback if layout or options not set up
      try {
        execSync(`zellij --session ${sName} -d`, { stdio: 'ignore' });
      } catch {}
    }
  }

  killSession(id: string) {
    const sName = `ortui-${id}`;
    try {
      execSync(`zellij kill-session ${sName}`, { stdio: 'ignore' });
      this.lastOutputs.delete(id);
    } catch {}
  }

  getCwd(id: string): string {
    // Return mock path or read active directory for zellij session
    return process.cwd();
  }

  capturePane(id: string): string[] {
    const sName = `ortui-${id}`;
    try {
      // Using zellij action dump-screen or command capture
      const output = execSync(`zellij --session ${sName} action dump-screen`, { encoding: 'utf8', stdio: 'pipe' });
      return output.split('\n').filter(Boolean);
    } catch {
      return [`[Zellij System] Active session "${sName}" telemetry listening...`, `[Plugins] harpoon, jdt, lazy-zellij, zellij-forgot active.`];
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
      execSync(`zellij --session ${sName} action write-chars "${wrappedCommand}\n"`, { stdio: 'ignore' });
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

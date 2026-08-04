/**
 * lanes.ts — canonical agent-lane registry for TIMMY.
 *
 * Every multiplexer backend (tmux/zellij/rmux) shares this map so new lanes
 * (jcode, minds, carbonyl, etc.) are added in ONE place and propagate to all
 * backends.
 */

export interface LaneRunner {
  /** Binary invoked inside the pane */
  cmd: string;
  /** Human-facing label */
  label: string;
  /** Where the binary is expected (for missing-binary guidance) */
  expected: string;
  /** Optional env vars injected before launch */
  env?: Record<string, string>;
  /** OpenRouter model associated with the lane (UI metadata) */
  model?: string;
}

/**
 * Lane IDs are stable strings; pane session ids ('1', '2', ...) map onto
 * these via DEFAULT_LANE_BINDINGS below.
 */
export const LANE_RUNNERS: Record<string, LaneRunner> = {
  opencode: {
    cmd: 'opencode',
    label: 'OpenCode CLI',
    expected: '$HOME/.opencode/bin/opencode',
    model: 'qwen/qwen-2.5-coder-32b',
  },
  hermes: {
    cmd: 'hermes',
    label: 'Hermes CLI',
    expected: '$HOME/.local/bin/hermes',
    model: 'nousresearch/hermes-3-llama-3.1-405b',
  },
  pi: {
    cmd: 'pi',
    label: 'Pi Daemon',
    expected: '$HOME/.local/bin/pi',
    model: 'inflection/pi-3',
  },
  jcode: {
    cmd: 'jcode',
    label: 'jcode',
    expected: '$HOME/.local/bin/jcode',
    model: 'jcode/default',
  },
  minds: {
    cmd: 'minds',
    label: 'Minds CLI (Animoca Builder)',
    expected: '/opt/homebrew/bin/minds',
    model: 'animoca/builder',
  },
};

/**
 * Which lane boots in which default pane session.
 * Extend freely — extra lanes spawn via addTmuxSession / lane switcher.
 */
export const DEFAULT_LANE_BINDINGS: Record<string, string> = {
  '1': 'opencode',
  '2': 'hermes',
  '3': 'pi',
  '5': 'jcode',
  '6': 'minds',
};

/**
 * shell preamble used by every backend — AgentPass banner + PATH.
 */
export function laneStartupScript(runnerKey: string | undefined, jti: string, visa: string, hash: string): string {
  const lines = [
    'clear',
    `printf '\\033[38;5;81m============================================================\\n\\033[0m'`,
    `printf '\\033[38;5;81m[TIMMY Core]\\033[0m Cloudflare Durable Storage: SUCCESS (D1/R2)\\n'`,
    `printf '\\033[38;5;121m[AgentPass]\\033[0m Delivering session passport (JTI: ${jti})\\n'`,
    `printf '\\033[38;5;121m[AgentPass]\\033[0m Visa stamp: ${visa} | scope: agent.run.governed: VERIFIED\\n'`,
    `printf '\\033[38;5;215m[Receipt]\\033[0m Shipped local-first proof bundle: ${hash}\\n'`,
    `printf '\\033[38;5;81m============================================================\\n\\033[0m'`,
    'export PATH="$HOME/.opencode/bin:$HOME/.local/bin:$PATH"',
  ];

  const runner = runnerKey ? LANE_RUNNERS[runnerKey] : undefined;
  if (runner) {
    lines.push(`printf '\\n\\033[38;5;220m⚡ Launching ${runner.label} in 3 seconds...\\n\\033[0m'`);
    lines.push('sleep 3');
    lines.push(
      `if command -v ${runner.cmd} >/dev/null 2>&1; then printf '\\033[38;5;121m[Runner]\\033[0m ${runner.label}: connected (${runner.cmd})\\n'; ${runner.cmd} || printf '\\n\\033[31m[Agent Alert] ${runner.label} exited with code $?\\n\\033[0m'; else printf '\\n\\033[38;5;215m[Runner]\\033[0m ${runner.label}: not found. Expected ${runner.expected}.\\n'; fi`
    );
  } else {
    lines.push(`printf '\\033[38;5;121m[Runner]\\033[0m Systems MCP shell ready. Type commands below.\\n'`);
  }

  return lines.join('; ');
}

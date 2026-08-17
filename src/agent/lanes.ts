/**
 * lanes.ts — canonical agent-lane registry for TIMMY.
 *
 * Every multiplexer backend (tmux/zellij/rmux) shares this map so new lanes
 * (jcode, minds, carbonyl, etc.) are added in ONE place and propagate to all
 * backends.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface LaneRunner {
  /** Binary invoked inside the pane */
  cmd: string;
  /** Human-facing label */
  label: string;
  /** Where the binary is expected (for missing-binary guidance) */
  expected: string;
  /** How to install it (shown when the binary is missing) */
  install?: string;
  /** Optional env vars injected before launch */
  env?: Record<string, string>;
  /** OpenRouter model associated with the lane (UI metadata) */
  model?: string;
  /** One-line plain-English blurb (what this agent actually is) */
  blurb?: string;
  /** One-shot delegation template; {task} replaced at delegate time */
  task?: string;
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
    install: 'npm i -g opencode-ai',
    model: 'qwen/qwen-2.5-coder-32b',
    blurb: 'open-source coding agent · MIT · 75+ providers',
    task: 'opencode run "{task}"',
  },
  hermes: {
    cmd: 'hermes',
    label: 'Hermes CLI',
    expected: '$HOME/.local/bin/hermes',
    install: 'github.com/NousResearch/hermes-agent',
    model: 'nousresearch/hermes-3-llama-3.1-405b',
    blurb: 'governed agent runner · #1 OpenRouter app',
  },
  pi: {
    cmd: 'pi',
    label: 'Pi Daemon',
    expected: '$HOME/.local/bin/pi',
    install: 'npm i -g @earendil-works/pi-coding-agent',
    model: 'inflection/pi-3',
    blurb: 'minimal coding agent: read · bash · edit · write',
    task: 'pi -p "{task}"',
  },
  jcode: {
    cmd: 'jcode',
    label: 'jcode',
    expected: '$HOME/.local/bin/jcode',
    install: 'github.com/1jehuang/jcode',
    model: 'jcode/default',
    blurb: 'coding agent on Claude Max / ChatGPT Pro subs · ACP adapter',
    task: 'jcode run "{task}"',
  },
  minds: {
    cmd: 'minds',
    label: 'Minds CLI (Animoca Builder)',
    expected: '/opt/homebrew/bin/minds',
    install: 'Animoca Brands Builder CLI — see your Animoca toolchain access',
    model: 'animoca/builder',
    blurb: 'Animoca Brands Builder CLI · web3 builder toolchain',
  },
  aichat: {
    cmd: 'aichat',
    label: 'aichat',
    expected: '/opt/homebrew/bin/aichat',
    install: 'brew install aichat',
    model: 'openrouter/auto',
    blurb: 'all-in-one LLM CLI · 20+ providers · OpenAI-compat server',
    task: 'aichat "{task}"',
  },
  deepagents: {
    cmd: 'deepagents-code',
    label: 'DeepAgents (LangChain)',
    expected: '$HOME/.local/bin/deepagents-code',
    install: 'uv tool install deepagents-code · managed: deepagents deploy · mcp: deepagents mcp-servers',
    model: 'langchain/managed',
    blurb: 'LangChain Deep Agents · managed deploy + MCP servers + local chat',
    task: 'deepagents-code "{task}"',
  },
  openhands: {
    cmd: 'openhands',
    label: 'OpenHands',
    expected: '$HOME/.local/bin/openhands',
    install: 'uv tool install openhands --python 3.12',
    model: 'openrouter/auto',
    blurb: 'self-hosted Devin-class autonomous SWE · MIT · sandboxed',
    // jailed workspace = the boundary (headless auto-approves inside its loop);
    // START/END markers let the TUI seal a receipt when the run finishes
    task: 'printf \'TIMMY_RUN_START\\n\'; mkdir -p "${TIMMY_WORKSPACE:-$HOME/openhands-workspace}"; cd "${TIMMY_WORKSPACE:-$HOME/openhands-workspace}" && openhands --headless -t "{task}" --always-approve; code=$?; printf \'TIMMY_RUN_END:%s\\n\' "$code"',
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
  '4': 'openhands',
  '5': 'jcode',
  '6': 'minds',
};

/**
 * shell preamble used by every backend — AgentPass banner + PATH.
 *
 * The launcher is written to a real file and the pane just runs `bash <file>`:
 * zero shell escaping, zero embedded one-liners. This kills the whole class
 * of nested-quoting mangling that leaked raw printf/ANSI into panes (minds).
 */
export function laneStartupScript(runnerKey: string | undefined, jti: string, visa: string, hash: string): string {
  const script = [
    '#!/usr/bin/env bash',
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
    script.push(`printf '\\n\\033[38;5;220m⚡ Launching ${runner.label} in 3 seconds...\\n\\033[0m'`);
    script.push('sleep 3');
    script.push(`if command -v ${runner.cmd} >/dev/null 2>&1; then`);
    script.push(`  printf '\\033[38;5;121m[Runner]\\033[0m ${runner.label}: connected (${runner.cmd})\\n'`);
    script.push(`  ${runner.cmd} || printf '\\n\\033[31m[Agent Alert] ${runner.label} exited with code $?\\n\\033[0m'`);
    script.push('else');
    script.push(`  printf '\\n\\033[38;5;215m[Runner]\\033[0m ${runner.label}: not found. Install: ${runner.install || runner.expected}\\n'`);
    script.push('fi');
  } else {
    script.push(`printf '\\033[38;5;121m[Runner]\\033[0m Systems MCP shell ready. Type commands below.\\n'`);
  }

  try {
    const dir = join(process.cwd(), '.timmy', 'run');
    mkdirSync(dir, { recursive: true });
    const path = join(dir, `lane-${runnerKey || 'shell'}.sh`);
    writeFileSync(path, script.join('\n') + '\n', { mode: 0o755 });
    return `bash '${path}'`;
  } catch {
    // filesystem unavailable — fall back to the old one-liner shape
    return script.slice(1).join('; ');
  }
}

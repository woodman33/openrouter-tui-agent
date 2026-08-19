// Command Post v0.1 — first harness slide: OpenHands, REAL SANDBOX OR NOTHING.
// Every run: disposable workspace (ephemeral repo copy), pinned ref, scoped
// limits, deterministic acceptance tests. OpenHands' own runtime is
// docker-backed; we additionally verify the daemon up front and fail closed.
// PTY/tmux is watch/attach/recovery only — structured spawn here.
import { existsSync, mkdirSync, writeFileSync, readFileSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import crypto from 'crypto';
import { appendReceipt } from './receipts.js';
import { appendEvent } from './eventbus.js';
import { planHashOf, consumeApproval } from './approvals.js';

const sha = (s: string): string => crypto.createHash('sha256').update(s).digest('hex');

export interface OpenHandsOpts {
  task: string;
  acceptance: string[];          // shell commands run in the workspace; all must exit 0
  fixture_repo?: string;         // git url/dir to clone (pinned ref) — else scaffold
  ref?: string;
  wall_ms?: number;
  max_iterations?: number;
  approval?: string;             // operator token bound to this task's plan hash
  dir?: string;
}

export interface OpenHandsResult {
  ok: boolean;
  state?: 'not_configured' | 'blocked';
  note?: string;
  plan_hash?: string;
  workdir?: string;
  patch?: string;
  patch_sha256?: string;
  acceptance?: { cmd: string; code: number }[];
  duration_ms?: number;
  receipt?: string;
}

export const openHandsPlanHash = (o: OpenHandsOpts): string =>
  planHashOf({ tool: 'timmy_openhands_run', task: o.task, acceptance: o.acceptance, ref: o.ref ?? null, wall_ms: o.wall_ms ?? 300000, max_iterations: o.max_iterations ?? 4 });

export function openHandsPreflight(): { ok: boolean; state?: 'not_configured'; note?: string } {
  const d = spawnSync('docker', ['info'], { encoding: 'utf8', timeout: 15000 });
  if (d.status !== 0) return { ok: false, state: 'not_configured', note: 'docker daemon unavailable — OpenHands isolation fails closed' };
  const o = spawnSync('openhands', ['--version'], { encoding: 'utf8', timeout: 15000 });
  if (o.status !== 0) return { ok: false, state: 'not_configured', note: 'openhands binary missing (uv tool install openhands --python 3.12)' };
  return { ok: true };
}

const scaffoldFixture = (work: string) => {
  writeFileSync(join(work, 'package.json'), JSON.stringify({ name: 'timmy-oh-fixture', version: '0.0.1', scripts: { test: 'node test.js' } }, null, 2));
  writeFileSync(join(work, 'add.js'), 'module.exports = { add: (a, b) => a - b }; // deliberate red\n');
  writeFileSync(join(work, 'test.js'), `const { add } = require('./add.js');\nif (add(1, 2) !== 3) { console.error('RED: add(1,2) !== 3'); process.exit(1); }\nconsole.log('GREEN');\n`);
};

export function runOpenHandsTask(o: OpenHandsOpts): OpenHandsResult {
  const dir = o.dir ?? process.cwd();
  const planHash = openHandsPlanHash(o);
  // paid/remote work default-deny: operator token bound to the complete task hash
  const gate = consumeApproval(o.approval ?? '', planHash);
  if (!gate.ok) {
    const rec = appendReceipt('runs', { kind: 'run', subject: 'openhands run DENIED (approval)', policy: 'human-gated', status: 'denied', error_class: 'approval', plan_hash: planHash, spans: [], artifacts: [] }, dir);
    appendEvent('openhands.denied', { plan_hash: planHash, note: gate.note }, dir);
    return { ok: false, state: 'blocked', note: `${gate.note} — mint: timmy approve ${planHash}`, plan_hash: planHash, receipt: rec.hash };
  }
  const pre = openHandsPreflight();
  if (!pre.ok) {
    const rec = appendReceipt('runs', { kind: 'run', subject: 'openhands run not_configured', policy: 'human-gated', status: 'failed', error_class: 'not_configured', plan_hash: planHash, discrepancies: [pre.note!], spans: [], artifacts: [] }, dir);
    appendEvent('openhands.not_configured', { plan_hash: planHash, note: pre.note }, dir);
    return { ok: false, state: pre.state, note: pre.note, plan_hash: planHash, receipt: rec.hash };
  }
  const work = mkdtempSync(join(tmpdir(), 'timmy-oh-'));
  if (o.fixture_repo) {
    const cl = spawnSync('git', ['clone', '--depth', '1', ...(o.ref ? ['--branch', o.ref] : []), o.fixture_repo, work], { encoding: 'utf8', timeout: 120000 });
    if (cl.status !== 0) {
      const rec = appendReceipt('runs', { kind: 'run', subject: 'openhands clone failed', policy: 'human-gated', status: 'failed', error_class: 'missing_source', plan_hash: planHash, spans: [], artifacts: [] }, dir);
      return { ok: false, state: 'blocked', note: 'fixture clone failed', plan_hash: planHash, workdir: work, receipt: rec.hash };
    }
  } else {
    scaffoldFixture(work);
    spawnSync('git', ['init', '-q'], { cwd: work });
    spawnSync('git', ['add', '-A'], { cwd: work });
    spawnSync('git', ['-c', 'user.email=timmy@local', '-c', 'user.name=timmy', 'commit', '-q', '-m', 'red fixture'], { cwd: work });
  }
  const t0 = Date.now();
  // NB: --max-iterations is NOT a top-level flag in this CLI; iterations are
  // bounded by the wall-clock timeout instead.
  const run = spawnSync('openhands', ['--headless', '-t', o.task, '--always-approve', '--json', '--override-with-envs'], {
    cwd: work, encoding: 'utf8', timeout: o.wall_ms ?? 300000,
    env: {
      ...process.env, TIMMY_WORKSPACE: work, OPENHANDS_SUPPRESS_BANNER: '1',
      TERM: 'dumb', NO_COLOR: '1', CI: '1',
      // agent-server boots with NO config.toml by default; feed the LLM via envs
      LLM_MODEL: process.env.LLM_MODEL ?? 'openrouter/auto',
      LLM_API_KEY: process.env.LLM_API_KEY ?? process.env.OPENROUTER_API_KEY ?? '',
      LLM_BASE_URL: process.env.LLM_BASE_URL ?? 'https://openrouter.ai/api/v1'
    }
  });
  const duration_ms = Date.now() - t0;
  const acceptance = (o.acceptance ?? []).map(cmd => ({
    cmd,
    code: spawnSync('bash', ['-c', cmd], { cwd: work, encoding: 'utf8', timeout: 60000 }).status ?? 1
  }));
  const patch = spawnSync('git', ['diff', 'HEAD'], { cwd: work, encoding: 'utf8' }).stdout ?? '';
  const allGreen = acceptance.length > 0 && acceptance.every(a => a.code === 0);
  const child = appendReceipt('runs', {
    kind: 'run', subject: `openhands headless · ${allGreen ? 'green' : 'red'}`, policy: 'human-gated',
    status: run.status === 0 && allGreen ? 'ok' : 'failed',
    ...(run.status !== 0 || !allGreen ? { error_class: (run.status === null ? 'wall_time' : 'acceptance_red') as string } : {}),
    plan_hash: planHash, ms: duration_ms,
    spans: [{ name: 'openhands headless (docker runtime)', kind: 'invoke_agent' }],
    artifacts: []
  }, dir);
  // structured events from --json stdout land on the bus (SDK-grade evidence);
  // usage/cost ride up onto the parent receipt (loop runs BEFORE the parent)
  let evCost = 0;
  let evTokens = 0;
  for (const line of (run.stdout ?? '').split('\n')) {
    const t = line.trim();
    if (!t.startsWith('{')) continue;
    try {
      const e = JSON.parse(t);
      if (e && typeof e === 'object') {
        evCost += Number(e.cost ?? e.usage?.cost ?? 0) || 0;
        evTokens += Number(e.usage?.total_tokens ?? e.tokens ?? 0) || 0;
        appendEvent('openhands.event', { plan_hash: planHash, kind: e.kind ?? e.type ?? 'event', ...e }, dir);
      }
    } catch { /* non-event json line */ }
  }
  appendEvent('openhands.completed', { plan_hash: planHash, green: allGreen, duration_ms }, dir);
  const parent = appendReceipt('runs', {
    kind: 'verify', subject: `openhands acceptance · ${acceptance.filter(a => a.code === 0).length}/${acceptance.length} green`,
    policy: 'human-gated', status: allGreen ? 'ok' : 'failed',
    ...(allGreen ? {} : { error_class: 'acceptance_red' as string }),
    plan_hash: planHash, output_sha256: sha(patch),
    ...(evCost > 0 ? { cost_usd: evCost } : {}),
    ...(evTokens > 0 ? { tokens: evTokens } : {}),
    child_receipts: [child.hash],
    spans: [{ name: 'acceptance tests', kind: 'execute_tool' }],
    artifacts: []
  }, dir);
  // failure evidence rides on the result (work order: never swallow why)
  const output_tail = (run.status === 0 && allGreen) ? undefined : `${(run.stderr ?? '')}${(run.stdout ?? '')}`.slice(-600);
  return { ok: run.status === 0 && allGreen, plan_hash: planHash, workdir: work, patch, patch_sha256: sha(patch), acceptance, duration_ms, receipt: parent.hash, note: output_tail };
}

export { readFileSync as _ohRead, existsSync as _ohExists, mkdirSync as _ohMkdir };

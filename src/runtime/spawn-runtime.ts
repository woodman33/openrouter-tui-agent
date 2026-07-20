import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { assertPlanApproved } from './approval.js';
import { BaseAgentRuntime } from './base.js';
import type { ApprovedRunPlan, RunRequest, RunResult, RuntimeAvailability, RuntimeDescriptor, RuntimeEventSink } from './types.js';

export interface SpawnRuntimeOptions {
  descriptor: RuntimeDescriptor & { command: string };
  buildArgs: (request: RunRequest) => string[];
  versionArgs?: string[];
  env?: NodeJS.ProcessEnv;
}

export class SpawnAgentRuntime extends BaseAgentRuntime {
  readonly descriptor: RuntimeDescriptor & { command: string };
  private readonly buildArgs: SpawnRuntimeOptions['buildArgs'];
  private readonly versionArgs: string[];
  private readonly extraEnv?: NodeJS.ProcessEnv;
  private readonly active = new Map<string, ChildProcessWithoutNullStreams>();

  constructor(options: SpawnRuntimeOptions) {
    super();
    this.descriptor = options.descriptor;
    this.buildArgs = options.buildArgs;
    this.versionArgs = options.versionArgs ?? ['--version'];
    this.extraEnv = options.env;
  }

  override async plan(request: RunRequest) {
    const plan = await super.plan(request);
    return { ...plan, command: this.descriptor.command, args: this.buildArgs(plan.request) };
  }

  async detect(): Promise<RuntimeAvailability> {
    const missingEnv = (this.descriptor.requiredEnv ?? []).filter(name => !process.env[name]);
    if (missingEnv.length) return { available: false, missingEnv, reason: `Missing environment: ${missingEnv.join(', ')}` };

    const executable = await resolveExecutable(this.descriptor.command);
    if (!executable) return { available: false, reason: `${this.descriptor.command} is not installed or not on PATH` };

    const version = await captureVersion(executable, this.versionArgs, this.extraEnv);
    return { available: true, version };
  }

  async execute(plan: ApprovedRunPlan, sink?: RuntimeEventSink): Promise<RunResult> {
    assertPlanApproved(plan);
    if (!plan.command || !plan.args) throw new Error(`Run plan ${plan.runId} has no spawn command`);

    const startedAt = new Date().toISOString();
    await this.emit(sink, this.event(plan, 'process.started', { command: plan.command, args: plan.args, cwd: plan.request.cwd }));

    return new Promise<RunResult>((resolve) => {
      const child = spawn(plan.command!, plan.args!, {
        cwd: plan.request.cwd,
        env: { ...process.env, ...this.extraEnv },
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      this.active.set(plan.runId, child);
      let settled = false;
      let timeout: NodeJS.Timeout | undefined;

      const finish = async (status: RunResult['status'], exitCode: number | null, error?: string) => {
        if (settled) return;
        settled = true;
        if (timeout) clearTimeout(timeout);
        this.active.delete(plan.runId);
        const finishedAt = new Date().toISOString();
        const result: RunResult = { runId: plan.runId, runtimeId: plan.runtimeId, status, startedAt, finishedAt, exitCode, error };
        await this.emit(sink, this.event(plan, status === 'completed' ? 'run.completed' : 'run.failed', { exitCode, error }));
        resolve(result);
      };

      child.stdout.on('data', chunk => void this.emit(sink, this.event(plan, 'output.stdout', { text: chunk.toString() })));
      child.stderr.on('data', chunk => void this.emit(sink, this.event(plan, 'output.stderr', { text: chunk.toString() })));
      child.once('error', error => void finish('failed', null, error.message));
      child.once('close', (code, signal) => void finish(signal ? 'cancelled' : code === 0 ? 'completed' : 'failed', code, signal ? `Terminated by ${signal}` : undefined));

      if (plan.request.timeoutMs && plan.request.timeoutMs > 0) {
        timeout = setTimeout(() => child.kill('SIGTERM'), plan.request.timeoutMs);
      }
    });
  }

  async cancel(runId: string): Promise<boolean> {
    const child = this.active.get(runId);
    return child ? child.kill('SIGTERM') : false;
  }
}

async function resolveExecutable(command: string): Promise<string | undefined> {
  if (command.includes(path.sep)) {
    try { await access(command); return command; } catch { return undefined; }
  }
  const pathEntries = (process.env.PATH ?? '').split(path.delimiter);
  for (const entry of pathEntries) {
    const candidate = path.join(entry, command);
    try { await access(candidate); return candidate; } catch { /* continue */ }
  }
  return undefined;
}

function captureVersion(command: string, args: string[], env?: NodeJS.ProcessEnv): Promise<string | undefined> {
  return new Promise(resolve => {
    const child = spawn(command, args, { env: { ...process.env, ...env }, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk.toString(); });
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    child.once('error', () => resolve(undefined));
    child.once('close', () => resolve((stdout.trim() || stderr.trim()).split(/\r?\n/, 1)[0] || undefined));
  });
}

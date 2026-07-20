import crypto from 'node:crypto';
import path from 'node:path';
import { requiresApproval } from './approval.js';
import type { AgentRuntime, RunPlan, RunRequest, RuntimeDescriptor, RuntimeEvent, RuntimeEventSink } from './types.js';

export abstract class BaseAgentRuntime implements AgentRuntime {
  abstract readonly descriptor: RuntimeDescriptor;
  abstract detect(): ReturnType<AgentRuntime['detect']>;
  abstract execute(...args: Parameters<AgentRuntime['execute']>): ReturnType<AgentRuntime['execute']>;
  abstract cancel(runId: string): Promise<boolean>;

  async plan(request: RunRequest): Promise<RunPlan> {
    const cwd = path.resolve(request.cwd);
    const normalizedRequest = { ...request, cwd, mode: request.mode ?? 'read_only' };
    const entropy = `${this.descriptor.id}\0${cwd}\0${request.task}\0${Date.now()}\0${crypto.randomUUID()}`;
    return {
      runId: `run_${crypto.createHash('sha256').update(entropy).digest('hex').slice(0, 16)}`,
      runtimeId: this.descriptor.id,
      request: normalizedRequest,
      risk: this.descriptor.risk,
      approvalRequired: requiresApproval(this.descriptor, normalizedRequest.mode),
      createdAt: new Date().toISOString(),
    };
  }

  protected event(plan: RunPlan, type: RuntimeEvent['type'], data?: Record<string, unknown>): RuntimeEvent {
    return { runId: plan.runId, runtimeId: plan.runtimeId, type, timestamp: new Date().toISOString(), data };
  }

  protected async emit(sink: RuntimeEventSink | undefined, event: RuntimeEvent): Promise<void> {
    await sink?.(event);
  }
}

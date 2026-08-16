import { assertPlanApproved } from './approval.js';
import { BaseAgentRuntime } from './base.js';
import type { ApprovedRunPlan, RunResult, RuntimeAvailability, RuntimeDescriptor, RuntimeEventSink } from './types.js';

export interface RuntimeExecutionContext {
  plan: ApprovedRunPlan;
  emit: (type: Parameters<BaseAgentRuntime['event']>[1], data?: Record<string, unknown>) => Promise<void>;
}

export interface CallbackRuntimeOptions {
  descriptor: RuntimeDescriptor;
  detect: () => Promise<RuntimeAvailability>;
  execute: (context: RuntimeExecutionContext) => Promise<Omit<RunResult, 'runId' | 'runtimeId' | 'startedAt' | 'finishedAt'>>;
  cancel?: (runId: string) => Promise<boolean>;
}

/** Shared adapter for in-process SDKs and governed remote agent services. */
export class CallbackAgentRuntime extends BaseAgentRuntime {
  readonly descriptor: RuntimeDescriptor;

  constructor(private readonly options: CallbackRuntimeOptions) {
    super();
    this.descriptor = options.descriptor;
  }

  detect() {
    return this.options.detect();
  }

  async execute(plan: ApprovedRunPlan, sink?: RuntimeEventSink): Promise<RunResult> {
    assertPlanApproved(plan);
    const startedAt = new Date().toISOString();
    await this.emit(sink, this.event(plan, 'process.started', { transport: this.descriptor.transport }));
    try {
      const partial = await this.options.execute({
        plan,
        emit: (type, data) => this.emit(sink, this.event(plan, type, data)),
      });
      const result = { ...partial, runId: plan.runId, runtimeId: plan.runtimeId, startedAt, finishedAt: new Date().toISOString() };
      await this.emit(sink, this.event(plan, result.status === 'completed' ? 'run.completed' : 'run.failed', { error: result.error }));
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.emit(sink, this.event(plan, 'run.failed', { error: message }));
      return { runId: plan.runId, runtimeId: plan.runtimeId, status: 'failed', startedAt, finishedAt: new Date().toISOString(), error: message };
    }
  }

  cancel(runId: string): Promise<boolean> {
    return this.options.cancel?.(runId) ?? Promise.resolve(false);
  }
}

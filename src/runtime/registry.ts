import type { AgentRuntime, RuntimeAvailability, RuntimeDescriptor } from './types.js';

export interface RuntimeStatus {
  descriptor: RuntimeDescriptor;
  availability: RuntimeAvailability;
}

export class AgentRuntimeRegistry {
  private readonly runtimes = new Map<string, AgentRuntime>();

  register(runtime: AgentRuntime): this {
    if (this.runtimes.has(runtime.descriptor.id)) throw new Error(`Runtime already registered: ${runtime.descriptor.id}`);
    this.runtimes.set(runtime.descriptor.id, runtime);
    return this;
  }

  get(id: string): AgentRuntime {
    const runtime = this.runtimes.get(id);
    if (!runtime) throw new Error(`Unknown runtime: ${id}`);
    return runtime;
  }

  list(): RuntimeDescriptor[] {
    return [...this.runtimes.values()].map(runtime => runtime.descriptor);
  }

  async detectAll(): Promise<RuntimeStatus[]> {
    return Promise.all([...this.runtimes.values()].map(async runtime => ({
      descriptor: runtime.descriptor,
      availability: await runtime.detect(),
    })));
  }
}

// agentBus.ts
import { Subject } from 'rxjs';
import { filter, bufferTime } from 'rxjs/operators';

interface AgentEvent {
  type: 'spawn' | 'thinking' | 'tool_call' | 'tool_result' | 'error' | 'complete';
  agentId: string;
  timestamp: number;
  payload: Record<string, any>;
}

const eventBus = new Subject<AgentEvent>();

// Reactive monitoring streams
export const activeAgents$ = eventBus.pipe(
  filter(e => e.type === 'spawn' || e.type === 'complete'),
  // Maintain active agent set
);

export const toolCalls$ = eventBus.pipe(
  filter(e => e.type === 'tool_call'),
  bufferTime(1000), // Batch tool calls per second
);

export const costAccumulator$ = eventBus.pipe(
  filter(e => e.type === 'complete'),
  // Accumulate costs
);

export default eventBus;
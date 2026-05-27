import type { CompanionServer } from './server.js';
import type { Agent } from '../agent/core.js';

export class CompanionSync {
  private server: CompanionServer;
  private agent: Agent;
  private handlers: Record<string, () => void> = {};

  constructor(server: CompanionServer, agent: Agent) {
    this.server = server;
    this.agent = agent;
    this.attach();
  }

  private attach(): void {
    this.handlers = {
      'thinking:start': () => this.server.setState('thinking'),
      'stream:start': () => this.server.setState('streaming'),
      'tool:call': () => this.server.setState('tool_call'),
      'stream:end': () => this.server.setState('idle'),
      'error': () => this.server.setState('error'),
      'thinking:end': () => this.server.setState('success')
    };

    for (const [event, handler] of Object.entries(this.handlers)) {
      this.agent.on(event as any, handler);
    }
  }

  detach(): void {
    for (const [event, handler] of Object.entries(this.handlers)) {
      this.agent.off(event as any, handler);
    }
    this.server.shutdown();
  }
}

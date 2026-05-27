import { Agent, createAgent } from './core.js';
import type { AgentConfig } from '../types/index.js';

export interface AgentProfile {
  id: string;
  name: string;
  model: string;
  instructions: string;
  tools?: string[];
}

export const PROFILES: Record<string, AgentProfile> = {
  orchestrator: {
    id: 'orchestrator',
    name: 'Orchestrator',
    model: 'anthropic/claude-opus-4.7',
    instructions: 'You are an orchestrator. Your job is to classify user requests and delegate to specialized sub-agents. Classify each request as: code-review, research, generate, or chat.',
  },
  'code-review': {
    id: 'code-review',
    name: 'Code Reviewer',
    model: 'anthropic/claude-opus-4.7',
    instructions: 'You are a meticulous code reviewer. Focus on bugs, performance, security, and maintainability.',
  },
  research: {
    id: 'research',
    name: 'Researcher',
    model: 'openai/gpt-5-mini',
    instructions: 'You are a research agent. Search, summarize, and synthesize information.',
  },
  generate: {
    id: 'generate',
    name: 'Generator',
    model: 'anthropic/claude-opus-4.7',
    instructions: 'You are a creative generator. Produce code, docs, or creative writing.',
  },
  chat: {
    id: 'chat',
    name: 'Chat',
    model: 'anthropic/claude-opus-4.7',
    instructions: 'You are a helpful conversational assistant.',
  },
};

export class AgentSwarm {
  private agents: Map<string, Agent> = new Map();
  private orchestrator: Agent;
  private totalCost = 0;
  private requestCosts: Map<string, number[]> = new Map();

  constructor(baseConfig: AgentConfig) {
    this.orchestrator = createAgent({
      ...baseConfig,
      model: PROFILES.orchestrator.model,
      instructions: PROFILES.orchestrator.instructions,
    });

    this.orchestrator.on('cost:update', (c) => { this.totalCost += c; });
  }

  private createSpecialized(profile: AgentProfile, baseConfig: AgentConfig): Agent {
    const agent = createAgent({
      ...baseConfig,
      model: profile.model,
      instructions: profile.instructions,
    });
    agent.on('cost:update', (c, _t) => {
      this.requestCosts.set(profile.id, [...(this.requestCosts.get(profile.id) || []), c]);
      this.totalCost += c;
      this.orchestrator.emit('cost:update', c, this.totalCost);
    });
    return agent;
  }

  async route(userMessage: string, baseConfig: AgentConfig): Promise<Agent> {
    let intent = 'chat';
    try {
      const response = await this.orchestrator.send(
        `Classify this user request into exactly one of: code-review, research, generate, chat. Reply with just the category name.\n\nRequest: ${userMessage}`
      );
      const category = response.trim().toLowerCase();
      if (PROFILES[category]) intent = category;
    } catch {
      intent = 'chat';
    }

    if (!this.agents.has(intent)) {
      this.agents.set(intent, this.createSpecialized(PROFILES[intent], baseConfig));
    }
    return this.agents.get(intent)!;
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getTotalCost(): number {
    return this.totalCost;
  }
}

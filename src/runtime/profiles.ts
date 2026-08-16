import { CallbackAgentRuntime } from './callback-runtime.js';
import { AgentRuntimeRegistry } from './registry.js';
import { SpawnAgentRuntime } from './spawn-runtime.js';
import type { RunRequest, RuntimeDescriptor } from './types.js';

const spawned = (
  descriptor: Omit<RuntimeDescriptor, 'transport'> & { command: string },
  buildArgs: (request: RunRequest) => string[],
) => new SpawnAgentRuntime({ descriptor: { ...descriptor, transport: 'spawn' }, buildArgs });

const taskFlag = (flag: string, extras: string[] = []) => (request: RunRequest) => [...extras, flag, request.task];

export function createDefaultRuntimeRegistry(): AgentRuntimeRegistry {
  const registry = new AgentRuntimeRegistry();

  registry.register(spawned({
    id: 'pi', displayName: 'Pi Coding Agent', command: 'pi', maturity: 'mvp', risk: 'workspace_mutation',
    capabilities: ['analyze', 'edit', 'shell', 'streaming'],
  }, taskFlag('-p')));

  registry.register(spawned({
    id: 'openhands', displayName: 'OpenHands', command: 'openhands', maturity: 'mvp', risk: 'workspace_mutation',
    capabilities: ['analyze', 'edit', 'shell', 'browser', 'sandbox', 'streaming'],
  }, taskFlag('--task', ['--mode', 'headless'])));

  registry.register(spawned({
    id: 'kimi-code', displayName: 'Kimi Code', command: 'kimi', maturity: 'profile', risk: 'workspace_mutation',
    capabilities: ['analyze', 'edit', 'shell', 'streaming'],
  }, taskFlag('-p')));

  registry.register(spawned({
    id: 'opencode', displayName: 'OpenCode', command: 'opencode', maturity: 'profile', risk: 'workspace_mutation',
    capabilities: ['analyze', 'edit', 'shell', 'mcp', 'streaming'],
  }, request => ['run', request.task]));

  registry.register(new CallbackAgentRuntime({
    descriptor: {
      id: 'openrouter-agents', displayName: 'OpenRouter Agents SDK', transport: 'sdk', maturity: 'mvp', risk: 'workspace_mutation',
      capabilities: ['analyze', 'edit', 'mcp', 'streaming', 'usage'], requiredEnv: ['OPENROUTER_API_KEY'],
    },
    detect: async () => process.env.OPENROUTER_API_KEY
      ? { available: true, reason: 'SDK available through the TIMMY OpenRouter client' }
      : { available: false, missingEnv: ['OPENROUTER_API_KEY'], reason: 'Missing OPENROUTER_API_KEY' },
    execute: async () => ({ status: 'failed', error: 'Bind this adapter to the existing Agent client before execution' }),
  }));

  const planned: Array<[string, string, string, RuntimeDescriptor['transport']]> = [
    ['hermes-agent', 'Hermes Agent', 'hermes', 'remote'],
    ['qwen-code', 'Qwen Code', 'qwen', 'spawn'],
    ['kilo-code', 'Kilo Code', 'kilo', 'spawn'],
    ['cline', 'Cline', 'cline', 'sdk'],
    ['cursor-local', 'Cursor Local', 'cursor-agent', 'spawn'],
    ['cursor-cloud', 'Cursor Cloud', 'cursor-cloud', 'remote'],
    ['kimiclaw', 'KimiClaw', 'kimiclaw', 'remote'],
    ['genspark-claw', 'Genspark Claw', 'genspark-claw', 'remote'],
    ['crush', 'Crush CLI', 'crush', 'spawn'],
    ['devin', 'Devin Agents', 'devin', 'remote'],
  ];

  for (const [id, displayName, command, transport] of planned) {
    if (transport === 'spawn') {
      registry.register(spawned({ id, displayName, command, maturity: 'planned', risk: 'workspace_mutation', capabilities: ['analyze', 'edit', 'shell'] }, taskFlag('-p')));
    } else {
      registry.register(new CallbackAgentRuntime({
        descriptor: { id, displayName, transport, maturity: 'planned', risk: 'workspace_mutation', capabilities: ['analyze', 'edit', 'streaming'] },
        detect: async () => ({ available: false, reason: 'Adapter profile exists; transport binding is not configured' }),
        execute: async () => ({ status: 'failed', error: 'Runtime transport is not configured' }),
      }));
    }
  }

  return registry;
}

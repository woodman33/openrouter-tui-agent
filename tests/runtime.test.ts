import { describe, expect, it } from 'vitest';
import { approveRunPlan, AgentRuntimeRegistry, createDefaultRuntimeRegistry, SpawnAgentRuntime } from '../src/runtime/index.js';

function nodeRuntime() {
  return new SpawnAgentRuntime({
    descriptor: {
      id: 'test-node', displayName: 'Test Node', command: process.execPath, transport: 'spawn', maturity: 'mvp',
      risk: 'read_only', capabilities: ['analyze', 'streaming'],
    },
    buildArgs: request => ['-e', `process.stdout.write(${JSON.stringify('task:')} + ${JSON.stringify(request.task)})`],
    versionArgs: ['--version'],
  });
}

describe('AgentRuntime', () => {
  it('detects an installed executable and plans without executing', async () => {
    const runtime = nodeRuntime();
    const availability = await runtime.detect();
    const plan = await runtime.plan({ task: 'inspect only', cwd: '.' });

    expect(availability.available).toBe(true);
    expect(availability.version).toMatch(/^v\d+/);
    expect(plan.runtimeId).toBe('test-node');
    expect(plan.approvalRequired).toBe(false);
    expect(plan.args?.join(' ')).toContain('inspect only');
  });

  it('streams normalized events and returns a completed result', async () => {
    const runtime = nodeRuntime();
    const plan = approveRunPlan(await runtime.plan({ task: 'hello runtime', cwd: '.' }));
    const events: string[] = [];
    const output: string[] = [];
    const result = await runtime.execute(plan, event => {
      events.push(event.type);
      if (event.type === 'output.stdout') output.push(String(event.data?.text));
    });

    expect(result.status).toBe('completed');
    expect(output.join('')).toBe('task:hello runtime');
    expect(events).toEqual(expect.arrayContaining(['process.started', 'output.stdout', 'run.completed']));
  });

  it('blocks write-capable execution without explicit approval', async () => {
    const runtime = nodeRuntime();
    const plan = await runtime.plan({ task: 'write', cwd: '.', mode: 'write' });
    expect(plan.approvalRequired).toBe(true);
    await expect(runtime.execute(plan)).rejects.toThrow('requires explicit approval');
  });

  it('rejects duplicate registrations', () => {
    const registry = new AgentRuntimeRegistry().register(nodeRuntime());
    expect(() => registry.register(nodeRuntime())).toThrow('already registered');
  });

  it('ships MVP profiles and capability-only planned adapters', async () => {
    const registry = createDefaultRuntimeRegistry();
    expect(registry.get('pi').descriptor.transport).toBe('spawn');
    expect(registry.get('openrouter-agents').descriptor.transport).toBe('sdk');
    expect(registry.get('openhands').descriptor.capabilities).toContain('sandbox');
    expect(registry.get('hermes-agent').descriptor.maturity).toBe('planned');
    expect(registry.list().length).toBeGreaterThanOrEqual(15);
  });
});

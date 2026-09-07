import { describe, expect, it } from 'vitest';
import { extractScript, runCode, validateScript, type Executor } from '../src/code.js';
import { connectorFor, edgeTools, toolTypes, type Env } from '../src/tools.js';
import { verifyEdgeChain } from '../src/chain.js';

// A fake executor that runs the script in-process (tests only; production
// runs it in a Dynamic Worker isolate). It exposes the connectors the same way.
const fakeExecutor: Executor = {
  async execute(code, connectors) {
    const logs: string[] = [];
    const scope: Record<string, unknown> = {};
    for (const c of connectors) scope[c.name] = c.fns;
    const fn = new Function(...Object.keys(scope), 'console', `return (${code})();`) as (...a: unknown[]) => Promise<unknown>;
    try {
      const result = await fn(...Object.values(scope), { log: (...a: unknown[]) => logs.push(a.map(String).join(' ')) });
      return { result, logs };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : String(e), logs };
    }
  }
};

const fakeFetch: typeof fetch = async (input) => {
  const url = String(input);
  if (url.includes('/t?')) return Response.json({ ok: true, serial: 'VC0007', uid: '04de5f1eacc040', counter: 61, receiptHash: 'a'.repeat(64) });
  if (url.includes('/api/chain/')) return Response.json({ ok: true, serial: 'VC0007', taps: [], verify: { ok: true, count: 0 } });
  if (url.includes('openrouter.ai/api/v1/chat/completions')) return Response.json({ choices: [{ message: { content: '```js\nasync () => { const t = await timmy.tools_list({}); return t.length; }\n```' } }] });
  return new Response('nope', { status: 404 });
};

const env: Env = { OPENROUTER_API_KEY: 'k', TIMMY_EDGE_TOKEN: 't', CUSTODY_BASE_URL: 'https://custody.test' };

describe('code mode', () => {
  it('runs an agent-authored script against the tools and seals one receipt with the exact calls', async () => {
    const script = `async () => {
      const tools = await timmy.tools_list({});
      const tap = await timmy.custody_verify_tap({ query: 'e=EF963FF7828658A599F3041510671E88&c=94EED9EE65337086' });
      const chain = await timmy.custody_chain({ serial: tap.body.serial });
      await timmy.receipt_seal({ kind: 'demo.step', data: { serial: tap.body.serial } });
      const v = await timmy.receipt_verify({});
      return { tools: tools.length, serial: tap.body.serial, chainOk: chain.body.ok, v };
    }`;
    const out = await runCode({ script }, env, { executor: fakeExecutor, fetch: fakeFetch });
    expect(out.ok).toBe(true);
    expect(out.result).toMatchObject({ tools: edgeTools().length, serial: 'VC0007', chainOk: true, v: { ok: true, count: 1 } });
    expect(out.tool_calls.map((c) => c.name)).toEqual(['tools_list', 'custody_verify_tap', 'custody_chain', 'receipt_seal', 'receipt_verify']);
    expect(out.tool_calls.every((c) => c.ok)).toBe(true);
    expect(out.receipt.kind).toBe('code.run');
    expect(out.receipt.data).toMatchObject({ generated: false, model: null, error: null, approval_present: false });
    expect(out.receipt.data.script_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(out.receipt.data.output_sha256).toMatch(/^[0-9a-f]{64}$/);
    // the in-run demo.step receipt and the code.run receipt share one chain
    expect(out.chain.map((r) => r.kind)).toEqual(['demo.step', 'code.run']);
    expect((await verifyEdgeChain(out.chain)).ok).toBe(true);
  });

  it('refuses a paid tool inside the script without an approval token, and records the refusal', async () => {
    const script = `async () => { return await timmy.openrouter_chat({ model: 'google/gemini-3.7-flash', messages: [{ role: 'user', content: 'hi' }] }); }`;
    const out = await runCode({ script }, env, { executor: fakeExecutor, fetch: fakeFetch });
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/operator approval token required/);
    expect(out.tool_calls[0]).toMatchObject({ name: 'openrouter_chat', ok: false });
    expect(out.receipt.data.error).toMatch(/approval/);
  });

  it('task mode needs approval, then generates the script through the model and runs it', async () => {
    await expect(runCode({ task: 'count tools' }, env, { executor: fakeExecutor, fetch: fakeFetch })).rejects.toMatchObject({ status: 403 });
    const out = await runCode({ task: 'count tools', approval: 'tok' }, env, { executor: fakeExecutor, fetch: fakeFetch });
    expect(out.ok).toBe(true);
    expect(out.result).toBe(edgeTools().length);
    expect(out.receipt.data).toMatchObject({ generated: true, model: 'google/gemini-3.7-flash', approval_present: true });
  });

  it('rejects scripts that are not async functions or use forbidden constructs', () => {
    expect(() => validateScript('1+1')).toThrow(/async function/);
    expect(() => validateScript('async () => { eval("x") }')).toThrow(/forbidden/);
    expect(() => validateScript('async () => { await import("x") }')).toThrow(/forbidden/);
    expect(() => validateScript('async () => 1')).not.toThrow();
  });

  it('extracts the function from a fenced model reply', () => {
    expect(extractScript('Here you go:\n```javascript\nasync () => 2\n```')).toBe('async () => 2');
    expect(() => extractScript('no code')).toThrow();
  });

  it('validates tool args and records the failure', async () => {
    const calls: never[] = [];
    const ctx = { env, calls: calls as never, chain: [], runId: 'r', fetch: fakeFetch };
    const c = connectorFor(ctx as never);
    await expect(c.fns.custody_chain({ serial: '!!!' })).rejects.toThrow(/invalid args/);
    expect((ctx.calls as unknown as { ok: boolean; error?: string }[])[0]).toMatchObject({ ok: false });
  });

  it('publishes types for every tool', () => {
    const t = toolTypes();
    for (const tool of edgeTools()) expect(t).toContain(`timmy.${tool.name}(`);
    expect(t).toContain('[PAID]');
  });
});

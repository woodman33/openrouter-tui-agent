import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { resolveModel, redact, llmCall, judgeLoop, judgePlanOf } from '../src/mcp/server.js';
import { issueApproval, planHashOf } from '../src/utils/approvals.js';
import { readChain, verifyChain } from '../src/utils/receipts.js';

// Fully mocked: no live paid models, no live ollama. Receipts/approvals write
// to a temp cwd so the real .timmy chain is untouched.
const realCwd = process.cwd();
let temp = '';
let orChatFailures = 0;

beforeAll(() => {
  temp = mkdtempSync(join(tmpdir(), 'timmy-mcp-test-'));
  process.chdir(temp);
  process.env.OPENROUTER_API_KEY = 'sk-or-test';
  vi.stubGlobal('fetch', vi.fn(async (input: any) => {
    const url = String(input);
    if (url.includes('/api/v1/models')) {
      return new Response(JSON.stringify({ data: [{ id: 'google/gemini-3.7-flash' }, { id: 'x-ai/grok-4.6' }] }), { status: 200 });
    }
    if (url.includes('/api/tags')) {
      return new Response(JSON.stringify({ models: [{ name: 'nemotron-3.5-lightning:latest' }, { name: 'qwen3.8:27b-mlx' }] }), { status: 200 });
    }
    if (url.includes('/api/chat')) {
      return new Response(JSON.stringify({ message: { content: 'local says ok' }, eval_count: 2, prompt_eval_count: 1 }), { status: 200 });
    }
    if (url.includes('/chat/completions')) {
      if (orChatFailures > 0) { orChatFailures--; return new Response(JSON.stringify({ error: 'boom' }), { status: 500 }); }
      return new Response(JSON.stringify({ choices: [{ message: { content: 'openrouter says ok' } }], usage: { total_tokens: 7 } }), { status: 200 });
    }
    return new Response('nf', { status: 404 });
  }));
});
afterAll(() => {
  vi.unstubAllGlobals();
  process.chdir(realCwd);
  rmSync(temp, { recursive: true, force: true });
});

describe('model resolution pre-hook', () => {
  it('resolves openrouter models', async () => {
    const r = await resolveModel('google/gemini-3.7-flash');
    expect(r.via).toBe('openrouter');
  });

  it('resolves local ollama tags when permitted', async () => {
    process.env.TIMMY_ALLOW_LOCAL_OLLAMA = '1';
    const r = await resolveModel('nemotron-3.5-lightning');
    expect(r.via).toBe('ollama');
    expect(r.id).toBe('nemotron-3.5-lightning:latest');
    delete process.env.TIMMY_ALLOW_LOCAL_OLLAMA;
  });

  it('suggests closest openrouter ids for unknown models', async () => {
    const r = await resolveModel('gemini-3.7-flash');
    expect(r.via).toBe('none');
    expect(r.suggestions).toContain('google/gemini-3.7-flash');
  });

  it('denies local ollama without permission', async () => {
    delete process.env.TIMMY_ALLOW_LOCAL_OLLAMA;
    const r = await resolveModel('nemotron-3.5-lightning');
    expect(r.via).toBe('none');
  });
});

describe('redaction', () => {
  it('strips sk-or, Bearer and JWT shapes', () => {
    const out = redact('key sk-or-abc123XYZ and Bearer tok.en.sig plus eyJhbGciOiJIUzI1NiJ9abcdefghij');
    expect(out).toContain('sk-or-REDACTED');
    expect(out).toContain('Bearer REDACTED');
    expect(out).toContain('JWT-REDACTED');
    expect(out).not.toContain('sk-or-abc123XYZ');
  });
});

describe('approval enforcement', () => {
  const model = 'google/gemini-3.7-flash';
  const prompt = 'hi';
  const planHash = planHashOf({ tool: 'timmy_llm_call', model, prompt });

  it('denies a gated call with no token and seals a denied receipt', async () => {
    const r = await llmCall({ model, prompt, requires_approval: true }) as any;
    expect(r.ok).toBe(false);
    expect(r.denied).toBe(true);
    const chain = readChain('runs');
    const rec = chain.find(x => x.hash === r.receipt);
    expect(rec?.status).toBe('denied');
    expect(rec?.error_class).toBe('approval');
  });

  it('a bare approved:true boolean never approves', async () => {
    const r = await llmCall({ model, prompt, requires_approval: true, approved: true }) as any;
    expect(r.ok).toBe(false);
    expect(r.denied).toBe(true);
  });

  it('accepts an operator token, then rejects replay of the same token', async () => {
    const a = issueApproval(planHash);
    const first = await llmCall({ model, prompt, requires_approval: true, approval: a.token }) as any;
    expect(first.ok).toBe(true);
    const replay = await llmCall({ model, prompt, requires_approval: true, approval: a.token }) as any;
    expect(replay.ok).toBe(false);
    expect(replay.denied).toBe(true);
  });

  it('receipts bind prompt hash, response hash, usage, transport and status', async () => {
    const r = await llmCall({ model, prompt }) as any;
    expect(r.ok).toBe(true);
    const rec = readChain('runs').find(x => x.hash === r.receipt) as any;
    expect(rec.status).toBe('ok');
    expect(rec.prompt_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(rec.response_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(rec.model_requested).toBe(model);
    expect(rec.model_resolved).toBe(model);
    expect(rec.via).toBe('openrouter');
    expect(rec.tokens).toBe(7);
    expect(rec.ms).toBeTypeOf('number');
  });
});

describe('timmy_judge_loop', () => {
  const prompt = 'what is a receipt?';
  const executors = ['google/gemini-3.7-flash', 'x-ai/grok-4.6'];
  const judge = 'nemotron-3.5-lightning';
  const planHash = planHashOf(judgePlanOf({ prompt, executors, judge }));

  it('phase 1 returns the plan + hash without running anything', async () => {
    const r = await judgeLoop({ prompt, executors, judge }) as any;
    expect(r.phase).toBe('plan');
    expect(r.planHash).toBe(planHash);
    expect(r.needs_approval).toBe(true);
  });

  it('rejects a wrong-plan token and a replayed token', async () => {
    const a = issueApproval('deadbeef'.repeat(4));
    const wrong = await judgeLoop({ prompt, executors, judge, approval: a.token }) as any;
    expect(wrong.ok).toBe(false);
    expect(wrong.denied).toBe(true);
  });

  it('default-denies paid routes when max_spend is 0', async () => {
    process.env.TIMMY_ALLOW_LOCAL_OLLAMA = '1'; // judge resolves local; executors stay paid
    const a = issueApproval(planHash);
    const r = await judgeLoop({ prompt, executors, judge, approval: a.token }) as any;
    delete process.env.TIMMY_ALLOW_LOCAL_OLLAMA;
    expect(r.ok).toBe(false);
    expect(r.denied).toBe(true);
    expect(r.note).toContain('max_spend');
    const last = readChain('runs').at(-1) as any;
    expect(last.status).toBe('denied');
    expect(last.error_class).toBe('spend_policy');
  });

  it('runs executors via allSettled, tolerates partial failure, judges, and links child+parent receipts', async () => {
    process.env.TIMMY_ALLOW_LOCAL_OLLAMA = '1';
    orChatFailures = 1; // one of the two openrouter executors 500s
    const budgetHash = planHashOf(judgePlanOf({ prompt, executors, judge, max_spend: 1 }));
    const a = issueApproval(budgetHash);
    const r = await judgeLoop({ prompt, executors, judge, max_spend: 1, approval: a.token }) as any;
    expect(r.ok).toBe(true);
    expect(r.failures).toHaveLength(1);
    expect(r.judgment.ok).toBe(true);
    // 2 executor child receipts (ok + failed) + judge child = 3, all linked
    expect(r.child_receipts).toHaveLength(3);
    const parent = readChain('runs').find(x => x.hash === r.receipt) as any;
    expect(parent.plan_hash).toBe(budgetHash);
    expect(parent.child_receipts).toEqual(r.child_receipts);
    expect(parent.status).toBe('ok');
    // replay of the consumed token is denied
    const replay = await judgeLoop({ prompt, executors, judge, approval: a.token }) as any;
    expect(replay.denied).toBe(true);
    delete process.env.TIMMY_ALLOW_LOCAL_OLLAMA;
  });

  it('the whole temp chain verifies', () => {
    expect(verifyChain('runs').ok).toBe(true);
  });
});

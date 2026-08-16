import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import worker from '../workers/ai-proxy/src/index.js';

// No live calls: upstream fetch is stubbed for every case.
const env = {
  OPENROUTER_API_KEY: 'sk-or-edgetest',
  TIMMY_EDGE_TOKEN: 'tok-123',
  ALLOWED_MODELS: 'google/gemini-3.7-flash',
  RATE_LIMIT_PER_MIN: '2'
};
const authed = { headers: { Authorization: 'Bearer tok-123' } };

let chatCalls = 0;
let failNextChatWith: number | null = null;

beforeEach(() => {
  chatCalls = 0;
  failNextChatWith = null;
  vi.stubGlobal('fetch', vi.fn(async (input: any) => {
    const url = String(input);
    if (url.includes('/api/v1/models')) {
      return new Response(JSON.stringify({ data: [{ id: 'google/gemini-3.7-flash', context_length: 8192, pricing: { prompt: '1', completion: '2' } }] }), { status: 200 });
    }
    if (url.includes('/chat/completions')) {
      chatCalls++;
      if (failNextChatWith) return new Response(JSON.stringify({ error: { message: 'upstream says no' } }), { status: failNextChatWith });
      return new Response(JSON.stringify({ choices: [{ message: { content: 'pong' } }] }), { status: 200 });
    }
    return new Response('not found', { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

const req = (path: string, init?: RequestInit & { headers?: Record<string, string> }) =>
  new Request(`https://timmy-ai-proxy.test${path}`, init);

describe('timmy-ai-proxy (hardened)', () => {
  it('/health is open and advertises auth + no code mode', async () => {
    const r = await worker.fetch(req('/health'), env);
    expect(r.status).toBe(200);
    const j = await r.json() as any;
    expect(j.auth).toBe(true);
    expect(j.code_mode).toBe(false);
  });

  it('rejects missing caller token with 401', async () => {
    const r = await worker.fetch(req('/models'), env);
    expect(r.status).toBe(401);
  });

  it('rejects wrong caller token with 401', async () => {
    const r = await worker.fetch(req('/models', { headers: { Authorization: 'Bearer nope' } }), env);
    expect(r.status).toBe(401);
  });

  it('serves trimmed /models to authenticated callers', async () => {
    const r = await worker.fetch(req('/models', authed), env);
    expect(r.status).toBe(200);
    const j = (await r.json()) as any[];
    expect(j[0].id).toBe('google/gemini-3.7-flash');
    expect(j[0].ctx).toBe(8192);
  });

  it('403 for models not on the allowlist', async () => {
    const r = await worker.fetch(req('/chat', { method: 'POST', ...authed, body: JSON.stringify({ model: 'x-ai/grok-4.6', messages: [] }) }), env);
    expect(r.status).toBe(403);
  });

  it('passes allowed chat through and preserves upstream 200', async () => {
    const r = await worker.fetch(req('/chat', { method: 'POST', ...authed, body: JSON.stringify({ model: 'google/gemini-3.7-flash', messages: [] }) }), env);
    expect(r.status).toBe(200);
    const j = await r.json() as any;
    expect(j.choices[0].message.content).toBe('pong');
  });

  it('preserves upstream error status verbatim (402)', async () => {
    failNextChatWith = 402;
    const r = await worker.fetch(req('/chat', { method: 'POST', ...authed, body: JSON.stringify({ model: 'google/gemini-3.7-flash', messages: [] }) }), env);
    expect(r.status).toBe(402);
    const j = await r.json() as any;
    expect(j.error.message).toBe('upstream says no');
  });

  it('rate-limits beyond RATE_LIMIT_PER_MIN with 429', async () => {
    // two chat calls already counted in this module window; third trips it
    const r = await worker.fetch(req('/chat', { method: 'POST', ...authed, body: JSON.stringify({ model: 'google/gemini-3.7-flash', messages: [] }) }), env);
    expect(r.status).toBe(429);
  });

  it('has no /code route anymore', async () => {
    const r = await worker.fetch(req('/code', { method: 'POST', ...authed, body: JSON.stringify({ code: 'return 1' }) }), env);
    expect(r.status).toBe(404);
  });
});

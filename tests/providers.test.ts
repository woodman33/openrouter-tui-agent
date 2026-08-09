import { describe, it, expect, vi, afterEach } from 'vitest';
import { pickOllamaModel, probeOllama, ollamaChatCompletion } from '../src/agent/providers.js';

describe('pickOllamaModel', () => {
  const models = ['ornith:latest', 'glm-5.2:cloud', 'kimi-k2.7-code:cloud', 'minimax-m3:cloud'];

  it('prefers prefixes in the given order', () => {
    expect(pickOllamaModel(models, ['kimi-k2.7-code', 'glm-5.2'])).toBe('kimi-k2.7-code:cloud');
    expect(pickOllamaModel(['ornith:latest', 'glm-5.2:cloud'], ['kimi-k2.7-code', 'glm-5.2']))
      .toBe('glm-5.2:cloud');
  });

  it('falls back to the first installed model', () => {
    expect(pickOllamaModel(['ornith:latest'], ['kimi-k2.7-code'])).toBe('ornith:latest');
  });

  it('returns null when nothing is installed', () => {
    expect(pickOllamaModel([], ['x'])).toBeNull();
  });
});

describe('probeOllama', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reports ok with model names on a healthy endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ models: [{ name: 'a' }, { name: 'b' }] })
    })));
    const r = await probeOllama();
    expect(r.ok).toBe(true);
    expect(r.models).toEqual(['a', 'b']);
  });

  it('reports not-ok when the endpoint is down', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }));
    const r = await probeOllama();
    expect(r.ok).toBe(false);
    expect(r.models).toEqual([]);
  });

  it('reports not-ok on HTTP error or empty catalog', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })));
    expect((await probeOllama()).ok).toBe(false);

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ models: [] }) })));
    expect((await probeOllama()).ok).toBe(false);
  });
});

describe('ollamaChatCompletion', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns the message content', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'OK' } }] })
    })));
    const text = await ollamaChatCompletion('ornith:latest', [{ role: 'user', content: 'hi' }]);
    expect(text).toBe('OK');
  });

  it('throws on HTTP failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })));
    await expect(ollamaChatCompletion('m', [])).rejects.toThrow('HTTP 500');
  });
});

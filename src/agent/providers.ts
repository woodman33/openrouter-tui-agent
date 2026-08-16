// Provider fallback layer: OpenRouter is primary; local Ollama is the
// offline / zero-cost last resort. Ollama speaks the OpenAI-compatible
// protocol on :11434, so no SDK is needed here.

export interface OllamaProbeResult {
  ok: boolean;
  models: string[];
  latencyMs?: number;
}

const OLLAMA_BASE = process.env.OLLAMA_HOST || 'http://localhost:11434';

export async function probeOllama(timeoutMs = 1500): Promise<OllamaProbeResult> {
  try {
    const start = Date.now();
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return { ok: false, models: [] };
    const data = (await res.json()) as { models?: { name: string }[] };
    const models = (data.models || []).map(m => m.name);
    return { ok: models.length > 0, models, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, models: [] };
  }
}

export function pickOllamaModel(models: string[], preferredPrefixes: string[]): string | null {
  for (const prefix of preferredPrefixes) {
    const hit = models.find(m => m.startsWith(prefix));
    if (hit) return hit;
  }
  return models[0] || null;
}

export async function ollamaChatCompletion(
  model: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false })
  });
  if (!res.ok) {
    throw new Error(`Ollama chat failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

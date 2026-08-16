// timmy-ai-proxy — hardened Cloudflare edge proxy for TIMMY.
// Secrets live at the edge that uses them (Worker secrets, never on disk):
//   OPENROUTER_API_KEY — upstream key
//   TIMMY_EDGE_TOKEN   — caller auth; every non-health route requires it
// Hardened 2026-08-15 per review: /code (new Function) REMOVED — Workers
// disallow eval-class constructs and it was an unauthenticated exec surface.
// Now: caller auth, model allowlist, spend/rate limits, upstream status and
// error passthrough. Undeployed until worker typecheck + tests are green and
// the owner says deploy.
let windowStart = 0;
let windowCount = 0;

export default {
  async fetch(req: Request, env: any): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/health') {
      return Response.json({ ok: true, worker: 'timmy-ai-proxy', auth: true, code_mode: false });
    }

    // Caller auth on everything else.
    const want = `Bearer ${env.TIMMY_EDGE_TOKEN ?? ''}`;
    if (!env.TIMMY_EDGE_TOKEN || (req.headers.get('Authorization') ?? '') !== want) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const key = env.OPENROUTER_API_KEY;
    if (!key) return Response.json({ ok: false, error: 'OPENROUTER_API_KEY secret not set on worker' }, { status: 500 });
    const auth = { Authorization: `Bearer ${key}`, 'X-Title': 'TIMMY' };

    if (url.pathname === '/models') {
      const r = await fetch('https://openrouter.ai/api/v1/models', { headers: auth });
      if (!r.ok) return new Response(await r.text(), { status: r.status }); // preserve upstream
      const j: any = await r.json();
      const slim = (j.data ?? []).map((m: any) => ({
        id: m.id,
        ctx: m.context_length,
        in: m.pricing?.prompt,
        out: m.pricing?.completion
      }));
      return Response.json(slim);
    }

    if (url.pathname === '/chat') {
      // Spend guard: model allowlist + per-minute rate limit.
      const allow = String(env.ALLOWED_MODELS ?? 'google/gemini-3.7-flash,x-ai/grok-4.6')
        .split(',').map((s: string) => s.trim()).filter(Boolean);
      let body: any;
      try { body = await req.json(); } catch { return Response.json({ ok: false, error: 'bad json' }, { status: 400 }); }
      if (!allow.includes(String(body?.model ?? ''))) {
        return Response.json({ ok: false, error: 'model not on allowlist', allow }, { status: 403 });
      }
      const limit = Number(env.RATE_LIMIT_PER_MIN ?? 20);
      const now = Date.now();
      if (now - windowStart > 60000) { windowStart = now; windowCount = 0; }
      if (++windowCount > limit) {
        return Response.json({ ok: false, error: 'rate limited' }, { status: 429 });
      }
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify(body)
      });
      // Preserve upstream status AND error bodies verbatim.
      return new Response(r.body, { status: r.status, headers: { 'Content-Type': 'application/json' } });
    }

    return Response.json({ ok: false, error: 'not found; routes: /health /models /chat' }, { status: 404 });
  }
};

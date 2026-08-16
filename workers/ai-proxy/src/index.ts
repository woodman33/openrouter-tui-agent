// timmy-ai-proxy — Cloudflare edge proxy + Code Mode for TIMMY.
// Secrets live at the edge that uses them; the laptop never holds the key
// when TIMMY_AI_PROXY is set. Code Mode = the "2 tool calls, not 2000 tools"
// thesis: a model writes code against api.{models,chat} instead of selecting
// from a huge tool catalog (apisnip-trimmed /models surface).
export default {
  async fetch(req: Request, env: any): Promise<Response> {
    const url = new URL(req.url);
    const key = env.OPENROUTER_API_KEY;
    if (!key) return Response.json({ ok: false, note: 'OPENROUTER_API_KEY secret not set on worker' }, { status: 500 });
    const auth = { Authorization: `Bearer ${key}`, 'X-Title': 'TIMMY' };

    if (url.pathname === '/models') {
      const r = await fetch('https://openrouter.ai/api/v1/models', { headers: auth });
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
      const body = await req.json();
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify(body)
      });
      return new Response(r.body, { headers: { 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/code') {
      // Code Mode: model-authored code over a 2-call surface (search + execute).
      const { code } = (await req.json()) as { code: string };
      const api = {
        models: async () => {
          const r = await fetch('https://openrouter.ai/api/v1/models', { headers: auth });
          const j: any = await r.json();
          return (j.data ?? []).map((m: any) => m.id as string);
        },
        chat: async (model: string, prompt: string) => {
          const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...auth },
            body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] })
          });
          const j: any = await r.json();
          return j?.choices?.[0]?.message?.content;
        }
      };
      try {
        const fn = new Function('api', `return (async () => { ${code} })()`);
        return Response.json({ ok: true, result: await fn(api) });
      } catch (e) {
        return Response.json({ ok: false, note: String(e) });
      }
    }

    return new Response('timmy-ai-proxy · /models (trimmed) · /chat · /code (code mode)', { status: 404 });
  }
};

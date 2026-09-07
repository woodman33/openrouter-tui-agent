// timmy-ai-proxy — hardened Cloudflare edge proxy for TIMMY, now with Code Mode.
// Secrets live at the edge that uses them (Worker secrets, never on disk):
//   OPENROUTER_API_KEY — upstream key
//   TIMMY_EDGE_TOKEN   — caller auth; every non-health route requires it
// Hardened 2026-08-15 per review: the old /code (new Function) was REMOVED —
// Workers disallow eval-class constructs and it was an unauthenticated exec
// surface. 2026-09-05: /code returns as CODE MODE — the script runs in a
// separate Dynamic Worker isolate (Worker Loader binding), never in this
// isolate; caller auth applies; every run seals one receipt (script hash,
// output hash, tool calls); paid tools inside the script still need the
// operator approval token. Undeployed until the owner says deploy.
import { DynamicWorkerExecutor } from '@cloudflare/codemode';
import { z } from 'zod';
import { HttpError, runCode, type CodeRequest, type Executor } from './code.js';
import { computeDailyHead, readLatestHead, writeDailyHead } from './head.js';
import { type Env, edgeTools, toolTypes } from './tools.js';
import { corsHeaders, parseRunsPath, validRoom } from './room-core.js';
export { SlateRoom } from './room.js';

let windowStart = 0;
let windowCount = 0;

const json = (body: unknown, status = 200): Response => Response.json(body, { status });

type RoomEnv = Env & { LOADER?: unknown; SLATE_ROOM?: DurableObjectNamespace };

export default {
  async fetch(req: Request, env: RoomEnv): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/health') {
      return json({ ok: true, worker: 'timmy-ai-proxy', auth: true, code_mode: !!env.LOADER, daily_head: !!env.CUSTODY_KV, slate_room: !!env.SLATE_ROOM, tools: edgeTools().map((t) => t.name) });
    }

    // Slate rooms (Durable Object). Reads and the WebSocket are public like
    // /head; writes need the caller token. The room only stores and relays.
    const runs = parseRunsPath(url.pathname);
    if (runs) {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
      if (!env.SLATE_ROOM) return json({ ok: false, error: 'no SLATE_ROOM binding on this deployment' }, 503);
      if (runs.action !== 'create' && !validRoom(runs.room)) return json({ ok: false, error: 'bad room name' }, 400);
      if (req.method === 'POST') {
        const want = `Bearer ${env.TIMMY_EDGE_TOKEN ?? ''}`;
        if (!env.TIMMY_EDGE_TOKEN || (req.headers.get('Authorization') ?? '') !== want) return json({ ok: false, error: 'unauthorized' }, 401);
      }
      if (runs.action === 'create') return json({ ok: true, note: 'rooms exist on first write' });
      const stub = env.SLATE_ROOM.get(env.SLATE_ROOM.idFromName(runs.room));
      return stub.fetch(req);
    }

    // Public: the daily edge chain head (anyone can recompute the chains from the public log).
    if (url.pathname === '/head' && req.method === 'GET') {
      if (!env.CUSTODY_KV) return json({ ok: false, error: 'no CUSTODY_KV on this deployment' }, 503);
      const head = await readLatestHead(env.CUSTODY_KV);
      if (!head) return json({ ok: false, error: 'no head yet; the daily cron has not run' }, 404);
      // public data; browsers (Slate 3D capsule evidence) read it cross-origin
      return Response.json(head, { headers: corsHeaders() });
    }

    // Caller auth on everything else.
    const want = `Bearer ${env.TIMMY_EDGE_TOKEN ?? ''}`;
    if (!env.TIMMY_EDGE_TOKEN || (req.headers.get('Authorization') ?? '') !== want) {
      return json({ ok: false, error: 'unauthorized' }, 401);
    }

    // Ops: compute + publish today's head now (same code path as the daily cron).
    if (url.pathname === '/head/compute' && req.method === 'POST') {
      if (!env.CUSTODY_KV) return json({ ok: false, error: 'no CUSTODY_KV on this deployment' }, 503);
      const head = await computeDailyHead(env.CUSTODY_KV);
      await writeDailyHead(env.CUSTODY_KV, head);
      return json({ ok: true, head });
    }

    if (url.pathname === '/code/tools' && req.method === 'GET') {
      return json({ ok: true, types: toolTypes(), tools: edgeTools().map((t) => ({ name: t.name, description: t.description, paid: !!t.paid, destructive: !!t.destructive, schema: z.toJSONSchema(t.input) })) });
    }

    if (url.pathname === '/code' && req.method === 'POST') {
      if (!env.LOADER) return json({ ok: false, error: 'code_mode unavailable: no LOADER (worker_loaders) binding on this deployment' }, 503);
      let body: CodeRequest;
      try {
        body = (await req.json()) as CodeRequest;
      } catch {
        return json({ ok: false, error: 'bad json' }, 400);
      }
      const executor = new DynamicWorkerExecutor({ loader: env.LOADER as never, timeout: 60_000 }) as unknown as Executor;
      try {
        const out = await runCode(body, env, { executor });
        return json(out, out.ok ? 200 : 422);
      } catch (e) {
        if (e instanceof HttpError) return json({ ok: false, error: e.message }, e.status);
        return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
      }
    }

    const key = env.OPENROUTER_API_KEY;
    if (!key) return json({ ok: false, error: 'OPENROUTER_API_KEY secret not set on worker' }, 500);
    const auth = { Authorization: `Bearer ${key}`, 'X-Title': 'TIMMY' };

    if (url.pathname === '/models') {
      const r = await fetch('https://openrouter.ai/api/v1/models', { headers: auth });
      if (!r.ok) return new Response(await r.text(), { status: r.status }); // preserve upstream
      const j = (await r.json()) as { data?: { id: string; context_length?: number; pricing?: { prompt?: string; completion?: string } }[] };
      const slim = (j.data ?? []).map((m) => ({ id: m.id, ctx: m.context_length, in: m.pricing?.prompt, out: m.pricing?.completion }));
      return json(slim);
    }

    if (url.pathname === '/chat') {
      // Spend guard: model allowlist + per-minute rate limit.
      const allow = String(env.ALLOWED_MODELS ?? 'google/gemini-3.7-flash,x-ai/grok-4.6')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      let body: { model?: string };
      try {
        body = (await req.json()) as { model?: string };
      } catch {
        return json({ ok: false, error: 'bad json' }, 400);
      }
      if (!allow.includes(String(body?.model ?? ''))) {
        return json({ ok: false, error: 'model not on allowlist', allow }, 403);
      }
      const limit = Number(env.RATE_LIMIT_PER_MIN ?? 20);
      const now = Date.now();
      if (now - windowStart > 60000) {
        windowStart = now;
        windowCount = 0;
      }
      if (++windowCount > limit) {
        return json({ ok: false, error: 'rate limited' }, 429);
      }
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify(body)
      });
      // Preserve upstream status AND error bodies verbatim.
      return new Response(r.body, { status: r.status, headers: { 'Content-Type': 'application/json' } });
    }

    return json({ ok: false, error: 'not found; routes: /health /head /models /chat /code /code/tools /runs/:room/{events,event,ws}' }, 404);
  },

  // Daily cron (wrangler.toml [triggers]): walk every chain, publish the head.
  async scheduled(_event: { scheduledTime: number }, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<void> {
    if (!env.CUSTODY_KV) return;
    const kv = env.CUSTODY_KV;
    ctx.waitUntil(
      (async () => {
        const head = await computeDailyHead(kv);
        await writeDailyHead(kv, head);
      })()
    );
  }
};

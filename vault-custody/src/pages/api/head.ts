// GET /api/head — the daily edge chain head, public. Written by the
// timmy-ai-proxy cron into CUSTODY_KV (head:latest); read here by anyone,
// including the local anchor job that seals it into the Timmy root chain.
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  const env = (locals as App.Locals).runtime?.env ?? ({} as CustodyEnv);
  const kv = env.CUSTODY_KV;
  if (!kv) return json({ ok: false, error: 'no CUSTODY_KV on this deployment' }, 503);
  const date = url.searchParams.get('date');
  const raw = await kv.get(date ? `head:${date}` : 'head:latest');
  if (!raw) return json({ ok: false, error: 'no head yet; the daily cron has not run' }, 404);
  return new Response(raw, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });

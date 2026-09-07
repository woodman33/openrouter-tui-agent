// /t — the tap. Every seal points here. Verify the SUN message, refuse replay,
// seal a custody.tap receipt, send the phone to the receipt page. Rendered on
// demand at the edge (never prerendered).
import type { APIRoute } from 'astro';
import { handleTap } from '../lib/tap';
import { storeFor } from '../lib/store';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, redirect }) => {
  const env = (locals as App.Locals).runtime?.env ?? ({} as CustodyEnv);
  const url = new URL(request.url);
  const out = await handleTap(url.searchParams, { store: storeFor(env.CUSTODY_KV), keyOverrides: env.CUSTODY_KEYS });

  // Every tap is also an event on the Timmy run store when the edge is configured.
  if (env.TIMMY_EDGE_URL && env.TIMMY_EDGE_TOKEN) {
    const post = fetch(new URL('/runs/custody/event', env.TIMMY_EDGE_URL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.TIMMY_EDGE_TOKEN}` },
      body: JSON.stringify({ kind: out.ok ? 'custody.tap' : 'custody.tap.refused', ...(out.ok ? { serial: out.serial, uid: out.uid, counter: out.counter, receipt: out.receiptHash } : { reason: out.reason, uid: out.uid ?? null }) })
    }).catch(() => undefined);
    const ctx = (locals as App.Locals).runtime?.ctx;
    if (ctx?.waitUntil) ctx.waitUntil(post);
    else await post;
  }

  if (url.searchParams.get('format') === 'json') {
    return new Response(JSON.stringify(out.ok ? { ...out, sun: { ...out.sun, fileData: out.sun.fileData ? Array.from(out.sun.fileData) : undefined } } : out), {
      status: out.ok ? 200 : 403,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }
  return redirect(out.redirect, 302);
};

// GET /api/chain/<serial> — the unit's chain as JSON: fixture timeline plus
// every sealed tap, verified before it leaves. This is what the Custody
// Companion (HTML5 Defold + Rive) reads after the /t redirect.
import type { APIRoute } from 'astro';
import { verifyCustodyChain } from '../../../lib/chain';
import { EPOCH, unitFor } from '../../../lib/registry';
import { storeFor } from '../../../lib/store';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const env = (locals as App.Locals).runtime?.env ?? ({} as CustodyEnv);
  const serial = String(params.serial ?? '').toUpperCase();
  const unit = unitFor(serial);
  if (!unit) return json({ ok: false, error: 'unknown serial' }, 404);
  const store = storeFor(env.CUSTODY_KV);
  const taps = await store.getChain(serial);
  const verify = await verifyCustodyChain(taps);
  return json({
    ok: true,
    epoch: EPOCH,
    serial,
    state: unit.state,
    product: unit.product,
    series: unit.series,
    contentsHash: unit.contentsHash,
    sealed: unit.sealed,
    opened: unit.opened ?? null,
    timeline: unit.timeline,
    taps,
    verify,
    persistent: store.persistent
  });
};

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });

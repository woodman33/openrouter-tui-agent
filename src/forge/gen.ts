// FORGE gen lane (p13; decisions.md D1-D5; DESIGN.md §1 read-only law —
// we append receipts through the canonical API, never edit chain logic).
// `timmy gen`: seals gen.request BEFORE dispatch and gen.result AFTER, with
// meta {provider, model, prompt_hash, slot_id, cost, latency_ms,
// artifact_hash, local}. local is COMPUTED (D2): true only when the dispatch
// path consulted no API key.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { appendReceipt } from '../utils/receipts.js';
import { loadSheet, validateSheet, type ForgeSheet, type ForgeSlot } from './sheet.js';

export const forgeEnabled = (): boolean => process.env.TIMMY_FORGE === '1';

export const sha256 = (b: Buffer | string): string =>
  'sha256_' + createHash('sha256').update(b).digest('hex');

export interface GenOpts {
  sheet?: string;
  slots?: string[];
  provider?: string;
  stub?: boolean;
  allowSpend?: boolean;
  dir?: string;
}
export interface GenLine { slot_id: string; request: string; result: string; artifact: string; local: boolean; cost: number; ms: number }

// D2: local is a fact about the path taken, never a claim.
const pathUsesNoKey = (provider: string): boolean =>
  provider === 'stub' || (provider === 'comfy' && !process.env.COMFY_CLOUD_API_KEY && !process.env.COMFY_CLOUD_TOKEN);

function dispatch(slot: ForgeSlot, provider: string, promptHash: string, allowSpend: boolean, dir: string): { artifact: string; bytes: Buffer; cost: number; model: string } {
  const outDir = join(dir, '.timmy', 'forge');
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, `${slot.slot_id}.bin`);
  if (provider === 'stub') {
    const bytes = Buffer.from(`TIMMY-FORGE-STUB ${slot.slot_id} ${promptHash} ${slot.prompt}`);
    writeFileSync(out, bytes);
    return { artifact: out, bytes, cost: 0, model: 'stub/deterministic' };
  }
  if (provider === 'comfy') {
    // thin adapter over comfyui-cli; partner spend is consent-gated like the
    // comfy CLI itself (spend_consent_required).
    if (!allowSpend) throw new Error('spend consent required: rerun with --allow-spend');
    const r = spawnSync('comfy', ['generate', slot.provider_pref || 'flux-ultra', '--prompt', slot.prompt, '--download', out], { encoding: 'utf8', timeout: 300000 });
    if (r.status !== 0 || !existsSync(out)) throw new Error(`comfyui-cli dispatch failed: ${(r.stderr ?? r.stdout ?? '').slice(0, 200)}`);
    const bytes = readFileSync(out);
    return { artifact: out, bytes, cost: 0.05, model: `comfy/${slot.provider_pref || 'flux-ultra'}` };
  }
  if (provider === 'comfy-mcp') {
    // wired through the existing cmcp WIRE slot (D5); honest when absent.
    throw new Error('comfy-mcp not configured in the cmcp wire — not_configured (D5)');
  }
  throw new Error(`unknown forge provider ${provider}`);
}

export function runGen(opts: GenOpts): GenLine[] {
  if (!forgeEnabled()) throw new Error('forge lane gated: run with TIMMY_FORGE=1 (D1)');
  let sheet: ForgeSheet;
  if (opts.sheet) {
    sheet = loadSheet(opts.sheet);
  } else {
    throw new Error('timmy gen needs --sheet <tldraw.json> (reference-sheet contract)');
  }
  validateSheet(sheet); // CUE gate BEFORE any gen fires (D3)
  const dir = opts.dir ?? process.cwd();
  const chosen = sheet.slots.filter(s => s.required || !opts.slots || opts.slots.length === 0 || opts.slots.includes(s.slot_id));
  const lines: GenLine[] = [];
  for (const slot of chosen) {
    if (opts.slots && opts.slots.length > 0 && !opts.slots.includes(slot.slot_id)) continue; // agent fills fewer optionals
    const provider = opts.provider ?? (opts.stub ? 'stub' : slot.provider_pref);
    const promptHash = sha256(slot.prompt);
    const req = appendReceipt('runs', {
      kind: 'gen.request', subject: `forge ${slot.slot_id} · ${slot.prompt.slice(0, 40)}`,
      policy: 'auto', prompt_hash: promptHash, model_requested: slot.provider_pref,
      via: provider, sources: [{ slot_id: slot.slot_id, class: slot.class, required: slot.required, est_cost_usd: slot.est_cost_usd ?? 0 }],
    } as never, dir);
    const t0 = Date.now();
    const d = dispatch(slot, provider, promptHash, Boolean(opts.allowSpend), dir);
    const ms = Date.now() - t0;
    const local = pathUsesNoKey(provider);
    const res = appendReceipt('runs', {
      kind: 'gen.result', subject: `forge ${slot.slot_id} · ${slot.prompt.slice(0, 40)}`,
      policy: 'auto', prompt_hash: promptHash, model_resolved: d.model, via: provider,
      ms, cost_usd: d.cost, output_sha256: sha256(d.bytes), artifacts: [d.artifact],
      status: 'ok', sources: [{ slot_id: slot.slot_id, local }],
    } as never, dir);
    lines.push({ slot_id: slot.slot_id, request: req.hash, result: res.hash, artifact: d.artifact, local, cost: d.cost, ms });
  }
  return lines;
}

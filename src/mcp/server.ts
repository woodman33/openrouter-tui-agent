#!/usr/bin/env node
// timmy mcp serve — the Agent Trust OS as an MCP server.
// Any MCP-speaking agent (Qwen, Cursor, lanes, future ALE workers) can drive
// TIMMY through these tools; every call lands in the receipt chain.
// Raw stdio JSON-RPC, no SDK dep. Line-delimited messages.
import { captureEnvLock } from '../utils/envlock.js';
import { readEvents, appendEvent } from '../utils/eventbus.js';
import { verifyChain, appendReceipt } from '../utils/receipts.js';
import { replayFromEdl, } from '../utils/cliprunner.js';
import { listGenerations, recordGeneration, updateGeneration, extractArtifactFromLog } from '../utils/generations.js';
import { locateGenAgent, buildGenAgentArgs, launchDetached } from '../utils/genbridge.js';
import { GENERATION_PROVIDERS } from '../utils/providers.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { spawnSync } from 'child_process';

const sleepSync = (ms: number) => spawnSync('sleep', [String(ms / 1000)]);

const TOOLS = [
  { name: 'timmy_env_lock', description: 'Environment lock: OS build, arch, tool BUILD HASHES (sha256 of binaries, not version strings).', inputSchema: { type: 'object', properties: {} } },
  { name: 'timmy_events_tail', description: 'Last N events from the timmy event bus (NDJSON spine).', inputSchema: { type: 'object', properties: { n: { type: 'number' } } } },
  { name: 'timmy_receipt_verify', description: 'Walk the hash chain of a receipt stream; returns ok/brokenAt.', inputSchema: { type: 'object', properties: { stream: { type: 'string' } }, required: ['stream'] } },
  { name: 'timmy_clip_replay', description: 'Replay a sealed clip job from its EDL cut-list alone; verifies output sha match.', inputSchema: { type: 'object', properties: { jobId: { type: 'string' } }, required: ['jobId'] } },
  { name: 'timmy_gen_run', description: 'Queue + execute a generation through the gen bridge (OpenRouter/local providers); sealed receipt on completion.', inputSchema: { type: 'object', properties: { provider: { type: 'string' }, model: { type: 'string' }, prompt: { type: 'string' }, kind: { type: 'string' } }, required: ['prompt'] } },
  { name: 'timmy_promo_apply', description: 'Apply a fused beats delta to the promo comp (v8 → v9): replaces claim/sub/evidence text per beat id.', inputSchema: { type: 'object', properties: { beats: { type: 'array' } }, required: ['beats'] } },
  { name: 'timmy_llm_call', description: 'Direct chat-completions call through TIMMY: openrouter direct (or the Cloudflare edge proxy when TIMMY_AI_PROXY is set), or the local ollama daemon (bare tags on-device, :cloud tags on ollama cloud; gated by TIMMY_ALLOW_LOCAL_OLLAMA=1). Every call sealed as a receipt with model + usage. Pre-tool hook validates the model (openrouter → ollama) before any call goes out. Bodybuilder-style fan-out = parallel calls; Fusion = one call with the outputs attached.', inputSchema: { type: 'object', properties: { model: { type: 'string' }, prompt: { type: 'string' }, system: { type: 'string' }, requires_approval: { type: 'boolean', description: 'HITL gate: the call refuses until approved:true is passed' }, approved: { type: 'boolean', description: 'human-in-the-loop approval flag for this run' } }, required: ['model', 'prompt'] } },
  { name: 'timmy_fusion_plan', description: 'Resolve the owner-picked judge chain (local nemotron-3.5-lightning + qwen3.8:27b-mlx first, then gemini-3.7-flash floor, grok-4.6 frontier, ollama :cloud tags) against openrouter/ollama and return the available-judges list for quick human approval before a fusion run.', inputSchema: { type: 'object', properties: { approved: { type: 'boolean' } } } }
];

// Judge chain (owner-picked order): free local first (M5-max optimized),
// cheap openrouter floor + one frontier, then ollama :cloud tags (the daemon routes them).
export const JUDGE_CHAIN = [
  'nemotron-3.5-lightning', 'qwen3.8:27b-mlx',
  'google/gemini-3.7-flash', 'x-ai/grok-4.6',
  'minimax-m3:cloud', 'kimi-k3:cloud', 'glm-5.2:cloud'
];

let orModelsCache: { at: number; ids: string[] } | null = null;
async function openrouterModels(): Promise<string[]> {
  if (orModelsCache && Date.now() - orModelsCache.at < 600000) return orModelsCache.ids;
  const proxy = process.env.TIMMY_AI_PROXY;
  try {
    const res = proxy
      ? await fetch(`${proxy}/models`)
      : await fetch('https://openrouter.ai/api/v1/models', { headers: { Authorization: `Bearer ${readApiKey()}` } });
    const j = (await res.json()) as any;
    const ids = Array.isArray(j) ? j.map((m: any) => m.id as string) : (j?.data ?? []).map((m: any) => m.id as string);
    orModelsCache = { at: Date.now(), ids };
    return ids;
  } catch { return orModelsCache?.ids ?? []; }
}

const localOllamaAllowed = (): boolean => process.env.TIMMY_ALLOW_LOCAL_OLLAMA === '1';
async function ollamaLocalModels(): Promise<string[]> {
  if (!localOllamaAllowed()) return [];
  try {
    const r = await fetch('http://localhost:11434/api/tags');
    const j = (await r.json()) as any;
    return (j?.models ?? []).map((m: any) => m.name as string);
  } catch { return []; }
}

// Pre-tool hook: every model id is validated before a call goes out.
// openrouter → ollama daemon (bare tags run on-device, :cloud tags on ollama
// cloud — the daemon routes; whole path gated by TIMMY_ALLOW_LOCAL_OLLAMA=1).
export async function resolveModel(id: string): Promise<{ via: string; id: string; suggestions?: string[] }> {
  const or = await openrouterModels();
  if (or.includes(id)) return { via: 'openrouter', id };
  const loc = await ollamaLocalModels();
  const tag = loc.find(m => m === id || m === `${id}:latest` || m.startsWith(id + ':'));
  if (tag) return { via: 'ollama', id: tag };
  const tail = id.split('/').pop() ?? id;
  return { via: 'none', id, suggestions: or.filter(m => m.includes(tail)).slice(0, 4) };
}

// No loose secrets in tool output, ever.
const redact = (s: string): string => s
  .replace(/sk-or-[A-Za-z0-9_-]+/g, 'sk-or-REDACTED')
  .replace(/Bearer [A-Za-z0-9._-]+/g, 'Bearer REDACTED')
  .replace(/eyJ[A-Za-z0-9_-]{20,}/g, 'JWT-REDACTED');

const readApiKey = (): string => {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  try {
    const env = readFileSync(join(process.cwd(), '.env'), 'utf8');
    const m = env.match(/^OPENROUTER_API_KEY=(.+)$/m);
    return m ? m[1].trim() : '';
  } catch { return ''; }
};

async function llmCall(args: { model: string; prompt: string; system?: string; requires_approval?: boolean; approved?: boolean }) {
  if (args.requires_approval && !args.approved) {
    appendEvent('run.gated', { model: args.model, note: 'awaiting human approval' });
    return { ok: false, needs_approval: true, model: args.model, note: 'human-in-the-loop gate: review the model list (timmy_fusion_plan) and re-invoke with approved:true' };
  }
  const resolved = await resolveModel(args.model);
  if (resolved.via === 'none') {
    appendEvent('run.failed', { model: args.model, note: 'model not resolvable on any permitted provider' });
    return { ok: false, needs_resolution: true, model: args.model, suggestions: resolved.suggestions, note: 'model not found on openrouter/ollama; pick a suggestion or permit ollama local (TIMMY_ALLOW_LOCAL_OLLAMA=1)' };
  }
  const messages = [
    ...(args.system ? [{ role: 'system', content: args.system }] : []),
    { role: 'user', content: args.prompt }
  ];
  const t0 = Date.now();
  if (resolved.via === 'ollama') {
    try {
      const r = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: resolved.id, messages, stream: false })
      });
      const ms = Date.now() - t0;
      if (!r.ok) {
        const raw = await r.text();
        appendEvent('run.failed', { model: resolved.id, status: r.status, ms });
        return { ok: false, status: r.status, note: redact(raw.slice(0, 300)), ms };
      }
      const j = await r.json() as any;
      const text = redact(j?.message?.content ?? '');
      const tokens = (j?.eval_count ?? 0) + (j?.prompt_eval_count ?? 0);
      appendReceipt('runs', {
        kind: 'run',
        subject: `llm ${resolved.id}`,
        policy: args.requires_approval ? 'human-gated' : 'auto',
        spans: [{ name: `chat ${resolved.id} via ollama`, kind: 'chat' }],
        cost_usd: 0,
        artifacts: []
      });
      appendEvent('run.completed', { model: resolved.id, via: 'ollama', ms, tokens });
      return { ok: true, model: resolved.id, via: 'ollama', ms, tokens, text };
    } catch (e) {
      appendEvent('run.failed', { model: resolved.id, note: redact((e as Error).message) });
      return { ok: false, note: redact((e as Error).message) };
    }
  }
  const proxy = process.env.TIMMY_AI_PROXY;
  const key = readApiKey();
  if (!proxy && !key) return { ok: false, note: 'no OPENROUTER_API_KEY in env or .env and no TIMMY_AI_PROXY edge route' };
  const body = JSON.stringify({ model: args.model, messages, temperature: 0.7 });
  try {
    const res = proxy
      ? await fetch(`${proxy}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
      : await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'X-Title': 'TIMMY' },
        body
      });
    const ms = Date.now() - t0;
    if (!res.ok) {
      const raw = await res.text();
      appendEvent('run.failed', { model: args.model, status: res.status, ms });
      return { ok: false, status: res.status, note: redact(raw.slice(0, 300)), ms };
    }
    const j = await res.json() as any;
    const text = redact(j?.choices?.[0]?.message?.content ?? '');
    const usage = j?.usage ?? {};
    appendReceipt('runs', {
      kind: 'run',
      subject: `llm ${args.model}`,
      policy: args.requires_approval ? 'human-gated' : 'auto',
      spans: [{ name: `chat ${args.model} via ${resolved.via}`, kind: 'chat' }],
      cost_usd: undefined,
      artifacts: []
    });
    appendEvent('run.completed', { model: args.model, via: resolved.via, ms, tokens: usage?.total_tokens ?? 0 });
    return { ok: true, model: args.model, via: resolved.via, ms, tokens: usage?.total_tokens ?? 0, text };
  } catch (e) {
    appendEvent('run.failed', { model: args.model, note: redact((e as Error).message) });
    return { ok: false, note: redact((e as Error).message) };
  }
}

async function fusionPlan(args: { approved?: boolean }) {
  const judges = [];
  for (const id of JUDGE_CHAIN) {
    const r = await resolveModel(id);
    judges.push({ model: id, via: r.via, ...(r.suggestions ? { suggestions: r.suggestions } : {}) });
  }
  const available = judges.filter(j => j.via !== 'none').map(j => j.model);
  appendEvent('fusion.planned', { available, approved: !!args?.approved });
  return {
    ok: true,
    chain: JUDGE_CHAIN,
    judges,
    available,
    floor: 'google/gemini-3.7-flash',
    requires_approval: true,
    approved: !!args?.approved,
    note: 'quick-approve: pass available (or a subset) back as timmy_llm_call runs with requires_approval:true, approved:true'
  };
}

const replaceInnerText = (html: string, id: string, text: string): string => {
  const re = new RegExp('(id="' + id + '"[^>]*>)([^<]*)', 'g');
  return html.replace(re, (_m, pre, old) => pre + text);
};

function genRun(args: { provider?: string; model?: string; prompt: string; kind?: string }) {
  const providerId = args.provider ?? 'openrouter';
  const prov = GENERATION_PROVIDERS.find(p => p.id === providerId)
    ?? { id: providerId, label: providerId, modelId: args.model ?? '', kind: (args.kind ?? 'text') as any, transport: 'openrouter' as any };
  const rec = recordGeneration({
    prompt: args.prompt,
    provider: prov.id,
    model: args.model ?? prov.modelId ?? '',
    kind: (args.kind ?? prov.kind ?? 'text') as any,
    transport: (prov.transport ?? 'openrouter') as any,
    status: 'running'
  });
  const genDir = locateGenAgent();
  const sargs = buildGenAgentArgs(prov as any, args.prompt);
  const log = join(process.cwd(), '.timmy', 'runs', `${rec.id}.log`);
  if (!genDir || !sargs) {
    updateGeneration(rec.id, { status: 'failed' });
    return { id: rec.id, status: 'failed', note: 'gen agent bridge unavailable' };
  }
  launchDetached(genDir, sargs as string[], log);
  const t0 = Date.now();
  while (Date.now() - t0 < 120000) {
    const txt = existsSync(log) ? readFileSync(log, 'utf8') : '';
    if (txt.includes('EXIT=')) break;
    sleepSync(2000);
  }
  const txt = existsSync(log) ? readFileSync(log, 'utf8') : '';
  const artifact = extractArtifactFromLog(txt);
  const ok = /EXIT=0/.test(txt);
  updateGeneration(rec.id, { status: ok ? 'done' : 'failed', ...(artifact ? { artifact } : {}) });
  return { id: rec.id, status: ok ? 'done' : 'failed', artifact, logTail: txt.split('\n').slice(-4) };
}

function promoApply(args: { beats: { id: string; claim?: string; sub?: string; evidence?: string }[] }) {
  const src = join(process.cwd(), 'studio', 'timmy-promo-v8', 'index.html');
  const outDir = join(process.cwd(), 'studio', 'timmy-promo-v9');
  if (!existsSync(src)) return { ok: false, note: 'v8 comp missing' };
  mkdirSync(outDir, { recursive: true });
  let html = readFileSync(src, 'utf8');
  const idMap: Record<string, { claim?: string; sub?: string; ev?: string }> = {
    hook1: { claim: 'h1t' }, hook2: { claim: 'h2' }, turn: { claim: 't1' },
    lanes: { claim: 'c1', sub: 'c1s', ev: 'c1e' }, cost: { claim: 'c2', sub: 'c2s', ev: 'c2e' },
    receipt: { claim: 'c3', ev: 'c3e' }, replay: { claim: 'c4', ev: 'c4e' }, envlock: { claim: 'c5', ev: 'c5e' },
    clip: { claim: 'c6', sub: 'c6s', ev: 'c6e' }, local: { claim: 'c7', sub: 'c7s', ev: 'c7e' },
    connect: { claim: 'c8', ev: 'c8e' }, grammar: { claim: 'c9', sub: 'c9s' },
    split: { claim: 'c10' }, lockup: { claim: 'l2' }, end: { ev: 'e2' }
  };
  let applied = 0;
  for (const b of args.beats) {
    const m = idMap[b.id];
    if (!m) continue;
    if (b.claim && m.claim) { html = replaceInnerText(html, m.claim, b.claim); applied++; }
    if (b.sub && m.sub) { html = replaceInnerText(html, m.sub, b.sub); applied++; }
    if (b.evidence && m.ev) { html = replaceInnerText(html, m.ev, b.evidence); applied++; }
  }
  writeFileSync(join(outDir, 'index.html'), html);
  for (const f of ['demo-lanes.mp4', 'demo-replay.mp4', 'bed.m4a']) {
    const s = join(dirname(src), f);
    if (existsSync(s)) copyFileSync(s, join(outDir, f));
  }
  return { ok: true, applied, out: join(outDir, 'index.html') };
}

const call = (name: string, args: any): unknown => {
  switch (name) {
    case 'timmy_env_lock': return captureEnvLock();
    case 'timmy_events_tail': return readEvents(Number(args?.n ?? 10));
    case 'timmy_receipt_verify': return verifyChain(String(args?.stream ?? 'runs'));
    case 'timmy_clip_replay': return replayFromEdl(String(args?.jobId ?? ''));
    case 'timmy_gen_run': return genRun(args ?? { prompt: '' });
    case 'timmy_promo_apply': return promoApply(args ?? { beats: [] });
    case 'timmy_llm_call': return llmCall(args ?? { model: '', prompt: '' });
    case 'timmy_fusion_plan': return fusionPlan(args ?? {});
    default: throw new Error(`unknown tool ${name}`);
  }
};

// Headless sessions get eyes: the companion auto-pops once per machine
// session (reused if already up; TIMMY_LOGS_OPEN=0 opts out of the pop).
import { ensureLogCompanion } from '../utils/logserver.js';
ensureLogCompanion().catch(() => {});

let buf = '';
process.stdin.on('data', d => {
  buf += d.toString();
  let i: number;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    let msg: any;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.method === 'initialize') {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'timmy', version: '0.4.0' } } }) + '\n');
    } else if (msg.method === 'notifications/initialized') {
      // no response for notifications
    } else if (msg.method === 'tools/list') {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { tools: TOOLS } }) + '\n');
    } else if (msg.method === 'tools/call') {
      (async () => {
        try {
          const result = await call(msg.params?.name, msg.params?.arguments);
          process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { content: [{ type: 'text', text: JSON.stringify(result) }] } }) + '\n');
        } catch (e) {
          process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { content: [{ type: 'text', text: `error: ${(e as Error).message}` }], isError: true } }) + '\n');
        }
      })();
    }
  }
});

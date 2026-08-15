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
  { name: 'timmy_llm_call', description: 'Direct OpenRouter chat-completions call through TIMMY: every call sealed as a receipt with model + usage. Bodybuilder-style fan-out = parallel calls; Fusion = one call with the outputs attached.', inputSchema: { type: 'object', properties: { model: { type: 'string' }, prompt: { type: 'string' }, system: { type: 'string' } }, required: ['model', 'prompt'] } }
];

const readApiKey = (): string => {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  try {
    const env = readFileSync(join(process.cwd(), '.env'), 'utf8');
    const m = env.match(/^OPENROUTER_API_KEY=(.+)$/m);
    return m ? m[1].trim() : '';
  } catch { return ''; }
};

async function llmCall(args: { model: string; prompt: string; system?: string }) {
  const key = readApiKey();
  if (!key) return { ok: false, note: 'no OPENROUTER_API_KEY in env or .env' };
  const t0 = Date.now();
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'X-Title': 'TIMMY' },
      body: JSON.stringify({
        model: args.model,
        messages: [
          ...(args.system ? [{ role: 'system', content: args.system }] : []),
          { role: 'user', content: args.prompt }
        ],
        temperature: 0.7
      })
    });
    const ms = Date.now() - t0;
    if (!res.ok) {
      const body = await res.text();
      appendEvent('run.failed', { model: args.model, status: res.status, ms });
      return { ok: false, status: res.status, note: body.slice(0, 300), ms };
    }
    const j = await res.json() as any;
    const text = j?.choices?.[0]?.message?.content ?? '';
    const usage = j?.usage ?? {};
    appendReceipt('runs', {
      kind: 'run',
      subject: `llm ${args.model}`,
      policy: 'auto',
      spans: [{ name: `chat ${args.model}`, kind: 'chat' }],
      cost_usd: undefined,
      artifacts: []
    });
    appendEvent('run.completed', { model: args.model, ms, tokens: usage?.total_tokens ?? 0 });
    return { ok: true, model: args.model, ms, tokens: usage?.total_tokens ?? 0, text };
  } catch (e) {
    appendEvent('run.failed', { model: args.model, note: (e as Error).message });
    return { ok: false, note: (e as Error).message };
  }
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
    default: throw new Error(`unknown tool ${name}`);
  }
};

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

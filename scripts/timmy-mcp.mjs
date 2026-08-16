#!/usr/bin/env node
// TIMMY Porter outbound MCP — stdio JSON-RPC server so OTHER clients
// (Cursor, Claude Code, Zed…) can call TIMMY: verify receipts, read the
// generation ledger, read Slate projects, see the fleet. Read-only on
// purpose: TIMMY stays the signing authority; outsiders get proofs, not pens.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const CWD = process.env.TIMMY_HOME || process.cwd();
const read = p => { try { return readFileSync(join(CWD, p), 'utf8'); } catch { return ''; } };
const jsonl = p => read(p).split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

const TOOLS = [
  { name: 'timmy_verify', description: 'Walk TIMMY receipt chains (gens/harness/runs/exports); detect tampering', inputSchema: { type: 'object', properties: {} } },
  { name: 'timmy_gens', description: 'List the generation ledger: prompts, providers, models, costs, statuses', inputSchema: { type: 'object', properties: { limit: { type: 'number' } } } },
  { name: 'timmy_slate', description: 'Read a TIMMY Slate project (beats, cast call-sheet, branches, refs)', inputSchema: { type: 'object', properties: { project: { type: 'string' } }, required: ['project'] } },
  { name: 'timmy_fleet', description: 'List the Porter fleet (houdini #1, roboflow #2, comfyui #3…) with detection status', inputSchema: { type: 'object', properties: {} } }
];

import { createHash } from 'node:crypto';
const canon = o => JSON.stringify(Object.keys(o).sort().reduce((a, k) => ({ ...a, [k]: o[k] }), {}));
function verify(stream) {
  const chain = jsonl(join('.timmy', 'receipts', `${stream}.jsonl`));
  let prev = 'genesis';
  for (const r of chain) {
    if (r.prev_hash !== prev) return { stream, ok: false, brokenAt: r.id, reason: 'chain link broken' };
    const { hash, ...rest } = r;
    if ('sha256_' + createHash('sha256').update(canon({ ...rest, hash: '' })).digest('hex') !== hash) return { stream, ok: false, brokenAt: r.id, reason: 'body tampered' };
    prev = r.hash;
  }
  return { stream, ok: true, count: chain.length };
}

function call(name, args = {}) {
  switch (name) {
    case 'timmy_verify':
      return ['gens', 'harness', 'runs', 'exports'].map(verify);
    case 'timmy_gens': {
      const g = jsonl(join('.timmy', 'generations.json')).flatMap(f => f.generations || []);
      return g.slice(0, args.limit || 20).map(r => ({ id: r.id, provider: r.provider, model: r.model, status: r.status, cost: r.cost_usd, prompt: String(r.prompt).slice(0, 120) }));
    }
    case 'timmy_slate': {
      const p = join('studio', args.project, 'slate.json');
      if (!existsSync(join(CWD, p))) return { error: `no project ${args.project}` };
      return JSON.parse(read(p));
    }
    case 'timmy_fleet': {
      try { return JSON.parse(read(join('.timmy', 'fleet.json'))); } catch { return 'default fleet (fleet.json absent): houdini-sceneforge #1, roboflow #2, comfyui #3, runcomfy #4, comfydeploy #5, wavespeed #6'; }
    }
    default:
      return { error: `unknown tool ${name}` };
  }
}

let buf = '';
process.stdin.on('data', d => {
  buf += d;
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i); buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    let msg; try { msg = JSON.parse(line); } catch { continue; }
    const reply = { jsonrpc: '2.0', id: msg.id };
    if (msg.method === 'initialize') reply.result = { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'timmy-porter', version: '1.0.0' } };
    else if (msg.method === 'tools/list') reply.result = { tools: TOOLS };
    else if (msg.method === 'tools/call') reply.result = { content: [{ type: 'text', text: JSON.stringify(call(msg.params?.name, msg.params?.arguments), null, 1) }] };
    else if (msg.method === 'notifications/initialized') continue;
    else reply.result = {};
    process.stdout.write(JSON.stringify(reply) + '\n');
  }
});

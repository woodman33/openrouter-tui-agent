// timmy logs companion — live receipt/event viewer for headless mode.
// When TIMMY is driven via MCP or CLI (no TUI on screen), this zero-dep
// server auto-pops a localhost page that streams the SAME NDJSON event bus
// the TUI consumes, plus the receipt chain with a verify button.
// SSE tail of .timmy/runs/timmy-events.jsonl; no dependencies, no secrets.
import { createServer, ServerResponse } from 'http';
import { existsSync, readFileSync, statSync, openSync, readSync, closeSync, readdirSync } from 'fs';
import { armPlan, dispatchPlan, pauseOrCancelLane, collectRun } from './dispatch.js';
import { join } from 'path';
import { spawn } from 'child_process';
import { pathToFileURL } from 'url';
import { readEvents, eventsPath, TimmyEvent } from './eventbus.js';
import { readChain, verifyChain } from './receipts.js';

export const LOGS_PORT = (): number => Number(process.env.TIMMY_LOGS_PORT ?? 4310);

const kindColor = (kind: string): string => {
  if (kind.includes('sealed') || kind.includes('completed')) return '#4ade80';
  if (kind.includes('failed') || kind.includes('broken')) return '#f87171';
  if (kind.includes('approval') || kind.includes('gated')) return '#fbbf24';
  if (kind.includes('fusion') || kind.includes('run')) return '#a78bfa';
  return '#9ca3af';
};

const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<title>TIMMY :: LIVE LOGS</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; }
  body { background: #0a0a0b; color: #e5e7eb; font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
  header { display: flex; gap: 12px; align-items: center; padding: 10px 16px; border-bottom: 1px solid #1f2937; position: sticky; top: 0; background: #0a0a0b; }
  header .logo { color: #a78bfa; font-weight: 700; letter-spacing: .08em; }
  header .dot { width: 8px; height: 8px; border-radius: 50%; background: #f87171; }
  header .dot.on { background: #4ade80; box-shadow: 0 0 8px #4ade8088; }
  header .meta { color: #6b7280; }
  header .right { margin-left: auto; display: flex; gap: 8px; }
  button { background: #111827; color: #a78bfa; border: 1px solid #374151; border-radius: 4px; font: inherit; padding: 3px 10px; cursor: pointer; }
  button:hover { border-color: #a78bfa; }
  main { display: grid; grid-template-columns: 1.4fr 1fr; gap: 0; height: calc(100vh - 42px); }
  section { overflow-y: auto; padding: 12px 16px; }
  section + section { border-left: 1px solid #1f2937; }
  h2 { color: #4ade80; font-size: 11px; letter-spacing: .18em; margin-bottom: 10px; }
  .ev { display: flex; gap: 10px; padding: 2px 0; white-space: pre-wrap; word-break: break-word; }
  .ev .ts { color: #4b5563; flex: 0 0 86px; }
  .ev .kind { flex: 0 0 150px; font-weight: 600; }
  .ev .pl { color: #9ca3af; }
  .rc { border: 1px solid #1f2937; border-radius: 6px; padding: 8px 10px; margin-bottom: 8px; background: #0d0f12; }
  .rc .sub { color: #e5e7eb; }
  .rc .hash { color: #4ade80; }
  .rc .prev { color: #4b5563; }
  .rc .meta { color: #6b7280; font-size: 11px; }
  #verify-out { color: #fbbf24; padding: 6px 16px; border-top: 1px solid #1f2937; }
</style></head><body>
<header>
  <span class="logo">TIMMY</span><span class="meta">:: LIVE LOGS</span>
  <span class="dot" id="dot"></span><span class="meta" id="conn">connecting…</span>
  <span class="meta" id="cwd"></span>
  <span class="right"><button id="verify">verify chain</button></span>
</header>
<div id="verify-out"></div>
<main>
  <section><h2>EVENT BUS · LIVE</h2><div id="events"></div></section>
  <section><h2>RECEIPT CHAIN · runs</h2><div id="chain"></div></section>
</main>
<script>
const esc = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const eventsEl = document.getElementById('events');
const colors = KIND => KIND.includes('sealed')||KIND.includes('completed') ? '#4ade80'
  : KIND.includes('failed')||KIND.includes('broken') ? '#f87171'
  : KIND.includes('approval')||KIND.includes('gated') ? '#fbbf24'
  : KIND.includes('fusion')||KIND.includes('run') ? '#a78bfa' : '#9ca3af';
function addEvent(ev, scroll) {
  const d = document.createElement('div'); d.className = 'ev';
  d.innerHTML = '<span class="ts">'+esc((ev.ts||'').slice(11,19))+'</span>'
    + '<span class="kind" style="color:'+colors(ev.kind)+'">'+esc(ev.kind)+'</span>'
    + '<span class="pl">'+esc(JSON.stringify(ev.payload||{}).slice(0,220))+'</span>';
  eventsEl.appendChild(d);
  if (scroll) eventsEl.parentElement.scrollTop = eventsEl.parentElement.scrollHeight;
}
function loadChain() {
  fetch('/receipts?stream=runs').then(r=>r.json()).then(list => {
    const el = document.getElementById('chain');
    el.innerHTML = list.slice(-25).reverse().map(r =>
      '<div class="rc"><div class="sub">'+esc(r.subject||r.kind||'')+'</div>'
      + '<div><span class="hash">hash '+esc(String(r.hash||'').slice(0,18))+'…</span> '
      + '<span class="prev">prev '+esc(String(r.prev_hash||'').slice(0,18))+'…</span></div>'
      + '<div class="meta">'+esc(r.policy||'')+' · '+esc(String(r.ts||r.created_at||'').slice(11,19))+'</div></div>'
    ).join('');
  }).catch(()=>{});
}
const es = new EventSource('/events');
es.onopen = () => { document.getElementById('dot').className = 'dot on'; document.getElementById('conn').textContent = 'live'; };
es.onerror = () => { document.getElementById('dot').className = 'dot'; document.getElementById('conn').textContent = 'reconnecting…'; };
es.onmessage = m => { addEvent(JSON.parse(m.data), true); if (JSON.parse(m.data).kind === 'receipt.sealed') loadChain(); };
document.getElementById('verify').onclick = () => {
  fetch('/verify?stream=runs').then(r=>r.json()).then(v => {
    document.getElementById('verify-out').textContent = v.ok
      ? '✓ chain intact · '+v.count+' receipts · ed25519 signed · hash-linked'
      : '✕ chain BROKEN at '+(v.brokenAt||'?');
  });
};
fetch('/health').then(r=>r.json()).then(h => { document.getElementById('cwd').textContent = h.cwd; });
loadChain();
</script></body></html>`;

// ---- Command Post survey column (same controller, allowlisted actions) ----
export const isLocalIp = (ip: string): boolean =>
  ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip);

const listPlans = () => {
  const dir = join(process.cwd(), '.timmy', 'dispatch');
  try {
    return readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
      const s = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      return {
        id: s.id, lifecycle: s.lifecycle, plan_hash: s.plan_hash,
        harness: (s.plan?.harnesses ?? []).join(','), objective: (s.plan?.objective ?? '').slice(0, 60),
        blocked: s.blocked ?? null
      };
    });
  } catch { return []; }
};

const DISPATCH_HTML = `
<div style="border-top:1px solid #1f2937;padding:12px 16px">
  <h2>DISPATCH · COMMAND POST</h2>
  <div id="plans" style="display:flex;flex-direction:column;gap:6px"></div>
</div>
<script>
async function act(id, action) {
  let token;
  if (action === 'arm') { token = prompt('operator approval token (timmy approve <planHash>):'); if (!token) return; }
  const r = await fetch('/dispatch/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action, token }) });
  const j = await r.json();
  alert(JSON.stringify(j).slice(0, 300));
  loadPlans();
}
async function loadPlans() {
  const r = await fetch('/dispatch');
  const plans = await r.json();
  document.getElementById('plans').innerHTML = plans.length ? plans.map(p =>
    '<div style="border:1px solid #1f2937;border-radius:6px;padding:6px 10px;background:#0d0f12">'
    + '<span style="color:#a78bfa">' + p.id + '</span> '
    + '<span style="color:#4ade80">' + p.lifecycle + '</span> '
    + '<span style="color:#9ca3af">' + p.harness + ' · ' + p.objective + '</span> '
    + '<span style="color:#4b5563">hash ' + (p.plan_hash || '').slice(0, 12) + '…</span>'
    + (p.blocked ? ' <span style="color:#f87171">' + p.blocked.state + ': ' + p.blocked.note + '</span>' : '')
    + ' <button onclick="act(\\'' + p.id + '\\',\\'arm\\')">arm</button>'
    + ' <button onclick="act(\\'' + p.id + '\\',\\'launch\\')">launch</button>'
    + ' <button onclick="act(\\'' + p.id + '\\',\\'hold\\')">hold</button>'
    + ' <button onclick="act(\\'' + p.id + '\\',\\'cancel\\')">cancel</button>'
    + ' <button onclick="act(\\'' + p.id + '\\',\\'collect\\')">collect</button>'
    + '</div>').join('') : '<div style="color:#5a6470">no plans — prepare one from chat (ctrl+d rail) or timmy_plan_dispatch</div>';
}
loadPlans(); setInterval(loadPlans, 3000);
</script>`;

interface SseClient { res: ServerResponse }
let clients: SseClient[] = [];
let tailOffset = 0;

function broadcast(ev: TimmyEvent) {
  const data = `data: ${JSON.stringify(ev)}\n\n`;
  for (const c of clients) c.res.write(data);
}

function tailLoop() {
  setInterval(() => {
    const p = eventsPath();
    if (!existsSync(p)) return;
    const size = statSync(p).size;
    if (size < tailOffset) tailOffset = 0; // truncated — restart
    if (size === tailOffset) return;
    const fd = openSync(p, 'r');
    const buf = Buffer.alloc(size - tailOffset);
    readSync(fd, buf, 0, buf.length, tailOffset);
    closeSync(fd);
    tailOffset = size;
    for (const line of buf.toString('utf8').split('\n').filter(Boolean)) {
      try { broadcast(JSON.parse(line) as TimmyEvent); } catch { /* partial line */ }
    }
  }, 700);
}

export function startLogServer(opts: { port?: number; open?: boolean } = {}): Promise<number> {
  const port = opts.port ?? LOGS_PORT();
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${port}`);
    if (url.pathname === '/health') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, cwd: process.cwd(), port }));
      return;
    }
    if (url.pathname === '/events') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(': connected\n\n');
      for (const ev of readEvents(50)) res.write(`data: ${JSON.stringify(ev)}\n\n`);
      const client = { res };
      clients.push(client);
      res.on('close', () => { clients = clients.filter(c => c !== client); });
      return;
    }
    if (url.pathname === '/receipts') {
      const stream = url.searchParams.get('stream') ?? 'runs';
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(readChain(stream)));
      return;
    }
    if (url.pathname === '/verify') {
      const stream = url.searchParams.get('stream') ?? 'runs';
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(verifyChain(stream)));
      return;
    }
    // Command Post survey surface: same controller, same allowlist. Browser
    // state is never sufficient — every mutation goes through the controller.
    if (url.pathname === '/dispatch') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(listPlans()));
      return;
    }
    if (url.pathname === '/dispatch/action' && req.method === 'POST') {
      const ip = req.socket.remoteAddress ?? '';
      if (!isLocalIp(ip)) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'localhost only' }));
        return;
      }
      let body: any = {};
      req.on('data', d => { try { body = JSON.parse(d.toString()); } catch { /* ignore */ } });
      req.on('end', () => {
        const { id, action, token } = body;
        let r: unknown = { ok: false, error: 'unknown action' };
        if (action === 'arm' && token) r = armPlan(String(id), String(token));
        else if (action === 'launch') r = dispatchPlan(String(id));
        else if (action === 'hold') r = pauseOrCancelLane(String(id), 'hold');
        else if (action === 'cancel') r = pauseOrCancelLane(String(id), 'cancel');
        else if (action === 'collect') r = collectRun(String(id));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(r));
      });
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(PAGE + DISPATCH_HTML);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => {
      tailOffset = existsSync(eventsPath()) ? statSync(eventsPath()).size : 0;
      tailLoop();
      if (opts.open) openBrowser(`http://localhost:${port}`);
      resolve(port);
    });
  });
}

export function openBrowser(url: string): void {
  if (process.env.TIMMY_LOGS_OPEN === '0') return;
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  const child = spawn(cmd, [url], { detached: true, stdio: 'ignore' });
  child.unref();
}

// Idempotent: if the companion is already up, reuse it; else spawn detached so
// it outlives short-lived MCP client processes. First starter auto-pops the
// browser (TIMMY_LOGS_OPEN=0 opts out).
export async function ensureLogCompanion(): Promise<{ url: string; started: boolean }> {
  const port = LOGS_PORT();
  const url = `http://localhost:${port}`;
  const alive = async () => {
    try {
      const r = await fetch(`${url}/health`, { signal: AbortSignal.timeout(500) });
      return r.ok;
    } catch { return false; }
  };
  if (await alive()) return { url, started: false };
  const tsx = join(process.cwd(), 'node_modules', '.bin', 'tsx');
  const child = spawn(tsx, [join(process.cwd(), 'src', 'utils', 'logserver.ts')], { detached: true, stdio: 'ignore' });
  child.unref();
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 250));
    if (await alive()) {
      openBrowser(url);
      return { url, started: true };
    }
  }
  return { url, started: false };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const open = process.argv.includes('--open') || process.env.TIMMY_LOGS_OPEN === '1';
  startLogServer({ open }).then(port => {
    console.log(`timmy logs companion · http://localhost:${port} · ctrl-c to stop`);
  }).catch(e => {
    console.error(`companion failed: ${(e as Error).message}`);
    process.exit(1);
  });
}

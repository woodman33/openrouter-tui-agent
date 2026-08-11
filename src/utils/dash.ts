import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { spawn, execSync } from 'child_process';
import { BRAND } from './brand.js';
import { GENERATION_PROVIDERS } from './providers.js';

// TIMMY Studios dashboard — the whole fabric (ledger, fleet, frames, events)
// rendered in carbonyl browser panes. Served by a plain python http.server
// over the repo cwd so /.timmy/* and /studio/frames/* are same-origin fetches.

export const DASH_PORT = 4273;

export function dashUrl(): string {
  return `http://127.0.0.1:${DASH_PORT}/studio/dashboard.html`;
}

export function ensureDashServer(cwd: string = process.cwd()): boolean {
  const pidFile = join(cwd, '.timmy', 'dash.pid');
  try {
    if (existsSync(pidFile)) {
      const pid = parseInt(readFileSync(pidFile, 'utf8').trim(), 10);
      if (Number.isFinite(pid) && pid > 0) {
        process.kill(pid, 0); // throws when dead
        return true;
      }
    }
  } catch {
    // stale pid — fall through and respawn
  }
  try {
    const child = spawn('python3', ['-m', 'http.server', String(DASH_PORT), '--directory', cwd], { detached: true, stdio: 'ignore' });
    child.unref();
    mkdirSync(join(cwd, '.timmy'), { recursive: true });
    writeFileSync(pidFile, String(child.pid), 'utf8');
    return true;
  } catch {
    return false;
  }
}

export function probeUrl(url: string): boolean {
  try {
    execSync(`curl -s -o /dev/null --max-time 1 ${JSON.stringify(url)}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function writeDashboard(cwd: string = process.cwd()): string {
  mkdirSync(join(cwd, 'studio'), { recursive: true });
  const path = join(cwd, 'studio', 'dashboard.html');
  writeFileSync(path, renderDashboardHtml(cwd), 'utf8');
  return path;
}

export function renderDashboardHtml(cwd: string = process.cwd()): string {
  const fleet = GENERATION_PROVIDERS.map(p => ({
    id: p.id, kind: p.kind, transport: p.transport, model: p.modelId || '', notes: p.notes || ''
  }));
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${BRAND.studios} — dashboard</title>
<style>
body{margin:0;background:#090b10;color:#e6edf3;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace}
header{padding:14px 18px;border-bottom:1px solid #21262d;display:flex;gap:14px;align-items:baseline;flex-wrap:wrap}
header h1{margin:0;font-size:16px;color:#d2a8ff}
header .tag{color:#3fb950}
header .slate{color:#8b949e}
main{padding:14px 18px;display:grid;gap:18px}
section h2{font-size:12px;letter-spacing:.25em;color:#3fb950;margin:0 0 8px}
table{border-collapse:collapse;width:100%}
td,th{border:1px solid #21262d;padding:4px 8px;text-align:left;vertical-align:top;font-size:12px}
th{color:#8b949e}
.done{color:#3fb950}.failed{color:#f85149}.running{color:#d29922}.queued{color:#8b949e}
.fleet{display:flex;flex-wrap:wrap;gap:6px}
.chip{border:1px solid #21262d;border-radius:10px;padding:2px 8px;font-size:11px;color:#e6edf3}
.chip b{color:#d2a8ff}
.frames{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.frames img{height:72px;border:1px solid #21262d}
pre{margin:0;font-size:11px;color:#8b949e;white-space:pre-wrap}
</style>
</head>
<body>
<header>
  <h1>⛁ ${BRAND.studios}</h1>
  <span class="tag">${BRAND.studiosTagline}</span>
  <span class="slate">${BRAND.slate}: ${BRAND.slateTagline}</span>
</header>
<main>
  <section><h2>GENERATION LEDGER</h2><table id="gens"><tr><th>id</th><th>timestamp</th><th>provider</th><th>model</th><th>status</th><th>cost</th><th>frames</th><th>prompt</th><th>artifact</th></tr></table><div id="frames"></div></section>
  <section><h2>PROVIDER FLEET</h2><div class="fleet" id="fleet"></div></section>
  <section><h2>TIMESTAMPED EVENTS (.timmy/runs/events.jsonl)</h2><pre id="events">loading…</pre></section>
</main>
<script>
var FLEET = ${JSON.stringify(fleet)};
var ROOT = ${JSON.stringify(cwd)};
function el(t){return document.createElement(t)}
function rel(p){return p && p.indexOf(ROOT)===0 ? p.slice(ROOT.length) : null}
function draw(gens){
  var t=document.getElementById('gens');
  while(t.rows.length>1)t.deleteRow(1);
  var fr=document.getElementById('frames');fr.innerHTML='';
  gens.slice().reverse().forEach(function(g){
    var r=t.insertRow();
    r.insertCell().textContent=g.id;
    r.insertCell().textContent=(g.created_at||'').replace('T',' ').slice(0,19);
    r.insertCell().textContent=g.provider;
    r.insertCell().textContent=g.model||'';
    var c=r.insertCell();c.textContent=g.status;c.className=g.status;
    r.insertCell().textContent=g.cost_usd!=null?'$'+g.cost_usd.toFixed(3):'';
    r.insertCell().textContent=g.frameCount||'';
    r.insertCell().textContent=g.prompt.length>70?g.prompt.slice(0,70)+'…':g.prompt;
    r.insertCell().textContent=g.artifact||'';
    var d=rel(g.framesDir);
    if(d&&g.frameCount){
      var wrap=el('div');wrap.className='frames';
      var n=Math.min(g.frameCount,8);
      for(var i=1;i<=n;i++){
        var img=el('img');
        img.src='/'+d+'/frame_'+String(i).padStart(4,'0')+'.png';
        img.title=g.id+' frame '+i;
        wrap.appendChild(img);
      }
      fr.appendChild(wrap);
    }
  });
}
function refresh(){
  fetch('/.timmy/generations.json').then(function(r){return r.ok?r.json():{generations:[]}}).then(function(d){draw(d.generations||[])}).catch(function(){});
  fetch('/.timmy/runs/events.jsonl').then(function(r){return r.ok?r.text():''}).then(function(t){
    var lines=t.split('\\n').filter(Boolean).slice(-25);
    document.getElementById('events').textContent=lines.join('\\n')||'(no events yet)';
  }).catch(function(){});
}
var f=document.getElementById('fleet');
FLEET.forEach(function(p){
  var s=el('span');s.className='chip';
  s.innerHTML='<b>'+p.id+'</b> '+p.kind+' · '+p.transport+(p.model?' · '+p.model:'');
  f.appendChild(s);
});
refresh();setInterval(refresh,5000);
</script>
</body>
</html>
`;
}

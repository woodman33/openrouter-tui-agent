// The bus side of Slate 3D: which lane an event belongs to, what colour class
// it carries, and three ways to receive events. The viewer only reads.
//
// sources
//   ws    the companion server's WebSocket ({type:'bus.tail'} then {type:'bus'})
//   sse   an EventSource URL that streams one event JSON per message
//   room  a Durable Object room speaking the runs/events contract
//         (GET <worker>/runs/<room>/events, polled)

const KIND_ALIASES = { comfy: 'comfyui', oapi: 'openapi', roboflow: 'roboflow', openhands: 'openhands', apify: 'apify', hyperframes: 'hyperframes', defold: 'defold', blender: 'blender', godot: 'godot', unity: 'unity' };

export function laneOf(ev, lanes) {
  const p = ev.payload ?? {};
  if (typeof p.harness === 'string' && lanes.has(p.harness)) return p.harness;
  if (typeof p.lane === 'string' && lanes.has(p.lane)) return p.lane;
  const head = String(ev.kind ?? '').split('.')[0];
  const k = KIND_ALIASES[head] ?? head;
  if (lanes.has(k)) return k;
  if (ev.kind === 'receipt.sealed') {
    const s = String(p.subject ?? '').split(/[.\s:/]/)[0];
    if (lanes.has(s)) return s;
  }
  return null;
}

export function classOf(ev) {
  const k = String(ev.kind ?? '');
  const status = String(ev.payload?.status ?? '');
  if (/denied$/.test(k)) return 'refusal';
  if (k.startsWith('approval.') || k === 'dispatch.armed') return 'human';
  if (/failed$/.test(k) || status === 'failed') return 'failed';
  if (k.startsWith('slate.')) return 'slate';
  if (k === 'receipt.sealed' || k.startsWith('dispatch.') || k.startsWith('run.') || /(done|completed|ok|planned|judged)$/.test(k)) return 'chain';
  return 'other';
}

export function connectBus(opts, onEvent, onStatus) {
  const { source = 'ws', sse, room, worker } = opts;
  let closed = false;
  const status = (live, text) => onStatus?.({ live, text, source });

  if (source === 'sse' && sse) {
    const es = new EventSource(sse);
    es.onopen = () => status(true, 'bus live');
    es.onerror = () => status(false, 'bus reconnecting');
    es.onmessage = (m) => { try { onEvent(JSON.parse(m.data), { tail: false }); } catch { /* skip bad line */ } };
    return { close: () => es.close() };
  }

  if (source === 'room' && room && worker) {
    const seen = new Set();
    let first = true;
    const base = worker.replace(/\/$/, '');
    const tick = async () => {
      if (closed) return;
      try {
        const r = await fetch(`${base}/runs/${encodeURIComponent(room)}/events`, { cache: 'no-store' });
        const j = await r.json();
        const arr = Array.isArray(j) ? j : (j.events ?? []);
        for (const e of arr) {
          const id = e.id ?? `${e.timestamp}:${e.type}`;
          if (seen.has(id)) continue;
          seen.add(id);
          let payload = e.payload ?? e.payload_json ?? {};
          if (typeof payload === 'string') { try { payload = JSON.parse(payload); } catch { payload = {}; } }
          onEvent({ v: 1, ts: e.timestamp ?? e.ts, kind: e.type ?? e.kind, payload }, { tail: first });
        }
        status(true, `room ${room} live`);
      } catch {
        status(false, `room ${room} unreachable`);
      }
      first = false;
      setTimeout(tick, 2000);
    };
    tick();
    return { close: () => { closed = true; } };
  }

  // default: the companion WebSocket on the same origin
  let ws;
  let backoff = 500;
  const open = () => {
    if (closed) return;
    ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`);
    ws.onopen = () => { backoff = 500; status(true, 'bus live'); ws.send(JSON.stringify({ type: 'hello', client: 'slate3d' })); };
    ws.onclose = () => { status(false, 'bus reconnecting'); if (!closed) setTimeout(open, (backoff = Math.min(backoff * 2, 8000))); };
    ws.onerror = () => { /* onclose follows */ };
    ws.onmessage = (m) => {
      let msg;
      try { msg = JSON.parse(m.data); } catch { return; }
      if (msg.type === 'bus.tail' && Array.isArray(msg.events)) for (const e of msg.events) onEvent(e, { tail: true });
      else if (msg.type === 'bus' && msg.event) onEvent(msg.event, { tail: false });
    };
  };
  open();
  return { close: () => { closed = true; ws?.close(); } };
}

// SlateRoom — the sync room for Slate boards (Slate 3D decision 2). One
// Durable Object per room name; SQLite-backed, append-only; the same
// runs/events contract as the repo's existing companion Durable Object, plus
// a hibernating WebSocket that pushes every new event as {type:'bus', event}.
// The room never spawns work: it stores and relays envelopes, nothing else.
import { DurableObject } from 'cloudflare:workers';
import { corsHeaders, normalizeEvent, parseRunsPath, wireEvent, type RoomEvent } from './room-core.js';

const TAIL = 200;
const json = (body: unknown, status = 200): Response => Response.json(body, { status, headers: corsHeaders() });

export class SlateRoom extends DurableObject {
  private ready = false;

  private init(): void {
    if (this.ready) return;
    this.ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS events (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      id TEXT UNIQUE NOT NULL,
      ts TEXT NOT NULL,
      kind TEXT NOT NULL,
      payload TEXT NOT NULL
    )`);
    this.ready = true;
  }

  private rows(since: number, limit: number): RoomEvent[] {
    const cur = since > 0
      ? this.ctx.storage.sql.exec('SELECT seq, id, ts, kind, payload FROM events WHERE seq > ? ORDER BY seq ASC LIMIT ?', since, limit)
      : this.ctx.storage.sql.exec('SELECT seq, id, ts, kind, payload FROM (SELECT * FROM events ORDER BY seq DESC LIMIT ?) ORDER BY seq ASC', limit);
    return [...cur].map((r) => ({ seq: Number(r.seq), id: String(r.id), ts: String(r.ts), kind: String(r.kind), payload: JSON.parse(String(r.payload)) as Record<string, unknown> }));
  }

  private append(e: RoomEvent): RoomEvent | null {
    const dup = [...this.ctx.storage.sql.exec('SELECT seq FROM events WHERE id = ?', e.id)];
    if (dup.length) return null;
    this.ctx.storage.sql.exec('INSERT INTO events (id, ts, kind, payload) VALUES (?, ?, ?, ?)', e.id, e.ts, e.kind, JSON.stringify(e.payload));
    const seq = Number([...this.ctx.storage.sql.exec('SELECT seq FROM events WHERE id = ?', e.id)][0]?.seq);
    return { ...e, seq };
  }

  private broadcast(msg: unknown): number {
    const text = JSON.stringify(msg);
    let n = 0;
    for (const ws of this.ctx.getWebSockets()) {
      try { ws.send(text); n++; } catch { /* closed */ }
    }
    return n;
  }

  async fetch(request: Request): Promise<Response> {
    this.init();
    const url = new URL(request.url);
    const parsed = parseRunsPath(url.pathname);
    if (!parsed) return json({ ok: false, error: 'not a runs route' }, 404);
    const { room, action } = parsed;

    if (action === 'ws') {
      if (request.headers.get('Upgrade') !== 'websocket') return json({ ok: false, error: 'expected websocket upgrade' }, 426);
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];
      this.ctx.acceptWebSocket(server);
      server.send(JSON.stringify({ type: 'bus.tail', room, events: this.rows(0, TAIL).map(wireEvent) }));
      return new Response(null, { status: 101, webSocket: client });
    }

    if (action === 'events' && request.method === 'GET') {
      const since = Number(url.searchParams.get('since') ?? 0);
      const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get('limit') ?? TAIL)));
      const events = this.rows(since, limit);
      return json({ ok: true, room, events: events.map(wireEvent), next: events.length ? events[events.length - 1].seq : since, viewers: this.ctx.getWebSockets().length });
    }

    if (action === 'get' && request.method === 'GET') {
      const count = Number([...this.ctx.storage.sql.exec('SELECT COUNT(*) AS n FROM events')][0]?.n ?? 0);
      return json({ ok: true, room, events: count, viewers: this.ctx.getWebSockets().length });
    }

    if (action === 'event' && request.method === 'POST') {
      let body: unknown;
      try { body = await request.json(); } catch { return json({ ok: false, error: 'bad json' }, 400); }
      const items = Array.isArray(body) ? body : [body];
      const stored: RoomEvent[] = [];
      let skipped = 0;
      for (const it of items.slice(0, 500)) {
        const e = normalizeEvent(it);
        if (!e) { skipped++; continue; }
        const s = this.append(e);
        if (s) stored.push(s); else skipped++;
      }
      for (const s of stored) this.broadcast({ type: 'bus', room, event: wireEvent(s) });
      return json({ ok: true, room, stored: stored.length, skipped, next: stored.length ? stored[stored.length - 1].seq : null });
    }

    if (action === 'create' && request.method === 'POST') {
      return json({ ok: true, room, note: 'rooms exist on first write; nothing to create' });
    }

    return json({ ok: false, error: 'method not allowed' }, 405);
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // viewers only read; a hello gets the tail again
    if (typeof message === 'string' && message.includes('hello')) {
      ws.send(JSON.stringify({ type: 'bus.tail', events: this.rows(0, TAIL).map(wireEvent) }));
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    try { ws.close(); } catch { /* already closed */ }
  }
}

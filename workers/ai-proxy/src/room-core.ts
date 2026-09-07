// SlateRoom contract, pure part. The room speaks the runs/events contract of
// the repo's existing Durable Object (POST /runs/create, POST /runs/:id/event,
// GET /runs/:id/events) plus a WebSocket at GET /runs/:id/ws. Events are the
// bus envelope {v, ts, kind, payload}; the old {type, timestamp} spelling is
// accepted on input and echoed back so both readers work.

export interface RoomEvent {
  seq?: number;
  id: string;
  ts: string;
  kind: string;
  payload: Record<string, unknown>;
}

export type RunsAction = 'create' | 'event' | 'events' | 'ws' | 'get';

export function parseRunsPath(pathname: string): { room: string; action: RunsAction } | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'runs') return null;
  if (parts.length === 2 && parts[1] === 'create') return { room: '', action: 'create' };
  if (parts.length === 2) return { room: decodeURIComponent(parts[1]), action: 'get' };
  if (parts.length === 3 && ['event', 'events', 'ws'].includes(parts[2])) return { room: decodeURIComponent(parts[1]), action: parts[2] as RunsAction };
  return null;
}

const ROOM_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/;
export const validRoom = (room: string): boolean => ROOM_RE.test(room);

export function normalizeEvent(body: unknown, now: () => string = () => new Date().toISOString()): RoomEvent | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const kind = typeof b.kind === 'string' ? b.kind : typeof b.type === 'string' ? b.type : '';
  if (!kind || kind.length > 120) return null;
  const ts = typeof b.ts === 'string' ? b.ts : typeof b.timestamp === 'string' ? b.timestamp : now();
  if (Number.isNaN(Date.parse(ts))) return null;
  const payload = b.payload && typeof b.payload === 'object' && !Array.isArray(b.payload) ? (b.payload as Record<string, unknown>) : {};
  const id = typeof b.id === 'string' && b.id.length <= 80 ? b.id : `evt_${Math.random().toString(36).slice(2, 11)}`;
  return { id, ts, kind, payload };
}

/** Wire shape: both spellings, so the existing DO's readers and the bus readers agree. */
export function wireEvent(e: RoomEvent): Record<string, unknown> {
  return { v: 1, seq: e.seq, id: e.id, ts: e.ts, timestamp: e.ts, kind: e.kind, type: e.kind, payload: e.payload };
}

export const corsHeaders = (): Record<string, string> => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type'
});

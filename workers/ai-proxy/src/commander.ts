// Commander — the commander loop as a Cloudflare Agents SDK durable agent
// (one Durable Object per room, SQLite-backed). mindship-v5c2 step 2.
//
//   memory     : SQL tables (turns, memory, receipts) + synced state
//   schedule   : this.schedule() steps that run the mind later (skipped, and
//                receipted as skipped, while held or killed)
//   websocket  : GET /commander/:room/ws — every state change and receipt is
//                pushed as {type:'commander.event'}; commands are accepted
//                over the socket with the caller token
//   mind       : OpenRouter (commander-core.chatOnce), modes generate /
//                bodybuilder / fusion
//   hands      : Code Mode (runCode in a Dynamic Worker isolate) when the mind
//                answers with a script
//   handoff    : POST /handoff → any MCP-capable harness holds the role with a
//                hold token; OpenRouter is paused until POST /release; the
//                holder posts its own turns to POST /turn
//   spend      : live ledger in state, cap in state (POST /cap), kill switch
//                POST /kill (POST /revive to resume)
//
// Every mutation seals one receipt on the room's edge chain (subject
// commander:<room>) stored in SQL and mirrored to CUSTODY_KV as
// chain:commander:<room>, so the daily head lists it like every other chain.
import { Agent, type Connection, type ConnectionContext, type WSMessage } from 'agents';
import { DynamicWorkerExecutor } from '@cloudflare/codemode';
import { HttpError, type Executor } from './code.js';
import { type EdgeReceipt, verifyEdgeChain } from './chain.js';
import { type Env } from './tools.js';
import { corsHeaders } from './room-core.js';
import {
  type CommanderAction, type CommanderState, type HandoffRequest, type HolderTurn, type TurnRequest,
  applyCap, applyHandoff, applyKill, applyMode, applyRelease, applyRevive, applySpend, canThink, capFromEnv,
  commanderChainKey, executeTurn, holderTurnData, initialCommanderState, isReadAction, newTurnId, parseCommanderPath,
  sealCommander, turnReceiptData, type CommanderReceiptKind
} from './commander-core.js';

export type CommanderEnv = Env & { COMMANDER_SPEND_CAP_USD?: string; LOADER?: unknown };

const TAIL_TURNS = 20;
const json = (body: unknown, status = 200): Response => Response.json(body, { status, headers: corsHeaders() });

interface TurnRow { id: string; ts: string; mode: string; by: string; source: string; status: string; usd: number; receipt: string; task: string; answer: string }

export class Commander extends Agent<CommanderEnv, CommanderState> {
  initialState: CommanderState = initialCommanderState('', '1970-01-01T00:00:00.000Z');
  private tables = false;

  private ensureTables(): void {
    if (this.tables) return;
    this.sql`CREATE TABLE IF NOT EXISTS turns (id TEXT PRIMARY KEY, ts TEXT NOT NULL, mode TEXT NOT NULL, by TEXT NOT NULL, source TEXT NOT NULL, status TEXT NOT NULL, usd REAL NOT NULL, receipt TEXT NOT NULL, task TEXT NOT NULL, answer TEXT NOT NULL)`;
    this.sql`CREATE TABLE IF NOT EXISTS memory (k TEXT PRIMARY KEY, v TEXT NOT NULL, ts TEXT NOT NULL)`;
    this.sql`CREATE TABLE IF NOT EXISTS receipts (seq INTEGER PRIMARY KEY AUTOINCREMENT, hash TEXT UNIQUE NOT NULL, kind TEXT NOT NULL, ts TEXT NOT NULL, body TEXT NOT NULL)`;
    this.tables = true;
  }

  async onStart(): Promise<void> {
    this.ensureTables();
    if (!this.state.room || this.state.room !== this.name) {
      const now = new Date().toISOString();
      this.setState({ ...initialCommanderState(this.name, now, capFromEnv(this.env)), ...(this.state.room === this.name ? this.state : {}), room: this.name });
    }
  }

  // ------------------------------------------------------------ chain

  private chain(): EdgeReceipt[] {
    this.ensureTables();
    return [...this.sql<{ body: string }>`SELECT body FROM receipts ORDER BY seq ASC`].map((r) => JSON.parse(r.body) as EdgeReceipt);
  }

  private async seal(kind: CommanderReceiptKind, data: Record<string, unknown>): Promise<EdgeReceipt> {
    const chain = this.chain();
    const rec = await sealCommander(chain, this.name, kind, data);
    this.sql`INSERT INTO receipts (hash, kind, ts, body) VALUES (${rec.hash}, ${rec.kind}, ${rec.ts}, ${JSON.stringify(rec)})`;
    if (this.env.CUSTODY_KV) {
      try { await this.env.CUSTODY_KV.put(commanderChainKey(this.name), JSON.stringify(chain)); } catch { /* KV mirror is best effort; SQL is the record */ }
    }
    return rec;
  }

  private commit(state: CommanderState, rec: EdgeReceipt, extra: Record<string, unknown> = {}): void {
    this.setState({ ...state, head: rec.hash, updated_at: rec.ts });
    this.broadcast(JSON.stringify({ type: 'commander.event', room: this.name, kind: rec.kind, receipt: { id: rec.id, hash: rec.hash, ts: rec.ts, data: rec.data }, state: this.state, ...extra }));
  }

  private turns(limit = TAIL_TURNS): TurnRow[] {
    this.ensureTables();
    return [...this.sql<TurnRow>`SELECT id, ts, mode, by, source, status, usd, receipt, task, answer FROM (SELECT * FROM turns ORDER BY ts DESC LIMIT ${limit}) ORDER BY ts ASC`];
  }

  private authed(token: string | undefined): boolean {
    return !!this.env.TIMMY_EDGE_TOKEN && token === this.env.TIMMY_EDGE_TOKEN;
  }

  private executor(): Executor | undefined {
    if (!this.env.LOADER) return undefined;
    return new DynamicWorkerExecutor({ loader: this.env.LOADER as never, timeout: 60_000 }) as unknown as Executor;
  }

  // ------------------------------------------------------------ commands (shared by http + ws + schedule)

  async cmdThink(body: TurnRequest, source: string): Promise<Record<string, unknown>> {
    const gate = canThink(this.state);
    if (!gate.ok) throw new HttpError(gate.status, gate.reason);
    const mode = body.mode ?? this.state.mode;
    const req: TurnRequest = { ...body, source };
    const r = await executeTurn(req, mode, { env: this.env, executor: this.executor() });
    const now = new Date().toISOString();
    const spent = applySpend(this.state, r.calls, now);
    const rec = await this.seal('commander.turn', await turnReceiptData(req, r, 'openrouter'));
    this.sql`INSERT INTO turns (id, ts, mode, by, source, status, usd, receipt, task, answer) VALUES (${r.turn_id}, ${now}, ${r.mode}, ${'openrouter'}, ${source}, ${r.ok ? 'ok' : 'failed'}, ${r.usd}, ${rec.hash}, ${String(body.task).slice(0, 20000)}, ${r.answer.slice(0, 60000)})`;
    this.commit({ ...spent, turns: spent.turns + 1, last_turn: r.turn_id }, rec, { turn: { id: r.turn_id, ok: r.ok, usd: r.usd, mode: r.mode } });
    return { ok: r.ok, turn_id: r.turn_id, mode: r.mode, answer: r.answer, outputs: r.outputs, calls: r.calls, hands: r.hands, hands_note: r.hands_note, usd: r.usd, ms: r.ms, receipt: rec, spend: this.state.spend };
  }

  async cmdTurn(body: HolderTurn): Promise<Record<string, unknown>> {
    const id = newTurnId(Date.now());
    const data = await holderTurnData(this.state, body, id);
    const now = new Date().toISOString();
    const rec = await this.seal('commander.turn', data);
    this.sql`INSERT INTO turns (id, ts, mode, by, source, status, usd, receipt, task, answer) VALUES (${id}, ${now}, ${'held'}, ${String(data.by)}, ${'handoff'}, ${'ok'}, ${0}, ${rec.hash}, ${String(body.asked ?? '').slice(0, 20000)}, ${String(body.did).slice(0, 60000)})`;
    this.commit({ ...this.state, turns: this.state.turns + 1, last_turn: id }, rec, { turn: { id, by: data.by } });
    return { ok: true, turn_id: id, receipt: rec };
  }

  async cmdHandoff(body: HandoffRequest): Promise<Record<string, unknown>> {
    const now = new Date().toISOString();
    const h = await applyHandoff(this.state, body, now);
    const rec = await this.seal('commander.handoff', h.data);
    this.commit(h.state, rec);
    // The hold token travels back exactly once and is never stored.
    return { ok: true, hold_token: h.token, held_by: h.state.held_by, openrouter_paused: true, receipt: rec };
  }

  async cmdRelease(body: { hold_token?: string; force?: boolean }, operator: boolean): Promise<Record<string, unknown>> {
    const now = new Date().toISOString();
    const r = await applyRelease(this.state, body.hold_token, now, !!body.force && operator);
    const rec = await this.seal('commander.release', r.data);
    this.commit(r.state, rec);
    return { ok: true, released: r.data, receipt: rec };
  }

  async cmdKill(body: { reason?: string }): Promise<Record<string, unknown>> {
    const now = new Date().toISOString();
    const k = applyKill(this.state, now, body.reason);
    const cancelled: string[] = [];
    for (const s of this.getSchedules()) { if (await this.cancelSchedule(s.id)) cancelled.push(s.id); }
    const rec = await this.seal('commander.kill', { ...k.data, schedules_cancelled: cancelled });
    this.commit(k.state, rec);
    return { ok: true, killed: true, schedules_cancelled: cancelled, receipt: rec };
  }

  async cmdRevive(): Promise<Record<string, unknown>> {
    const now = new Date().toISOString();
    const r = applyRevive(this.state, now);
    const rec = await this.seal('commander.revive', r.data);
    this.commit(r.state, rec);
    return { ok: true, killed: false, receipt: rec };
  }

  async cmdMode(body: { mode?: unknown }): Promise<Record<string, unknown>> {
    const now = new Date().toISOString();
    const m = applyMode(this.state, body.mode, now);
    const rec = await this.seal('commander.mode', m.data);
    this.commit(m.state, rec);
    return { ok: true, mode: m.state.mode, receipt: rec };
  }

  async cmdCap(body: { cap_usd?: unknown }): Promise<Record<string, unknown>> {
    const now = new Date().toISOString();
    const c = applyCap(this.state, body.cap_usd, now);
    const rec = await this.seal('commander.cap', c.data);
    this.commit(c.state, rec);
    return { ok: true, spend: c.state.spend, receipt: rec };
  }

  async cmdSchedule(body: { task?: string; mode?: unknown; in?: number; at?: string; cron?: string; models?: string[]; judge?: string }): Promise<Record<string, unknown>> {
    if (this.state.killed) throw new HttpError(423, 'killed: revive before scheduling');
    const task = String(body.task ?? '').trim();
    if (!task) throw new HttpError(400, 'task required');
    let when: number | Date | string;
    let kind: string;
    if (typeof body.cron === 'string' && body.cron.trim()) { when = body.cron.trim(); kind = 'cron'; }
    else if (typeof body.at === 'string' && !Number.isNaN(Date.parse(body.at))) { when = new Date(body.at); kind = 'at'; }
    else { const s = Number(body.in ?? 60); if (!Number.isFinite(s) || s < 1 || s > 30 * 86400) throw new HttpError(400, 'in: seconds in [1, 2592000]'); when = s; kind = 'delay'; }
    const payload = { task, mode: body.mode, models: body.models, judge: body.judge };
    const s = await this.schedule(when, 'scheduledThink', payload);
    const rec = await this.seal('commander.schedule', { schedule_id: s.id, kind, when: String(body.cron ?? body.at ?? body.in ?? 60), time: s.time, task_preview: task.slice(0, 200), mode: body.mode ?? this.state.mode });
    this.commit(this.state, rec, { schedule: { id: s.id, time: s.time } });
    return { ok: true, schedule: { id: s.id, time: s.time, kind }, receipt: rec };
  }

  async cmdCancel(body: { id?: string }): Promise<Record<string, unknown>> {
    const id = String(body.id ?? '');
    const ok = id ? await this.cancelSchedule(id) : false;
    const rec = await this.seal('commander.cancel', { schedule_id: id, cancelled: ok });
    this.commit(this.state, rec);
    return { ok, schedule_id: id, receipt: rec };
  }

  async cmdRemember(body: { k?: string; v?: unknown; forget?: boolean }): Promise<Record<string, unknown>> {
    const k = String(body.k ?? '').trim().slice(0, 120);
    if (!k) throw new HttpError(400, 'k required');
    const now = new Date().toISOString();
    if (body.forget) this.sql`DELETE FROM memory WHERE k = ${k}`;
    else this.sql`INSERT INTO memory (k, v, ts) VALUES (${k}, ${JSON.stringify(body.v ?? null).slice(0, 8000)}, ${now}) ON CONFLICT(k) DO UPDATE SET v = excluded.v, ts = excluded.ts`;
    const n = Number([...this.sql<{ n: number }>`SELECT COUNT(*) AS n FROM memory`][0]?.n ?? 0);
    const rec = await this.seal('commander.remember', { k, forget: !!body.forget, notes: n });
    this.commit({ ...this.state, memory_notes: n }, rec);
    return { ok: true, k, notes: n, receipt: rec };
  }

  /** Scheduled step handler: runs the mind later, or seals the skip when it may not. */
  async scheduledThink(payload: { task: string; mode?: unknown; models?: string[]; judge?: string }): Promise<void> {
    const gate = canThink(this.state);
    if (!gate.ok) {
      const rec = await this.seal('commander.turn', { turn_id: newTurnId(Date.now()), by: 'schedule', source: 'schedule', mode: this.state.mode, ok: false, skipped: true, reason: gate.reason, usd: 0 });
      this.commit(this.state, rec, { skipped: gate.reason });
      return;
    }
    const mode = payload.mode;
    await this.cmdThink({ task: payload.task, models: payload.models, judge: payload.judge, ...(typeof mode === 'string' ? { mode: mode as TurnRequest['mode'] } : {}) }, 'schedule');
  }

  // ------------------------------------------------------------ reads

  private read(action: CommanderAction, url: URL): Record<string, unknown> {
    switch (action) {
      case 'state': return { ok: true, room: this.name, state: this.state, viewers: [...this.getConnections()].length, schedules: this.getSchedules().length };
      case 'spend': return { ok: true, room: this.name, spend: this.state.spend, killed: this.state.killed, held: !!this.state.held_by, openrouter_paused: this.state.openrouter_paused };
      case 'turns': return { ok: true, room: this.name, turns: this.turns(Math.min(200, Math.max(1, Number(url.searchParams.get('limit') ?? TAIL_TURNS)))) };
      case 'receipts': { const chain = this.chain(); return { ok: true, room: this.name, count: chain.length, receipts: chain.slice(-Math.min(500, Math.max(1, Number(url.searchParams.get('limit') ?? 50)))) }; }
      case 'schedules': return { ok: true, room: this.name, schedules: this.getSchedules().map((s) => ({ id: s.id, callback: s.callback, time: s.time, type: s.type, payload: s.payload })) };
      case 'memory': return { ok: true, room: this.name, memory: [...this.sql<{ k: string; v: string; ts: string }>`SELECT k, v, ts FROM memory ORDER BY ts DESC LIMIT 200`].map((r) => ({ k: r.k, v: JSON.parse(r.v), ts: r.ts })) };
      default: return { ok: false, error: 'not a read' };
    }
  }

  private async write(action: CommanderAction, body: Record<string, unknown>, source: string, operator: boolean): Promise<Record<string, unknown>> {
    switch (action) {
      case 'think': return this.cmdThink(body as unknown as TurnRequest, source);
      case 'turn': return this.cmdTurn(body as unknown as HolderTurn);
      case 'handoff': return this.cmdHandoff(body as unknown as HandoffRequest);
      case 'release': return this.cmdRelease(body as { hold_token?: string; force?: boolean }, operator);
      case 'kill': return this.cmdKill(body as { reason?: string });
      case 'revive': return this.cmdRevive();
      case 'mode': return this.cmdMode(body);
      case 'cap': return this.cmdCap(body);
      case 'schedule': return this.cmdSchedule(body as Parameters<Commander['cmdSchedule']>[0]);
      case 'cancel': return this.cmdCancel(body as { id?: string });
      case 'remember': return this.cmdRemember(body as { k?: string; v?: unknown; forget?: boolean });
      default: throw new HttpError(405, 'not a command');
    }
  }

  // ------------------------------------------------------------ http

  async onRequest(request: Request): Promise<Response> {
    this.ensureTables();
    const url = new URL(request.url);
    const parsed = parseCommanderPath(url.pathname);
    if (!parsed) return json({ ok: false, error: 'not a commander route' }, 404);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
    const { action } = parsed;
    if (isReadAction(action)) {
      if (action === 'ws') return json({ ok: false, error: 'expected websocket upgrade' }, 426);
      if (action === 'receipts' && url.searchParams.get('verify') === '1') {
        const chain = this.chain();
        return json({ ok: true, room: this.name, verify: await verifyEdgeChain(chain), count: chain.length });
      }
      return json(this.read(action, url));
    }
    if (request.method !== 'POST') return json({ ok: false, error: 'method not allowed' }, 405);
    // /turn and /release are the holder's calls: authenticated by the hold token, not the operator token.
    const operator = this.authed((request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, ''));
    if (!operator && action !== 'turn' && action !== 'release') return json({ ok: false, error: 'unauthorized' }, 401);
    let body: Record<string, unknown> = {};
    try { const t = await request.text(); body = t ? (JSON.parse(t) as Record<string, unknown>) : {}; } catch { return json({ ok: false, error: 'bad json' }, 400); }
    try {
      return json(await this.write(action, body, 'http', operator));
    } catch (e) {
      if (e instanceof HttpError) return json({ ok: false, error: e.message, state: this.state }, e.status);
      return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
    }
  }

  // ------------------------------------------------------------ websocket (TUI + companion)

  async onConnect(connection: Connection, _ctx: ConnectionContext): Promise<void> {
    this.ensureTables();
    connection.send(JSON.stringify({ type: 'commander.hello', room: this.name, state: this.state, turns: this.turns(), schedules: this.getSchedules().length }));
  }

  async onMessage(connection: Connection, message: WSMessage): Promise<void> {
    if (typeof message !== 'string') return;
    let msg: { cmd?: string; token?: string; body?: Record<string, unknown>; id?: unknown };
    try { msg = JSON.parse(message) as typeof msg; } catch { connection.send(JSON.stringify({ type: 'commander.reply', ok: false, error: 'bad json' })); return; }
    const cmd = String(msg.cmd ?? 'state') as CommanderAction;
    const reply = (r: Record<string, unknown>, status = 200) => connection.send(JSON.stringify({ type: 'commander.reply', cmd, id: msg.id ?? null, status, ...r }));
    if (cmd === 'hello' as string) { reply({ ok: true, room: this.name, state: this.state, turns: this.turns() }); return; }
    if (isReadAction(cmd)) { reply(this.read(cmd, new URL(`https://ws.local/commander/${encodeURIComponent(this.name)}/${cmd}`))); return; }
    const operator = this.authed(msg.token);
    if (!operator && cmd !== 'turn' && cmd !== 'release') { reply({ ok: false, error: 'unauthorized' }, 401); return; }
    try {
      reply(await this.write(cmd, msg.body ?? {}, 'ws', operator));
    } catch (e) {
      if (e instanceof HttpError) reply({ ok: false, error: e.message }, e.status);
      else reply({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
    }
  }

  async onClose(connection: Connection): Promise<void> {
    try { connection.close(); } catch { /* already closed */ }
  }
}

// Hermes TUI Gateway JSON-RPC client and connection lifecycle.
//
// ALL Hermes wire-format assumptions live in THIS file (per
// docs/HERMES_TIMMY_ADDITIONS.md Phase 1: "Keep all Hermes assumptions in one
// file"). Contract of record: NousResearch/hermes-agent `tui_gateway/`
// (server.py = JSON-RPC dispatcher, transport.py = newline-delimited stdio
// frames, ws.py = WebSocket transport at /api/ws inside the dashboard server).
//
// Verified contract (2026-07-02, hermes-agent main):
// - JSON-RPC 2.0, newline-delimited: one JSON object per line.
// - Default transport is the stdio of a spawned gateway child process whose
//   stdout carries ONLY JSON frames (print() is redirected to stderr). The
//   gateway must run unbuffered (PYTHONUNBUFFERED=1) or clients hang.
// - Handshake: the gateway emits a `gateway.ready` event immediately after
//   startup/accept; clients block on it before issuing requests.
// - Requests:  {"jsonrpc":"2.0","id":n,"method":"<name>","params":{...}}
// - Responses: {"jsonrpc":"2.0","id":n,"result":{...}} or
//              {"jsonrpc":"2.0","id":n,"error":{"code":...,"message":...}}
// - Events:    {"jsonrpc":"2.0","method":"event",
//               "params":{"type":"<event>","session_id":"<sid>","payload":{...}}}
// - Interactive gates: approval/clarify/sudo/secret `.request` events block
//   server-side (default 300s) until the matching `.respond` method is called
//   with {request_id, answer}. (Param key names are high-confidence but were
//   extracted from a summarized read of server.py — see UNVERIFIED below.)
//
// UNVERIFIED assumptions, kept here so they are trivial to correct:
// - `prompt.submit` params are assumed to be {session_id, prompt}.
// - `session.create` result is assumed to carry the new session id under one
//   of `session_id` | `sessionId` | `id`.
// - `.respond` param keys are assumed to be {request_id, answer}.

import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import type { Readable, Writable } from 'stream';
import { WebSocket } from 'ws';

export type HermesConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'ready'
  | 'closed'
  | 'error';

/** Raw event notification exactly as the gateway frames it. */
export interface HermesGatewayEvent {
  type: string;
  sessionId: string;
  payload: Record<string, unknown>;
}

export interface HermesConnectionConfig {
  mode: 'ws' | 'spawn' | 'none';
  /** ws:// or wss:// URL when mode === 'ws'. */
  url?: string;
  /** Executable + args when mode === 'spawn'. */
  command?: string;
  args?: string[];
  /** Human hint shown in the disconnected state. Never contains secrets. */
  hint: string;
}

/**
 * Resolve how to reach a Hermes gateway from the environment.
 * TIMMY_HERMES_URL (ws://...) wins, then TIMMY_HERMES_CMD (a command line that
 * starts a gateway speaking newline-delimited JSON-RPC on stdout). With
 * neither set, TIMMY stays cleanly disconnected — Hermes is optional.
 */
export function resolveHermesConnectionConfig(
  env: Record<string, string | undefined> = process.env,
): HermesConnectionConfig {
  const url = (env.TIMMY_HERMES_URL || '').trim();
  if (url) {
    if (url.startsWith('ws://') || url.startsWith('wss://')) {
      return { mode: 'ws', url, hint: 'TIMMY_HERMES_URL' };
    }
    return {
      mode: 'none',
      hint: 'TIMMY_HERMES_URL must be a ws:// or wss:// URL',
    };
  }
  const cmd = (env.TIMMY_HERMES_CMD || '').trim();
  if (cmd) {
    const parts = cmd.split(/\s+/).filter(Boolean);
    return {
      mode: 'spawn',
      command: parts[0],
      args: parts.slice(1),
      hint: 'TIMMY_HERMES_CMD',
    };
  }
  return {
    mode: 'none',
    hint: 'Set TIMMY_HERMES_URL (ws://...) or TIMMY_HERMES_CMD to connect',
  };
}

export interface HermesClientOptions {
  config?: HermesConnectionConfig;
  /** Injected streams for tests: frames written to `input`, read from `output`. */
  streams?: { input: Writable; output: Readable };
  requestTimeoutMs?: number;
  /** How long to wait for gateway.ready before declaring the connection dead. */
  handshakeTimeoutMs?: number;
  onEvent?: (event: HermesGatewayEvent) => void;
  onStatus?: (status: HermesConnectionStatus, detail?: string) => void;
  /** Bounded gateway stderr lines, for diagnostics only — never persisted. */
  onStderr?: (line: string) => void;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_HANDSHAKE_TIMEOUT_MS = 15_000;

export class HermesClient {
  private readonly config: HermesConnectionConfig;
  private readonly options: HermesClientOptions;
  private child: ChildProcessWithoutNullStreams | null = null;
  private ws: WebSocket | null = null;
  private writeStream: Writable | null = null;
  private status: HermesConnectionStatus = 'disconnected';
  private nextRequestId = 1;
  private pending = new Map<number, PendingRequest>();
  private lineBuffer = '';
  private handshakeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: HermesClientOptions = {}) {
    this.options = options;
    this.config = options.config ?? resolveHermesConnectionConfig();
  }

  getStatus(): HermesConnectionStatus {
    return this.status;
  }

  getConfig(): HermesConnectionConfig {
    return this.config;
  }

  connect(): void {
    if (this.status === 'connecting' || this.status === 'ready') return;
    if (this.options.streams) {
      this.writeStream = this.options.streams.input;
      this.options.streams.output.on('data', (chunk: Buffer | string) =>
        this.ingest(chunk.toString()),
      );
      this.setStatus('connecting', 'waiting for gateway.ready');
      this.armHandshakeTimer();
      return;
    }
    if (this.config.mode === 'ws' && this.config.url) {
      this.connectWebSocket(this.config.url);
      return;
    }
    if (this.config.mode === 'spawn' && this.config.command) {
      this.spawnGateway(this.config.command, this.config.args ?? []);
      return;
    }
    this.setStatus('disconnected', this.config.hint);
  }

  private armHandshakeTimer(): void {
    this.clearHandshakeTimer();
    const timeoutMs = this.options.handshakeTimeoutMs ?? DEFAULT_HANDSHAKE_TIMEOUT_MS;
    this.handshakeTimer = setTimeout(() => {
      if (this.status === 'connecting') {
        this.fail(`timed out waiting for gateway.ready (${timeoutMs}ms)`);
      }
    }, timeoutMs);
    this.handshakeTimer.unref?.();
  }

  private clearHandshakeTimer(): void {
    if (this.handshakeTimer) {
      clearTimeout(this.handshakeTimer);
      this.handshakeTimer = null;
    }
  }

  private connectWebSocket(url: string): void {
    this.setStatus('connecting', 'opening websocket');
    this.armHandshakeTimer();
    try {
      const ws = new WebSocket(url);
      this.ws = ws;
      // WS messages arrive as complete frames (possibly several, possibly
      // without a trailing newline) — parse discretely, don't line-buffer.
      ws.on('message', (data) => this.ingestDiscrete(data.toString()));
      ws.on('error', (err) => this.fail(`websocket error: ${err.message}`));
      ws.on('close', () => {
        if (this.status !== 'error') this.setStatus('closed', 'websocket closed');
        this.rejectAllPending('connection closed');
      });
    } catch (err) {
      this.fail(`websocket connect failed: ${(err as Error).message}`);
    }
  }

  private spawnGateway(command: string, args: string[]): void {
    this.setStatus('connecting', `spawning ${command}`);
    this.armHandshakeTimer();
    try {
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        // The gateway hangs clients unless it runs unbuffered.
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
      });
      this.child = child;
      this.writeStream = child.stdin;
      child.stdout.on('data', (chunk: Buffer) => this.ingest(chunk.toString()));
      child.stderr.on('data', (chunk: Buffer) => {
        for (const line of chunk.toString().split('\n')) {
          const trimmed = line.trim();
          if (trimmed) this.options.onStderr?.(trimmed.slice(0, 500));
        }
      });
      child.on('error', (err) => this.fail(`spawn failed: ${err.message}`));
      child.on('exit', (code) => {
        if (this.status !== 'error') {
          this.setStatus('closed', `gateway exited (code ${code ?? 'null'})`);
        }
        this.rejectAllPending('gateway exited');
      });
    } catch (err) {
      this.fail(`spawn failed: ${(err as Error).message}`);
    }
  }

  /** Line-buffered frame parser: one JSON object per newline-terminated line. */
  private ingest(text: string): void {
    this.lineBuffer += text;
    let newline = this.lineBuffer.indexOf('\n');
    while (newline !== -1) {
      const line = this.lineBuffer.slice(0, newline).trim();
      this.lineBuffer = this.lineBuffer.slice(newline + 1);
      if (line) this.handleFrame(line);
      newline = this.lineBuffer.indexOf('\n');
    }
  }

  /** Discrete parser for transports that deliver whole messages (WebSocket). */
  private ingestDiscrete(text: string): void {
    for (const segment of text.split('\n')) {
      const line = segment.trim();
      if (line) this.handleFrame(line);
    }
  }

  private handleFrame(line: string): void {
    let frame: any;
    try {
      frame = JSON.parse(line);
    } catch {
      // Non-JSON on the frame channel: ignore rather than crash the TUI.
      return;
    }
    if (frame && typeof frame === 'object' && frame.id != null && ('result' in frame || 'error' in frame)) {
      const pending = this.pending.get(Number(frame.id));
      if (!pending) return;
      this.pending.delete(Number(frame.id));
      clearTimeout(pending.timer);
      if ('error' in frame && frame.error) {
        const message =
          typeof frame.error === 'object' && frame.error.message
            ? String(frame.error.message)
            : 'gateway error';
        pending.reject(new Error(message));
      } else {
        pending.resolve(frame.result);
      }
      return;
    }
    if (frame && frame.method === 'event' && frame.params && typeof frame.params === 'object') {
      const type = String(frame.params.type ?? '');
      if (!type) return;
      const event: HermesGatewayEvent = {
        type,
        sessionId: String(frame.params.session_id ?? frame.params.sessionId ?? ''),
        payload:
          frame.params.payload && typeof frame.params.payload === 'object'
            ? (frame.params.payload as Record<string, unknown>)
            : {},
      };
      if (type === 'gateway.ready' && this.status !== 'ready') {
        this.setStatus('ready');
      }
      try {
        this.options.onEvent?.(event);
      } catch {
        // Listener errors must never take down the transport.
      }
    }
  }

  /** Transport-agnostic frame send: WebSocket or stdio/injected stream. */
  private sendFrame(frame: string): void {
    if (this.ws) {
      if (this.ws.readyState !== WebSocket.OPEN) {
        throw new Error('websocket not open');
      }
      this.ws.send(frame);
      return;
    }
    if (this.writeStream) {
      this.writeStream.write(frame);
      return;
    }
    throw new Error('not connected');
  }

  request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    if (!this.ws && !this.writeStream) {
      return Promise.reject(new Error('not connected'));
    }
    const id = this.nextRequestId++;
    const frame = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
    return new Promise((resolve, reject) => {
      const timeoutMs = this.options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      timer.unref?.();
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.sendFrame(frame);
      } catch (err) {
        this.pending.delete(id);
        clearTimeout(timer);
        reject(err as Error);
      }
    });
  }

  /** ASSUMPTION: result carries the id under session_id | sessionId | id. */
  async createSession(params: Record<string, unknown> = {}): Promise<string> {
    const result = (await this.request('session.create', params)) as
      | Record<string, unknown>
      | null
      | undefined;
    const sessionId = result?.session_id ?? result?.sessionId ?? result?.id;
    if (typeof sessionId !== 'string' || !sessionId) {
      throw new Error('session.create returned no session id');
    }
    return sessionId;
  }

  /** ASSUMPTION: prompt.submit params are {session_id, prompt}. */
  submitPrompt(sessionId: string, prompt: string): Promise<unknown> {
    return this.request('prompt.submit', { session_id: sessionId, prompt });
  }

  /**
   * Answer a blocking approval/clarify/sudo/secret request.
   * ASSUMPTION: params are {request_id, answer}.
   */
  respond(
    kind: 'approval' | 'clarify' | 'sudo' | 'secret',
    requestId: string,
    answer: string,
  ): Promise<unknown> {
    return this.request(`${kind}.respond`, { request_id: requestId, answer });
  }

  close(): void {
    this.clearHandshakeTimer();
    this.rejectAllPending('client closed');
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
    if (this.child) {
      try {
        this.child.kill();
      } catch {
        /* ignore */
      }
      this.child = null;
    }
    this.writeStream = null;
    if (this.status !== 'error') this.setStatus('closed');
  }

  private rejectAllPending(reason: string): void {
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error(reason));
    }
    this.pending.clear();
  }

  private fail(detail: string): void {
    this.setStatus('error', detail);
    this.rejectAllPending(detail);
  }

  private setStatus(status: HermesConnectionStatus, detail?: string): void {
    this.status = status;
    if (status === 'ready' || status === 'closed' || status === 'error') {
      this.clearHandshakeTimer();
    }
    try {
      this.options.onStatus?.(status, detail);
    } catch {
      /* listener errors must not break the transport */
    }
  }
}

// Process-lifetime owner of the Hermes event mirror: client + store + JSONL
// log live HERE, not in the React tree, so switching TUI modes (which
// unmounts HermesPanel) never kills a spawned gateway mid-run or discards
// run state. The panel/hook layer only subscribes and issues actions.

import {
  HermesClient,
  resolveHermesConnectionConfig,
  type HermesConnectionConfig,
  type HermesConnectionStatus,
  type HermesGatewayEvent,
} from './client.js';
import {
  prepareApprove,
  prepareReject,
  prepareTextResponse,
  type PreparedResponse,
} from './approvals.js';
import type { HermesApproval } from './events.js';
import { HermesEventLog, writeHermesReceipt } from './receipt-writer.js';
import { buildResponseEvent, HermesStore, type HermesStoreSnapshot } from './store.js';

export interface HermesMirrorState {
  snapshot: HermesStoreSnapshot;
  status: HermesConnectionStatus;
  statusDetail?: string;
  configMode: 'ws' | 'spawn' | 'none';
  configHint: string;
  sessionId: string | null;
  lastError?: string;
  infoMessage?: string;
  eventLogPath: string;
  failedWrites: number;
  stderrLines: string[];
}

export interface HermesMirrorOptions {
  config?: HermesConnectionConfig;
  /** Base directory for .timmy/ artifacts (tests override). */
  baseDir?: string;
}

export class HermesMirror {
  private readonly config: HermesConnectionConfig;
  private readonly baseDir?: string;
  private readonly store: HermesStore;
  private readonly log: HermesEventLog;
  private client: HermesClient | null = null;
  private status: HermesConnectionStatus = 'disconnected';
  private statusDetail?: string;
  private sessionId: string | null = null;
  private lastError?: string;
  private infoMessage?: string;
  private stderrLines: string[] = [];
  private listeners = new Set<() => void>();

  constructor(options: HermesMirrorOptions = {}) {
    this.config = options.config ?? resolveHermesConnectionConfig();
    this.baseDir = options.baseDir;
    if (this.config.mode === 'none') this.statusDetail = this.config.hint;
    this.store = new HermesStore({ onChange: () => this.notify() });
    this.log = new HermesEventLog({
      baseDir: options.baseDir,
      onWriteError: (message) => {
        this.lastError = message;
        this.notify();
      },
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): HermesMirrorState {
    return {
      snapshot: this.store.snapshot(),
      status: this.status,
      statusDetail: this.statusDetail,
      configMode: this.config.mode,
      configHint: this.config.hint,
      sessionId: this.sessionId,
      lastError: this.lastError,
      infoMessage: this.infoMessage,
      eventLogPath: this.log.path,
      failedWrites: this.log.failedWrites,
      stderrLines: [...this.stderrLines],
    };
  }

  connect(): void {
    if (this.client) {
      const current = this.client.getStatus();
      if (current === 'ready') return;
      // 'connecting' included: pressing c again tears down a stuck handshake.
      this.client.close();
      this.client = null;
    }
    this.lastError = undefined;
    this.infoMessage = undefined;
    const client = new HermesClient({
      config: this.config,
      onEvent: (event) => this.handleGatewayEvent(event),
      onStatus: (status, detail) => {
        this.status = status;
        this.statusDetail = detail;
        this.notify();
      },
      onStderr: (line) => {
        this.stderrLines = [...this.stderrLines.slice(-4), line];
        this.notify();
      },
    });
    this.client = client;
    client.connect();
    this.notify();
  }

  private handleGatewayEvent(raw: HermesGatewayEvent): void {
    const event = this.store.applyGateway(raw);
    if (event) this.log.append(event);
  }

  async startSession(): Promise<void> {
    const client = this.client;
    if (!client || client.getStatus() !== 'ready') {
      this.setError('not connected — press c to connect first');
      return;
    }
    try {
      const sid = await client.createSession();
      this.sessionId = sid;
      this.store.beginRun(sid);
      this.setInfo(`session ${sid.slice(0, 12)} created`);
    } catch (err) {
      this.setError(`session.create failed: ${(err as Error).message}`);
    }
  }

  async submitPrompt(text: string): Promise<void> {
    const client = this.client;
    if (!client || client.getStatus() !== 'ready') {
      this.setError('not connected — press c to connect first');
      return;
    }
    if (!this.sessionId) {
      this.setError('no session — press s to create one');
      return;
    }
    if (!this.store.snapshot().run) {
      this.store.beginRun(this.sessionId);
    }
    this.store.attachPrompt(text);
    const priorStatus = this.store.snapshot().run?.status ?? 'created';
    this.store.setRunStatus('running');
    try {
      await client.submitPrompt(this.sessionId, text);
      this.clearMessages();
    } catch (err) {
      // The prompt never started; put the run back the way it was.
      this.store.setRunStatus(priorStatus);
      this.setError(`prompt.submit failed: ${(err as Error).message}`);
    }
  }

  approve(approvalId: string): Promise<void> {
    return this.respondTo(approvalId, (approval) => prepareApprove(approval));
  }

  reject(approvalId: string): Promise<void> {
    return this.respondTo(approvalId, (approval) => prepareReject(approval));
  }

  answer(approvalId: string, text: string): Promise<void> {
    return this.respondTo(approvalId, (approval) => prepareTextResponse(approval, text));
  }

  /**
   * Resolve the request by id AT SEND TIME and refuse if it is no longer
   * open — a typed answer must never be delivered to a different request
   * than the one the user started answering.
   */
  private async respondTo(
    approvalId: string,
    prepare: (approval: HermesApproval) => PreparedResponse,
  ): Promise<void> {
    const approval = this.store
      .snapshot()
      .approvals.find((a) => a.id === approvalId);
    if (!approval || approval.status !== 'open') {
      this.setError('request is no longer open — answer discarded');
      return;
    }
    const client = this.client;
    if (!client || client.getStatus() !== 'ready') {
      this.setError('not connected');
      return;
    }
    const prepared = prepare(approval);
    try {
      await client.respond(prepared.kind, prepared.requestId, prepared.answer);
      const event = buildResponseEvent({
        approval,
        responseSummary: prepared.responseSummary,
        status: prepared.status,
        eventId: this.store.nextEventId(),
      });
      this.store.apply(event);
      this.log.append(event);
      this.clearMessages();
    } catch (err) {
      this.setError(`${prepared.kind}.respond failed: ${(err as Error).message}`);
    }
  }

  exportReceipt(): string | null {
    this.lastError = undefined;
    this.infoMessage = undefined;
    this.log.flush();
    const result = writeHermesReceipt({
      snapshot: this.store.snapshot(),
      eventLogPath: this.log.path,
      baseDir: this.baseDir,
      onWriteError: (message) => this.setError(message),
    });
    if (!result) {
      if (!this.lastError) this.setError('no run to export yet');
      return null;
    }
    this.store.markReceipt(result.path);
    this.setInfo(`receipt written: ${result.path}`);
    return result.path;
  }

  /** Full teardown — only for process exit (or tests). */
  destroy(): void {
    this.client?.close();
    this.client = null;
    this.log.close();
    this.listeners.clear();
  }

  private setError(message: string): void {
    this.lastError = message;
    this.infoMessage = undefined;
    this.notify();
  }

  private setInfo(message: string): void {
    this.infoMessage = message;
    this.lastError = undefined;
    this.notify();
  }

  private clearMessages(): void {
    this.lastError = undefined;
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        /* subscribers must not break the mirror */
      }
    }
  }
}

let singleton: HermesMirror | null = null;

/** Process-wide mirror instance; closed automatically on process exit. */
export function getHermesMirror(): HermesMirror {
  if (!singleton) {
    singleton = new HermesMirror();
    process.once('exit', () => {
      singleton?.destroy();
    });
  }
  return singleton;
}

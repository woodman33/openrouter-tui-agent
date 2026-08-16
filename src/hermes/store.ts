// Local in-memory run state reducer for the Hermes event mirror.
// Pure TypeScript (no React, no IO) so it is directly unit-testable.

import {
  normalizeGatewayEvent,
  requestIdFrom,
  severityFor,
  toolCallIdFrom,
  type HermesApproval,
  type HermesEvent,
  type HermesModelUsage,
  type HermesProviderRoute,
  type HermesRun,
  type HermesRunStatus,
  type RawGatewayEvent,
} from './events.js';

/** Events kept in memory for rendering; the JSONL log keeps the full stream. */
const MAX_EVENTS_IN_MEMORY = 500;
/** Streaming assistant text kept for display. */
const MAX_STREAM_CHARS = 4_000;
/** Run id assigned to events that arrive before a run exists. */
const UNATTACHED_RUN_ID = 'run_hermes_unattached';
/** Terminal statuses a run can never leave. */
const TERMINAL_STATUSES: ReadonlySet<HermesRunStatus> = new Set(['failed', 'cancelled']);

export interface HermesStoreSnapshot {
  run: HermesRun | null;
  events: HermesEvent[];
  eventCount: number;
  toolCallCount: number;
  approvalCount: number;
  openApprovals: HermesApproval[];
  approvals: HermesApproval[];
  routes: HermesProviderRoute[];
  usage: HermesModelUsage;
  model?: string;
  provider?: string;
  statusLine?: string;
  streamText: string;
}

export class HermesStore {
  private run: HermesRun | null = null;
  private events: HermesEvent[] = [];
  private eventCount = 0;
  private toolCallIds = new Set<string>();
  private approvals = new Map<string, HermesApproval>();
  private routes: HermesProviderRoute[] = [];
  private usage: HermesModelUsage = {};
  private model?: string;
  private provider?: string;
  private statusLine?: string;
  private streamText = '';
  private eventSeq = 0;
  private readonly onChange?: () => void;
  private readonly now: () => string;

  constructor(options: { onChange?: () => void; now?: () => string } = {}) {
    this.onChange = options.onChange;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  nextEventId(): string {
    this.eventSeq += 1;
    return `hev_${this.eventSeq}`;
  }

  /**
   * Start a fresh run: per-run aggregates reset, but events that arrived
   * before the run existed (e.g. session.info during session creation) are
   * adopted into it so receipts stay internally consistent.
   */
  beginRun(sessionId: string, prompt?: string): HermesRun {
    const timestamp = this.now();
    const run: HermesRun = {
      id: `run_hermes_${Date.now()}`,
      sessionId,
      status: 'created',
      prompt,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const adoptedEvents = this.events
      .filter((e) => e.runId === UNATTACHED_RUN_ID)
      .map((e) => ({ ...e, runId: run.id, sessionId }));
    const adoptedRoutes = this.routes
      .filter((r) => r.runId === UNATTACHED_RUN_ID)
      .map((r) => ({ ...r, runId: run.id }));
    const adoptedApprovals = [...this.approvals.values()]
      .filter((a) => a.runId === UNATTACHED_RUN_ID)
      .map((a) => ({ ...a, runId: run.id }));

    this.run = run;
    this.events = adoptedEvents;
    this.eventCount = adoptedEvents.length;
    this.toolCallIds = new Set();
    this.approvals = new Map(adoptedApprovals.map((a) => [a.id, a]));
    this.routes = adoptedRoutes;
    this.usage = {};
    this.streamText = '';
    if (this.model || this.provider) {
      this.run = { ...run, model: this.model, provider: this.provider };
    }
    this.notify();
    return this.run;
  }

  /** Record the first prompt of the run without restarting it. */
  attachPrompt(prompt: string): void {
    if (!this.run) return;
    this.run = {
      ...this.run,
      prompt: this.run.prompt ?? prompt.slice(0, 200),
      updatedAt: this.now(),
    };
    this.notify();
  }

  setRunStatus(status: HermesRunStatus, options: { force?: boolean } = {}): void {
    if (!this.run) return;
    if (!options.force && TERMINAL_STATUSES.has(this.run.status)) return;
    this.run = { ...this.run, status, updatedAt: this.now() };
    this.notify();
  }

  /**
   * Ingest a raw gateway event. Returns the normalized HermesEvent when the
   * event belongs in the receipt model (callers append it to the JSONL log).
   */
  applyGateway(raw: RawGatewayEvent): HermesEvent | null {
    if (raw.type === 'status.update') {
      const text = raw.payload?.text;
      if (typeof text === 'string') this.statusLine = text.slice(0, 200);
      this.notify();
      return null;
    }

    const runId = this.run?.id ?? UNATTACHED_RUN_ID;
    const sessionId = this.run?.sessionId ?? raw.sessionId;
    const event = normalizeGatewayEvent(raw, {
      runId,
      sessionId,
      nextEventId: () => this.nextEventId(),
      now: this.now,
    });
    if (!event) return null;
    this.apply(event);
    return event;
  }

  /** Apply a normalized event (also used for locally-generated responses). */
  apply(event: HermesEvent): void {
    this.eventCount += 1;
    this.events.push(event);
    if (this.events.length > MAX_EVENTS_IN_MEMORY) {
      this.events.splice(0, this.events.length - MAX_EVENTS_IN_MEMORY);
    }

    switch (event.type) {
      case 'message.delta': {
        const chunk =
          typeof event.payload.text === 'string'
            ? event.payload.text
            : typeof event.payload.delta === 'string'
              ? event.payload.delta
              : typeof event.payload.content === 'string'
                ? event.payload.content
                : '';
        if (chunk && event.payload.channel === undefined) {
          this.streamText = (this.streamText + chunk).slice(-MAX_STREAM_CHARS);
        }
        break;
      }
      case 'message.complete': {
        if (
          this.run &&
          (this.run.status === 'running' || this.run.status === 'waiting' || this.run.status === 'created') &&
          this.openApprovalList().length === 0
        ) {
          this.run = { ...this.run, status: 'completed', updatedAt: event.timestamp };
        }
        break;
      }
      case 'tool.start': {
        this.toolCallIds.add(toolCallIdFrom(event.payload, event.id));
        if (this.run && !TERMINAL_STATUSES.has(this.run.status)) {
          this.run = { ...this.run, status: 'running', updatedAt: event.timestamp };
        }
        break;
      }
      case 'approval.request':
      case 'clarify.request':
      case 'sudo.request':
      case 'secret.request': {
        const kind = event.type.split('.')[0] as HermesApproval['kind'];
        const requestId = requestIdFrom(event.payload) ?? event.id;
        const message =
          typeof event.payload.prompt === 'string'
            ? event.payload.prompt
            : typeof event.payload.command === 'string'
              ? event.payload.command
              : typeof event.payload.message === 'string'
                ? event.payload.message
                : '(no detail provided)';
        this.approvals.set(requestId, {
          id: requestId,
          runId: event.runId,
          kind,
          status: 'open',
          title: `${kind} request`,
          message: message.slice(0, 500),
          requestedAt: event.timestamp,
        });
        if (this.run && !TERMINAL_STATUSES.has(this.run.status)) {
          this.run = { ...this.run, status: 'waiting', updatedAt: event.timestamp };
        }
        break;
      }
      case 'approval.response':
      case 'clarify.response':
      case 'sudo.response':
      case 'secret.response': {
        const requestId = requestIdFrom(event.payload);
        const existing = requestId ? this.approvals.get(requestId) : undefined;
        if (existing) {
          const status =
            typeof event.payload.status === 'string' &&
            ['approved', 'rejected', 'answered', 'expired'].includes(event.payload.status)
              ? (event.payload.status as HermesApproval['status'])
              : 'answered';
          this.approvals.set(existing.id, {
            ...existing,
            status,
            respondedAt: event.timestamp,
            responseSummary:
              typeof event.payload.responseSummary === 'string'
                ? event.payload.responseSummary
                : undefined,
          });
        }
        if (
          this.run &&
          this.run.status === 'waiting' &&
          this.openApprovalList().length === 0
        ) {
          this.run = { ...this.run, status: 'running', updatedAt: event.timestamp };
        }
        break;
      }
      case 'provider.route': {
        const model = typeof event.payload.model === 'string' ? event.payload.model : undefined;
        const provider =
          typeof event.payload.provider === 'string' ? event.payload.provider : undefined;
        if (model) this.model = model;
        if (provider) this.provider = provider;
        this.routes.push({
          id: event.id,
          runId: event.runId,
          provider: provider ?? this.provider ?? 'unknown',
          model: model ?? this.model ?? 'unknown',
          status: 'selected',
          startedAt: event.timestamp,
        });
        if (this.run) {
          this.run = { ...this.run, model: this.model, provider: this.provider };
        }
        break;
      }
      case 'model.switch': {
        const model = typeof event.payload.model === 'string' ? event.payload.model : undefined;
        if (model) this.model = model;
        if (this.run) this.run = { ...this.run, model: this.model };
        break;
      }
      case 'run.error': {
        if (this.run) {
          this.run = { ...this.run, status: 'failed', updatedAt: event.timestamp };
        }
        break;
      }
      default:
        break;
    }

    this.mergeUsage(event);
    this.notify();
  }

  /**
   * Merge usage when present. A nested payload.usage object counts on any
   * event; bare top-level token/cost fields only on events that actually
   * report usage, so unrelated numeric payload fields cannot clobber it.
   */
  private mergeUsage(event: HermesEvent): void {
    const payload = event.payload;
    const nested =
      payload.usage && typeof payload.usage === 'object'
        ? (payload.usage as Record<string, unknown>)
        : null;
    const allowTopLevel =
      event.type === 'message.complete' ||
      event.type === 'provider.route' ||
      event.type === 'model.switch';
    const usage = nested ?? (allowTopLevel ? payload : null);
    if (!usage) return;
    const num = (v: unknown): number | undefined =>
      typeof v === 'number' && Number.isFinite(v) ? v : undefined;
    const inputTokens = num(usage.input_tokens ?? usage.inputTokens ?? usage.prompt_tokens);
    const outputTokens = num(usage.output_tokens ?? usage.outputTokens ?? usage.completion_tokens);
    const totalTokens = num(usage.total_tokens ?? usage.totalTokens);
    const costUsd = num(usage.cost_usd ?? usage.costUsd ?? usage.cost);
    if (inputTokens !== undefined) this.usage.inputTokens = inputTokens;
    if (outputTokens !== undefined) this.usage.outputTokens = outputTokens;
    if (totalTokens !== undefined) this.usage.totalTokens = totalTokens;
    if (costUsd !== undefined) this.usage.costUsd = costUsd;
    if (this.run && (inputTokens ?? outputTokens ?? totalTokens ?? costUsd) !== undefined) {
      this.run = { ...this.run, usage: { ...this.usage } };
    }
  }

  markReceipt(path: string): void {
    if (this.run) {
      this.run = { ...this.run, receiptPath: path };
      this.notify();
    }
  }

  private openApprovalList(): HermesApproval[] {
    return [...this.approvals.values()].filter((a) => a.status === 'open');
  }

  snapshot(): HermesStoreSnapshot {
    const approvals = [...this.approvals.values()];
    return {
      run: this.run,
      events: [...this.events],
      eventCount: this.eventCount,
      toolCallCount: this.toolCallIds.size,
      approvalCount: this.approvals.size,
      openApprovals: approvals.filter((a) => a.status === 'open'),
      approvals,
      routes: [...this.routes],
      usage: { ...this.usage },
      model: this.model,
      provider: this.provider,
      statusLine: this.statusLine,
      streamText: this.streamText,
    };
  }

  private notify(): void {
    try {
      this.onChange?.();
    } catch {
      /* subscribers must not break ingestion */
    }
  }
}

/** Build a locally-generated response event for an answered request. */
export function buildResponseEvent(args: {
  approval: HermesApproval;
  responseSummary: string;
  status: HermesApproval['status'];
  eventId: string;
  timestamp?: string;
}): HermesEvent {
  const type = `${args.approval.kind}.response` as HermesEvent['type'];
  return {
    id: args.eventId,
    runId: args.approval.runId,
    sessionId: '',
    type,
    timestamp: args.timestamp ?? new Date().toISOString(),
    payload: {
      request_id: args.approval.id,
      status: args.status,
      responseSummary: args.responseSummary,
    },
    severity: severityFor(type),
  };
}

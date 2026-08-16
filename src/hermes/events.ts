// Hermes event types and normalizer.
// Data model from docs/HERMES_TIMMY_ADDITIONS.md ("Proposed Data Model").
// Event names are TARGET CONTRACTS mirrored from the Hermes TUI Gateway; until
// verified against a live Hermes instance, all wire-format assumptions stay in
// src/hermes/client.ts and everything below is TIMMY's normalized local model.

export type HermesRunStatus =
  | 'created'
  | 'running'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface HermesRun {
  id: string;
  sessionId: string;
  status: HermesRunStatus;
  prompt?: string;
  createdAt: string;
  updatedAt: string;
  model?: string;
  provider?: string;
  usage?: HermesModelUsage;
  receiptPath?: string;
}

export type HermesEventType =
  | 'message.delta'
  | 'message.complete'
  | 'tool.start'
  | 'tool.progress'
  | 'tool.complete'
  | 'tool.error'
  | 'approval.request'
  | 'approval.response'
  | 'clarify.request'
  | 'clarify.response'
  | 'sudo.request'
  | 'sudo.response'
  | 'secret.request'
  | 'secret.response'
  | 'model.switch'
  | 'provider.route'
  | 'quota.warning'
  | 'run.error';

export interface HermesEvent {
  id: string;
  runId: string;
  sessionId: string;
  type: HermesEventType;
  timestamp: string;
  payload: Record<string, unknown>;
  severity?: 'info' | 'warning' | 'error';
}

export interface HermesToolCall {
  id: string;
  runId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  args?: Record<string, unknown>;
  resultSummary?: string;
  startedAt: string;
  completedAt?: string;
  receiptEventIds: string[];
}

export interface HermesApproval {
  id: string;
  runId: string;
  kind: 'approval' | 'clarify' | 'sudo' | 'secret';
  status: 'open' | 'approved' | 'rejected' | 'answered' | 'expired';
  title: string;
  message: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  requestedAt: string;
  respondedAt?: string;
  responseSummary?: string;
}

export interface HermesModelUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  latencyMs?: number;
}

export interface HermesProviderRoute {
  id: string;
  runId: string;
  provider: string;
  model: string;
  status: 'selected' | 'succeeded' | 'failed' | 'fallback';
  reason?: string;
  errorCode?: string;
  startedAt: string;
  completedAt?: string;
}

export interface HermesReceipt {
  schemaVersion: '0.1.0';
  runId: string;
  sessionId: string;
  createdAt: string;
  eventLogPath: string;
  eventCount: number;
  toolCallCount: number;
  approvalCount: number;
  modelRoutes: HermesProviderRoute[];
  usage?: HermesModelUsage;
  status: HermesRunStatus;
  receiptSha256: string;
}

export interface HermesContextSnapshot {
  id: string;
  runId: string;
  createdAt: string;
  sources: Array<{
    kind: 'file' | 'folder' | 'diff' | 'staged' | 'git' | 'url' | 'memory' | 'skill';
    ref: string;
    tokenEstimate?: number;
    sha256?: string;
  }>;
  notes?: string;
}

export interface HermesTrajectoryExport {
  runId: string;
  format: 'sharegpt-jsonl';
  createdAt: string;
  eventsPath: string;
  outputPath: string;
  outcome: 'success' | 'failure' | 'mixed';
  redaction: 'none' | 'basic' | 'strict';
}

const HERMES_EVENT_TYPES: ReadonlySet<string> = new Set<HermesEventType>([
  'message.delta',
  'message.complete',
  'tool.start',
  'tool.progress',
  'tool.complete',
  'tool.error',
  'approval.request',
  'approval.response',
  'clarify.request',
  'clarify.response',
  'sudo.request',
  'sudo.response',
  'secret.request',
  'secret.response',
  'model.switch',
  'provider.route',
  'quota.warning',
  'run.error',
]);

export function isHermesEventType(value: string): value is HermesEventType {
  return HERMES_EVENT_TYPES.has(value);
}

export function severityFor(type: HermesEventType): HermesEvent['severity'] {
  switch (type) {
    case 'tool.error':
    case 'run.error':
      return 'error';
    case 'approval.request':
    case 'clarify.request':
    case 'sudo.request':
    case 'secret.request':
    case 'quota.warning':
      return 'warning';
    default:
      return 'info';
  }
}

/** A gateway event exactly as framed on the wire (see src/hermes/client.ts). */
export interface RawGatewayEvent {
  type: string;
  sessionId: string;
  payload: Record<string, unknown>;
}

export interface NormalizeContext {
  runId: string;
  sessionId: string;
  nextEventId: () => string;
  now?: () => string;
}

/**
 * Normalize a raw gateway event into TIMMY's HermesEvent model.
 *
 * Wire names that are not part of the receipt event model return null;
 * callers surface them elsewhere (e.g. status.update → store status line,
 * gateway.ready → connection status). Mapping decisions:
 * - reasoning.delta / thinking.delta fold into message.delta with a
 *   payload.channel marker (the receipt model has one streaming-text type).
 * - tool.end is treated as tool.complete (docs say tool.complete, one source
 *   extraction says tool.end — accept both).
 * - session.info becomes provider.route: it is where the gateway reports the
 *   active model/provider.
 * - error becomes run.error.
 */
export function normalizeGatewayEvent(
  raw: RawGatewayEvent,
  ctx: NormalizeContext,
): HermesEvent | null {
  const timestamp = (ctx.now ?? (() => new Date().toISOString()))();
  const base = {
    id: ctx.nextEventId(),
    runId: ctx.runId,
    sessionId: raw.sessionId || ctx.sessionId,
    timestamp,
  };

  let type: HermesEventType | null = null;
  let payload: Record<string, unknown> = raw.payload ?? {};

  switch (raw.type) {
    case 'reasoning.delta':
    case 'thinking.delta':
      type = 'message.delta';
      payload = { ...payload, channel: raw.type.split('.')[0] };
      break;
    case 'tool.end':
      type = 'tool.complete';
      break;
    case 'session.info':
      type = 'provider.route';
      break;
    case 'error':
      type = 'run.error';
      break;
    case 'gateway.ready':
    case 'status.update':
    case 'activity':
    case 'review.summary':
    case 'gateway.stderr':
      return null;
    default:
      type = isHermesEventType(raw.type) ? raw.type : null;
  }

  if (!type) return null;

  // Gateway-echoed *.response events can carry the raw answer (which for
  // secret/sudo IS the secret). Never let an `answer` field reach the store,
  // logs, or receipts — keep only ids/status, with a placeholder for
  // sensitive kinds. Locally-built response events (buildResponseEvent)
  // already follow this shape.
  if (type.endsWith('.response')) {
    const kind = type.split('.')[0];
    const sanitized: Record<string, unknown> = {};
    const requestId = requestIdFrom(payload);
    if (requestId) sanitized.request_id = requestId;
    if (typeof payload.status === 'string') sanitized.status = payload.status;
    if (kind === 'secret' || kind === 'sudo') {
      sanitized.responseSummary = `[${kind.toUpperCase()}_ANSWER_PROVIDED]`;
    } else if (typeof payload.responseSummary === 'string') {
      sanitized.responseSummary = payload.responseSummary;
    }
    payload = sanitized;
  }

  return { ...base, type, payload, severity: severityFor(type) };
}

/** Best-effort extraction of a tool-call id from an unversioned payload. */
export function toolCallIdFrom(payload: Record<string, unknown>, fallback: string): string {
  const candidate =
    payload.tool_call_id ?? payload.call_id ?? payload.id ?? payload.tool_id;
  return typeof candidate === 'string' && candidate ? candidate : fallback;
}

/** Best-effort extraction of a request id from a *.request payload. */
export function requestIdFrom(payload: Record<string, unknown>): string | null {
  const candidate = payload.request_id ?? payload.requestId ?? payload.id;
  return typeof candidate === 'string' && candidate ? candidate : null;
}

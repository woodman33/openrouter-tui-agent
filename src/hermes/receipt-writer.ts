// Local-first persistence for the Hermes event mirror:
// - .timmy/hermes-events.jsonl  (append-only, redacted, one event per line)
// - .timmy/receipts/hermes-<runId>.json (sealed receipt artifact)
//
// Conventions inherited from the rest of the repo: cwd-relative .timmy/ dir
// created lazily, redact-before-write via src/utils/redact, sync fs wrapped in
// try/catch so background IO never crashes the Ink TUI — but unlike the
// telemetry spool, write failures are COUNTED and surfaced, because silently
// losing proof artifacts defeats the point of receipts.

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { canonicalize } from '../receipt/schema.js';
import { redactTelemetryPayload, safeStringify } from '../utils/redact.js';
import type { HermesEvent, HermesReceipt } from './events.js';
import type { HermesStoreSnapshot } from './store.js';

const FLUSH_INTERVAL_MS = 250;
const MAX_BUFFERED_EVENTS = 100;

/** Event types buffered and flushed on a timer instead of written per-event. */
const DELTA_TYPES = new Set<HermesEvent['type']>(['message.delta']);

export interface HermesEventLogOptions {
  /** Directory containing .timmy/ — defaults to process.cwd(). Tests override. */
  baseDir?: string;
  flushIntervalMs?: number;
  onWriteError?: (message: string) => void;
}

export class HermesEventLog {
  readonly path: string;
  private buffer: string[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private failedWriteCount = 0;
  private readonly options: HermesEventLogOptions;

  constructor(options: HermesEventLogOptions = {}) {
    this.options = options;
    const baseDir = options.baseDir ?? process.cwd();
    this.path = path.join(baseDir, '.timmy', 'hermes-events.jsonl');
  }

  get failedWrites(): number {
    return this.failedWriteCount;
  }

  append(event: HermesEvent): void {
    const line = safeStringify(redactTelemetryPayload(event));
    if (DELTA_TYPES.has(event.type)) {
      this.buffer.push(line);
      if (this.buffer.length >= MAX_BUFFERED_EVENTS) {
        this.flush();
      } else {
        this.ensureTimer();
      }
      return;
    }
    // Control events flush anything buffered first so ordering is preserved.
    this.buffer.push(line);
    this.flush();
  }

  flush(): void {
    if (this.buffer.length === 0) return;
    const chunk = this.buffer.join('\n') + '\n';
    this.buffer = [];
    try {
      fs.mkdirSync(path.dirname(this.path), { recursive: true });
      fs.appendFileSync(this.path, chunk, 'utf8');
    } catch (err) {
      this.failedWriteCount += 1;
      try {
        this.options.onWriteError?.(
          `hermes event log write failed (${this.failedWriteCount}): ${(err as Error).message}`,
        );
      } catch {
        /* never crash the TUI from a write-error callback */
      }
    }
  }

  private ensureTimer(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.flush(), this.options.flushIntervalMs ?? FLUSH_INTERVAL_MS);
    (this.timer as { unref?: () => void }).unref?.();
  }

  close(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush();
  }
}

/** Drop undefined values / circular refs so canonicalize() hashes cleanly. */
function sanitizeForHash<T>(value: T): T {
  return JSON.parse(safeStringify(value)) as T;
}

export interface WriteReceiptArgs {
  snapshot: HermesStoreSnapshot;
  eventLogPath: string;
  baseDir?: string;
  now?: () => string;
  onWriteError?: (message: string) => void;
}

export interface WriteReceiptResult {
  path: string;
  receipt: HermesReceipt;
}

/**
 * Seal and write one local Hermes receipt JSON artifact
 * (docs/HERMES_TIMMY_ADDITIONS.md Phase 5). Returns null when there is no run
 * to seal or the write fails (failure is reported via onWriteError).
 */
export function writeHermesReceipt(args: WriteReceiptArgs): WriteReceiptResult | null {
  const { snapshot } = args;
  if (!snapshot.run) return null;
  const baseDir = args.baseDir ?? process.cwd();
  const createdAt = (args.now ?? (() => new Date().toISOString()))();

  const unsealed: Omit<HermesReceipt, 'receiptSha256'> = sanitizeForHash({
    schemaVersion: '0.1.0',
    runId: snapshot.run.id,
    sessionId: snapshot.run.sessionId,
    createdAt,
    eventLogPath: path.relative(baseDir, args.eventLogPath) || args.eventLogPath,
    eventCount: snapshot.eventCount,
    toolCallCount: snapshot.toolCallCount,
    approvalCount: snapshot.approvalCount,
    modelRoutes: snapshot.routes.map((route) => redactTelemetryPayload(route)),
    usage: snapshot.usage,
    status: snapshot.run.status,
  });

  const receiptSha256 = crypto.createHash('sha256').update(canonicalize(unsealed)).digest('hex');
  const receipt: HermesReceipt = { ...unsealed, receiptSha256 };

  const receiptDir = path.join(baseDir, '.timmy', 'receipts');
  const receiptPath = path.join(receiptDir, `hermes-${snapshot.run.id}.json`);
  try {
    fs.mkdirSync(receiptDir, { recursive: true });
    fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), 'utf8');
  } catch (err) {
    try {
      args.onWriteError?.(`hermes receipt write failed: ${(err as Error).message}`);
    } catch {
      /* ignore */
    }
    return null;
  }
  return { path: receiptPath, receipt };
}

import type { Receipt } from './receipts.js';
import { readChain } from './receipts.js';

export interface SealableChatTurn {
  role: string;
  timestamp?: number | string;
  seal?: string;
}

const MATCH_SKEW_MS = 1000;
const SESSION_SKEW_MS = 5000;

const toMillis = (value: number | string | undefined): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const isSealReceipt = (receipt: Receipt): boolean => typeof receipt.hash === 'string';

export const shortSeal = (hash: string): string => `${hash.slice(7, 15)}…`;

export function chatSealMap<T extends SealableChatTurn>(
  turns: readonly T[],
  existing: Record<number, string> = {},
  chain: readonly Receipt[] = readChain('runs'),
  formatSeal: (hash: string) => string = hash => hash,
): Record<number, string> {
  const sealed: Record<number, string> = {};
  const turnTimes = turns
    .map(turn => toMillis(turn.timestamp))
    .filter((value): value is number => value !== null);
  const firstTurnAt = turnTimes.length ? Math.min(...turnTimes) : null;
  const receipts = chain
    .filter(isSealReceipt)
    .map(receipt => ({ receipt, ts: Date.parse(receipt.ts) }))
    .filter(item => Number.isFinite(item.ts))
    .filter(item => firstTurnAt === null || item.ts >= firstTurnAt - SESSION_SKEW_MS)
    .sort((a, b) => a.ts - b.ts);

  let receiptCursor = 0;
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (turn.role !== 'assistant') continue;

    const retained = existing[i] ?? turn.seal;
    if (retained) {
      sealed[i] = retained;
      const matched = receipts.findIndex((item, index) =>
        index >= receiptCursor && (formatSeal(item.receipt.hash) === retained || item.receipt.hash === retained));
      if (matched >= 0) receiptCursor = matched + 1;
      continue;
    }

    const turnAt = toMillis(turn.timestamp);
    const matched = receipts.findIndex((item, index) =>
      index >= receiptCursor && (turnAt === null || item.ts >= turnAt - MATCH_SKEW_MS));
    if (matched >= 0) {
      sealed[i] = formatSeal(receipts[matched].receipt.hash);
      receiptCursor = matched + 1;
    }
  }

  return sealed;
}

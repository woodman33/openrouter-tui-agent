import { describe, expect, it } from 'vitest';
import type { Receipt } from '../src/utils/receipts.js';
import { chatSealMap, shortSeal } from '../src/utils/chat-seals.js';

const receipt = (ts: string, hash: string): Receipt => ({
  v: 1,
  id: `rc_${hash}`,
  stream: 'runs',
  ts,
  kind: 'llm',
  subject: 'walnut chat · hello',
  policy: 'auto',
  epoch: 1,
  prev_hash: 'genesis',
  hash,
});

describe('chatSealMap', () => {
  it('rehydrates assistant turns from chat receipts', () => {
    const seals = chatSealMap(
      [
        { role: 'user', timestamp: Date.parse('2026-08-30T00:00:00.000Z') },
        { role: 'assistant', timestamp: Date.parse('2026-08-30T00:00:02.000Z') },
      ],
      {},
      [receipt('2026-08-30T00:00:02.250Z', 'sha256_abcdef1234567890')],
    );

    expect(seals[1]).toBe('sha256_abcdef1234567890');
  });

  it('can format seals for the web chat payload', () => {
    const seals = chatSealMap(
      [{ role: 'assistant', timestamp: Date.parse('2026-08-30T00:00:02.000Z') }],
      {},
      [receipt('2026-08-30T00:00:02.250Z', 'sha256_abcdef1234567890')],
      shortSeal,
    );

    expect(seals[0]).toBe('abcdef12…');
  });
});

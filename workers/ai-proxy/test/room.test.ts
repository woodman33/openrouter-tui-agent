import { describe, expect, it } from 'vitest';
import { normalizeEvent, parseRunsPath, validRoom, wireEvent } from '../src/room-core.js';

describe('SlateRoom contract', () => {
  it('parses the runs routes of the existing Durable Object contract plus ws', () => {
    expect(parseRunsPath('/runs/create')).toEqual({ room: '', action: 'create' });
    expect(parseRunsPath('/runs/slate:ledger')).toEqual({ room: 'slate:ledger', action: 'get' });
    expect(parseRunsPath('/runs/slate%3Aledger/events')).toEqual({ room: 'slate:ledger', action: 'events' });
    expect(parseRunsPath('/runs/r1/event')).toEqual({ room: 'r1', action: 'event' });
    expect(parseRunsPath('/runs/r1/ws')).toEqual({ room: 'r1', action: 'ws' });
    expect(parseRunsPath('/runs/r1/nope')).toBeNull();
    expect(parseRunsPath('/health')).toBeNull();
  });

  it('accepts bus envelopes and the old type/timestamp spelling, rejects junk', () => {
    const now = () => '2026-09-06T12:00:00.000Z';
    expect(normalizeEvent({ v: 1, ts: '2026-09-06T11:00:00.000Z', kind: 'receipt.sealed', payload: { subject: 'defold.build' } }, now))
      .toMatchObject({ ts: '2026-09-06T11:00:00.000Z', kind: 'receipt.sealed', payload: { subject: 'defold.build' } });
    expect(normalizeEvent({ type: 'run.created', timestamp: '2026-09-06T11:00:00.000Z', payload: { goal: 'x' }, id: 'evt_1' }, now))
      .toEqual({ id: 'evt_1', ts: '2026-09-06T11:00:00.000Z', kind: 'run.created', payload: { goal: 'x' } });
    expect(normalizeEvent({ kind: 'slate.render.start' }, now)).toMatchObject({ kind: 'slate.render.start', ts: now(), payload: {} });
    expect(normalizeEvent({ kind: 'x', ts: 'not a date' }, now)).toBeNull();
    expect(normalizeEvent({ payload: {} }, now)).toBeNull();
    expect(normalizeEvent('nope', now)).toBeNull();
    expect(normalizeEvent({ kind: 'x', payload: [1, 2] }, now)?.payload).toEqual({});
  });

  it('echoes both spellings on the wire so every reader agrees', () => {
    const w = wireEvent({ seq: 7, id: 'evt_a', ts: '2026-09-06T11:00:00.000Z', kind: 'dispatch.armed', payload: { harness: 'defold' } });
    expect(w).toMatchObject({ v: 1, seq: 7, id: 'evt_a', ts: '2026-09-06T11:00:00.000Z', timestamp: '2026-09-06T11:00:00.000Z', kind: 'dispatch.armed', type: 'dispatch.armed', payload: { harness: 'defold' } });
  });

  it('room names are bounded', () => {
    expect(validRoom('slate:ledger')).toBe(true);
    expect(validRoom('board.v2-x')).toBe(true);
    expect(validRoom('')).toBe(false);
    expect(validRoom('../etc')).toBe(false);
    expect(validRoom('a'.repeat(101))).toBe(false);
  });
});

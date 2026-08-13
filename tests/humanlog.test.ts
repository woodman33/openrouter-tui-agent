import { describe, it, expect } from 'vitest';
import { humanizeLine, humanizeLines, relTime, clockTime, parseTs } from '../src/utils/humanlog.js';

describe('human log layer', () => {
  it('parses leading ISO timestamps', () => {
    expect(parseTs('[2026-08-11T03:54:52.247Z] Telemetry sync')).toBe('2026-08-11T03:54:52.247Z');
    expect(parseTs('no ts here')).toBeUndefined();
  });

  it('humanizes the meaningful events', () => {
    expect(humanizeLine('[2026-08-11T03:54:52.247Z] [INFO] [run.created] {"source":"timmy-studio"}')?.text).toContain('run sealed');
    expect(humanizeLine('[2026-08-11T03:54:52.247Z] [INFO] [model.switch] {"model":"qwen/qwen3.8-max"}')?.text).toBe('model → qwen/qwen3.8-max');
    expect(humanizeLine('[2026-08-11T00:00:00.000Z] [WARN] Companion health check failed')?.icon).toBe('⚠');
    expect(humanizeLine('{"ts":"2026-08-11T00:00:00.000Z","genId":"g1","event":"recorded","detail":"nano-banana-2/image"}')?.text).toContain('gen queued · nano-banana-2');
  });

  it('maps agent-internal events to human words, not "gen" noise', () => {
    expect(humanizeLine('{"event":"model.selected","model":"qwen/qwen3.8-max"}')?.text).toBe('→ qwen/qwen3.8-max');
    expect(humanizeLine('{"event":"model.test.started"}')).toBeNull();
    expect(humanizeLine('{"event":"openrouter.request.failed"}')?.icon).toBe('✕');
    expect(humanizeLine('{"event":"model.fallback.used"}')?.text).toBe('provider fallback used');
  });

  it('collapses consecutive repeats into one counted line', () => {
    const { events } = humanizeLines([
      '{"event":"model.test.succeeded"}',
      '{"event":"model.test.succeeded"}',
      '{"event":"model.test.succeeded"}'
    ]);
    expect(events).toHaveLength(1);
    expect(events[0].text).toBe('health ok ×3');
  });

  it('hides noise: per-line telemetry and mode changes', () => {
    expect(humanizeLine('[2026-08-11T03:54:52.247Z] Telemetry sync: man33.workers.dev/telemetry')).toBeNull();
    expect(humanizeLine('[2026-08-11T11:28:44.213Z] [INFO] [mode.change] {"mode":"brief"}')).toBeNull();
  });

  it('collapses telemetry into a count, keeps real events', () => {
    const { events, telemetryCount } = humanizeLines([
      '[2026-08-11T03:54:51.927Z] Telemetry sync: x',
      '[2026-08-11T03:54:52.012Z] Telemetry sync: x',
      '[2026-08-11T03:54:52.247Z] [INFO] [run.created] {}'
    ]);
    expect(telemetryCount).toBe(2);
    expect(events).toHaveLength(1);
  });

  it('relative time buckets and clock format', () => {
    const now = Date.parse('2026-08-11T12:00:00.000Z');
    expect(relTime('2026-08-11T12:00:00.000Z', now).trim()).toBe('now');
    expect(relTime('2026-08-11T11:59:20.000Z', now).trim()).toBe('40s');
    expect(relTime('2026-08-11T11:55:00.000Z', now).trim()).toBe('5m');
    expect(relTime('2026-08-11T09:00:00.000Z', now).trim()).toBe('3h');
    expect(clockTime('2026-08-11T09:01:02.000Z')).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});

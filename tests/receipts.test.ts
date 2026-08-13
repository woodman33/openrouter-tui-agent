import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { appendReceipt, verifyChain, readChain, receiptsPath } from '../src/utils/receipts.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'timmy-receipts-'));
});

describe('receipt chain v1', () => {
  it('links receipts with prev_hash from genesis', () => {
    const a = appendReceipt('gens', { kind: 'generation', subject: 'g1', policy: 'human-gated' }, dir);
    const b = appendReceipt('gens', { kind: 'generation', subject: 'g2', policy: 'human-gated' }, dir);
    expect(a.prev_hash).toBe('genesis');
    expect(b.prev_hash).toBe(a.hash);
    expect(a.hash).toMatch(/^sha256_[0-9a-f]{64}$/);
  });

  it('verifies an intact chain', () => {
    appendReceipt('gens', { kind: 'generation', subject: 'g1', policy: 'auto' }, dir);
    appendReceipt('gens', { kind: 'generation', subject: 'g2', cost_usd: 0.22, policy: 'auto' }, dir);
    const r = verifyChain('gens', dir);
    expect(r.ok).toBe(true);
    expect(r.count).toBe(2);
  });

  it('detects body tampering', () => {
    appendReceipt('gens', { kind: 'generation', subject: 'g1', cost_usd: 0.22, policy: 'auto' }, dir);
    appendReceipt('gens', { kind: 'generation', subject: 'g2', policy: 'auto' }, dir);
    const p = receiptsPath('gens', dir);
    const lines = readFileSync(p, 'utf8').split('\n').filter(Boolean);
    const first = JSON.parse(lines[0]);
    first.cost_usd = 0.01; // tamper
    writeFileSync(p, [JSON.stringify(first), ...lines.slice(1)].join('\n') + '\n');
    const r = verifyChain('gens', dir);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('tampered');
  });

  it('detects a broken chain link', () => {
    appendReceipt('gens', { kind: 'generation', subject: 'g1', policy: 'auto' }, dir);
    appendReceipt('gens', { kind: 'generation', subject: 'g2', policy: 'auto' }, dir);
    const p = receiptsPath('gens', dir);
    const lines = readFileSync(p, 'utf8').split('\n').filter(Boolean);
    const second = JSON.parse(lines[1]);
    second.prev_hash = 'sha256_deadbeef';
    writeFileSync(p, [lines[0], JSON.stringify(second)].join('\n') + '\n');
    const r = verifyChain('gens', dir);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('chain link broken');
  });

  it('empty chain verifies', () => {
    expect(verifyChain('runs', dir)).toEqual({ ok: true, count: 0 });
    expect(readChain('runs', dir)).toEqual([]);
  });
});

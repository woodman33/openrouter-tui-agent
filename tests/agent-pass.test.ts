import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import crypto from 'crypto';
import { appendReceipt } from '../src/utils/receipts.js';
import { buildAgentPass, verifyAgentPass, merkleRoot } from '../src/utils/agent-pass.js';

const hex = (s: string): string => crypto.createHash('sha256').update(s).digest('hex');

let dir = '';
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'timmy-pass-')); });
afterAll(() => { rmSync(dir, { recursive: true, force: true }); });

const mkReceipt = (subject: string): string =>
  appendReceipt('runs', { kind: 'run', subject, policy: 'human-gated', status: 'ok', spans: [], artifacts: [] }, dir).hash;

describe('AgentPass rung 1 (V-03): Merkle receipt payload', () => {
  it('merkle root is deterministic; single leaf is its own root', () => {
    const a = hex('a'), b = hex('b');
    expect(merkleRoot([a])).toBe(a);
    expect(merkleRoot([a, b])).toBe(merkleRoot([a, b]));
    expect(merkleRoot([a, b])).not.toBe(merkleRoot([b, a])); // order is part of the root
  });

  it('packages parent/child chain + QA scores + bundles and verifies clean', () => {
    const parent = mkReceipt('agent-pass parent');
    const c1 = mkReceipt('agent-pass child 1');
    const c2 = mkReceipt('agent-pass child 2');
    const r = buildAgentPass({
      parent_receipt: parent,
      children: [c1, c2],
      qa_scores: [{ model: 'roboflow/detection', metric: 'mean_confidence', value: 0.9 }],
      bundles: [{ id: 'run_promo8', sha256: hex('bundle') }],
      dir
    });
    expect(r.ok).toBe(true);
    expect(r.receipt).toBeTruthy();
    expect(r.pass!.leaves).toHaveLength(4);
    expect(verifyAgentPass(r.pass!, dir)).toEqual({ ok: true });
  });

  it('detects a tampered merkle root', () => {
    const parent = mkReceipt('agent-pass tamper parent');
    const r = buildAgentPass({ parent_receipt: parent, dir });
    const tampered = { ...r.pass!, merkle_root: hex('evil') };
    const v = verifyAgentPass(tampered, dir);
    expect(v.ok).toBe(false);
    expect(v.brokenAt).toBe('merkle');
  });

  it('detects receipts missing from the runs chain', () => {
    const parent = mkReceipt('agent-pass chain parent');
    const fake = `sha256_${hex('not-in-chain')}`;
    const r = buildAgentPass({ parent_receipt: parent, children: [fake], dir });
    expect(r.ok).toBe(true); // schema-valid; membership is verify's job
    const v = verifyAgentPass(r.pass!, dir);
    expect(v.ok).toBe(false);
    expect(v.brokenAt).toBe('chain');
  });
});

// AgentPass rung 1 (V-03, v0.7.8): package a parent/child receipt chain,
// visual QA scores, and .agentrun bundle hashes into one verifiable payload
// under a SHA-256 Merkle root. Verification recomputes the root from the
// declared leaves and checks every receipt leaf is a member of the runs
// chain. Escrow settlement (ceiling → draws → refund) stays target-grade.
import { spawnSync } from 'child_process';
import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { appendReceipt, readChain } from './receipts.js';

export interface QaScore { model: string; metric: string; value: number }
export interface PassLeaf { hash: string; kind: 'receipt' | 'bundle'; label?: string }
export interface AgentPass {
  schema_version: 'agent-pass/0.1';
  pass_id: string;
  created_at: string;
  parent_receipt: string;
  children: string[];
  qa_scores: QaScore[];
  bundles: { id: string; sha256: string }[];
  leaves: PassLeaf[];
  merkle_root: string;
}

const hexOf = (receiptHash: string): string => receiptHash.replace(/^sha256_/, '');

// SHA-256 Merkle over raw leaf bytes; odd levels duplicate the last node;
// a single leaf is its own root. Leaf ORDER is part of the root (declared
// in the pass, recomputed verbatim at verify time).
export function merkleRoot(hexLeaves: string[]): string {
  if (!hexLeaves.length) return crypto.createHash('sha256').update('').digest('hex');
  let level: Buffer[] = hexLeaves.map(h => Buffer.from(h, 'hex'));
  while (level.length > 1) {
    if (level.length % 2) level.push(level[level.length - 1]);
    const next: Buffer[] = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(crypto.createHash('sha256').update(Buffer.concat([level[i], level[i + 1]])).digest());
    }
    level = next;
  }
  return level[0].toString('hex');
}

export function validatePassCue(pass: unknown): { ok: boolean; note?: string; error_class?: string } {
  const cueBin = spawnSync('cue', ['version'], { encoding: 'utf8' });
  if (cueBin.status !== 0) return { ok: false, error_class: 'not_configured', note: 'cue binary missing (brew install cue)' };
  const schema = fileURLToPath(new URL('../../schemas/agent-pass.cue', import.meta.url));
  const tmp = join(mkdtempSync(join(tmpdir(), 'timmy-passcue-')), 'pass.json');
  writeFileSync(tmp, JSON.stringify(pass));
  const r = spawnSync('cue', ['vet', '-d', '#Pass', schema, tmp], { encoding: 'utf8' });
  if (r.status !== 0) return { ok: false, error_class: 'schema', note: (r.stderr || r.stdout || 'cue vet failed').slice(0, 400) };
  return { ok: true };
}

export function buildAgentPass(o: {
  parent_receipt: string;
  children?: string[];
  qa_scores?: QaScore[];
  bundles?: { id: string; sha256: string }[];
  dir?: string;
}): { ok: boolean; pass?: AgentPass; receipt?: string; note?: string } {
  const leaves: PassLeaf[] = [
    { hash: hexOf(o.parent_receipt), kind: 'receipt', label: 'parent' },
    ...(o.children ?? []).map((c, i) => ({ hash: hexOf(c), kind: 'receipt' as const, label: `child-${i}` })),
    ...(o.bundles ?? []).map(b => ({ hash: b.sha256, kind: 'bundle' as const, label: b.id }))
  ];
  const pass: AgentPass = {
    schema_version: 'agent-pass/0.1',
    pass_id: `ap_${crypto.randomBytes(4).toString('hex')}`,
    created_at: new Date().toISOString(),
    parent_receipt: o.parent_receipt,
    children: o.children ?? [],
    qa_scores: o.qa_scores ?? [],
    bundles: o.bundles ?? [],
    leaves,
    merkle_root: merkleRoot(leaves.map(l => l.hash))
  };
  const v = validatePassCue(pass);
  if (!v.ok) return { ok: false, note: v.note ?? v.error_class };
  const rec = appendReceipt('runs', {
    kind: 'verify',
    subject: `agent-pass ${pass.pass_id} · merkle ${pass.merkle_root.slice(0, 16)}…`,
    policy: 'human-gated', status: 'ok',
    // the Merkle root IS the manifest hash of the packaged payload
    manifest_sha256: pass.merkle_root,
    child_receipts: pass.children,
    sources: [{ parent_receipt: pass.parent_receipt, qa_scores: pass.qa_scores, bundles: pass.bundles.map(b => b.id), leaves: pass.leaves.length }],
    spans: [{ name: 'agent-pass merkle packaging', kind: 'execute_tool' }],
    artifacts: []
  }, o.dir);
  return { ok: true, pass, receipt: rec.hash };
}

export function verifyAgentPass(pass: AgentPass, dir?: string): { ok: boolean; brokenAt?: 'schema' | 'merkle' | 'chain'; note?: string } {
  const v = validatePassCue(pass);
  if (!v.ok) return { ok: false, brokenAt: 'schema', note: v.note };
  if (merkleRoot(pass.leaves.map(l => l.hash)) !== pass.merkle_root) return { ok: false, brokenAt: 'merkle', note: 'merkle root mismatch' };
  const chain = new Set(readChain('runs', dir).map(r => r.hash));
  for (const rh of [pass.parent_receipt, ...pass.children]) {
    if (!chain.has(rh)) return { ok: false, brokenAt: 'chain', note: `receipt not in runs chain: ${rh}` };
  }
  return { ok: true };
}

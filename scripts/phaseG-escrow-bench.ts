// Phase G — V-03 graduation benchmark: settle + cancel both honor the
// refund = ceiling − drawn invariant, the runs chain walks clean, and a
// tampered Merkle proof slashes with no payout path. Graduation seals a
// settlement receipt; a missed criterion seals an honest blocked receipt.
import { runEscrowBench } from '../src/utils/escrow-bench.js';
import { appendReceipt } from '../src/utils/receipts.js';

const r = runEscrowBench();
if (!r.ok) {
  const rec = appendReceipt('runs', { kind: 'verify', subject: 'V-03 graduation BLOCKED (bench error)', policy: 'human-gated', status: 'failed', error_class: 'exec', discrepancies: [r.note ?? 'bench failed'], spans: [], artifacts: [] });
  console.log(JSON.stringify({ graduated: false, note: r.note, receipt: rec.hash }, null, 2));
  process.exit(1);
}
if (r.graduated) {
  const rec = appendReceipt('runs', {
    kind: 'verify', subject: 'V-03 GRADUATION · escrow settlement · refund invariant + slash-on-tamper',
    policy: 'human-gated', status: 'ok',
    cost_usd: r.cancel_refund,
    escrow_ids: r.escrow_ids,
    lifecycle_refund: r.lifecycle_refund, cancel_refund: r.cancel_refund,
    tamper_slashed: r.tamper_slashed, chain_ok: r.chain_ok,
    spans: [{ name: 'escrow lifecycle + cancel refund + tamper slash', kind: 'execute_tool' }],
    artifacts: []
  });
  console.log(JSON.stringify({ graduated: true, ...r, receipt: rec.hash }, null, 2));
  process.exit(0);
}
const rec = appendReceipt('runs', { kind: 'verify', subject: 'V-03 graduation BLOCKED (criteria not met)', policy: 'human-gated', status: 'failed', error_class: 'bench_criteria', discrepancies: [r.note ?? 'criteria'], spans: [], artifacts: [] });
console.log(JSON.stringify({ graduated: false, ...r, receipt: rec.hash }, null, 2));
process.exit(1);

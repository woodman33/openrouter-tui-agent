// Phase F — V-02 graduation benchmark: one stage sha in three lane
// manifests + replay byte-compare + fresh-compile determinism. Graduation
// seals a receipt; a missed criterion seals an honest blocked receipt and
// V-02 stays a target.
import { runUsdBench } from '../src/utils/usd-bench.js';
import { appendReceipt } from '../src/utils/receipts.js';

const r = runUsdBench();
if (!r.ok) {
  const rec = appendReceipt('runs', { kind: 'verify', subject: 'V-02 graduation BLOCKED (bench error)', policy: 'human-gated', status: 'failed', error_class: 'exec', discrepancies: [r.note ?? 'bench failed'], spans: [], artifacts: [] });
  console.log(JSON.stringify({ graduated: false, note: r.note, receipt: rec.hash }, null, 2));
  process.exit(1);
}
if (r.graduated) {
  const rec = appendReceipt('runs', {
    kind: 'verify', subject: 'V-02 GRADUATION · USD spine · one sha in three lane manifests · replay byte-compares',
    policy: 'human-gated', status: 'ok',
    output_sha256: r.stage_sha256,
    lanes: r.lanes, plan_ids: r.plan_ids, replay_byte_compare: r.replay_byte_compare,
    spans: [{ name: 'tri-lane stage handoff + replay determinism', kind: 'execute_tool' }],
    artifacts: []
  });
  console.log(JSON.stringify({ graduated: true, ...r, receipt: rec.hash }, null, 2));
  process.exit(0);
}
const rec = appendReceipt('runs', { kind: 'verify', subject: 'V-02 graduation BLOCKED (criteria not met)', policy: 'human-gated', status: 'failed', error_class: 'bench_criteria', discrepancies: [r.note ?? 'criteria'], spans: [], artifacts: [] });
console.log(JSON.stringify({ graduated: false, ...r, receipt: rec.hash }, null, 2));
process.exit(1);

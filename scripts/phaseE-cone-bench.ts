// Phase E — V-01 graduation benchmark: cone-budgeted capsule vs
// unconstrained raw-repo dump + mantle ablation. Graduation seals an
// efficiency receipt; a missed criterion seals an honest blocked receipt and
// V-01 stays a target. See src/utils/cone-bench.ts for the measured proxy.
import { runConeBench } from '../src/utils/cone-bench.js';
import { appendReceipt } from '../src/utils/receipts.js';

const r = runConeBench();
if (!r.ok) {
  const rec = appendReceipt('runs', { kind: 'verify', subject: 'V-01 graduation BLOCKED (bench error)', policy: 'human-gated', status: 'failed', error_class: 'exec', discrepancies: [r.note ?? 'bench failed'], spans: [], artifacts: [] });
  console.log(JSON.stringify({ graduated: false, note: r.note, receipt: rec.hash }, null, 2));
  process.exit(1);
}
if (r.graduated) {
  const rec = appendReceipt('runs', {
    kind: 'verify', subject: 'V-01 GRADUATION · cone efficiency benchmark · recall preserved, tokens reduced',
    policy: 'human-gated', status: 'ok',
    tokens_raw: r.tokens_raw, tokens_cone: r.tokens_cone, tokens_ablation: r.tokens_ablation,
    recall_raw: r.recall_raw, recall_cone: r.recall_cone, recall_ablation: r.recall_ablation,
    tier_tokens: r.tier_tokens, reduction_pct: r.reduction_pct, plan_id: r.plan_id,
    spans: [{ name: 'cone vs raw-repo benchmark + mantle ablation', kind: 'execute_tool' }],
    artifacts: []
  });
  console.log(JSON.stringify({ graduated: true, ...r, receipt: rec.hash }, null, 2));
  process.exit(0);
}
const rec = appendReceipt('runs', { kind: 'verify', subject: 'V-01 graduation BLOCKED (criteria not met)', policy: 'human-gated', status: 'failed', error_class: 'bench_criteria', discrepancies: [r.note ?? 'criteria'], tokens_raw: r.tokens_raw, tokens_cone: r.tokens_cone, recall_cone: r.recall_cone, recall_ablation: r.recall_ablation, spans: [], artifacts: [] });
console.log(JSON.stringify({ graduated: false, ...r, receipt: rec.hash }, null, 2));
process.exit(1);

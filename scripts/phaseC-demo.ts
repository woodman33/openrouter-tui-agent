// Phase C — Demo C remediation: red→green coding task inside the ephemeral
// runner container. Local model first ($0); every outcome receipted honestly.
// Usage: npx tsx scripts/phaseC-demo.ts
import { runOpenHandsTask, openHandsPlanHash, type OpenHandsOpts } from '../src/utils/openhands-adapter.js';
import { issueApproval } from '../src/utils/approvals.js';

const opts: OpenHandsOpts = {
  task: 'add.js contains the exact line: module.exports = { add: (a, b) => a - b }; // deliberate red — npm test is RED because add() subtracts. Use the file_editor tool with command str_replace: old_string "a - b" and new_string "a + b" in /work/add.js. Then verify with the terminal tool: npm test.',
  acceptance: ['npm test'],
  engine: 'docker',
  // owner-approved escalation (2026-08-19): frontier under hard cap,
  // single-use approval bound to this plan hash
  llm: 'auto',
  max_spend: 0.5,
  wall_ms: 420000,
  no_activity_ms: 150000,
  dir: process.cwd()
};

const hash = openHandsPlanHash(opts);
const { token } = issueApproval(hash);
const r = await runOpenHandsTask({ ...opts, approval: token });
console.log(JSON.stringify({
  ok: r.ok,
  state: r.state ?? null,
  plan_hash: r.plan_hash,
  acceptance: r.acceptance,
  pristine_acceptance: r.pristine_acceptance,
  host_canary: r.host_canary,
  patch_sha256: r.patch_sha256,
  receipt: r.receipt,
  note: r.note ?? null
}, null, 2));
process.exit(r.ok ? 0 : 1);

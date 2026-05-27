import fs from 'fs';
import path from 'path';

function printIndex() {
  const indexPath = path.join(process.cwd(), '.timmy', 'receipts', 'index.json');
  console.log(`\n================================================================================`);
  console.log(`🛡️  TIMMY OFFLINE RECEIPT INDEX`);
  console.log(`================================================================================`);

  if (!fs.existsSync(indexPath)) {
    console.log(`No local receipts found. Run "npm run timmy:test-run" to generate and index runs.`);
    console.log(`================================================================================\n`);
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const receipts = data.receipts || [];
    if (receipts.length === 0) {
      console.log(`Local receipt index is currently empty.`);
      console.log(`================================================================================\n`);
      return;
    }

    console.log(`Index location: ${indexPath}`);
    console.log(`Total receipts found: ${receipts.length}\n`);

    for (const r of receipts) {
      console.log(`◈ Run ID:      \x1b[36m${r.runId}\x1b[0m`);
      console.log(`  Goal:        ${r.goal}`);
      console.log(`  Phase:       \x1b[35m${r.phase.toUpperCase()}\x1b[0m`);
      console.log(`  Risk Level:  \x1b[31m${r.riskLevel.toUpperCase()}\x1b[0m`);
      console.log(`  Receipt URL: \x1b[32;4m${r.receiptUrl}\x1b[0m`);
      console.log(`  Telemetry:   ${r.telemetryUrl}`);
      console.log(`  Created At:  ${r.createdAt}`);
      console.log(`  Updated At:  ${r.updatedAt}`);
      console.log(`  Counters:    Commands: \x1b[1m${r.counters?.commands || 0}\x1b[0m | Output Lines: ${r.counters?.outputLines || 0} | Errors: \x1b[31m${r.counters?.errors || 0}\x1b[0m | Approvals: ${r.counters?.approvals || 0}`);
      console.log(`────────────────────────────────────────────────────────────────────────────────`);
    }
  } catch (err: any) {
    console.error(`✕ Error reading index file:`, err.message);
  }
  console.log(`\n================================================================================\n`);
}

printIndex();

process.env.TIMMY_TESTING = 'true';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { SLASH_COMMANDS } from '../src/utils/slash-commands.js';

class MockAgent extends EventEmitter {
  public config = {
    apiKey: '',
    model: 'google/gemini-2.5-flash',
    instructions: ''
  };
  public latestReceipt: any = null;
  public relayedVmLogs: string[] = [];
  public workspaceContexts: Record<string, string[]> = {};
}

async function verifyAgentProofFlow() {
  console.log('================================================================================');
  console.log('🧪 VERIFYING E2E AGENT PROOF FLOW');
  console.log('================================================================================');

  const agent = new MockAgent();
  const state = {};

  const agentProofCmd = SLASH_COMMANDS.find(c => c.command === '/agent-proof');
  if (!agentProofCmd) {
    console.error('✕ Error: /agent-proof command not registered!');
    process.exit(1);
  }

  console.log('✓ /agent-proof command registration: FOUND');

  const testPrompt = 'Verify that Antigravity can complete the production TUI launch.';
  console.log(`Executing /agent-proof command with prompt: "${testPrompt}"...`);
  
  const initialResult = agentProofCmd.execute(testPrompt, agent as any, state);
  console.log(`Command initial response:\n"${initialResult}"\n`);

  console.log('Waiting for background proof flow task...');
  
  // Wait up to 5 seconds for the receipt to populate
  let attempts = 0;
  while (!agent.latestReceipt && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!agent.latestReceipt) {
    console.error('✕ Error: Timed out waiting for latestReceipt to populate!');
    process.exit(1);
  }

  const receipt = agent.latestReceipt;
  console.log('✓ Receipt generation: SUCCESS');
  console.log(`  - Run ID:        ${receipt.runId}`);
  console.log(`  - Provider:      ${receipt.provider}`);
  console.log(`  - Manifest Hash: ${receipt.manifestHash}`);
  console.log(`  - Receipt Path:  ${receipt.receiptPath}`);

  // Assert local manifest exists
  if (!fs.existsSync(receipt.receiptPath)) {
    console.error(`✕ Error: Manifest file not written at ${receipt.receiptPath}!`);
    process.exit(1);
  }
  console.log('✓ Local .agentrun bundle manifest file exists');

  // Assert manifest hash length: prefix "sha256_" is 7 chars, hash is 64 chars, total length is 71 chars.
  const rawHashPart = receipt.manifestHash.replace('sha256_', '');
  if (rawHashPart.length !== 64) {
    console.error(`✕ Error: Manifest hash length is not 64 hex characters! Hash part length: ${rawHashPart.length}`);
    process.exit(1);
  }
  console.log(`✓ Manifest hash contains full 64-character SHA-256 string: ${rawHashPart}`);

  // Verify vocabulary
  const manifestRaw = fs.readFileSync(receipt.receiptPath, 'utf8');
  const forbidden = /cryptographic|cryptographically|signed|signature|immutable|notarized|legal proof|signature verifier/i;
  if (forbidden.test(manifestRaw)) {
    console.error('✕ Error: Forbidden overclaim words found inside receipt manifest!');
    process.exit(1);
  }
  console.log('✓ Receipt vocabulary audit: PASSED (contains zero forbidden overclaim terms)');

  // Verify prompt_hash inside manifest.json
  const manifestData = JSON.parse(manifestRaw);
  if (!manifestData.prompt_hash || manifestData.prompt_hash.replace('sha256_', '').length !== 64) {
    console.error('✕ Error: prompt_hash missing or incorrect length in manifest!');
    process.exit(1);
  }
  console.log(`✓ Manifest contains correct prompt_hash: ${manifestData.prompt_hash}`);

  // Verify local index index.json
  const indexPath = path.join(process.cwd(), '.timmy', 'receipts', 'index.json');
  if (!fs.existsSync(indexPath)) {
    console.error(`✕ Error: Receipts index index.json not written at ${indexPath}!`);
    process.exit(1);
  }
  console.log('✓ Local receipts index index.json exists');

  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const found = (indexData.receipts || []).some((r: any) => r.runId === receipt.runId);
  if (!found) {
    console.error('✕ Error: Run ID not found inside index.json receipts list!');
    process.exit(1);
  }
  console.log('✓ Run ID successfully indexed inside local receipts index list');

  console.log('\n================================================================================');
  console.log('🟢 ALL AGENT PROOF FLOW VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('================================================================================\n');
}

verifyAgentProofFlow().catch(err => {
  console.error('✕ Verification script execution failed:', err);
  process.exit(1);
});

import { describe, it, expect } from 'vitest';
import { canonicalize, computeReceiptHash, Receipt } from '../src/receipt/schema.js';
import { VERSION } from '../src/version.js';

describe('TIMMY Fusion Receipt System', () => {
  it('should canonicalize and hash a conformed fusion receipt structure', () => {
    const fusionReceipt: Omit<Receipt, 'receipt_sha256'> = {
      schema_version: '0.3',
      run_id: 'run_fusion_test_123',
      type: 'fusion',
      task: 'Optimize database clustering with consensus routing',
      created_at: '2026-07-04T00:00:00.000Z',
      cwd: '/path/to/openrouter-tui-agent',
      platform: 'linux',
      node_version: 'v20.0.0',
      package: { name: 'timmy-tui', version: VERSION },
      status: 'completed',
      models_used: [
        { id: 'claude-sonnet-4', weight: 0.4, tokens: 250 },
        { id: 'qwen-2.5-coder', weight: 0.3, tokens: 150 },
        { id: 'gemini-2.5-pro', weight: 0.3, tokens: 200 }
      ],
      plugins_run: ['harpoon@1.2.0', 'jdt@3.1.0'],
      rive_state_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      consensus: {
        model: 'gemini-2.5-pro',
        tokens: 1800,
        latency_ms: 450
      },
      artifacts: [
        { path: '.timmy/receipts/fusion_run_1717750800000/replay.md', sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08' }
      ]
    };

    const hash = computeReceiptHash(fusionReceipt);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);

    // Ensure order of properties in receipt does not affect hash
    const unorderedReceipt: Omit<Receipt, 'receipt_sha256'> = {
      consensus: {
        model: 'gemini-2.5-pro',
        tokens: 1800,
        latency_ms: 450
      },
      artifacts: [
        { path: '.timmy/receipts/fusion_run_1717750800000/replay.md', sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08' }
      ],
      rive_state_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      plugins_run: ['harpoon@1.2.0', 'jdt@3.1.0'],
      models_used: [
        { id: 'claude-sonnet-4', weight: 0.4, tokens: 250 },
        { id: 'qwen-2.5-coder', weight: 0.3, tokens: 150 },
        { id: 'gemini-2.5-pro', weight: 0.3, tokens: 200 }
      ],
      status: 'completed',
      package: { name: 'timmy-tui', version: VERSION },
      node_version: 'v20.0.0',
      platform: 'linux',
      cwd: '/path/to/openrouter-tui-agent',
      created_at: '2026-07-04T00:00:00.000Z',
      task: 'Optimize database clustering with consensus routing',
      type: 'fusion',
      run_id: 'run_fusion_test_123',
      schema_version: '0.3'
    };

    const unorderedHash = computeReceiptHash(unorderedReceipt);
    expect(unorderedHash).toBe(hash);
  });
});

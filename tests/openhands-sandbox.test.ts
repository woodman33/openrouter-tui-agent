import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { runOpenHandsTask, openHandsPlanHash } from '../src/utils/openhands-adapter.js';
import { issueApproval } from '../src/utils/approvals.js';
import { readChain } from '../src/utils/receipts.js';

let dir = '';
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'timmy-oh-test-')); });
afterAll(() => { rmSync(dir, { recursive: true, force: true }); });

const opts = () => ({
  task: 'make the failing test pass',
  acceptance: ['npm test'],
  wall_ms: 120000,
  max_iterations: 2,
  dir
});

describe('OpenHands adapter — real sandbox or nothing', () => {
  it('default-deny without operator approval (paid work)', async () => {
    const r = await runOpenHandsTask(opts());
    expect(r.ok).toBe(false);
    expect(r.state).toBe('blocked');
    expect(r.note).toContain('timmy approve');
    const last = readChain('runs', dir).at(-1) as any;
    expect(last.status).toBe('denied');
    expect(last.error_class).toBe('approval');
  });

  it('fails closed not_configured when isolation is unavailable', async () => {
    const o = opts();
    o.approval = issueApproval(openHandsPlanHash(o)).token;
    const oldPath = process.env.PATH;
    process.env.PATH = '/nonexistent';
    const r = await runOpenHandsTask(o);
    process.env.PATH = oldPath;
    expect(r.ok).toBe(false);
    expect(r.state).toBe('not_configured');
    const last = readChain('runs', dir).at(-1) as any;
    expect(last.status).toBe('failed');
    expect(last.error_class).toBe('not_configured');
  });
});

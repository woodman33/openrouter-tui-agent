import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { roboflowRun } from '../src/utils/roboflow-adapter.js';
import { readChain } from '../src/utils/receipts.js';

let dir = '';
const savedKey = process.env.ROBOFLOW_API_KEY;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'timmy-rf-test-'));
  delete process.env.ROBOFLOW_API_KEY;
});
afterAll(() => {
  if (savedKey) process.env.ROBOFLOW_API_KEY = savedKey;
  rmSync(dir, { recursive: true, force: true });
});

describe('roboflow adapter gating', () => {
  it('reports not_configured without a key and seals a receipt', () => {
    const r = roboflowRun({ action: 'sample', project: 'timmy-observer', video: 'x.mp4' }, dir);
    expect(r.ok).toBe(false);
    expect(r.state).toBe('not_configured');
    const last = readChain('runs', dir).at(-1) as any;
    expect(last.status).toBe('failed');
    expect(last.error_class).toBe('not_configured');
  });
});

import { describe, it, expect } from 'vitest';
import { detectRoboflow, roboflowUpload } from '../src/utils/roboflow.js';

describe('roboflow connector', () => {
  it('reports honest status without configuration', () => {
    delete process.env.ROBOFLOW_API_KEY;
    const st = detectRoboflow();
    expect(st.key).toBe(false);
    expect(st.via).toBe('not configured');
  });

  it('degrades honestly on upload without a key', async () => {
    delete process.env.ROBOFLOW_API_KEY;
    const r = await roboflowUpload('demo-north');
    expect(r.ok).toBe(false);
    expect(r.uploaded).toBe(0);
    expect(r.reason).toContain('ROBOFLOW_API_KEY');
  });
});

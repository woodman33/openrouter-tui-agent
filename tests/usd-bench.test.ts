import { describe, it, expect } from 'vitest';
import { runUsdBench } from '../src/utils/usd-bench.js';

describe('V-02 graduation benchmark', () => {
  it('one stage sha in three lane manifests; replay byte-compares; compiles deterministic', () => {
    const r = runUsdBench();
    expect(r.ok).toBe(true);
    expect(r.graduated).toBe(true);
    expect(r.stage_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(r.lanes).toEqual(['houdini-mcp', 'unreal-mcp', 'webcontainers']);
    expect(r.plan_ids).toHaveLength(3);
    expect(r.replay_byte_compare).toBe(true);
  });
});

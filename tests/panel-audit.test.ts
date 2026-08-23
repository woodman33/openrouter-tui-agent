// p10 feature audit — the mount audit runs under tsx (the live app's
// resolver; vitest's vite resolver cannot load mcporter's SDK path). This
// test shells out and asserts every panel RENDERED (no CRASHED).
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('panel mount audit', () => {
  it('every panel mounts without crashing', () => {
    const out = execSync('npx tsx scripts/audit-panels.tsx', { encoding: 'utf8', timeout: 180000 });
    const line = out.split('\n').find(l => l.startsWith('PANEL_AUDIT'));
    expect(line).toBeTruthy();
    const results = JSON.parse(line!.slice('PANEL_AUDIT '.length)) as Record<string, string>;
    // ChatPanel(legacy) is quarantined in src/tui/attic — audit mounts it from there
    const crashed = Object.entries(results).filter(([, v]) => v.startsWith('CRASHED'));
    expect(crashed).toEqual([]);
    expect(Object.keys(results).length).toBeGreaterThanOrEqual(19);
  }, 200000);
});

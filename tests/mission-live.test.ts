import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { startLogServer } from '../src/utils/logserver.js';
import { issueApproval } from '../src/utils/approvals.js';

// Mission Studio live launch (v0.7.6): the arming gateway triggers the
// containerized lane for openhands+docker plans and telemetry lands on the
// event bus the studio streams. DRYRUN exercises the mechanics without a
// real container; approval/isolation gates still apply.
let port = 0;
beforeAll(async () => {
  process.env.TIMMY_DISPATCH_DRYRUN = '1';
  port = await startLogServer({ port: 4397 });
});
afterAll(() => { delete process.env.TIMMY_DISPATCH_DRYRUN; });

const DOC = {
  nodes: [
    { id: 'cap', kind: 'capsule', objective: 'live mission telemetry probe' },
    { id: 'h', kind: 'harness', harness: 'openhands', workspace: 'docker' }
  ],
  edges: [{ from: 'h', to: 'cap', kind: 'harness' }]
};

const post = async (p: number, path: string, body: unknown) =>
  (await fetch(`http://127.0.0.1:${p}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();

describe('mission studio live launch (:4310/mission)', () => {
  it('compiles openhands+docker capsules with the container workspace kind', async () => {
    const c = await post(port, '/mission/compile', { doc: DOC });
    expect(c.ok).toBe(true);
    expect(c.plans[0].plan.workspace.kind).toBe('docker');
    expect(c.plans[0].plan.harnesses[0]).toBe('openhands');
  });

  it('refuses launch before arm (chat prepares, authority launches)', async () => {
    const c = await post(port, '/mission/compile', { doc: DOC });
    const s = await post(port, '/mission/store', { plan: c.plans[0].plan });
    expect(s.ok).toBe(true);
    const l = await post(port, '/dispatch/action', { id: s.id, action: 'launch' });
    expect(l.ok).toBe(false);
    expect(String(l.note)).toContain('not armed');
  });

  it('armed container plan launches and streams telemetry events', async () => {
    const c = await post(port, '/mission/compile', { doc: DOC });
    const s = await post(port, '/mission/store', { plan: c.plans[0].plan });
    const a = await post(port, '/dispatch/action', { id: s.id, action: 'arm', token: issueApproval(s.plan_hash).token });
    expect(a.ok).toBe(true);
    const l = await post(port, '/dispatch/action', { id: s.id, action: 'launch' });
    expect(l.ok).toBe(true);
    expect(l.container).toBe(true);
    // telemetry for THIS plan landed on the bus (studio SSE filters by plan_id)
    const evs = readFileSync(join(process.cwd(), '.timmy', 'runs', 'timmy-events.jsonl'), 'utf8')
      .trim().split('\n').map(x => JSON.parse(x))
      .filter((e: { payload?: { plan_id?: string } }) => e.payload?.plan_id === s.id);
    expect(evs.some((e: { kind: string }) => e.kind === 'dispatch.container_started')).toBe(true);
    expect(evs.some((e: { kind: string }) => e.kind === 'dispatch.container_done')).toBe(true);
    const plans = await (await fetch(`http://127.0.0.1:${port}/dispatch`)).json();
    expect(plans.find((p: { id: string }) => p.id === s.id).lifecycle).toBe('judging');
  });
});

// warroom-t3b1: profile roundtrip, tmux war room lifecycle + activity resize,
// CHAT tab transcript, COMMAND tab commander + harness panes.
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { ShellV2 } from '../src/tui/components/ShellV2.js';
import { appendReceipt } from '../src/utils/receipts.js';
import * as warroom from '../src/harness/warroom.js';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function until(view: ReturnType<typeof render>, pred: (f: string) => boolean, ms = 15000): Promise<string> {
  const t0 = Date.now();
  for (;;) {
    const f = view.lastFrame() ?? '';
    if (pred(f)) return f;
    if (Date.now() - t0 > ms) return f;
    await sleep(50);
  }
}

beforeEach(() => { warroom.killWar(); });

describe('warroom', () => {
  it('profile save/load roundtrip', () => {
    const p: warroom.WarProfile = {
      name: 'roundtrip-test',
      harnesses: [{ id: 'jcode', model: null, weight: 2 }, { id: 'pi', model: 'qwen/qwen3-coder', weight: 1 }],
      commander: { model: 'openrouter/auto', ws: null },
    };
    const f = warroom.saveProfile(p);
    const loaded = warroom.loadProfile('roundtrip-test');
    expect(loaded?.harnesses.length).toBe(2);
    expect(loaded?.harnesses[1].model).toBe('qwen/qwen3-coder');
    expect(f).toContain('profile.cue');
  });

  it('war room starts tmux panes; activity weight resizes', () => {
    const p: warroom.WarProfile = {
      name: 'tmux-test',
      harnesses: [{ id: 'sh:sleep 60', model: null, weight: 1 }, { id: 'sh:sleep 61', model: null, weight: 1 }],
      commander: { model: 'openrouter/auto', ws: null },
    };
    const r = warroom.startWarRoom(p);
    expect(r.ok).toBe(true);
    const panes = warroom.panes();
    expect(panes.length).toBe(2);
    const active = warroom.setActivity(p, 'sh:sleep 60', 'responding');
    const after = warroom.panes().find(x => x.name === 'sh:sleep 60');
    expect(after?.height ?? 0).toBeGreaterThanOrEqual(12);
    void active;
    expect(warroom.killWar().ok).toBe(true);
  });

  it('CHAT tab shows transcript from receipts; COMMAND tab shows commander + harness panes', async () => {
    appendReceipt('runs', {
      kind: 'chat', subject: 'chat.turn · openrouter/auto', policy: 'human-gated', status: 'ok',
      sources: [{ role: 'user', text: 'status of the war room?' }],
    });
    const view = render(React.createElement(ShellV2, { width: 120 }));
    await until(view, x => x.includes('YOUR JOURNEY'));
    view.stdin.write('5');
    let f = await until(view, x => /CHAT · SOVEREIGN/i.test(x));
    expect(f).toContain('you: status of the war room?');
    expect(f).toContain('LOG RAIN');
    view.stdin.write('\x1b'); // back to NORMAL
    view.stdin.write('6');
    f = await until(view, x => /COMMANDER ·/i.test(x));
    expect(f).toContain('HARNESS PANES');
    expect(f).toContain('cmdr');
    view.unmount();
  });
});

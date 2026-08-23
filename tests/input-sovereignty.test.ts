// v1.0.5-keyboard-arch — focus stack contract: Enter at NAV claims
// input:command; printable chars (incl. nav keys) never hijack; Esc pops to
// NAV (visible in the footer MODE indicator); 1-4 then switch views; Enter
// re-claims INPUT. Red under the old boolean mechanism.
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../src/tui/app.js';

process.env.TIMMY_TELEMETRY_URL = 'off';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

describe('input sovereignty via focus stack (View [1] chat)', () => {
  it('Enter claims INPUT; nav-laden typing never hijacks; Esc pops to NAV', async () => {
    const view = render(React.createElement(App, { config: { onboarded: true } as never }));
    await sleep(400);

    let f = view.lastFrame() ?? '';
    expect(f).toContain('MODE:NAV');

    view.stdin.write('\r');                    // Enter at NAV → input:command
    await sleep(250);
    f = view.lastFrame() ?? '';
    expect(f).toContain('MODE:INPUT:COMMAND');

    view.stdin.write('g1q? 1234 hello — v1.0.5');
    await sleep(400);
    f = view.lastFrame() ?? '';
    expect(f).toContain('hello — v1.0.5');    // buffer intact
    expect(f).toContain('[1 COM]');           // still COMMAND
    expect(f).not.toContain('SLATE DAG');     // no hijack

    view.stdin.write('\x1b');                  // Esc → pop to NAV
    await sleep(250);
    f = view.lastFrame() ?? '';
    expect(f).toContain('MODE:NAV');

    view.stdin.write('2');
    await sleep(300);
    f = view.lastFrame() ?? '';
    expect(f).toContain('SLATE DAG');         // nav key works at NAV

    view.stdin.write('1');
    await sleep(300);
    view.stdin.write('\r');
    await sleep(250);
    f = view.lastFrame() ?? '';
    expect(f).toContain('MODE:INPUT:COMMAND'); // Enter re-claims INPUT

    view.unmount();
  }, 20000);
});

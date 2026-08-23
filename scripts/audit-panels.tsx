// p10 feature audit — mount every panel/component headlessly under tsx (the
// same resolver the live app uses) and record RENDERED vs CRASHED.
import React from 'react';
import { render } from 'ink-testing-library';
import { createAgent } from '../src/agent/core.js';

process.env.TIMMY_TELEMETRY_URL = 'off';

const agent = createAgent({ onboarded: true } as never);
const base = {
  agent,
  setInspector: () => undefined,
  zone: 0,
  setZone: () => undefined,
  setModalInput: () => undefined,
  inputLocked: false
} as never;

const results: Record<string, string> = {};

const mount = async (el: React.ReactElement): Promise<string> => {
  try {
    const v = render(el);
    await new Promise(r => setTimeout(r, 350));
    const f = v.lastFrame() ?? '';
    v.unmount();
    return f.trim().length > 0 ? 'RENDERED' : 'EMPTY';
  } catch (e) {
    return `CRASHED: ${(e as Error).message.slice(0, 80)}`;
  }
};

const P = await import('../src/tui/panels/LanesPanel.js'); results.LanesPanel = await mount(React.createElement(P.LanesPanel, base));
const B = await import('../src/tui/panels/BrowsePanel.js'); results.BrowsePanel = await mount(React.createElement(B.BrowsePanel, base));
const C = await import('../src/tui/panels/ClipPanel.js'); results.ClipPanel = await mount(React.createElement(C.ClipPanel, base));
const CR = await import('../src/tui/panels/CodeReviewPanel.js'); results.CodeReviewPanel = await mount(React.createElement(CR.CodeReviewPanel, base));
const D = await import('../src/tui/panels/DashboardPanel.js'); results.DashboardPanel = await mount(React.createElement(D.DashboardPanel, base));
const DR = await import('../src/tui/panels/DispatchRail.js'); results.DispatchRail = await mount(React.createElement(DR.DispatchRail, base));
const F = await import('../src/tui/panels/FilesPanel.js'); results.FilesPanel = await mount(React.createElement(F.FilesPanel, base));
const G = await import('../src/tui/panels/GensPanel.js'); results.GensPanel = await mount(React.createElement(G.GensPanel, base));
const L = await import('../src/tui/panels/LogsPanel.js'); results.LogsPanel = await mount(React.createElement(L.LogsPanel, base));
const LR = await import('../src/tui/panels/LogRain.js'); results.LogRain = await mount(React.createElement(LR.LogRain, { height: 20 } as never));
const ME = await import('../src/tui/panels/ModelExplorerPanel.js'); results.ModelExplorerPanel = await mount(React.createElement(ME.ModelExplorerPanel, base));
const O = await import('../src/tui/panels/OptionsPanel.js'); results.OptionsPanel = await mount(React.createElement(O.OptionsPanel, base));
const PO = await import('../src/tui/attic/PorterPanel.js'); results['PorterPanel(legacy,attic)'] = await mount(React.createElement(PO.PorterPanel, base));
const PR = await import('../src/tui/panels/ProjectsPanel.js'); results.ProjectsPanel = await mount(React.createElement(PR.ProjectsPanel, base));
const S = await import('../src/tui/panels/SetupPanel.js'); results.SetupPanel = await mount(React.createElement(S.SetupPanel, base));
const SL = await import('../src/tui/panels/SlatePanel.js'); results.SlatePanel = await mount(React.createElement(SL.SlatePanel, base));
const CH = await import('../src/tui/attic/ChatPanel.js'); results['ChatPanel(legacy,attic)'] = await mount(React.createElement(CH.ChatPanel, base));
const CV = await import('../src/tui/components/CommandView.js'); results.CommandView = await mount(React.createElement(CV.CommandView, { agent } as never));
const EV = await import('../src/tui/components/EscrowReceiptsView.js'); results.EscrowReceiptsView = await mount(React.createElement(EV.EscrowReceiptsView, { paneFocus: 0, width: 100, height: 20 } as never));

console.log('PANEL_AUDIT ' + JSON.stringify(results));
process.exit(0);

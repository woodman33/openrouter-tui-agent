// DESIGN.md §9.3 — the Clearinghouse contract, enforced in CI.
// Locks the theme export surface to §2 exactly, bans raw hex outside theme.ts,
// bans border drawing outside src/tui/ui/ (attic is quarantined dead code),
// bans chalk color methods in panels, requires every panel to use the ui kit,
// and enforces the §3.4 density budget on the known list-heavy views.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { theme } from '../src/tui/theme.js';

const TUI = join(process.cwd(), 'src', 'tui');

const walk = (dir: string, out: string[] = []): string[] => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e === 'attic') continue; // quarantined dead code — outside the contract
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(e)) {
      out.push(p);
    }
  }
  return out;
};

const rel = (p: string): string => relative(TUI, p);

describe('design contract (DESIGN.md §9.3)', () => {
  it('theme exports exactly the §2 token set', () => {
    expect(Object.keys(theme).sort()).toEqual([
      // §2.1 ground & surfaces
      'ground', 'surface', 'surfaceRaised', 'line', 'lineFocus',
      // §2.2 text ramp
      'textPrimary', 'textSecondary', 'textMuted',
      // §2.3 semantic accents
      'accent', 'seal', 'warn', 'danger', 'ident',
    ].sort());
  });

  it('no raw hex outside theme.ts', () => {
    const bad = walk(TUI)
      .filter(f => rel(f) !== 'theme.ts')
      .flatMap(f => readFileSync(f, 'utf8').split('\n')
        .map((l, i) => ({ f: rel(f), i: i + 1, hit: /#[0-9a-fA-F]{6}/.test(l) }))
        .filter(x => x.hit));
    expect(bad).toEqual([]);
  });

  it('no borderStyle= outside src/tui/ui/', () => {
    const bad = walk(TUI)
      .filter(f => !rel(f).startsWith('ui/'))
      .filter(f => readFileSync(f, 'utf8').includes('borderStyle='))
      .map(rel);
    expect(bad).toEqual([]);
  });

  it('no chalk color methods in panels', () => {
    const bad = walk(join(TUI, 'panels'))
      .filter(f => /chalk\./.test(readFileSync(f, 'utf8')))
      .map(rel);
    expect(bad).toEqual([]);
  });

  it('every panel imports from the ui kit', () => {
    const bad = walk(join(TUI, 'panels'))
      .filter(f => !readFileSync(f, 'utf8').includes("'../ui/"))
      .map(rel);
    expect(bad).toEqual([]);
  });

  it('density budget: list-heavy views use BudgetList (§3.4)', () => {
    const listHeavy = [
      'components/EscrowReceiptsView.tsx',
      'panels/LanesPanel.tsx',
      'panels/BrowsePanel.tsx',
      'panels/FilesPanel.tsx',
      'panels/ProjectsPanel.tsx',
      'panels/ClipPanel.tsx',
      'panels/OptionsPanel.tsx',
      'panels/DashboardPanel.tsx',
    ];
    const bad = listHeavy
      .filter(f => !readFileSync(join(TUI, f), 'utf8').includes('BudgetList'));
    expect(bad).toEqual([]);
  });
});

import type { Mode } from './router.js';

export interface KeyHint { key: string; label: string }

// ─── ONE GRAMMAR, EVERY TAB ────────────────────────────────────────────────
// A verb keeps its key everywhere; each tab only shows the verbs it has.
//   Tab/⇧Tab  walk the left menu        ←→   move between panes
//   ↑↓        move inside focused pane  ↵    ALWAYS select / submit
//   Esc       ALWAYS back / cancel      ?    this keymap
// Verb keys (same letter on every tab that has the verb):
//   n new · k kill · t type-into · g approve · o open/attach outside ·
//   v visual view · p preview · P publish · d detail · s sync ·
//   f follow · h human/raw · e export · i reindex · 1-9 positional pick

export const GLOBAL_KEYS: KeyHint[] = [
  { key: 'Tab/⇧Tab', label: 'menu ↓↑' },
  { key: '←→', label: 'panes' },
  { key: '↑↓', label: 'move' },
  { key: '↵', label: 'select' },
  { key: 'Esc', label: 'back' },
  { key: '?', label: 'keys' }
];

export const MODE_KEYS: Record<Mode, KeyHint[]> = {
  brief: [
    { key: '→', label: 'model rail' },
    { key: 'd', label: 'model detail' },
    { key: 'o', label: 'open model page' },
    { key: '1-3', label: 'home buttons (empty chat)' }
  ],
  lanes: [
    { key: 't/↵', label: 'type task' },
    { key: 'g', label: 'approve' },
    { key: 'n', label: 'spawn' },
    { key: 'k', label: 'kill' },
    { key: 'o', label: 'attach' },
    { key: 'y', label: 'yank attach cmd' },
    { key: 'v', label: 'tmux tabs' },
    { key: 'G', label: 'tiled grid' }
  ],
  gens: [
    { key: 'n', label: 'new prompt' },
    { key: ']/[', label: 'option (while typing)' },
    { key: 'y', label: 'yank gen line' },
    { key: '1/2', label: 'failed → reroute / note' }
  ],
  slate: [
    { key: 'n', label: 'new project' },
    { key: 'P', label: 'publish site' },
    { key: 'c', label: 'TIMMY Clip job' },
    { key: 'v', label: 'canvas pane' },
    { key: 'o', label: 'site pane' }
  ],
  browse: [
    { key: 'n', label: 'new pane' },
    { key: 't', label: 'type into pane' },
    { key: 'k', label: 'kill pane' }
  ],
  logs: [
    { key: '←→/1-5', label: 'file' },
    { key: 'h', label: 'human/raw' },
    { key: 'f', label: 'follow' },
    { key: 'r', label: 'refresh' }
  ],
  files: [
    { key: 'p', label: 'preview' },
    { key: 'v', label: 'carbonyl' },
    { key: 'o', label: '$EDITOR' },
    { key: 's', label: 'sync logs' },
    { key: 'e', label: 'training export' },
    { key: 'i', label: 'reindex' }
  ]
};

// Two reserved description-bar lines per tab, generated from the same table
// so the bar, the ? overlay and the panel hint bar can never disagree.
export function submenuLines(mode: Mode): [string, string] {
  const verbs = MODE_KEYS[mode].map(h => `${h.key} ${h.label}`);
  const half = Math.ceil(verbs.length / 2);
  return [verbs.slice(0, half).join(' · ') || '—', verbs.slice(half).join(' · ') || ''];
}

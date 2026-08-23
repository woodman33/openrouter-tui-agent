# TIMMY key contract v1 (2026-08-23, p10)

Single source of truth for the keyboard. Implementation:
`src/tui/hooks/useKeyDispatcher.ts` (root dispatcher + focus stack),
`src/tui/views.tsx` (9 views), `src/tui/layout.tsx` (MODE footer).

## Dispatcher order (every key routes exactly once)

| # | key | owner | behavior |
|---|-----|-------|----------|
| 0 | any | `modal:onboarding` stack top | dispatcher yields entirely (sovereign first-run leaf) |
| 1 | `Esc` | dispatcher, BEFORE any owner | pop `modal:*` → close modal; pop `input:*` → NAV; at NAV → no-op |
| 2 | `Tab`/`⇧Tab` | dispatcher | cycle pane focus in the active view (owners never see Tab) |
| 3 | any | `modal:palette` top | palette arrows/Enter (dispatcher routes to paletteKey) |
| 4 | any | `modal:help` top | closes via Esc only |
| 5 | any | `input:*` top | routed to the registered owner handler (e.g. `input:command`) |
| 6 | `^C` | dispatcher nav | clean quit (alt-screen restored) |
| 7 | `^K` | dispatcher nav | push `modal:palette` |
| 8 | `1`–`9` | dispatcher nav | switch view (NAV mode only) |
| 9 | `l` | dispatcher nav | jump to view 3 (TELEMETRY) |
| 10 | `q` | dispatcher nav | clean quit |
| 11 | `?` | dispatcher nav | push `modal:help` |
| 12 | `Enter` | dispatcher nav | view 1 only: claim `input:command` |

## Focus stack semantics

- Stack of names; base `nav` is permanent. `push` on claim, `release` on
  blur; **pop-on-unmount is structural** (a dead component can never hold
  focus — the p09 boolean could, and that was the trap).
- Stack top = single key owner. Footer shows `MODE:<TOP>` always
  (`MODE:NAV`, `MODE:INPUT:COMMAND`, `MODE:MODAL:PALETTE`, …).
- Panels register via `useKeyOwner(name, handler)` and only fire when the
  stack says so (`panelMayAct`): at `nav` they receive the residue the
  dispatcher doesn't consume (arrows etc.); under a foreign `input:*` or any
  `modal:*` they are silent.

## NAV keymap (views)

| key | view | cards |
|-----|------|-------|
| 1 | COMMAND | CommandView + (input via Enter) |
| 2 | MISSION | SlatePanel · GensPanel |
| 3 | TELEMETRY | LogsPanel · LogRain |
| 4 | ESCROW | EscrowReceiptsView (ledger · chain) |
| 5 | LANES | LanesPanel · DispatchRail |
| 6 | LIBRARY | BrowsePanel · FilesPanel |
| 7 | PROJECTS | ProjectsPanel · ClipPanel |
| 8 | SYSTEM | Options / Setup / ModelExplorer (Tab selects) |
| 9 | REVIEW | CodeReviewPanel · DashboardPanel |

## Per-owner keymaps (when their `input:*` is stack top)

| owner | keys |
|-------|------|
| `input:command` | printables → buffer · `Enter` send · `↑/↓` scroll · `Esc` (dispatcher) → NAV |
| `input:slate` / `input:gens` / `input:lanes` / … | panel verbs (arrows, `Enter` select, panel claim keys); printables only while claimed |

No naked `useInput` for global keys outside the dispatcher; onboarding is
the single permitted sovereign leaf.

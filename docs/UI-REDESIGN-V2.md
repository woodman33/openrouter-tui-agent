# TIMMY TUI — UI Redesign V2: RUNS · WORK · LOGS
**Status:** PLAN (approved-for-implementation pending user go-ahead) · 2026-08-11
**Scope:** full from-scratch rebuild of the three non-chat tabs. **CHAT IS FROZEN.**
**Forbidden files (this whole effort):** `src/tui/panels/ChatPanel.tsx`, `src/tui/panels/LogRain.tsx`,
companion chat island. `layout.tsx` may change ONLY to swap which panel component a mode renders —
never its chat branch.

---

## 0. Why this exists (the failure we're fixing)

User verdict 2026-08-11: *"I have NO IDEA what any tab does besides chat… numbered agents — where do
they work? users can't see them so why do they matter? logs are just dates and times… I can't ever use
TIMMY TUI if it sucks to use."*

Diagnosis: the three tabs violated the first law of great TUIs — **every screen must answer one
question, visibly, with real data.** RUNS was a gateway cockpit with no explanation; WORK showed
`[FLOWING]` theater for agents that weren't running; LOGS printed raw machine noise.

The research corpus (KIMI K3 swarm, 413 sources) says the same thing from the other direction:
*"receipts must be used weekly before they are sold"* (EXECUTIVE_OVERVIEW §5 failure mode #3) and
*"harness effects on SWE-bench: +15–20pp — harness range > model range"* (arXiv pdf/2605.23950).
**The TUI is the harness. Its UX is the product.** A trust layer nobody can read is write-only storage.

---

## 1. Design doctrine (research-grounded)

| # | Rule | Source |
|---|------|--------|
| 1 | One screen = one question. No dashboard-of-everything. | k9s (resource views), lazygit (5 focused panels), btop |
| 2 | Status = glyph + color, never prose. Prose only in detail views. | lazygit/btop grammar; our humanlog.ts |
| 3 | No fake states. Every row is backed by a real detection/event/receipt; otherwise say `not installed` / `quiet`. | user verdict; trust thesis |
| 4 | Key hints always visible, contextual to the focused panel. | lazygit bottom bar, k9s footer |
| 5 | List → Enter → detail → Esc back. Drill-down, not modals. | k9s/lazygit/gh-dash |
| 6 | Live with follow/pause; human words by default, raw one key away. | our LogsPanel human view (validated by user) |
| 7 | Human checkpoints inline where risk happens (approve/reject at the step, not in another tab). | Anthropic *Building Effective Agents* (human checkpoints); EU AI Act Art. 12 tamper-evident logging (helpnetsecurity 2026-04-16) |
| 8 | The receipt is the payoff: every run ends in a visible sealed proof with export. | TIMMY thesis; Pipelock mediator-signed receipts (pipelab.org 2026-04-29) |
| 9 | Delegation queues, never pretends to parallelize. | Cognition reversal: coding agents write single-threaded (agent-infra-foundation 2026-05-09) |
| 10 | Density with readability: sparklines/gauges for rates, tables for facts, rain for now. | btop; our LogRain (user called the idea sexy) |

**Tab map (one question each):**
- **CHAT** — "what does my agent say?" (frozen, already good)
- **RUNS** — "what is an agent doing *right now*, and may it?" (mission control)
- **WORK** — "who is on my team, and what do I hand them?" (the crew)
- **LOGS** — "what happened, can I find it, and what did it cost?" (the story)

The 11-panel aspirational map (REVIEW/DASHBOARD/MODELS/FILES/PORTER/SETUP/OPTIONS) is **folded, not
built**: MODELS lives in the chat rail (existing); DASHBOARD's telemetry becomes the LOGS observability
strip; PORTER/lanes live in WORK; REVIEW/FILES stay parked in foundry. Four tabs, done excellently,
beat eleven tabs done theatrically.

---

## 2. RUNS — "Mission Control" (replaces HermesPanel.tsx)

**Question answered:** what is a governed agent doing right now, step by step, and may it proceed?

**Data backbone (already real, already typed):** `useHermesEventStream()` → `HermesStoreSnapshot`
(`run: HermesRun`, `events[]`, `openApprovals[]`, `routes[]` provider fallback chain,
`usage` per-model tokens/cost, `streamText`). Plus `.timmy/runs/events.jsonl` + generations ledger for
studio/gen runs, so RUNS shows *all* work, not only gateway runs.

```
┌ 🏃 RUNS · run_…3f2 · ● running 00:42 · qwen/qwen3.8-max · $0.0213 · ⛁ sealed: 11 ┐
│ prompt: "tighten the rain truncation and re-test"                               │
├────────────── RUN LIST (↑↓) ──────────────┬────────── STEP TIMELINE ────────────┤
│ ● 22:41 qwen   tighten the rain…  $0.021  │ ✓ session created            0.2s   │
│ ⛁ 21:17 qwen   seal the receipt…  $0.11   │ ✓ model routed → openrouter  1.1s   │
│ ✕ 20:54 muse   storyboard beats…  $0.40   │ ✓ tool edit · ChatPanel     12.4s   │
│ ⚠ 20:39 opus   refactor lanes…   pending  │ ⚠ APPROVAL ┌ rm -rf dist ┐          │
│                                          │ │  [a] approve  [r] reject │          │
│                                          │ ○ seal receipt (pending)              │
├──────────────────────────────────────────┴──────────────────────────────────────┤
│ [s] new run · [p] prompt · [a]/[r] approve/reject · [x] export receipt · [l] log│
└─────────────────────────────────────────────────────────────────────────────────┘
```

- **Left: run list** — newest first; glyph per status (`● running ⚠ gated ✕ failed ⛁ sealed ○ idle`);
  time, model short, prompt excerpt, cost. Source: hermes mirror (live) + ledger/jsonl (history).
- **Right: step timeline** of selected run — events reduced to steps via `humanlog.ts` + tool-call
  pairing (`toolCallIdFrom` already in events.ts); elapsed per step; provider-route lines show
  fallbacks (`🔀 muse-spark failed → qwen3.8-max` — that's the trust story, visible).
- **Approval card inline** at the step that's gated: command in a box, `[a]`/`[r]`/`[t]` act right there
  (doctrine #7). No tab-switching to be safe.
- **Receipt footer row** on terminal runs: `⛁ sealed · sha256:9f2c… · [x] export` (doctrine #8).
- **Empty state:** "No runs yet. [s] starts one — everything it does streams here and ends in a
  receipt." Honest, one action.
- **Cost ticker** top-right accumulates from `usage` live (doctrine #10).

**Beats the industry:** no shipping agent TUI (OpenCode/Crush/Claude Code/OpenHands) shows
provider-fallback provenance + per-step approvals + a sealed receipt per run in one view.

---

## 3. WORK — "The Crew" (replaces WorkspacePanel.tsx)

**Question answered:** who is on my team, are they real on this machine, and what do I hand them?

**Data:** `src/agent/lanes.ts` registry + real install detection (`command -v`, cached 15s) +
last-activity per lane from `events.jsonl`/logs + per-lane cost from ledger. Swarm templates demoted to
`[Tab] policies`, labeled *templates — nothing runs yet*.

```
┌ 👥 WORK · THE CREW — real agents on this machine · 4 ready · 1 missing · 0 waiting ┐
│ NAME        STATUS             LAST RUN            COST      WHAT IT DOES          │
│ ▶ opencode  ● ready            22:41 · 12m ago     $0.021    writes code, own sess │
│   hermes    ● ready            22:17 · 36m ago     $0.110    governed jobs+receipts│
│   pi        ○ not installed    —                   —         lightweight coder     │
│   jcode     ● ready            20:54 · 2h ago      $0.003    fast code review      │
│   minds     ● ready            —                   —         research/knowledge    │
├────────────────────────────────────────────────────────────────────────────────────┤
│ delegate → opencode: fix the rain truncation and re-test_                          │
│ [↵] delegate · [g] approve blocked cmd · [l] lane log · [Tab] swarm policies       │
└────────────────────────────────────────────────────────────────────────────────────┘
```

- **Roster table** (k9s-style columns): name / honest status / last run (real, from events) / cost /
  one-line role. Selected row expands a detail strip: last 3 runs (from ledger), binary path, model.
- **Delegation is real:** `[↵]` opens the inline input; submit sends a **one-shot command template**
  into the lane's tmux session. Templates live in ONE config map in `lanes.ts` (verified against each
  CLI's `--help` during implementation; wrong guesses are one-line fixes):
  `opencode run "{task}"`, `hermes chat -q "{task}"`, `pi -p "{task}"`, `jcode "{task}"`, `minds ask "{task}"`.
- Delegation is queued + receipted: the send lands in `events.jsonl` (`lane.delegated`), shows in RUNS
  and the rain. Doctrine #9: one task per lane, visible queue, no fake parallelism.
- **`[g]`** keeps the existing blocked-command approval (real). **`[l]`** jumps to LOGS filtered to the lane.

**Beats the industry:** presence-detected multi-agent roster + one-key delegation + per-agent cost +
approval gating. Nothing shipping does all four.

---

## 4. LOGS — "The Story" (replaces LogsPanel.tsx)

**Question answered:** what happened, can I find the moment, and what did it cost?
This is also the **EU AI Act Art. 12 surface**: tamper-evident, timestamped, reviewable — the weekly
30-minute receipt-review ritual from the executive overview happens HERE.

```
┌ 📜 LOGS · THE STORY · today · 132 events · $3.1512 · errs 2 · warns 5 · sealed 11 ┐
│ rate ▁▂▁▃▅▂▁▇▃▂▁▂   sources: [1]unified [2]tui [3]events [4]companion [5]browser    │
│ 22:41:07  ⛁ runs    run sealed · studio                              $0.0213      │
│ 22:40:55  🔀 model  → qwen/qwen3.8-max                                            │
│ 22:39:12  ✕ net     openrouter request failed (muse-spark) → fallback used        │
│ 22:37:44  ⚠ work    cmux access denied → tmux fallback initialized                │
│ ── 2026-08-10 ─────────────────────────────────────────────────────────────────── │
│ 21:17:03  ⚠ comp    companion health check failed (localhost:5173)                │
├───────────────────────────────────────────────────────────────────────────────────┤
│ [/] search · [e] errors only · [c] costs on/off · [f] follow · [h] raw · [↵] inspect│
└───────────────────────────────────────────────────────────────────────────────────┘
```

- **Unified human timeline by default** (humanlog.ts), day separators, severity color, source tag
  column (`runs/model/net/work/comp/gen`), optional cost column.
- **Observability strip** (btop-style, doctrine #10): ASCII sparkline of events/min (bucketed from
  timestamps), counters errs/warns/sealed, session cost total.
- **Filters:** `[/]` incremental search (dims non-matches), `[e]` errors+warns only, `[1-6]` source
  switch (unified default), `[c]` cost column, `[f]` follow, `[h]` raw.
- **Inspector:** `[↵]` on a line opens a detail box: raw line, parsed fields, related run id;
  `[r]` **jumps to RUNS focused on that run** (cross-nav, doctrine #5). This is the "find the moment"
  superpower: rain shows now, story shows history, runs shows depth — linked.
- Telemetry stays collapsed (`☁ ×N`), never per-line.

**Beats the industry:** human-readable-by-default unified agent history with cost column, sparkline,
and log→run cross-jump. Langfuse does this in a browser for $29/mo; TIMMY ships it in the terminal,
sealed.

---

## 5. Shared primitives (new, small, testable)

`src/tui/components/`:
- `PanelFrame.tsx` — title row + status strip + children + `KeyHintBar` (consistent chrome, doctrine #4)
- `KeyHintBar.tsx` — contextual hints from a declarative `[{key,label}]` prop
- `StatusGlyph.tsx` — single source of truth: status→(glyph,color) map used by ALL panels + rain
- `Sparkline.tsx` — pure fn `buckets(timestamps[], now, width) → '▁▂▃…'` + component (unit-tested)
- `EmptyState.tsx` — "what this screen shows + first action" block (doctrine #3)

`src/hermes/selectors.ts` — pure reducers over mirror snapshot + ledger/jsonl:
`runSummaries()`, `stepTimeline(snapshot)`, `laneLastActivity()`, `sessionCost()`. All unit-tested
(no React, mirrors the store.ts testing style).

---

## 6. Implementation phases (each ends green: vitest + tsc + tsgo)

| Phase | Work | Files touched | Chat risk |
|-------|------|---------------|-----------|
| P1 | shared primitives + selectors + tests | components/*, hermes/selectors.ts, tests | zero |
| P2 | RunsPanel v2; layout swaps `hermes` mode render; **delete HermesPanel.tsx** | RunsPanel.tsx, layout.tsx (1 line), -HermesPanel | zero (layout chat branch untouched) |
| P3 | CrewPanel v2; delegation templates in lanes.ts; **delete WorkspacePanel.tsx** | CrewPanel.tsx, lanes.ts, layout.tsx (1 line) | zero |
| P4 | StoryPanel v2; **delete LogsPanel.tsx**; cross-jump `runs:focus` event | StoryPanel.tsx, layout.tsx (1 line), RunsPanel listens | zero |
| P5 | palette/help copy for the three tabs; acceptance pass | app.tsx palette labels, slash /help text | cosmetic only |

**Verification:** after each phase `npx vitest run && npx tsc --noEmit && npm run typecheck:native`;
manual 60-second acceptance per tab (checklist in §8). No commit without your word.

---

## 7. What we will NOT build (ruthless, per your optimization function)

No new tabs (the 11-panel map stays folded). No virtual-scroll lib, no mouse support, no theme engine,
no tmux control surface, no cluster/GPU dashboards, no multiplayer, no Langfuse embed. Every one of
those is a foundry issue, not a branch. Complexity is the denominator.

---

## 8. Acceptance checklist (you, 60s per tab, cold start)

- **RUNS:** open cold → empty state explains the screen in one sentence; `[s]` starts a run; steps
  stream with glyphs; a blocked command shows the approve card inline; finished run shows `⛁ sealed`
  + `[x]` exports a receipt file.
- **WORK:** every row's status is true (`pi` says not installed if absent); `[↵]` delegates a real
  one-shot task to opencode and the run appears in RUNS + rain; `[Tab]` shows policies labeled templates.
- **LOGS:** default view is human sentences with day separators; `[/]truncation` finds the moment;
  `[↵]`+`[r]` lands in RUNS on the related run; sparkline + cost total update live.
- **CHAT:** pixel-identical behavior before/after (frozen file list never edited).

---

## 9. Open questions for you (answer any time, non-blocking)

1. Delegation one-shot templates: ok to ship best-guesses in one config map, verified at build time?
2. RUNS history depth: keep last 50 runs in the list (jsonl-backed), or all-time with `[m] more`?
3. Should `[x]` export write `receipts/<runid>.json` into the repo dir or `~/.timmy/receipts/`?

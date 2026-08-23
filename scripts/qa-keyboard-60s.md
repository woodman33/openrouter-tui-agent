# Keyboard QA — 60 seconds (v1.0.5-keyboard-arch)

Human checklist; `npx tsx scripts/qa-keyboard-60s.ts` automates steps 2-8
with tmux send-keys + capture-pane and prints the FULL captures. Any step
failing = the keyboard task is NOT done, no matter what the suite says.

1. Boot: `npx tsx timmy.ts` — footer right shows `MODE:NAV`.
2. Press `2`, `3`, `4`, `1` — views switch; status bar stays `MODE:NAV`.
3. Press `Enter` — COMMAND chat takes focus (`MODE:INPUT:COMMAND`).
4. Type `test 2 tab q` — every char lands in the input; NO view switch,
   NO quit (the old leak class).
5. `Esc` — status bar flips to `MODE:NAV` (the old trap class: Esc always
   reaches the root because the dispatcher handles it before any owner).
6. `Tab` — pane focus cycles visibly; the `◆` glyph follows the focused
   card border.
7. `^K` — palette opens (`MODE:MODAL:PALETTE`); `Esc` closes to the prior
   mode.
8. `q` — clean quit; alt-screen restored (`\x1b[?1049l`); scrollback intact.

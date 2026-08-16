# TIMMY TUI — UI VISION v1

The TUI works; it doesn't yet LOOK like the product the promo shows. This doc is the
single source for the visual language. Every panel migrates to it; no new hex values
outside `src/tui/theme.ts`.

## Principle

**One instrument, one voice.** The promo lockup is the brand: near-black field,
purple identity, green trust, amber precision. The TUI is that lockup, running.

## Palette roles (theme.ts is the only hex owner)

| Token            | Hex       | Role                                                        |
|------------------|-----------|-------------------------------------------------------------|
| brand            | `#a78bfa` | TIMMY identity: logo, active nav, companion, brand moments  |
| accent           | `#ffaa33` | signal color: focus, selection, cost, precision instrument  |
| success / trust  | `#3ddc84` | seals, verified chains, live dots, "SHIPS TODAY"            |
| warning          | `#e6b800` | approvals waiting, queued, paused                           |
| error            | `#ff4444` | failed runs, broken chains                                  |
| info             | `#4aa8ff` | links, panel titles, neutral-blue chrome                    |
| textPrimary      | `#e8ecf0` | headlines, claims                                           |
| textSecondary    | `#8892a0` | subs, hint-bar keys, evidence                               |
| textTertiary     | `#5a6470` | dim labels, badges, collapsed telemetry                     |
| surfaceBase      | `#0a0e12` | the field                                                   |
| surfaceRaised    | `#101418` | cards, receipt boxes                                        |
| borderDefault    | `#1c232c` | the ONLY border color (hairline; brand/green borders only for trust moments) |

Rules:
- Purple = identity, never status. Green = trust, never nav. Amber = signal/cost.
  If a color is used for two roles, one of them is wrong.
- Borders are hairline `borderDefault` everywhere except: receipt/trust frames
  (green, like the promo's RECEIPT box) and the single focused pane (brand).
- No `#30363d`, `#4f9cff`, `#e6e6ea`, `#a5b0bc`, `#3fb950` stragglers — those were
  the pre-vision mix. Migrate to tokens.

## Chrome

- **Header**: `TIMMY` (brand, bold) `::` MODE (textPrimary) `·` model (tertiary) —
  right: `RUN·<id>` (tertiary) `COST·$x.xxxx` (accent). Seal-pulse ⛁ flashes green.
- **Nav (left)**: key digit tertiary, label textSecondary; active = brand label +
  brand left-edge; badges tertiary, warning on problems.
- **Footer**: the unified key grammar bar — keys textPrimary-bold, verbs
  textSecondary; sourced ONLY from keymap.ts.
- **Description bar** under the stage: guidance never covers permanent text.

## Panel anatomy (every tab)

```
┌ title row: icon+TITLE (info or brand)          right: ● LIVE / status glyph
│ tab strip (if multi-source): active = double border brand
│ hint row: [key] verb · …  (keys secondary, verbs tertiary)
│ main stage: round border, hairline
└ footer row: range/count tertiary · follow state success/warning
```

- Headlines bold textPrimary; evidence boxes surfaceRaised with hairline border,
  hash green, prev tertiary (mirror the promo receipt card exactly).
- Empty states: one dim glyph line + one teaching line (already the house style).

## Migration checklist (first pass = LOGS)

- [x] theme.ts: add `brand` token; document roles
- [x] LogsPanel: all hex → tokens; companion row brand
- [ ] ChatPanel / GensPanel / LanesPanel / SlatePanel / BrowsePanel / ProjectsPanel:
      sweep hardcoded hex to tokens (one PR per panel, reviewable)
- [ ] PanelFrame shared component (title row + hint row + stage frame) so the
      anatomy above is code, not convention
- [ ] ? overlay + onboarding restyle to tokens

The test that keeps it honest: `grep -rn "#[0-9a-f]\{6\}" src/tui/panels` should only
ever show imports from theme.ts.

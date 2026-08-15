# TIMMY PROMO FINALIZE PACK — handoff to TIMMY TUI (2026-08-15)

Feed this file to TIMMY TUI. Run the three model prompts via **Bodybuilder**
(custom API fan-out to OpenRouter: qwen/qwen3.8-max · google/gemini-2.7-flash ·
x-ai/grok-4.6 — resolve exact ids on the model rail if these 404), synthesize
with **Fusion**, apply the fused delta as v9, render, seal, and record the whole
workflow as receipts. The test: TIMMY records each model's workflow and fixes
the promo from the fused judgement.

---

## 1. RESULTS SO FAR (v1→v8, all sealed in .timmy/receipts/runs.jsonl)

| cut | receipt | verdict | lesson kept |
|---|---|---|---|
| v1 | sha256_94764c89 | terrible (owner) | draft quality ≠ marketing; receipt is punchline, pixels must earn |
| v2 | sha256_558a55d6 | better | intercut terminal footage; re-encode `-g 30 +faststart` or seeks freeze |
| v3 | sha256_2877bd1e | better | design pass BEFORE render; catalog primitives; registered GSAP timeline |
| v4 | sha256_71f6965b | closer | whip wipes, hash-rain, count-up; still not clear enough |
| v5 | sha256_abeb60d4 | way clearer | plain-word claims; every claim carries its real receipt hash |
| v6 | sha256_0d67ac78 | best yet | clean SYNTHETIC demo clips (vhs, `timmy $` prompt, zero sensitive data); clarity first |
| v7 | sha256_1296d9e1 | closer to perfect | real TUI chrome (top bar w/ live cost tick, ┌ PANEL frames, mono-first type); register window.__timelines BEFORE building tweens |
| v8 | sha256_fb4381dc | current best | 45s; proof cards w/ real values; SHIPS-TODAY vs ROADMAP honesty split |

Chain: v1→v8 via prev_hash. Restic snapshots: fa0df80d, aa659efe, 02a8288b,
bdb6886c, 450047ea, 35fffa4d. Making-of casts on disk per version (asciinema).

### Render/lint laws (hard-won)
1. Register `window.__timelines['<comp-id>'] = tl` IMMEDIATELY after creating tl.
2. `<video>` with data-start must be a TOP-LEVEL child of the stage (nested = frozen).
3. Every timed element needs class="clip" (or inline opacity:0 for dips).
4. Text above media: z-index stack video 0 / shade 1 / frame 2 / text 3.
5. GSAP exits get a `tl.set(hard-kill)`; use fromTo (never .to on un-seeked state).
6. vhs tape durations need units (`25ms`, `400ms` — bare numbers = seconds = hang).
7. OTIO 0.18 crashes under Python 3.14 → uv pin 3.12; Clip.2 needs media_references map + active_media_reference_key + Track kind.

### Claim audit (what we may claim; everything else is ROADMAP-labeled)
SHIPS TODAY (real, in-repo): hash-chained+ed25519-signed+env-locked receipts ·
/verify · replay-verified deterministic edits (timmy clip replay) · live tmux lanes
w/ approvals (OpenCode/OpenHands/jcode/aichat/deepagents) · live cost column ·
EDL v1 + OTIO (validated by otioconvert) + W3C Media Fragments + theatre.js→EDL ·
local-first + Ollama fallback + zero accounts · restic-immutable archives ·
/hf push private datasets · roboflow upload · mcpsnoop+mcp-probe lenses ·
open-edit design lane · one grammar/eight tabs.
ROADMAP (label on screen): agent labor exchange · fleet bidding · hosted receipt
portal · execution graph · spend rails · zsh provenance sensor.

### Real proof values (put on screen)
ffmpeg 9.0.1 sha256 cebe04356214a938… · darwin 25F84 · arm64 ·
chain hashes above · "verified: replay matches sealed output ⛁".

---

## 2. CURRENT BEST CUT (v8) — studio/timmy-promo-v8/index.html

45s · 1280×720 · JetBrains Mono-first · palette: bg #05060a · violet #a98bff ·
green #3fb950 · amber #f5b540 · text #e6edf3/#c9d1d9 · border #2d333b.
Persistent top bar `TIMMY :: PROMO · glm-5.2 · RUN·… · COST·$tick(0→2.19)`;
bottom grammar bar (Tab ←→ ↑↓ ↵ Esc ?).

Timing map (beats): 0.4 hook type-on "the agent said \"done.\"" · 2.4 "it wasn't."
slam · 3.7 "⛁ prove it." · 5.3 LANES (demo-lanes.mp4 shaded + claim/sub/evidence) ·
8.7 COST (count-up + AgentPass) · 12.1 RECEIPT (proof card) · 15.5 REPLAY
(demo-replay.mp4 + sha-match card) · 18.9 ENV-LOCK (build-hash card) · 22.3 CLIP/OTIO ·
25.7 LOCAL · 29.1 CONNECTS · 32.5 GRAMMAR (keycaps) · 35.7 SHIPS/ROADMAP split ·
39.3 lockup ⛁ TIMMY + "Trust the receipt, not the model." + registry + url ·
42.5 end "this reel = receipt #8".

---

## 3. THE DELTA SCHEMA (every model outputs this; Fusion merges it)

```json
{
  "model": "<your id>",
  "beats": [
    { "id": "hook1|hook2|turn|lanes|cost|receipt|replay|envlock|clip|local|connect|grammar|split|lockup|end",
      "claim": "string|null (null = keep v8)",
      "sub": "string|null",
      "evidence": "string|null (MUST be real; use audit §1; no invention)",
      "start": "number|null", "duration": "number|null",
      "animation": "type-on|slam|rise|count-up|type-on-evidence|stagger|null",
      "why": "one sentence"
    }
  ],
  "global": { "hook_alt": "string|null", "voice_note": "string", "cuts": "string|null" },
  "total_must_equal": 45.0
}
```

## 4. MODEL PROMPTS (Bodybuilder fan-out: same system, three models, parallel)

SYSTEM (all three):
"You are finalizing a 45-second terminal-brand reel for TIMMY, the Agent Trust OS
('Trust the receipt, not the model.'). Brand law: mono-first type; every claim
plain words + one idea; every claim carries REAL proof (receipt hash, build hash,
verified CLI output) from the audit; SHIPS-TODAY vs ROADMAP must stay labeled;
no jargon without translation; total exactly 45.0s; reading speed ≈4.2 words/sec.
Output ONLY the delta-schema JSON. Do not invent capabilities."

USER-QWEN (qwen3.8-max — reasoning/copy rigor):
"Current cut: §2. Audit every beat's claim for clarity and honesty against §1's
audit. Rewrite any claim a first-time viewer can't parse in one read. Tighten
subs to ≤12 words. Keep the hook story (said done / it wasn't / prove it) unless
you can beat it with a more concrete pain. Return delta JSON."

USER-GEMINI (gemini-2.7-flash — visual pacing/motion):
"Current cut: §2 timing map. Audit pacing: no beat under 2.8s with >2 text lines;
evidence type-ons start ≥0.4s after claim; dips 0.4s; count-up 1.8s. Propose timing
+ animation deltas for maximum readability at 720p. Return delta JSON."

USER-GROK (grok-4.6 — punch/memorability, no overclaim):
"Current cut: §2. Sharpen the hook and the three core claims (control/cost/proof)
for punch and recall. Propose up to 3 alternative hooks; pick the best; keep the
honesty split sacred — punch never exceeds proof. Return delta JSON."

## 5. FUSION PROMPT (synthesis + judgement)

"Inputs: three delta-schema JSONs (qwen3.8-max, gemini-2.7-flash, grok-4.6) + v8
structure §2. Merge rule per beat: honesty > clarity > punch; timing conflicts
resolved to keep total 45.0; any claim lacking real evidence in §1 is cut.
Output: (a) FINAL cut JSON (full beats array, not deltas), (b) judgement table:
per beat which model won and why, (c) one-sentence workflow summary per model
(how each model approached the task) — TIMMY receipts will verify these."

## 6. TIMMY EXECUTION PROTOCOL (record + fix)

1. Read this pack + studio/timmy-promo-v8/index.html.
2. Bodybuilder custom API → OpenRouter: parallel requests to the three models
   (system §4 + each user prompt), response_format json_object. Each run = receipt.
3. Fusion run with §5 + the three outputs. Receipt.
4. Apply FINAL cut JSON → studio/timmy-promo-v9/index.html (copy v8, apply beats).
5. Render: `npx hyperframes render studio/timmy-promo-v9 --quality high`
   (obey render laws §1; fix lint; re-render until 0 timed-media errors).
6. Seal: appendReceipt('runs', {kind:'run', subject:'promo v9 · bodybuilder fan-out +
   fusion synthesis', spans per model run + fusion, artifacts [index.html, mp4, cast]}).
7. restic backup studio/timmy-promo-v9; asciinema the whole session.
8. Report from RECEIPTS: per-model cost, latency, workflow summary, fusion judgement.
   That report IS the product demo: TIMMY hired three models, fused them, fixed its
   own promo, and the receipts prove every step.

# TIMMYTUI Launch Video Edit Notes

Date: 2026-06-05

## Reviewed Draft

- Browser-open draft: `/Users/williammeldman/heygen:hyperframes/remotion/openrouter-tui-launch/out/OpenRouterTuiLaunch.mp4`
- Product Hunt master candidate: `/Users/williammeldman/heygen:hyperframes/renders/openrouter-tui-launch/openrouter-tui-launch-v3-hyperframes.mp4`
- Remotion master: `/Users/williammeldman/heygen:hyperframes/renders/openrouter-tui-launch/openrouter-tui-launch-v3.mp4`
- Local 16:9 launch master: `launch-assets/video/timmytui-product-hunt-demo-v3-16x9.mp4`
- Format: 1920x1080, 30 fps, about 60 seconds, with voiceover.

## Exact Title And Caption Replacements Made

| Previous / risky wording | Replacement |
| --- | --- |
| Model Routing | OpenRouter Model Selection |
| routes across models | choose from OpenRouter models |
| router / best-model framing | model rail / selected model / choose the model before the run |
| broad provider fallback claim | no fallback claim in the active cut |
| raw proof / manifest framing | sealed TIMMY receipt / manifest hash / reviewable later |

The active v3 cut uses the safer final claim:

> TIMMYTUI gives AI agent work model selection, MCP -> CLI evidence bundles, cmux workspace launch, Browser Companion mirroring, and sealed TIMMY receipts.

## Scenes To Cut

- Any screen with OpenRouter provider errors, model failures, or failed provider health state.
- Any screen with broken layout, overlapping controls, blank Browser Companion gaps, or terminal spam.
- Options navigation unless it is absolutely required for context.
- Raw manifest contents. Showing the existence of a receipt path or manifest hash is fine.
- tmux views unless they are clearly labeled as fallback persistence.
- Herdr or TIMMY Pane surfaces; keep them out of the launch video because they are roadmap.
- Any caption implying TIMMY autonomously chooses the best model for every prompt.

## Scenes To Keep

- Main Chat with the OpenRouter model rail visible.
- MCP -> CLI page showing URL paste, scan output, and evidence-bundle framing.
- Workspace page showing cmux launch and local work-surface context.
- Browser Companion proof/review surface showing session mirroring and receipt review.
- Sealed TIMMY receipt beat with manifest hash visible enough to support the claim.
- Clean TIMMYTUI end card with the tagline: `Trust the receipt, not the model.`

## Final 60-Second Timeline

| Time | Scene | On-screen copy | Voice / caption intent |
| --- | --- | --- | --- |
| 0:00-0:04 | Hook | AI agents need receipts. | AI agents are powerful, but you often cannot see what they actually did. |
| 0:04-0:12 | Main Chat / model rail | OpenRouter Model Selection / Choose the model before the run. | TIMMYTUI starts with a local-first Main Chat and an OpenRouter model rail. |
| 0:12-0:25 | MCP -> CLI | MCP server -> CLI evidence bundle. | Paste an MCP server URL and create commands, Visa scopes, receipt fields, and a dry-run plan. |
| 0:25-0:38 | Workspace | cmux = visual workspace. Browser = review surface. | cmux opens the work surface; Browser Companion mirrors chat, logs, workspace status, and receipts. |
| 0:38-0:52 | Proof | Sealed TIMMY receipt. Manifest hash. Reviewable later. | `/agent-proof` creates a sealed TIMMY receipt with a manifest hash. |
| 0:52-0:60 | End card | TIMMYTUI / Trust the receipt, not the model. | Final claim: model selection, MCP evidence, cmux launch, Browser Companion mirroring, sealed receipts. |

## Risky Claims Still Present

None in the active v3 video source or rendered review frames.

Risk to keep watching for in adjacent launch copy:

- Do not say `Model Routing` unless a clip visibly proves health testing, fallback, and actual routing behavior.
- Do not use the forbidden proof/legal guarantee terms from the launch brief.
- Do not imply TIMMY selects the optimal model automatically or guarantees provider recovery.

## Recommended Export File Names

- Product Hunt / X / LinkedIn / GitHub master: `timmytui-product-hunt-demo-v3-16x9.mp4` (created in `launch-assets/video/`)
- Captioned social variant: `timmytui-product-hunt-demo-v3-16x9-captioned.mp4`
- Silent gallery preview loop: `timmytui-product-hunt-demo-v3-gallery-loop.mp4`
- YouTube/Vimeo upload title: `TIMMYTUI - Trust the receipt, not the model`

## Product Hunt Gallery Alignment Notes

Product Hunt gallery images should use 1270x760 landscape frames and at least 2 images before launch. Use 7 images if possible:

1. Hero: `TIMMYTUI` plus `Trust the receipt, not the model.`
2. Main Chat: `Choose the model before the run.`
3. MCP -> CLI: `MCP server -> CLI evidence bundle.`
4. Workspace: `Open the workspace in cmux.`
5. Browser Companion: `Mirror the session in the browser.`
6. Proof: `Generate a sealed TIMMY receipt.`
7. Store / Field Guides: keep as a secondary launch asset, not part of the core proof claim.

The video and gallery should tell the same story: local-first model selection, local MCP evidence, cmux workspace launch, Browser Companion review, and sealed receipts.

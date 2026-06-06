# TIMMYTUI Launch Video Final Edit Notes

Final master: `launch-assets/video/timmytui-launch-demo-v4.mp4`

Source render: `/Users/williammeldman/heygen:hyperframes/renders/openrouter-tui-launch/timmytui-launch-demo-v4.mp4`

Duration: 60.03 seconds

Format: 16:9, 1920x1080, H.264 video, AAC audio

Verification asset: `launch-assets/video/timmytui-launch-demo-v4-contact-sheet.jpg`

## 1. Title And Caption Replacements

| Draft wording removed | Final wording used |
| --- | --- |
| Model Routing | OpenRouter Model Selection |
| routes across models | choose from OpenRouter models |
| best model / auto route framing | choose the model before the run |
| MCP server -> CLI evidence bundle | MCP server -> CLI evidence bundle |
| broad proof guarantee language | sealed TIMMY receipt / manifest hash |

No automatic model-routing claim is used. The cut only shows OpenRouter model selection through the visible model rail.

## 2. Scenes Cut

- Provider-error, broken-layout, jumbled UI, terminal-spam, and settings-navigation-led surfaces.
- Raw manifest views.
- tmux fallback views.
- Options.
- Roadmap-only surfaces.
- Any title or caption implying automatic model routing.

## 3. Scenes Kept

- Founder intro as a short human hook.
- Main Chat with the OpenRouter model rail visible.
- MCP to CLI scan and evidence output.
- Workspace launcher with cmux, Browser Companion, and Local Files context.
- Browser Companion proof receipt with manifest hash.
- Clean TIMMYTUI end card with the main tagline.

## 4. Audio Used

V4 uses the newest downloaded ElevenLabs v3 snippets where they match the scene cleanly, then switches to tighter scene-sized ElevenLabs clips for the back half:

| Scene | Audio file | Source decision |
| --- | --- | --- |
| Hook | `audio/v4-01-hook-elevenv3.mp3` | First 5.35s from `ElevenLabs_audio_eleven-v-3_AI agents ne..._2026-06-05T17_26_58.mp3`. |
| Model rail | `audio/v4-02-model-elevenv3.mp3` | First 6.35s from `ElevenLabs_audio_eleven-v-3_Choose the m..._2026-06-05T17_29_35.mp3`. |
| MCP evidence | `audio/v4-03-mcp-elevenv3.mp3` | First 12.95s from `ElevenLabs_audio_eleven-v-3_Paste an M-C..._2026-06-05T17_31_04.mp3`. |
| Workspace | `audio/eleven-04-workspace.mp3` | Existing scene-sized take kept for timing. |
| Proof | `audio/eleven-05-proof.mp3` | Existing scene-sized take kept for timing. |
| Close | `audio/eleven-06-close.mp3` | Existing scene-sized close kept for tagline timing. |

All new snippets were trimmed, lightly faded, converted to 48 kHz stereo, and normalized for the final render. The v3 Mark-voice render remains available as a fallback at `launch-assets/video/timmytui-launch-demo-v3.mp4`.

## 5. Final 60-Second Timeline

| Time | Scene | On-screen caption | Story purpose |
| --- | --- | --- | --- |
| 0:00-0:04 | Founder hook / TIMMY opening | AI agents need receipts. | Establish the trust problem fast. |
| 0:04-0:12 | Main Chat and model rail | Choose the model before the run. | Show OpenRouter model selection without overclaiming routing. |
| 0:12-0:25 | MCP to CLI evidence | MCP server -> CLI evidence bundle. | Make the evidence-bundle workflow the first major proof point. |
| 0:25-0:37 | Workspace | Open the workspace in cmux. | Show cmux as the visual work surface and Browser Companion as the review surface. |
| 0:37-0:52 | Browser Companion proof | Generate a sealed TIMMY receipt. | Center the sealed receipt and manifest hash. |
| 0:52-1:00 | End card | Trust the receipt, not the model. | Close on the launch message. |

## 6. Remaining Risky Claims

- None in the current title cards or captions.
- The video shows model selection through the OpenRouter model rail. It does not show or claim automatic provider routing.
- The proof scene shows Browser Companion and a receipt surface; it does not show raw manifest details.
- Store / Field Guides are not included because there was no clean launch-safe footage in the selected take set.

## 7. Recommended Export Names

- Master export: `launch-assets/video/timmytui-launch-demo-v4.mp4`
- Product Hunt upload: `timmytui-launch-demo-v4-product-hunt-16x9.mp4`
- X / LinkedIn upload: `timmytui-launch-demo-v4-social-16x9.mp4`
- GitHub README asset: `timmytui-launch-demo-v4-github-16x9.mp4`
- Fallback master: `launch-assets/video/timmytui-launch-demo-v3.mp4`

## 8. Product Hunt Gallery Alignment

The video matches the Product Hunt gallery story:

1. Hero: founder hook and TIMMYTUI end card.
2. Main Chat: OpenRouter model rail.
3. MCP to CLI: evidence bundle creation.
4. Workspace: cmux launch surface.
5. Browser Companion: mirrored review surface.
6. Proof: sealed TIMMY receipt and manifest hash.
7. Store / Field Guides: keep as a still/gallery image unless clean footage is recorded.

# OpenRouter capability map

Generated 2026-09-07T10:47:03.100Z from `capabilities.inventory.json` (sha256 862e9fd78d6e81f2, 111 fetched sources, 104 capabilities). mindship-v5c2 step 1.

| status | count | meaning |
|---|---|---|
| implemented | 15 | exists in the repo today; the row names the file |
| wire-now | 29 | a small change on a surface that already exists; the row names it |
| later | 60 | waits; the row says why |

Unverified inventory entries: 9. Rows defaulted (no explicit rule): 0. Not found in the docs: `fan-out`.

## Verbs and receipts

Command-center verbs are `timmy …` commands (src/cli.ts and the lanes it dispatches to); receipt kinds are the subjects sealed into the root store or the edge chains. `—` means no verb or receipt applies.

### models

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [models-list](https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties) | **implemented** | timmy models · timmy cf …/models | models.list | src/cli.ts models; workers/ai-proxy /models (slim id/ctx/price) | wire-now: seal the catalog sha so a model pin cites the catalog it came from |
| [model-endpoints](https://openrouter.ai/docs/api/api-reference/endpoints/list-all-endpoints-for-a-model) | **later** | timmy models endpoints <id> | openrouter.endpoints |  | per-provider pricing/latency for a model; useful once routing is wired |
| [models-user-filtered](https://openrouter.ai/docs/api/api-reference/models/list-models-filtered-by-user-provider-preferences-privacy-settings-and-guardrails) *(unverified)* | **later** | timmy models --mine | models.list |  | unverified in the docs |
| [providers-list](https://openrouter.ai/docs/api/api-reference/providers/list-providers) | **wire-now** | timmy providers audit | openrouter.providers | src/agent/provider-registry.ts + GET /api/v1/providers | audit is local registry only today; add the live provider list |
| [latest-model-resolution](https://openrouter.ai/docs/guides/routing/routers/latest-resolution) | **later** | timmy model ~author/family-latest | model.pin |  | allowlists pin exact ids on purpose; a floating alias needs the pinned id recorded in the receipt first |
| [model-variant-suffixes](https://openrouter.ai/docs/guides/routing/model-variants/free) | **wire-now** | timmy commander think --models a:nitro | commander.turn | workers/ai-proxy/src/tools.ts allowlist() | allow suffix variants of an allowlisted base id |

### chat

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [chat-completions](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request) | **implemented** | timmy commander think · timmy_llm_call · /chat | commander.turn · llm.call | workers/ai-proxy/src/commander-core.ts chatOnce; src/mcp/server.ts timmy_llm_call; worker /chat passthrough |  |
| [prompt-completions](https://openrouter.ai/docs/api_reference/overview) | **later** | — | — |  | legacy prompt field; nothing in Timmy needs it |
| [anthropic-messages-api](https://openrouter.ai/docs/api/api-reference/anthropic-messages/create-a-message) | **later** | — | — |  | Timmy speaks chat completions; the Messages shape adds nothing yet |

### other

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [app-attribution-headers](https://openrouter.ai/docs/app-attribution) | **wire-now** | (every call) | — | commander-core.ts chatOnce, code.ts generateScript: X-Title only | add HTTP-Referer + X-OpenRouter-Categories so OpenRouter rankings credit TIMMY |
| [presets](https://openrouter.ai/docs/guides/features/presets) | **later** | timmy model @preset/<slug> | model.pin |  | project profiles already carry models; presets duplicate that server-side |
| [batch-api](https://openrouter.ai/docs/batch-quickstart) | **later** | timmy sim run --batch | sim.run |  | the story sim could batch actor turns at half price; after v0 |
| [broadcast-observability](https://openrouter.ai/docs/guides/features/broadcast) | **later** | (every call) | — |  | trace/session ids to OpenRouter observability; receipts are our trace |
| [openapi-and-versioning](https://openrouter.ai/docs/api_reference/versioning) | **wire-now** | timmy oapi (spec_url openrouter.ai/openapi.json) | oapi.call | src/mcp/server.ts timmy_oapi_run | point the OpenAPI lane at the OpenRouter spec: every endpoint becomes a receipted tool |
| [mcp-server](https://openrouter.ai/docs/guides/overview/mcp-server) | **wire-now** | fleet connector openrouter-mcp | fleet.detect | fleet/fleet.json (detect url https://mcp.openrouter.ai/mcp) | detect-only entry like tripo; the commander handoff already speaks MCP |
| [ori-eval-llm-judge](https://openrouter.ai/docs/guides/ori/eval) | **later** | timmy judge | judge.run |  | Timmy has its own judge loop (timmy_judge_loop) with receipts |
| [fusion-analyst-model-judge-alias](https://openrouter.ai/docs/changelog) | **later** | — | — |  | a deprecated field alias, not a capability |
| [workspaces-files-containers](https://openrouter.ai/docs/guides/features/workspaces) *(unverified)* | **later** | — | — |  | unverified |
| [benchmarks-datasets-classifications](https://openrouter.ai/docs/api/api-reference/benchmarks/list-benchmarks) *(unverified)* | **later** | timmy sim export | dataset.behavior-v0 |  | unverified; behavior-v0 stays local |

### responses-api

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [responses-api](https://openrouter.ai/docs/api_reference/responses/overview) | **later** | timmy commander think --api responses | commander.turn |  | commander uses chat completions; switch when server tools are wired |
| [responses-tool-calling](https://openrouter.ai/docs/api_reference/responses/tool-calling) | **later** | — | commander.turn |  | with responses-api |
| [responses-reasoning](https://openrouter.ai/docs/api_reference/responses/reasoning) | **later** | — | commander.turn |  | with responses-api |
| [responses-streaming](https://openrouter.ai/docs/api_reference/responses/basic-usage) | **later** | — | — |  | with responses-api |

### streaming

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [sse-streaming](https://openrouter.ai/docs/api_reference/streaming) | **implemented** | timmy logs (companion) · timmy chat | chat.turn | src/companion/server.ts + client (stream: true); the TUI chat surface is Qwen-owned and not verified here | commander turns are non-streamed on purpose (one receipt per turn) |
| [stream-cancellation](https://openrouter.ai/docs/api_reference/streaming) | **wire-now** | timmy commander kill | commander.kill | commander.ts cmdKill | abort in-flight OpenRouter fetches on kill (AbortController); today kill stops the next turn, not the current one |
| [mid-stream-errors](https://openrouter.ai/docs/api_reference/errors-and-debugging) | **later** | — | — |  | with streaming in the commander |

### tool-calling

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [tool-calling](https://openrouter.ai/docs/guides/features/tool-calling) | **wire-now** | timmy commander think --tools | commander.turn | commander-core.ts chatOnce (tools passthrough) | Timmy tools run as Code Mode (hands) today; native tools[] lets the mind call edge tools directly |
| [parallel-tool-calls](https://openrouter.ai/docs/api_reference/parameters) | **later** | — | commander.turn |  | after tool-calling |
| [server-tools](https://openrouter.ai/docs/guides/features/server-tools) | **later** | timmy commander think --server-tools | commander.turn |  | server-side tools run at OpenRouter; receipts would cite their calls |
| [server-tool-web-search](https://openrouter.ai/docs/guides/features/server-tools/web-search) | **later** | timmy commander think --web | commander.turn |  | after server-tools |
| [server-tool-web-fetch](https://openrouter.ai/docs/guides/features/server-tools/web-fetch) | **later** | — | commander.turn |  | after server-tools |
| [server-tool-advisor](https://openrouter.ai/docs/guides/features/server-tools/advisor) | **later** | — | commander.turn |  | after server-tools |
| [server-tool-subagent](https://openrouter.ai/docs/guides/features/server-tools/subagent) | **later** | — | commander.turn |  | Timmy dispatches harnesses itself (Command Post) |
| [server-tool-fusion](https://openrouter.ai/docs/guides/features/server-tools/fusion) | **wire-now** | timmy commander think --mode fusion --native | commander.turn | commander-core.ts executeTurn fusion branch | let fusion mode delegate to openrouter:fusion; receipt records native=true and the analysis models |
| [server-tools-shell-bash-apply-patch-tool-search](https://openrouter.ai/docs/guides/features/server-tools) *(unverified)* | **later** | — | — |  | unverified; Code Mode is the hands |

### structured-outputs

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [structured-outputs](https://openrouter.ai/docs/guides/features/structured-outputs) | **wire-now** | timmy sim run · timmy commander think --json-schema | sim.turn · commander.turn | lanes/sim/sim.mjs referee call; commander-core.ts chatOnce | the referee already demands JSON; response_format.json_schema makes it a contract |

### plugins

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [response-healing-plugin](https://openrouter.ai/docs/guides/features/plugins/response-healing) | **wire-now** | timmy sim run | sim.turn | lanes/sim/sim.mjs referee call | heal malformed referee JSON server-side instead of firstJson() |
| [plugins-array](https://openrouter.ai/docs/guides/features/plugins) | **wire-now** | (every call) | — | commander-core.ts chatOnce | plugins passthrough field |
| [web-search-plugin-online](https://openrouter.ai/docs/guides/features/plugins/web-search) | **later** | — | — |  | deprecated in favour of the web_search server tool |

### routing

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [provider-order-and-fallbacks](https://openrouter.ai/docs/guides/routing/provider-selection) | **wire-now** | timmy commander think --provider | commander.turn | commander-core.ts chatOnce | provider passthrough; record the provider that answered |
| [provider-filters](https://openrouter.ai/docs/guides/routing/provider-selection) | **wire-now** | timmy commander think --provider | commander.turn | commander-core.ts chatOnce | with provider passthrough |
| [provider-sort-and-price-caps](https://openrouter.ai/docs/guides/routing/provider-selection) | **wire-now** | timmy commander cap | commander.cap · commander.turn | commander-core.ts: spend cap → provider.max_price | the room cap becomes a per-request price ceiling too |
| [nitro-floor-shorthands](https://openrouter.ai/docs/guides/features/service-tiers) | **wire-now** | timmy commander think --models a:floor | commander.turn | tools.ts allowlist() | with model-variant-suffixes |
| [service-tier](https://openrouter.ai/docs/guides/features/service-tiers) | **later** | — | commander.turn |  | no priority need yet |
| [exacto-variant](https://openrouter.ai/docs/guides/routing/model-variants/exacto) | **later** | — | — |  | after tool-calling |
| [auto-exacto](https://openrouter.ai/docs/guides/routing/auto-exacto) | **later** | — | — |  | after tool-calling |
| [router-metadata](https://openrouter.ai/docs/guides/features/router-metadata) | **wire-now** | (every call) | commander.turn | commander-core.ts chatOnce | X-OpenRouter-Metadata: enabled → record provider/model actually used in receipt.models[] |

### privacy

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [in-region-routing](https://openrouter.ai/docs/guides/features/in-region-routing) | **later** | — | — |  | no residency requirement yet |
| [zero-data-retention](https://openrouter.ai/docs/guides/features/zdr) | **wire-now** | timmy project new --zdr | project.new · commander.turn | lanes/project/templates/profile.cue + commander-core.ts provider.zdr | a project profile flag that every call under it carries |
| [provider-logging-data-collection](https://openrouter.ai/docs/guides/privacy/provider-logging) | **wire-now** | timmy project new --no-data-collection | project.new · commander.turn | profile.cue + provider.data_collection | with zdr |
| [input-output-logging](https://openrouter.ai/docs/guides/features/input-output-logging) | **later** | — | — |  | dashboard toggle, not an API |
| [guardrails](https://openrouter.ai/docs/guides/features/guardrails) | **later** | timmy approve | approval |  | Timmy gates paid calls with its own single-use tokens |

### fallbacks

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [model-fallbacks](https://openrouter.ai/docs/guides/routing/model-fallbacks) | **wire-now** | timmy commander think --models a,b | commander.turn | commander-core.ts planTurn generate branch | in generate mode, extra models become body.models fallbacks instead of being ignored |

### auto-router

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [auto-router](https://openrouter.ai/docs/guides/routing/routers/auto-router) | **implemented** | lane default openrouter/auto | agentrun | src/agent/lanes.ts (openhands LLM_MODEL default) | the commander allowlist pins ids; auto stays a lane default |
| [pareto-code-router](https://openrouter.ai/docs/guides/routing/routers/pareto-router) | **later** | timmy commander think --models openrouter/pareto-code | commander.turn |  | after allowlist suffix/alias support |
| [free-models-router](https://openrouter.ai/docs/guides/routing/routers/free-router) | **wire-now** | timmy sim run --actor-model openrouter/free | sim.turn | lanes/sim/sim.mjs (any model id) | a $0 actor tier for rehearsal runs; already accepted by the lane, not yet a documented default |
| [body-builder](https://openrouter.ai/docs/guides/routing/routers/body-builder) | **wire-now** | timmy commander think --mode bodybuilder --native | commander.turn | src/utils/providers.ts lists openrouter/bodybuilder; commander-core.ts bodybuilder branch | Timmy fans out itself today; native mode would take the router's {requests:[…]} and run them |
| [fusion-router](https://openrouter.ai/docs/guides/routing/routers/fusion-router) | **wire-now** | timmy commander think --mode fusion --native | commander.turn | commander-core.ts fusion branch; src/mcp/server.ts timmy_fusion_plan (own judge chain) | model openrouter/fusion as the native alternative to our actors+judge |

### caching

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [prompt-caching-cache-control](https://openrouter.ai/docs/guides/best-practices/prompt-caching) | **later** | — | commander.turn |  | commander prompts are short; wire with memory-in-prompt |
| [prompt-caching-automatic](https://openrouter.ai/docs/guides/best-practices/prompt-caching) | **wire-now** | timmy commander spend | commander.turn | commander-core.ts usageCost | record usage.prompt_tokens_details.cached_tokens in the ledger |
| [session-sticky-routing](https://openrouter.ai/docs/guides/best-practices/prompt-caching) | **wire-now** | (every commander call) | commander.turn | commander-core.ts chatOnce | session_id = room so a room keeps its provider |
| [response-caching](https://openrouter.ai/docs/guides/features/response-caching) *(unverified)* | **later** | — | — |  | unverified |

### multimodal

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [pdf-input-file-parser](https://openrouter.ai/docs/guides/overview/multimodal/pdfs) | **later** | timmy commander think --file | commander.turn |  | after multimodal in the commander |
| [image-input](https://openrouter.ai/docs/guides/overview/multimodal/image-understanding) | **later** | timmy commander think --image | commander.turn |  | the observer lane uses Roboflow for images today |
| [audio-input-output](https://openrouter.ai/docs/guides/overview/multimodal/audio) | **later** | — | — |  |  |
| [video-input](https://openrouter.ai/docs/guides/overview/multimodal/videos) | **later** | — | — |  |  |
| [image-generation-api](https://openrouter.ai/docs/guides/overview/multimodal/image-generation) | **implemented** | timmy gen | gen.run | src/utils/providers.ts (image models through OpenRouter) + GENS ledger | the dedicated /images endpoint is later; today images ride the chat route |
| [video-generation-api](https://openrouter.ai/docs/guides/overview/multimodal/video-generation) | **implemented** | timmy gen | gen.run | src/utils/providers.ts (happyhorse-1.1) | the dedicated /videos job endpoint is later |
| [text-to-speech](https://openrouter.ai/docs/guides/overview/multimodal/tts) | **later** | timmy gen --kind tts | gen.run |  | ElevenLabs lanes exist elsewhere |
| [speech-to-text](https://openrouter.ai/docs/guides/overview/multimodal/stt) | **later** | — | — |  |  |

### transforms

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [context-compression-middle-out](https://openrouter.ai/docs/guides/features/message-transforms) | **later** | timmy commander think | commander.turn |  | commander prompts are short; wire when memory grows into the prompt |

### reasoning

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [reasoning-parameter](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens) | **wire-now** | timmy commander think --reasoning | commander.turn | commander-core.ts chatOnce | passthrough + record reasoning tokens in the ledger |
| [reasoning-details-preservation](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens) | **later** | — | — |  | multi-turn reasoning continuity; the commander keeps turns, not threads |

### usage-accounting

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [usage-object](https://openrouter.ai/docs/cookbook/administration/usage-accounting) | **implemented** | timmy commander spend | commander.turn | commander-core.ts usageCost/applySpend (cost, tokens, uncounted) | usage.include is deprecated per the docs (usage always returned): drop the flag |
| [generation-stats](https://openrouter.ai/docs/api/api-reference/generations/get-request-&-usage-metadata-for-a-generation) | **wire-now** | timmy commander turns --exact | commander.turn | commander.ts (GET /generation?id after each call) | exact native cost per generation; needs the generation id stored on the call record |
| [zero-completion-insurance](https://openrouter.ai/docs/guides/features/zero-completion-insurance) | **implemented** | (billing) | — | automatic | nothing to wire |
| [generation-feedback-and-stored-content](https://openrouter.ai/docs/api/api-reference/generations/submit-feedback-for-a-generation) *(unverified)* | **later** | — | — |  | unverified |

### embeddings

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [embeddings-api](https://openrouter.ai/docs/api_reference/embeddings) | **later** | — | — |  | CPO embeddings are local/Zilliz (Sparks plan) |
| [rerank-api](https://openrouter.ai/docs/api/api-reference/rerank/submit-a-rerank-request) | **later** | — | — |  | same |

### keys-auth

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [bearer-api-key-auth](https://openrouter.ai/docs/api_reference/authentication) | **implemented** | (every call) | — | worker secret OPENROUTER_API_KEY; lanes read process.env |  |
| [oauth-pkce](https://openrouter.ai/docs/guides/overview/auth/oauth) | **later** | timmy connect openrouter | connect |  | single-operator setup; env key suffices |
| [workload-identity-federation](https://openrouter.ai/docs/guides/overview/auth/workload-identity-federation) *(unverified)* | **later** | — | — |  | unverified |
| [management-api-keys](https://openrouter.ai/docs/guides/overview/auth/management-api-keys) | **wire-now** | timmy project new --budget | project.new | lanes/project/project.mjs (mint a key with limit = budget) | a per-project OpenRouter key whose limit IS the profile budget: the cap enforced by OpenRouter, not only by us |
| [byok](https://openrouter.ai/docs/guides/overview/auth/byok) | **later** | — | — |  |  |

### rate-limits

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [current-key-limits](https://openrouter.ai/docs/api_reference/limits) | **implemented** | timmy cf pane | cf.pane | lanes/cf/pane.mjs spend.openrouter.key (/auth/key) |  |
| [rate-limits](https://openrouter.ai/docs/api_reference/limits) | **implemented** | /chat | — | workers/ai-proxy/src/index.ts (429 passthrough + own RATE_LIMIT_PER_MIN) |  |

### credits-analytics

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [credits](https://openrouter.ai/docs/api/api-reference/credits/get-remaining-credits) | **implemented** | timmy cf pane | cf.pane | lanes/cf/pane.mjs spend.openrouter.credits |  |
| [analytics](https://openrouter.ai/docs/api/api-reference/analytics/query-analytics-data) | **wire-now** | timmy cf pane | cf.pane | lanes/cf/pane.mjs (POST /analytics/query: spend by model per day) |  |

### errors

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [error-shape-and-codes](https://openrouter.ai/docs/api_reference/errors-and-debugging) | **implemented** | (every call) | commander.turn.models[].error | index.ts preserves upstream status/body; commander records upstream errors per call |  |

### sdk-client

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [ts-sdk-package](https://openrouter.ai/docs/client-sdks/typescript/overview) | **implemented** | timmy chat / gen | — | package.json @openrouter/sdk; src/agent/core.ts, src/agent/tools.ts, src/modes/chat/tools.ts |  |
| [ts-sdk-chat-send](https://github.com/OpenRouterTeam/typescript-sdk) | **implemented** | timmy chat | chat.turn | src/agent/core.ts (the agent client) |  |
| [ts-sdk-constructor-attribution](https://openrouter.ai/docs/client-sdks/typescript/sdks/credits/README) | **wire-now** | (sdk) | — | src/agent/core.ts client construction | httpReferer/appTitle/appCategories on the client |
| [sdk-devtools](https://openrouter.ai/docs/agent-sdk/dev-tools/devtools) *(unverified)* | **later** | — | — |  | unverified |

### sdk-agent

| capability | status | verb | receipt | where / how | note |
|---|---|---|---|---|---|
| [agent-sdk-package](https://openrouter.ai/docs/client-sdks/agent-migration) | **later** | — | — |  | @openrouter/agent is not a dependency; the commander is the agent loop |
| [agent-callmodel](https://openrouter.ai/docs/agent-sdk/call-model/api-reference) | **later** | — | — |  | with agent-sdk-package |
| [agent-tool-helper](https://openrouter.ai/docs/agent-sdk/call-model/tools) | **later** | — | — |  | edge tools are zod already (tools.ts) |
| [agent-stop-conditions](https://openrouter.ai/docs/agent-sdk/call-model/stop-conditions) | **later** | — | — |  | the commander has cap + kill |
| [agent-next-turn-params](https://openrouter.ai/docs/agent-sdk/call-model/next-turn-params) | **later** | — | — |  |  |
| [agent-dynamic-parameters](https://openrouter.ai/docs/agent-sdk/call-model/dynamic-parameters) | **later** | — | — |  |  |
| [agent-streaming-methods](https://openrouter.ai/docs/agent-sdk/call-model/streaming) | **later** | — | — |  |  |
| [agent-message-format-converters](https://openrouter.ai/docs/agent-sdk/call-model/message-formats) | **later** | — | — |  |  |
| [agent-mcp-tools](https://openrouter.ai/docs/agent-sdk/call-model/mcp-tools) | **later** | — | — |  | the commander handoff is the MCP surface |
| [agent-lifecycle-hooks](https://openrouter.ai/docs/agent-sdk/call-model/lifecycle-hooks) | **later** | — | — |  | Timmy's pre-tool hook lives in the MCP server |
| [agent-hitl-and-async-tools](https://openrouter.ai/docs/agent-sdk/call-model/tool-approval-state) *(unverified)* | **later** | — | — |  | timmy approve is the HITL gate |

## The two names in the order

- **bodybuilder** is real at OpenRouter: the `openrouter/bodybuilder` router returns `{requests:[…]}` for the caller to run in parallel. Timmy already fans out itself (commander `bodybuilder` mode, `timmy_judge_loop`); wiring the native router is a `--native` flag on the same mode.
- **fusion** is real at OpenRouter: `openrouter/fusion` (a panel of models plus an analyst) and the `openrouter:fusion` server tool. Timmy runs its own actors + judge (commander `fusion` mode, `timmy_fusion_plan`); the native router is the `--native` alternative, and the receipt must say which one answered.
- "judge" exists only as a deprecated alias (`judge_model` → `analyst_model`); "fan-out" is not an OpenRouter term.

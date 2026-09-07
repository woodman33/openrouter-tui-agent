#!/usr/bin/env node
// OpenRouter capability map (mindship-v5c2 step 1): every capability in
// capabilities.inventory.json (measured from the live docs) mapped to a
// command-center verb + a receipt kind, marked implemented / wire-now / later.
//
//   node fleet/openrouter/map.mjs [--no-seal]
//
// Rules are explicit per capability id (the table below); an id with no rule
// falls back to its area's default and is flagged `defaulted: true` so the
// map never quietly claims more than was decided. `implemented` names the
// file that does it today; `wire-now` names the surface a small change lands
// on; `later` says why it waits.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DIR = join(ROOT, 'fleet', 'openrouter');
const inv = JSON.parse(readFileSync(join(DIR, 'capabilities.inventory.json'), 'utf8'));
const invSha = createHash('sha256').update(readFileSync(join(DIR, 'capabilities.inventory.json'))).digest('hex');

const I = 'implemented', W = 'wire-now', L = 'later';
// id → [status, verb, receipt, where/how, note]
const RULES = {
  // models
  'models-list': [I, 'timmy models · timmy cf …/models', 'models.list', 'src/cli.ts models; workers/ai-proxy /models (slim id/ctx/price)', 'wire-now: seal the catalog sha so a model pin cites the catalog it came from'],
  'model-endpoints': [L, 'timmy models endpoints <id>', 'openrouter.endpoints', '', 'per-provider pricing/latency for a model; useful once routing is wired'],
  'models-user-filtered': [L, 'timmy models --mine', 'models.list', '', 'unverified in the docs'],
  'providers-list': [W, 'timmy providers audit', 'openrouter.providers', 'src/agent/provider-registry.ts + GET /api/v1/providers', 'audit is local registry only today; add the live provider list'],
  'latest-model-resolution': [L, 'timmy model ~author/family-latest', 'model.pin', '', 'allowlists pin exact ids on purpose; a floating alias needs the pinned id recorded in the receipt first'],
  'model-variant-suffixes': [W, 'timmy commander think --models a:nitro', 'commander.turn', 'workers/ai-proxy/src/tools.ts allowlist()', 'allow suffix variants of an allowlisted base id'],
  // chat
  'chat-completions': [I, 'timmy commander think · timmy_llm_call · /chat', 'commander.turn · llm.call', 'workers/ai-proxy/src/commander-core.ts chatOnce; src/mcp/server.ts timmy_llm_call; worker /chat passthrough', ''],
  'prompt-completions': [L, '—', '—', '', 'legacy prompt field; nothing in Timmy needs it'],
  'anthropic-messages-api': [L, '—', '—', '', 'Timmy speaks chat completions; the Messages shape adds nothing yet'],
  // other
  'app-attribution-headers': [W, '(every call)', '—', 'commander-core.ts chatOnce, code.ts generateScript: X-Title only', 'add HTTP-Referer + X-OpenRouter-Categories so OpenRouter rankings credit TIMMY'],
  'presets': [L, 'timmy model @preset/<slug>', 'model.pin', '', 'project profiles already carry models; presets duplicate that server-side'],
  'batch-api': [L, 'timmy sim run --batch', 'sim.run', '', 'the story sim could batch actor turns at half price; after v0'],
  'openapi-and-versioning': [W, 'timmy oapi (spec_url openrouter.ai/openapi.json)', 'oapi.call', 'src/mcp/server.ts timmy_oapi_run', 'point the OpenAPI lane at the OpenRouter spec: every endpoint becomes a receipted tool'],
  'mcp-server': [W, 'fleet connector openrouter-mcp', 'fleet.detect', 'fleet/fleet.json (detect url https://mcp.openrouter.ai/mcp)', 'detect-only entry like tripo; the commander handoff already speaks MCP'],
  'ori-eval-llm-judge': [L, 'timmy judge', 'judge.run', '', 'Timmy has its own judge loop (timmy_judge_loop) with receipts'],
  'fusion-analyst-model-judge-alias': [L, '—', '—', '', 'a deprecated field alias, not a capability'],
  'broadcast-observability': [L, '(every call)', '—', '', 'trace/session ids to OpenRouter observability; receipts are our trace'],
  'workspaces-files-containers': [L, '—', '—', '', 'unverified'],
  'benchmarks-datasets-classifications': [L, 'timmy sim export', 'dataset.behavior-v0', '', 'unverified; behavior-v0 stays local'],
  // responses api
  'responses-api': [L, 'timmy commander think --api responses', 'commander.turn', '', 'commander uses chat completions; switch when server tools are wired'],
  'responses-tool-calling': [L, '—', 'commander.turn', '', 'with responses-api'],
  'responses-reasoning': [L, '—', 'commander.turn', '', 'with responses-api'],
  'responses-streaming': [L, '—', '—', '', 'with responses-api'],
  // streaming
  'sse-streaming': [I, 'timmy logs (companion) · timmy chat', 'chat.turn', 'src/companion/server.ts + client (stream: true); the TUI chat surface is Qwen-owned and not verified here', 'commander turns are non-streamed on purpose (one receipt per turn)'],
  'stream-cancellation': [W, 'timmy commander kill', 'commander.kill', 'commander.ts cmdKill', 'abort in-flight OpenRouter fetches on kill (AbortController); today kill stops the next turn, not the current one'],
  'mid-stream-errors': [L, '—', '—', '', 'with streaming in the commander'],
  // tool calling
  'tool-calling': [W, 'timmy commander think --tools', 'commander.turn', 'commander-core.ts chatOnce (tools passthrough)', 'Timmy tools run as Code Mode (hands) today; native tools[] lets the mind call edge tools directly'],
  'parallel-tool-calls': [L, '—', 'commander.turn', '', 'after tool-calling'],
  'server-tools': [L, 'timmy commander think --server-tools', 'commander.turn', '', 'server-side tools run at OpenRouter; receipts would cite their calls'],
  'server-tool-web-search': [L, 'timmy commander think --web', 'commander.turn', '', 'after server-tools'],
  'server-tool-web-fetch': [L, '—', 'commander.turn', '', 'after server-tools'],
  'server-tool-advisor': [L, '—', 'commander.turn', '', 'after server-tools'],
  'server-tool-subagent': [L, '—', 'commander.turn', '', 'Timmy dispatches harnesses itself (Command Post)'],
  'server-tool-fusion': [W, 'timmy commander think --mode fusion --native', 'commander.turn', 'commander-core.ts executeTurn fusion branch', 'let fusion mode delegate to openrouter:fusion; receipt records native=true and the analysis models'],
  'server-tools-shell-bash-apply-patch-tool-search': [L, '—', '—', '', 'unverified; Code Mode is the hands'],
  // structured outputs / plugins
  'structured-outputs': [W, 'timmy sim run · timmy commander think --json-schema', 'sim.turn · commander.turn', 'lanes/sim/sim.mjs referee call; commander-core.ts chatOnce', 'the referee already demands JSON; response_format.json_schema makes it a contract'],
  'response-healing-plugin': [W, 'timmy sim run', 'sim.turn', 'lanes/sim/sim.mjs referee call', 'heal malformed referee JSON server-side instead of firstJson()'],
  'plugins-array': [W, '(every call)', '—', 'commander-core.ts chatOnce', 'plugins passthrough field'],
  'web-search-plugin-online': [L, '—', '—', '', 'deprecated in favour of the web_search server tool'],
  'context-compression-middle-out': [L, 'timmy commander think', 'commander.turn', '', 'commander prompts are short; wire when memory grows into the prompt'],
  // routing
  'provider-order-and-fallbacks': [W, 'timmy commander think --provider', 'commander.turn', 'commander-core.ts chatOnce', 'provider passthrough; record the provider that answered'],
  'provider-filters': [W, 'timmy commander think --provider', 'commander.turn', 'commander-core.ts chatOnce', 'with provider passthrough'],
  'provider-sort-and-price-caps': [W, 'timmy commander cap', 'commander.cap · commander.turn', 'commander-core.ts: spend cap → provider.max_price', 'the room cap becomes a per-request price ceiling too'],
  'nitro-floor-shorthands': [W, 'timmy commander think --models a:floor', 'commander.turn', 'tools.ts allowlist()', 'with model-variant-suffixes'],
  'service-tier': [L, '—', 'commander.turn', '', 'no priority need yet'],
  'exacto-variant': [L, '—', '—', '', 'after tool-calling'],
  'auto-exacto': [L, '—', '—', '', 'after tool-calling'],
  'router-metadata': [W, '(every call)', 'commander.turn', 'commander-core.ts chatOnce', 'X-OpenRouter-Metadata: enabled → record provider/model actually used in receipt.models[]'],
  'in-region-routing': [L, '—', '—', '', 'no residency requirement yet'],
  'model-fallbacks': [W, 'timmy commander think --models a,b', 'commander.turn', 'commander-core.ts planTurn generate branch', 'in generate mode, extra models become body.models fallbacks instead of being ignored'],
  // auto routers
  'auto-router': [I, 'lane default openrouter/auto', 'agentrun', 'src/agent/lanes.ts (openhands LLM_MODEL default)', 'the commander allowlist pins ids; auto stays a lane default'],
  'pareto-code-router': [L, 'timmy commander think --models openrouter/pareto-code', 'commander.turn', '', 'after allowlist suffix/alias support'],
  'free-models-router': [W, 'timmy sim run --actor-model openrouter/free', 'sim.turn', 'lanes/sim/sim.mjs (any model id)', 'a $0 actor tier for rehearsal runs; already accepted by the lane, not yet a documented default'],
  'body-builder': [W, 'timmy commander think --mode bodybuilder --native', 'commander.turn', 'src/utils/providers.ts lists openrouter/bodybuilder; commander-core.ts bodybuilder branch', 'Timmy fans out itself today; native mode would take the router\'s {requests:[…]} and run them'],
  'fusion-router': [W, 'timmy commander think --mode fusion --native', 'commander.turn', 'commander-core.ts fusion branch; src/mcp/server.ts timmy_fusion_plan (own judge chain)', 'model openrouter/fusion as the native alternative to our actors+judge'],
  // caching
  'prompt-caching-cache-control': [L, '—', 'commander.turn', '', 'commander prompts are short; wire with memory-in-prompt'],
  'prompt-caching-automatic': [W, 'timmy commander spend', 'commander.turn', 'commander-core.ts usageCost', 'record usage.prompt_tokens_details.cached_tokens in the ledger'],
  'session-sticky-routing': [W, '(every commander call)', 'commander.turn', 'commander-core.ts chatOnce', 'session_id = room so a room keeps its provider'],
  'response-caching': [L, '—', '—', '', 'unverified'],
  // multimodal
  'pdf-input-file-parser': [L, 'timmy commander think --file', 'commander.turn', '', 'after multimodal in the commander'],
  'image-input': [L, 'timmy commander think --image', 'commander.turn', '', 'the observer lane uses Roboflow for images today'],
  'audio-input-output': [L, '—', '—', '', ''],
  'video-input': [L, '—', '—', '', ''],
  'image-generation-api': [I, 'timmy gen', 'gen.run', 'src/utils/providers.ts (image models through OpenRouter) + GENS ledger', 'the dedicated /images endpoint is later; today images ride the chat route'],
  'video-generation-api': [I, 'timmy gen', 'gen.run', 'src/utils/providers.ts (happyhorse-1.1)', 'the dedicated /videos job endpoint is later'],
  'text-to-speech': [L, 'timmy gen --kind tts', 'gen.run', '', 'ElevenLabs lanes exist elsewhere'],
  'speech-to-text': [L, '—', '—', '', ''],
  // reasoning
  'reasoning-parameter': [W, 'timmy commander think --reasoning', 'commander.turn', 'commander-core.ts chatOnce', 'passthrough + record reasoning tokens in the ledger'],
  'reasoning-details-preservation': [L, '—', '—', '', 'multi-turn reasoning continuity; the commander keeps turns, not threads'],
  // usage
  'usage-object': [I, 'timmy commander spend', 'commander.turn', 'commander-core.ts usageCost/applySpend (cost, tokens, uncounted)', 'usage.include is deprecated per the docs (usage always returned): drop the flag'],
  'generation-stats': [W, 'timmy commander turns --exact', 'commander.turn', 'commander.ts (GET /generation?id after each call)', 'exact native cost per generation; needs the generation id stored on the call record'],
  'zero-completion-insurance': [I, '(billing)', '—', 'automatic', 'nothing to wire'],
  'generation-feedback-and-stored-content': [L, '—', '—', '', 'unverified'],
  // privacy
  'zero-data-retention': [W, 'timmy project new --zdr', 'project.new · commander.turn', 'lanes/project/templates/profile.cue + commander-core.ts provider.zdr', 'a project profile flag that every call under it carries'],
  'provider-logging-data-collection': [W, 'timmy project new --no-data-collection', 'project.new · commander.turn', 'profile.cue + provider.data_collection', 'with zdr'],
  'input-output-logging': [L, '—', '—', '', 'dashboard toggle, not an API'],
  'guardrails': [L, 'timmy approve', 'approval', '', 'Timmy gates paid calls with its own single-use tokens'],
  // embeddings
  'embeddings-api': [L, '—', '—', '', 'CPO embeddings are local/Zilliz (Sparks plan)'],
  'rerank-api': [L, '—', '—', '', 'same'],
  // keys
  'bearer-api-key-auth': [I, '(every call)', '—', 'worker secret OPENROUTER_API_KEY; lanes read process.env', ''],
  'oauth-pkce': [L, 'timmy connect openrouter', 'connect', '', 'single-operator setup; env key suffices'],
  'workload-identity-federation': [L, '—', '—', '', 'unverified'],
  'management-api-keys': [W, 'timmy project new --budget', 'project.new', 'lanes/project/project.mjs (mint a key with limit = budget)', 'a per-project OpenRouter key whose limit IS the profile budget: the cap enforced by OpenRouter, not only by us'],
  'byok': [L, '—', '—', '', ''],
  'current-key-limits': [I, 'timmy cf pane', 'cf.pane', 'lanes/cf/pane.mjs spend.openrouter.key (/auth/key)', ''],
  // credits / limits / errors
  'credits': [I, 'timmy cf pane', 'cf.pane', 'lanes/cf/pane.mjs spend.openrouter.credits', ''],
  'analytics': [W, 'timmy cf pane', 'cf.pane', 'lanes/cf/pane.mjs (POST /analytics/query: spend by model per day)', ''],
  'rate-limits': [I, '/chat', '—', 'workers/ai-proxy/src/index.ts (429 passthrough + own RATE_LIMIT_PER_MIN)', ''],
  'error-shape-and-codes': [I, '(every call)', 'commander.turn.models[].error', 'index.ts preserves upstream status/body; commander records upstream errors per call', ''],
  // sdk
  'ts-sdk-package': [I, 'timmy chat / gen', '—', 'package.json @openrouter/sdk; src/agent/core.ts, src/agent/tools.ts, src/modes/chat/tools.ts', ''],
  'ts-sdk-chat-send': [I, 'timmy chat', 'chat.turn', 'src/agent/core.ts (the agent client)', ''],
  'ts-sdk-constructor-attribution': [W, '(sdk)', '—', 'src/agent/core.ts client construction', 'httpReferer/appTitle/appCategories on the client'],
  'sdk-devtools': [L, '—', '—', '', 'unverified'],
  'agent-sdk-package': [L, '—', '—', '', '@openrouter/agent is not a dependency; the commander is the agent loop'],
  'agent-callmodel': [L, '—', '—', '', 'with agent-sdk-package'],
  'agent-tool-helper': [L, '—', '—', '', 'edge tools are zod already (tools.ts)'],
  'agent-stop-conditions': [L, '—', '—', '', 'the commander has cap + kill'],
  'agent-next-turn-params': [L, '—', '—', '', ''],
  'agent-dynamic-parameters': [L, '—', '—', '', ''],
  'agent-streaming-methods': [L, '—', '—', '', ''],
  'agent-message-format-converters': [L, '—', '—', '', ''],
  'agent-mcp-tools': [L, '—', '—', '', 'the commander handoff is the MCP surface'],
  'agent-lifecycle-hooks': [L, '—', '—', '', 'Timmy\'s pre-tool hook lives in the MCP server'],
  'agent-hitl-and-async-tools': [L, '—', '—', '', 'timmy approve is the HITL gate']
};

const AREA_DEFAULT = { verb: '—', receipt: '—', status: L, note: 'no rule written; defaulted' };

const rows = inv.capabilities.map((c) => {
  const r = RULES[c.id];
  const [status, verb, receipt, where, note] = r ?? [AREA_DEFAULT.status, AREA_DEFAULT.verb, AREA_DEFAULT.receipt, '', AREA_DEFAULT.note];
  return { id: c.id, area: c.area, name: c.name, status, verb, receipt, where, note, doc_url: c.doc_url, surface: c.request_surface ?? c.sdk_surface ?? null, unverified: !!c.unverified, defaulted: !r };
});

const count = (s) => rows.filter((r) => r.status === s).length;
const map = { v: 1, generated_at: new Date().toISOString(), inventory_sha256: invSha, inventory_sources: inv.sources.length, capabilities: rows.length, implemented: count(I), wire_now: count(W), later: count(L), defaulted: rows.filter((r) => r.defaulted).length, unverified: rows.filter((r) => r.unverified).length, not_found: inv.not_found, rows };
writeFileSync(join(DIR, 'capabilities.map.json'), JSON.stringify(map, null, 1));

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const md = [];
md.push('# OpenRouter capability map', '', `Generated ${map.generated_at} from \`capabilities.inventory.json\` (sha256 ${invSha.slice(0, 16)}, ${inv.sources.length} fetched sources, ${rows.length} capabilities). mindship-v5c2 step 1.`, '',
  `| status | count | meaning |`, `|---|---|---|`, `| implemented | ${map.implemented} | exists in the repo today; the row names the file |`, `| wire-now | ${map.wire_now} | a small change on a surface that already exists; the row names it |`, `| later | ${map.later} | waits; the row says why |`, '',
  `Unverified inventory entries: ${map.unverified}. Rows defaulted (no explicit rule): ${map.defaulted}. Not found in the docs: ${inv.not_found.map((n) => `\`${n.term}\``).join(', ') || 'none'}.`, '',
  '## Verbs and receipts', '', 'Command-center verbs are `timmy …` commands (src/cli.ts and the lanes it dispatches to); receipt kinds are the subjects sealed into the root store or the edge chains. `—` means no verb or receipt applies.', '');
for (const area of [...new Set(rows.map((r) => r.area))]) {
  md.push(`### ${area}`, '', '| capability | status | verb | receipt | where / how | note |', '|---|---|---|---|---|---|');
  for (const r of rows.filter((x) => x.area === area)) md.push(`| [${esc(r.id)}](${r.doc_url ?? '#'})${r.unverified ? ' *(unverified)*' : ''} | **${r.status}** | ${esc(r.verb)} | ${esc(r.receipt)} | ${esc(r.where)} | ${esc(r.note)} |`);
  md.push('');
}
md.push('## The two names in the order', '', '- **bodybuilder** is real at OpenRouter: the `openrouter/bodybuilder` router returns `{requests:[…]}` for the caller to run in parallel. Timmy already fans out itself (commander `bodybuilder` mode, `timmy_judge_loop`); wiring the native router is a `--native` flag on the same mode.', '- **fusion** is real at OpenRouter: `openrouter/fusion` (a panel of models plus an analyst) and the `openrouter:fusion` server tool. Timmy runs its own actors + judge (commander `fusion` mode, `timmy_fusion_plan`); the native router is the `--native` alternative, and the receipt must say which one answered.', '- "judge" exists only as a deprecated alias (`judge_model` → `analyst_model`); "fan-out" is not an OpenRouter term.', '');
writeFileSync(join(DIR, 'CAPABILITY-MAP.md'), md.join('\n'));
const mapSha = createHash('sha256').update(readFileSync(join(DIR, 'capabilities.map.json'))).digest('hex');
console.log(JSON.stringify({ capabilities: rows.length, implemented: map.implemented, wire_now: map.wire_now, later: map.later, defaulted: map.defaulted, unverified: map.unverified, map_sha256: mapSha, files: ['fleet/openrouter/capabilities.map.json', 'fleet/openrouter/CAPABILITY-MAP.md'] }, null, 1));

if (!process.argv.includes('--no-seal')) {
  const a = ['tsx', 'src/cli.ts', 'seal', 'openrouter.map', '--meta', `capabilities=${rows.length}`, '--meta', `implemented=${map.implemented}`, '--meta', `wire_now=${map.wire_now}`, '--meta', `later=${map.later}`, '--meta', `unverified=${map.unverified}`, '--meta', `defaulted=${map.defaulted}`, '--meta', `inventory_sha256=${invSha}`, '--meta', `inventory_sources=${inv.sources.length}`, '--meta', `map_sha256=${mapSha}`, '--meta', 'map=fleet/openrouter/CAPABILITY-MAP.md', '--meta', `not_found=${inv.not_found.map((n) => n.term).join(',') || 'none'}`, '--meta', 'bodybuilder=openrouter/bodybuilder:real,wire-now', '--meta', 'fusion=openrouter/fusion+openrouter:fusion:real,wire-now', '--meta', 'order=mindship-v5c2'];
  const r = spawnSync('npx', a, { cwd: ROOT, encoding: 'utf8' });
  process.stdout.write(r.stdout ?? ''); if (r.status !== 0) process.stderr.write(r.stderr ?? '');
}

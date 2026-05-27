## 4. Layer 4: Edge Intelligence — Cloudflare + OpenRouter Architecture

The terminal UI on the developer's laptop is only half the system. The other half lives at the network edge — where inference happens, tool calls execute, and agent state persists across sessions. This chapter maps that architecture: **Cloudflare Workers** as the execution runtime, **OpenRouter** as the model routing layer, and the edge services — Durable Objects, D1, KV, Vectorize, AI Gateway — that form a production AI agent platform deployable in minutes.

The thesis is transformative: a V8 isolate in a Cloudflare data center 50ms from the user can hold a WebSocket open for hours via Durable Object hibernation, route LLM calls through OpenRouter's adaptive quality engine, cache responses at zero cost, and persist memory in serverless SQLite — all on a free tier that runs a personal agent indefinitely, or a paid tier costing less than a coffee per month [^1509^] [^1391^].

---

### 4.1 Cloudflare Workers as the Agent Runtime

Cloudflare Workers executes JavaScript and TypeScript inside V8 isolates across 300+ edge locations. Unlike containers or virtual machines, these isolates cold-start in under 5 milliseconds, scale automatically, and charge only for CPU time consumed — not for idle capacity [^1509^]. For a TUI agent that spends most of its time waiting for user input or LLM responses, this execution model is a near-perfect fit.

#### 4.1.1 Dynamic Workers (March 2026): 100× Faster Than Containers

At Agents Week 2026, Cloudflare introduced **Dynamic Workers** — LLM-generated TypeScript executed safely inside sandboxed V8 isolates [^1536^] [^1534^]. The Dynamic Worker Loader instantiates an isolate, runs the code, and returns results in milliseconds. Compared to Docker containers (seconds of overhead) or Firecracker microVMs (hundreds of milliseconds), Dynamic Workers are roughly 100× faster and 10–100× more memory-efficient [^1531^].

This eliminates the sequential ReAct loop. Instead of calling tools one by one — call, wait, parse, repeat — the agent writes a single TypeScript program that chains all operations. One LLM generation, one execution pass, one result. For a TUI agent, collapsing a 15-step tool chain into a single compiled function eliminates perceptible latency.

```typescript
import { DynamicWorkerExecutor } from "@cloudflare/codemode";

const executor = new DynamicWorkerExecutor({ loader: env.LOADER });
const result = await executor.execute({
  code: `
    const files = await cfApi.listFiles({ repo: "my-project" });
    const summary = files.map(f => ({ name: f.name, size: f.size }));
    return { fileCount: summary.length, largest: summary.sort((a,b) => b.size - a.size)[0] };
  `
});
```

#### 4.1.2 Code Mode (February 2026): The Entire Cloudflare API as Two MCP Tools

**Code Mode**, launched February 2026, solves token bloat [^1435^] [^1545^]. A traditional MCP server exposing every Cloudflare API endpoint — DNS, firewall, Workers, R2 — consumes approximately **1.17 million tokens** in the system prompt. For 128K context windows, this is unusable.

Code Mode replaces hundreds of discrete tools with exactly two: `search()` and `execute()`. The LLM searches Cloudflare docs for the right API pattern, then writes TypeScript against a typed SDK executed in a Dynamic Worker sandbox. The entire Cloudflare API fits in roughly **1,000 tokens** — a **99.9% reduction** [^1435^].

```typescript
import { createCodeTool } from "@cloudflare/codemode/ai";

// Code Mode MCP tool registration — ~1,000 tokens vs 1.17M tokens for full API
const tools = [
  { name: "search", description: "Search Cloudflare docs for API patterns" },
  { name: "execute", description: "Execute Cloudflare API call as TypeScript" }
];

export class MyAgent extends Agent {
  async onChatMessage() {
    const executor = new DynamicWorkerExecutor({ loader: this.env.LOADER });
    const codemode = createCodeTool({ tools: myTools, executor });
    const result = streamText({
      model,
      system: "You are a helpful infrastructure assistant.",
      messages: await convertToModelMessages(this.state.messages),
      tools: { codemode },
      stopWhen: stepCountIs(10),
    });
  }
}
```

For a TUI agent managing Cloudflare infrastructure, Code Mode means the agent reasons about the entire platform without context window pressure. The LLM looks up what it needs, writes the code, and executes it.

#### 4.1.3 Workers AI: 78+ Models at $0.011 per 1,000 Neurons

**Workers AI** runs 78+ models on NVIDIA GPUs across Cloudflare's edge network [^1449^] [^1557^].

| Category | Model Count | Key Models | Context / Features |
|----------|-------------|------------|-------------------|
| Text Generation (LLMs) | 22+ | `@cf/moonshot-ai/kimi-k2.6` (262K), `@cf/meta/llama-4-scout-17b`, `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`, `@cf/qwen/qwen2.5-coder-32b-instruct` | Up to 262K; function calling, vision, reasoning |
| Embeddings | 4 | `@cf/baai/bge-m3`, `@cf/google/embeddinggemma-300m` | Multilingual, 100+ languages |
| Speech-to-Text | 4 | `@cf/openai/whisper-large-v3-turbo`, `@cf/deepgram/nova-3` | Multiple languages |
| Text-to-Speech | 5 | `@cf/deepgram/aura-2-en`, `@cf/myshell-ai/melotts` | English, Spanish |
| Image Generation | 6 | `@cf/black-forest-labs/flux-2-dev`, `@cf/leonardoai/phoenix-1.0` | Text-to-image |
| Other | 3 | Reranker (`@cf/baai/bge-reranker-base`), translation, image-to-text | RAG, 22-language translation |

Pricing is neuron-based — a unit of GPU compute. The free tier provides 10,000 neurons per day. Beyond that: **$0.011 per 1,000 neurons** [^1449^]. Llama 3.2 1B consumes ~2,457 neurons per million input tokens (~$0.027/M); Llama 3.3 70B consumes ~26,668 neurons per million (~$0.293/M). Classification and routing tasks cost fractions of a penny.

```typescript
// Workers AI binding — no external API calls, runs on the same edge node
const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
  messages: [{ role: "user", content: "Classify the intent of this command" }]
});
```

#### 4.1.4 AI Gateway: Unified API, Caching, Rate Limiting — Core Features Free

**AI Gateway** normalizes requests, caches responses, enforces rate limits, and provides observability across 10+ providers — Workers AI, OpenAI, Anthropic, Google Gemini, Groq, xAI, AWS Bedrock [^1437^] [^1432^].

The gateway exposes one OpenAI-compatible endpoint: `https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/{provider}/` [^1437^]. A TUI agent switches from Workers AI to OpenRouter to Anthropic by changing a path segment. Critically, AI Gateway's **core features — analytics, caching, rate limiting, retries — are free** [^1444^]. Caching eliminates costs for repeated queries: the second identical request hits Cloudflare's global cache at zero token cost and sub-100ms latency [^1439^].

Guardrails using Llama Guard 3 scan for harmful content before requests reach the LLM. DLP scanning detects PII. Model fallback reroutes to backup providers on 5xx errors — essential for production agents [^1433^].

---

### 4.2 Agent State & Memory on Cloudflare

An agent without memory is a chatbot. Persistent state — working, episodic, and semantic — requires a storage stack designed for the edge. Cloudflare provides five services covering the full memory hierarchy.

#### 4.2.1 Durable Objects: Stateful, WebSocket Hibernation, Agent Persistence

**Durable Objects (DOs)** are the backbone of agent persistence. Each DO is a singleton object with sequential request processing, strong consistency, and a local SQLite database [^1498^] [^1494^]. A TUI agent's conversation history, tool configs, and preferences persist across WebSocket reconnections.

The **WebSocket Hibernation API** enables long-lived agents. A DO accepts a WebSocket, serializes state (up to 16KB per socket via `serializeAttachment`), hibernates — freeing memory and stopping billing — then wakes when a message arrives [^1505^]. For an 8-hour coding session, the connection stays alive while the DO pays nothing during idle periods.

```typescript
import { DurableObject } from "cloudflare:workers";

export class AgentRoom extends DurableObject {
  async fetch(request) {
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ agentId: "agent-123", startedAt: Date.now() });
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    const state = ws.deserializeAttachment();
    // Agent processes message, queries LLM, responds
    const response = await this.queryLLM(message);
    ws.send(JSON.stringify({ agentId: state.agentId, response }));
  }

  async webSocketClose(ws, code, reason, wasClean) {
    ws.close(code, reason); // DO hibernates automatically
  }
}
```

For larger state, DOs provide full SQLite access through `this.ctx.storage.sql.exec()`, enabling relational queries, indexes, and transactions [^1502^]. The Agents SDK's `Agent` base class abstracts all of this — `this.state` is automatically persisted to SQLite on every change, and `onChatMessage()`, `onEmail()`, and `onAlarm()` handlers make the DO behave like a long-running process [^1443^].

#### 4.2.2 D1 Database: 5 Million Rows per Day Free, Global Read Replicas, Time Travel

**D1** is Cloudflare's serverless SQLite database [^1546^] [^1547^]. The free tier: 5 million rows read, 100,000 rows written per day, 5 GB storage — enough for years of conversation logs and tool call history without paying [^1510^].

D1's **Time Travel** recovers to any minute in the last 30 days [^1547^]. An agent that corrupts its state through a bad tool call can roll back to a known-good point. Global read replicas keep query latency low from any edge location.

```typescript
const { results } = await env.DB.prepare(
  "INSERT INTO conversations (agent_id, role, content, tool_calls) VALUES (?, ?, ?, ?) RETURNING *"
).bind(agentId, "assistant", content, JSON.stringify(toolCalls)).run();
```

#### 4.2.3 KV Store: Edge-Cached Agent Config and Session State

**Workers KV** is a global key-value store with edge caching at every Cloudflare location [^1540^]. For a TUI agent, it stores configuration (model selection, tool enablement, user flags) and session snapshots. The pricing asymmetry matters: reads cost $0.50/M, writes cost $5.00/M — 10× more [^1540^] [^1511^]. Store static config and cached results in KV; write event streams to D1.

```typescript
// Read agent configuration — sub-millisecond, cached at 300+ edge locations
const config = await env.CACHE.get("agent:config:user-123");
// Write session snapshot — more expensive, do sparingly
await env.CACHE.put("agent:session:123", JSON.stringify(snapshot));
```

#### 4.2.4 Vectorize: Vector DB for RAG and Semantic Search

**Vectorize** is Cloudflare's distributed vector database for semantic search and RAG [^1491^]. Queries execute at the edge, co-located with the Worker — a RAG pipeline (embed, search, retrieve, call LLM) completes in one edge hop instead of traversing the internet to a separate service.

Pricing: $0.01 per million vector dimensions queried, $0.05 per hundred million stored [^1491^]. A typical 768-dimensional embedding costs ~$0.0077 per million queries. Vectorize integrates with Workers AI embedding models (`@cf/baai/bge-m3`, `@cf/google/embeddinggemma-300m`) in the same request lifecycle [^1492^].

```typescript
// Upsert document embeddings
await env.VECTOR_INDEX.upsert([
  { id: "doc1", values: embedding, metadata: { title: "API Reference", source: "docs" } }
]);
// Semantic search for RAG context
const results = await env.VECTOR_INDEX.query(queryEmbedding, { topK: 5, filter: { source: "docs" } });
```

#### 4.2.5 AI Search (AutoRAG): Fully Managed RAG Pipeline

**AI Search** (formerly AutoRAG) is Cloudflare's fully managed RAG pipeline [^1497^] [^1500^]. Upload documents to R2; AI Search handles ingestion, chunking, embedding, vector storage, and retrieval — automatically reindexing on changes. It provisions its own Vectorize index and AI Gateway endpoint, requiring zero infrastructure configuration [^1496^].

For a TUI agent answering questions about a codebase or knowledge base, AI Search eliminates RAG boilerplate. The agent calls one query endpoint; the service handles embedding, retrieval, and context injection. Data segmentation supports multi-tenancy across workspaces [^1501^].

---

### 4.3 MCP Server Hosting on Cloudflare

The Model Context Protocol (MCP) is the "USB-C for AI applications" — a standard for agents to discover and call remote tools [^1438^] [^1441^]. Cloudflare Workers excels at hosting MCP servers: every deployment is globally distributed, auto-scaled, and runs within 50ms of most users.

#### 4.3.1 Three Approaches: Stateless, Stateful McpAgent, Raw Transport

Cloudflare's `agents-sdk` provides three approaches for building MCP servers, each suited to different agent architectures [^1435^] [^1539^]:

| Approach | Stateful? | Requires DO? | Best For | Complexity |
|----------|-----------|--------------|----------|------------|
| `createMcpHandler()` | No | No | Stateless tools (calculators, fetch wrappers) | Minimal |
| `McpAgent` | Yes | Yes | Stateful sessions (per-user config, multi-turn context) | Medium |
| Raw `WebStandardStreamableHTTPServerTransport` | No | No | Full protocol control, no SDK dependency | High |

The **stateless approach** is a single exported handler: define tools with Zod schemas, implement execute functions, and deploy. The **stateful `McpAgent`** creates one Durable Object per MCP session, giving each tool call access to persistent state — a database connection, a cached access token, a conversation buffer. **Raw transport** bypasses the SDK entirely and implements the MCP protocol over Streamable HTTP directly, useful when integrating with non-standard clients or building custom authentication flows [^1542^].

```typescript
// Stateless MCP — simplest possible tool exposure
import { createMcpHandler } from "@cloudflare/agents/mcp";

export default createMcpHandler({
  tools: [{
    name: "search_docs",
    description: "Search documentation",
    parameters: z.object({ query: z.string() }),
    execute: async ({ query }) => {
      return { results: await searchIndex(query) };
    }
  }]
});
```

#### 4.3.2 Hosting Your Own MCP Server

Hosting an MCP server on Workers follows the standard flow: write the handler, configure `wrangler.toml`, run `wrangler deploy`. The server is available at `https://your-agent.workers.dev/mcp` [^1538^].

Authentication uses OAuth via Cloudflare Access or providers like Auth0, with KV storing session state. The `McpAgent` class manages the full OAuth flow: redirect, callback, token refresh, and per-session credential storage [^1541^]. The TUI agent connects, authenticates as the user, and makes tool calls with the user's credentials — the client never sees the access token.

#### 4.3.3 Connecting to Remote MCP Servers

The TUI agent connects to remote MCP servers over Streamable HTTP — the current MCP standard, replacing legacy SSE [^1441^]. The TUI sends tool call requests; the server returns results, streaming progress updates for long-running operations.

```typescript
// TUI-side MCP client connecting to remote Workers-hosted MCP server
const mcpClient = await createMCPClient({
  transport: {
    url: "https://agent-tools.workers.dev/mcp",
    headers: { Authorization: `Bearer ${oauthToken}` }
  }
});
const tools = await mcpClient.tools(); // Auto-discovered from server
```

#### 4.3.4 Honi Framework: 4-Tier Agent Memory

The **Honi** framework organizes agent memory into four tiers mapping to Cloudflare's storage services [^1443^]:

1. **Working Memory** — Durable Object SQLite: current task context, active tool outputs, conversation buffer. Survives hibernation, lost on eviction.
2. **Episodic Memory** — D1 database: structured logs of past conversations and tool calls. Queryable to recall "what I did last Tuesday."
3. **Semantic Memory** — Vectorize: embedding vectors of facts, code patterns, user preferences. Retrieved via similarity search for RAG context injection.
4. **Procedural Memory** — KV store: tool definitions, system prompts, agent configuration. Read on initialization, rarely changed.

This four-tier architecture means the agent does not start as a blank slate. It remembers coding style from semantic embeddings, recalls past sessions from episodic logs, and retains its personality from procedural config — all without a centralized database.

---

### 4.4 OpenRouter as the Model Router

Cloudflare Workers AI provides excellent inference for the 78+ models it hosts, but production agents often need access to proprietary models — Claude Sonnet 4, GPT-5, Gemini 2.5 Pro — that only run on their providers' infrastructure. **OpenRouter** bridges this gap: a unified API gateway to 300+ models from 60+ providers, accessed through a single OpenAI-compatible endpoint [^1394^] [^1451^]. For the edge agent architecture, OpenRouter serves as the external model provider of choice, complementing Workers AI's internal inference.

#### 4.4.1 `@openrouter/agent` SDK

OpenRouter provides two TypeScript SDKs. The base `@openrouter/sdk` is a thin, type-safe wrapper over the REST API [^1453^] [^1401^]. The **`@openrouter/agent` SDK** wraps multi-turn tool calling, streaming, stop conditions, and cost tracking into one `callModel` function [^1494^] [^1497^].

```typescript
import { OpenRouter, tool, stepCountIs, hasToolCall } from '@openrouter/agent';
import { z } from 'zod';

const client = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

const result = client.callModel({
  model: 'openai/gpt-5-nano',
  input: 'What is the weather in Paris?',
  tools: [weatherTool],
  stopWhen: [stepCountIs(10), hasToolCall('finish')],
});

// Stream progress to the TUI in real time
for await (const delta of result.getTextStream()) {
  process.stdout.write(delta);
}
```

The `callModel` function handles the full agent loop: prompt, parse tool calls, execute, feed back, repeat until a stop condition fires. This eliminates hundreds of lines of boilerplate. Stop conditions include `stepCountIs(n)` for loop limits, `maxCost(dollars)` to cap spend, `hasToolCall('finish')` for completion signals, and `maxTokensUsed(n)` to prevent runaway generation [^1456^].

#### 4.4.2 Model Routing: `openrouter/auto`, `:exacto`, `:nitro`, `:floor`

OpenRouter's routing engine is its most differentiated feature. Rather than hardcoding a model name, the agent can request a routing strategy, and OpenRouter selects the best provider in real time [^1452^] [^1501^]:

| Routing Strategy | Slug | How It Works | Best For |
|-----------------|------|--------------|----------|
| **Auto Router** | `openrouter/auto` | Powered by Not Diamond; selects optimal model by cost, speed, and quality. No extra fee. | General-purpose agent queries |
| **Exacto** | `:exacto` | Adaptive quality routing re-evaluating providers every ~5 min on throughput, tool-call telemetry, and benchmark scores. Reduced tool-call errors by 88% for GLM-5. | Tool-heavy agent workflows |
| **Nitro** | `:nitro` | Routes to the fastest available provider (throughput-optimized) | Real-time TUI responses |
| **Floor** | `:floor` | Routes to the cheapest available provider (price-optimized) | Cost-sensitive batch operations |
| **Specific Model** | `provider/model` | Pins exact model and provider; no routing | Deterministic, reproducible outputs |

Since March 2026, Auto Exacto has been the default for all tool-calling requests [^1522^]. Every five minutes, it re-evaluates providers across three signals: throughput capacity, billions of scored tool-call responses (valid JSON, correct tool names, schema conformance), and benchmark scores. Result: tool-call error rates dropped 88% for GLM-5 and 80% for GLM-4.7 [^1522^].

```typescript
// Route to cheapest provider for cost-sensitive operations
const result = client.callModel({ model: 'anthropic/claude-sonnet-4:floor', input: query });
// Route to fastest provider for real-time TUI streaming
const result = client.callModel({ model: 'openrouter/auto:nitro', input: query });
// Auto-select with quality weighting for critical tool calls
const result = client.callModel({ model: 'openrouter/auto:exacto', input: query, tools: [deployTool] });
```

#### 4.4.3 Function Calling with Zod Schemas

OpenRouter normalizes function calling across all 300+ models. The `@openrouter/agent` SDK uses Zod schemas for input validation, with automatic execution and error handling [^1494^].

```typescript
const deployTool = tool({
  name: 'deploy_worker',
  inputSchema: z.object({
    scriptName: z.string().describe('Name of the Worker script'),
    code: z.string().describe('JavaScript/TypeScript source code')
  }),
  execute: async ({ scriptName, code }) => {
    const result = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${scriptName}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: code
    });
    return { deployed: result.ok, url: `https://${scriptName}.workers.dev` };
  }
});
```

The SDK handles parallel tool calls, tool approval gates for dangerous operations, and `nextTurnParams` that allow a tool to modify subsequent request parameters — for instance, a pagination tool can signal to increase `max_tokens` on the next turn.

#### 4.4.4 Structured Outputs, Response Healing

TUI agents often need structured JSON output matching a schema. OpenRouter enforces JSON Schema via `response_format: { type: "json_schema" }` [^1415^] [^1408^]. Use `"json_schema"` (not `"json_object"`) for strict adherence [^1414^].

**Response Healing** automatically repairs malformed JSON — missing brackets, invalid escaping, truncated output. This reduces structured-output defects by 80% for Gemini 2.0 Flash and 99.8% for Qwen3 235B [^1518^], eliminating most "JSON parse error" crashes.

```typescript
const result = client.callModel({
  model: 'anthropic/claude-sonnet-4',
  input: 'Extract: Jason is 25, Maria is 30',
  responseFormat: {
    type: 'json_schema',
    schema: z.object({
      people: z.array(z.object({ name: z.string(), age: z.number() }))
    })
  }
});
```

#### 4.4.5 Context Caching: `X-OpenRouter-Cache` Header

**Response Caching**, introduced April 2026, is enabled with one header: `X-OpenRouter-Cache: true` [^1409^]. The first call hits the provider and bills normally. Subsequent identical calls — matching request body, model, API key, and streaming mode — return in 80–300ms with **zero tokens billed** [^1412^]. TTL is controllable via `X-OpenRouter-Cache-TTL` (1 second to 24 hours, default 5 minutes). For a TUI agent, caching eliminates redundant calls for repeated commands like "show my deployments."

**Prompt Caching** works at the provider level, reducing costs on common prefixes. Anthropic models offer cache reads at 0.1× price — 90% savings [^1422^].

```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "X-OpenRouter-Cache: true" \
  -H "X-OpenRouter-Cache-TTL: 3600" \
  -H "Content-Type: application/json" \
  -d '{"model": "anthropic/claude-sonnet-4", "messages": [{"role": "user", "content": "List my Workers"}]}'
```

---

### 4.5 The Edge AI Agent Pattern — Complete Architecture

The preceding sections described the components. This section assembles them into a cohesive architecture: the request path from TUI keystroke to LLM response and back, the state flow across memory tiers, and the cost model that makes this production-viable at any scale.

#### 4.5.1 Architecture: TUI → Cloudflare Worker → OpenRouter → LLM

The data flow follows four optimized hops:

```
TUI Terminal → WebSocket → Cloudflare Worker (edge, <5ms cold start)
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
       Workers AI (local)     AI Gateway (cache check)     OpenRouter (external)
       (78+ models)            (HIT → cached response)     (300+ models, routing)
              │                      │                      │
              └──────────────────────┼──────────────────────┘
                                     ▼
                        LLM Provider → Response → TUI
```

The Worker is the orchestration hub. It receives the user's message over a WebSocket (held by a hibernating DO), picks the right model, checks AI Gateway cache, and forwards to Workers AI or OpenRouter. Tool results execute via Code Mode or MCP calls, feeding back into the LLM context.

```typescript
// Cloudflare Worker with OpenRouter routing
import { Agent } from "agents-sdk";

export class AIAgent extends Agent {
  async onRequest(request) {
    const { messages } = await request.json();
    const response = await this.env.OPENROUTER.fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${this.env.OPENROUTER_KEY}` },
      body: JSON.stringify({
        model: "openrouter/auto",
        messages,
        tools: this.mcpTools  // MCP tools from Durable Object state
      })
    });
    return response;
  }
}
```

The `wrangler.toml` configuration binds all the services into a single deployable unit:

```toml
name = "ai-agent"
main = "src/index.ts"
compatibility_date = "2026-05-01"

[ai]
binding = "AI"

[durable_objects]
bindings = [{name = "AGENT", class_name = "AIAgent"}]

[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

[[d1_databases]]
binding = "DB"
database_name = "agent-memory"
database_id = "your-d1-id"

[[vectorize]]
binding = "VECTOR_INDEX"
index_name = "agent-knowledge"
```

#### 4.5.2 Request Lifecycle

A query like "deploy my API worker and check health" traverses this lifecycle:

1. **Input**: TUI sends JSON over the persistent WebSocket to the Durable Object.
2. **Context Loading**: The DO loads working memory from SQLite and queries Vectorize for semantically similar past interactions.
3. **Routing Decision**: Intent classification via Workers AI's `@cf/meta/llama-3.1-8b-instruct` (cheap, fast), then routing to a large model for code generation.
4. **Gateway Check**: AI Gateway checks cache; on miss, forwards to OpenRouter with `openrouter/auto:exacto` routing.
5. **Tool Execution**: The LLM returns a `deploy_worker` tool call. Code Mode in a Dynamic Worker executes the deployment TypeScript against the Cloudflare API.
6. **Health Check**: The LLM calls `check_health`; the agent executes it against the deployed endpoint.
7. **Response Streaming**: Results stream back through the WebSocket in real time.
8. **Persistence**: Conversation and tool outputs write to D1. Key facts embed into Vectorize.
9. **Hibernation**: After 10 seconds of inactivity, the DO serializes and hibernates — WebSocket stays open, resources stop consuming.

Latency: 2–5 seconds end-to-end for non-cached queries; under 200ms for cache hits.

#### 4.5.3 State Management: DO Working, D1 Episodic, Vectorize Semantic

The three-tier memory architecture maps storage services to cognitive functions:

| Memory Tier | Storage Service | Persistence Model | Latency | Use Case |
|-------------|-----------------|-------------------|---------|----------|
| **Working** | Durable Object SQLite | Survives hibernation, lost on eviction | <1ms | Active conversation, pending tool calls, session buffer |
| **Episodic** | D1 database | Permanent, 30-day Time Travel | 5–20ms query | Past conversations, tool call logs, user interaction history |
| **Semantic** | Vectorize | Permanent vector storage | 10–30ms query | RAG context retrieval, user preference embeddings, code pattern matching |
| **Procedural** | KV store | Edge-cached globally | <1ms (cached) | Tool definitions, system prompts, agent configuration |

Working memory in DO SQLite holds the agent's current context — what the user asked, which tools are in flight, partial results. Queryable SQL lets the agent resume interrupted sessions: `SELECT * FROM pending_tools WHERE status = 'waiting'` [^1502^].

Episodic memory in D1 provides the long tail. When a user says "like last week," the agent queries: `SELECT * FROM conversations WHERE user_id = ? AND created_at > date('now', '-7 days')` [^1546^]. Time Travel recovers accidentally deleted conversations.

Semantic memory in Vectorize enables associative recall. Embedded facts — "user prefers TypeScript," "staging endpoint is flaky" — retrieve via similarity search without exact keyword matches [^1491^].

#### 4.5.4 Cost Model: Pennies per Million Requests

The edge agent architecture is not merely fast and scalable — it is extraordinarily cheap. The following table breaks down the cost of running a production TUI agent handling 1 million requests per month on Cloudflare's paid tier ($5/month base) with OpenRouter for external model access.

| Component | Monthly Volume | Unit Cost | Monthly Cost |
|-----------|---------------|-----------|--------------|
| Workers Paid Plan (base) | — | $5.00/month | **$5.00** |
| Workers Requests | 1M | $0.30/million (included in 10M/mo) | **$0.00** |
| Workers CPU | ~50M ms | $0.02/million ms (30M ms included) | **~$0.40** |
| D1 Reads | 5M rows | $0.001/million (25B included) | **$0.00** |
| D1 Writes | 1M rows | $1.00/million (50M included) | **$0.00** |
| KV Reads | 2M | $0.50/million (10M included) | **$0.00** |
| KV Writes | 100K | $5.00/million (1M included) | **$0.00** |
| Vectorize Queries | 1M vectors (768-dim) | $0.01/million dims queried (~$0.0077/M queries) | **~$0.01** |
| Workers AI (Llama 3.1 8B) | 5M neurons/day avg | 10K neurons free/day + $0.011/1K neurons | **~$1.50** |
| AI Gateway | 1M requests | Core features free | **$0.00** |
| **Cloudflare Subtotal** | | | **~$6.91/month** |
| OpenRouter (GPT-4o-class) | 500K input tokens + 100K output tokens | ~$2.50/M input + $10.00/M output + 5.5% platform fee | **~$2.30** |
| OpenRouter (Claude Sonnet 4) | 200K input + 50K output | ~$3.00/M input + $15.00/M output + 5.5% fee | **~$1.38** |
| OpenRouter Response Cache Hits | 300K tokens equivalent | $0 (cache hit = free) | **-$1.50** (saved) |
| **OpenRouter Subtotal (with caching)** | | | **~$2.18/month** |
| **TOTAL MONTHLY COST** | 1M agent requests + 700K LLM tokens | | **~$9.09/month** |

This is the realistic cost of a production agent at 1M requests. The same workload on AWS Lambda with API Gateway and direct OpenAI calls costs $60–100/month — API Gateway alone charges $3.50/million requests plus data transfer fees [^1516^] [^1507^]. The Cloudflare+OpenRouter architecture is roughly 7–10× cheaper.

The free tier is equally capable. Cloudflare handles 100,000 requests/day, D1 reads 5M rows/day, and Workers AI provides 10,000 neurons/day — enough for a personal TUI agent at zero cost [^1509^] [^1449^]. OpenRouter's free tier allows 50 requests/day on free models [^1402^]. A developer can build, deploy, and operate a fully functional AI agent without entering a credit card.

Because inference is cheap and caching makes repeated queries free, the agent can be aggressively proactive — precomputing answers, maintaining warm connections, running background checks — without worrying about runaway bills. The `maxCost` stop condition in `@openrouter/agent` caps per-request spend, and AI Gateway's rate limiting prevents abuse. The result is an architecture that is powerful, fast, and safe to deploy — the hallmark of production-grade infrastructure.

| Service | Type | Free Tier | Paid Tier ($5/mo) | Best For | TUI Available? |
|---------|------|-----------|-------------------|----------|----------------|
| **Workers** | V8 isolate runtime | 100K req/day, 10ms CPU | 10M req/mo +$0.30/M, 30M ms CPU | Agent execution, API orchestration | Yes (`create-agent-tui`) |
| **Workers AI** | Serverless GPU inference | 10K neurons/day | $0.011/1K neurons | LLM inference, embeddings, STT/TTS | Yes (via SDK) |
| **AI Gateway** | Unified AI API proxy | Core features free | 5% fee on credit purchases | Caching, fallback, observability | Yes (OpenAI-compatible) |
| **Durable Objects** | Stateful objects + SQLite | Included with Workers | DO GB-seconds | Agent persistence, WebSockets | Yes (`Agent` class) |
| **D1** | Serverless SQLite | 5M rows read/day, 100K write, 5GB | 25B read/mo, 50M write/mo | Episodic memory, conversation logs | Yes (SQL binding) |
| **KV** | Edge key-value store | 100K reads/day, 1K writes, 1GB | 10M reads/mo, 1M writes/mo | Config caching, session snapshots | Yes (binding) |
| **Vectorize** | Vector database | — | $0.01/M dims queried | Semantic memory, RAG retrieval | Yes (binding) |
| **AI Search (AutoRAG)** | Managed RAG pipeline | Workers AI + Vectorize costs | No additional fee | Document Q&A, knowledge base | Yes (query API) |
| **Queues** | Message queue | 10K ops/day, 24h retention | 1M ops/mo, 4d retention | Background job processing | Yes (producer/consumer) |
| **R2** | Object storage (S3-compatible) | 10GB, 1M Class A, 10M Class B | $0.015/GB, $4.50/M Class A | File storage, zero egress | Yes (binding) |
| **MCP (Workers)** | MCP server hosting | Included with Workers | — | Tool exposure, agent integration | Yes (3 approaches) |
| **Email Workers** | Email send/receive | Routing free; sending 3K/mo paid | $0.35/1,000 emails | Agent email interface | Yes (`onEmail()`) |
| **Browser Rendering** | Puppeteer in Workers | Workers Paid required | CPU-time based | Web scraping, screenshots | Yes (Puppeteer API) |

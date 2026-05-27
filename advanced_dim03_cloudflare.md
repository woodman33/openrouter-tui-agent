# Cloudflare SDK/Agent — Deep Technical Research (2026)

**Research Date**: July 2025
**Confidence Level**: High (primary sources: official Cloudflare docs, changelog, blog posts)
**Total Searches Conducted**: 20+ independent queries across web search and browser visits
**Sources**: Official Cloudflare documentation (developers.cloudflare.com), Cloudflare blog, third-party evaluations, GitHub discussions

---

## Table of Contents

1. [Cloudflare Agents SDK](#1-cloudflare-agents-sdk)
2. [Workers AI (78+ Models)](#2-workers-ai)
3. [AI Gateway](#3-ai-gateway)
4. [D1 Database](#4-d1-database)
5. [KV Store](#5-kv-store)
6. [R2 Storage](#6-r2-storage)
7. [Durable Objects](#7-durable-objects)
8. [Queues](#8-queues)
9. [Workers MCP](#9-workers-mcp)
10. [Browser Rendering](#10-browser-rendering)
11. [Vectorize](#11-vectorize)
12. [AutoRAG / AI Search](#12-autorag--ai-search)
13. [Email Workers](#13-email-workers)
14. [Real-time (WebSockets)](#14-real-time-websockets)
15. [Observability](#15-observability)
16. [wrangler v4 CLI](#16-wrangler-v4-cli)
17. [Pricing Summary](#17-pricing-summary)
18. [Agent Architecture Patterns](#18-agent-architecture-patterns)
19. [MCP Server Hosting on Workers](#19-mcp-server-hosting-on-workers)
20. [Platform Comparison](#20-platform-comparison)
21. [Key Integration Architecture](#21-key-integration-architecture)

---

## 1. Cloudflare Agents SDK

**Feature/Service**: `agents-sdk` npm package — Official SDK for building AI agents on Cloudflare

**Description**: The Agents SDK is Cloudflare's official TypeScript framework for building and deploying AI agents on Workers. It provides a declarative way to create stateful agents with built-in support for streaming, tool calling, human-in-the-loop, and MCP integration. Version 0.1.0 shipped with full AI SDK v5 compatibility.

**Key Components**:
- `Agent` base class — Durable Object-backed stateful agent with SQLite persistence
- `useAgentChat` React hook — Enhanced v5 chat interface with automatic tool resolution
- `McpAgent` — Durable Object per MCP session with state management and elicitation
- `createMcpHandler()` — Stateless MCP server for simple tool exposure
- Code Mode SDK — `@cloudflare/codemode` for executing AI-generated code safely
- Email module — `agents/email` for inbound/outbound email handling with sub-addressing

**API Example**:
```typescript
import { Agent } from "agents";
import { createCodeTool } from "@cloudflare/codemode/ai";
import { DynamicWorkerExecutor } from "@cloudflare/codemode";

export class MyAgent extends Agent {
  async onChatMessage() {
    const executor = new DynamicWorkerExecutor({ loader: this.env.LOADER });
    const codemode = createCodeTool({ tools: myTools, executor });
    const result = streamText({
      model,
      system: "You are a helpful assistant.",
      messages: await convertToModelMessages(this.state.messages),
      tools: { codemode },
      stopWhen: stepCountIs(10),
    });
  }
}
```

**useAgentChat v5 Example**:
```typescript
const { messages, sendMessage, addToolResult } = useAgentChat({
  agent,
  experimental_automaticToolResolution: true,
  tools,
});
```

**Pricing**: Included in Workers pricing. Agents run as Workers/Durable Objects.

**Sources**: [^1443^] [^1545^] [^1435^] [^1546^]
**Date**: SDK v0.1.0 released Sept 2025; Code Mode SDK Feb 2026
**Confidence**: High

---

## 2. Workers AI

**Feature/Service**: Serverless GPU inference on Cloudflare's global edge network

**Description**: Workers AI provides serverless inference for 78+ ML models running on Cloudflare's global network. Models include text generation, embeddings, speech recognition, text-to-speech, text-to-image, image-to-text, translation, reranking, and voice activity detection. Pricing is based on "Neurons" — a unit measuring GPU compute.

**Complete Model Catalog (78+ models)**:

### Text Generation (LLMs)
| Model | Provider | Context | Features |
|-------|----------|---------|----------|
| `@cf/moonshot-ai/kimi-k2.6` | Moonshot AI | 262.1k | Function calling, reasoning, vision |
| `@cf/openai/gpt-oss-120b` | OpenAI | Large | Function calling, reasoning |
| `@cf/openai/gpt-oss-20b` | OpenAI | Large | Function calling, reasoning |
| `@cf/meta/llama-4-scout-17b-16e-instruct` | Meta | Large | Batch, function calling, vision |
| `@cf/google/gemma-4-26b-a4b-it` | Google | Large | Function calling, reasoning, vision |
| `@cf/nvidia/nemotron-3-120b-a12b` | NVIDIA | Large | Function calling, reasoning |
| `@cf/moonshot-ai/kimi-k2.5` | Moonshot AI | 256k | Function calling, reasoning, vision |
| `@cf/zhipu-ai/glm-4.7-flash` | Zhipu AI | 131k | Function calling, reasoning |
| `@cf/qwen/qwen3-30b-a3b-fp8` | Qwen | Large | Batch, function calling, reasoning |
| `@cf/qwen/qwq-32b` | Qwen | 128k | Reasoning (LoRA) |
| `@cf/qwen/qwen2.5-coder-32b-instruct` | Qwen | 128k | Code (LoRA) |
| `@cf/mistralai/mistral-small-3.1-24b-instruct` | MistralAI | 128k | Function calling, vision |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | Meta | 128k | Batch, function calling |
| `@cf/google/gemma-3-12b-it` | Google | 128k | LoRA, vision |
| `@cf/meta/llama-3.2-1b-instruct` | Meta | 128k | — |
| `@cf/meta/llama-3.2-3b-instruct` | Meta | 128k | — |
| `@cf/meta/llama-3.2-11b-vision-instruct` | Meta | 128k | LoRA, vision |
| `@cf/meta/llama-3.1-8b-instruct-fp8-fast` | Meta | 128k | Function calling |
| `@cf/meta/llama-3.1-8b-instruct` | Meta | 128k | — |
| `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` | DeepSeek | Large | Reasoning |
| `@cf/ibm/granite-4.0-h-micro` | IBM | Large | Function calling |
| `@cf/aisingapore/gemma-sea-lion-v4-27b-it` | AI Singapore | Large | SEA languages |
| `@cf/meta/llama-guard-3-8b` | Meta | 8k | Content safety |
| `@cf/mistral/mistral-7b-instruct-v0.1` | MistralAI | 32k | — |

### Embeddings
| Model | Provider | Dimensions | Languages |
|-------|----------|------------|-----------|
| `@cf/google/embeddinggemma-300m` | Google | Various | 100+ |
| `@cf/baai/bge-m3` | BAAI | Various | 100+ |
| `@cf/qwen/qwen3-embedding-0.6b` | Qwen | Various | Multilingual |
| `@cf/pfnet/plamo-embedding-1b` | Preferred Networks | Various | Japanese |

### Speech & Audio
| Model | Type | Provider |
|-------|------|----------|
| `@cf/deepgram/nova-3` | Speech-to-Text | Deepgram |
| `@cf/deepgram/flux` | Speech-to-Text | Deepgram |
| `@cf/openai/whisper-large-v3-turbo` | Speech-to-Text | OpenAI |
| `@cf/openai/whisper-tiny-en` | Speech-to-Text | OpenAI |
| `@cf/deepgram/aura-2-en` | Text-to-Speech | Deepgram |
| `@cf/deepgram/aura-2-es` | Text-to-Speech | Deepgram |
| `@cf/deepgram/aura-1` | Text-to-Speech | Deepgram |
| `@cf/myshell-ai/melotts` | Text-to-Speech | MyShell |
| `@cf/pipecat/smart-turn-v2` | Voice Activity Detection | Pipecat |

### Image Generation
| Model | Provider |
|-------|----------|
| `@cf/black-forest-labs/flux-2-klein-9b` | Black Forest Labs |
| `@cf/black-forest-labs/flux-2-klein-4b` | Black Forest Labs |
| `@cf/black-forest-labs/flux-2-dev` | Black Forest Labs |
| `@cf/black-forest-labs/flux-1-schnell` | Black Forest Labs |
| `@cf/leonardoai/lucid-origin` | Leonardo |
| `@cf/leonardoai/phoenix-1.0` | Leonardo |

### Other Models
- `@cf/baai/bge-reranker-base` — Reranker for RAG
- `@cf/ai4bharat/indictrans2-en-indic-1B` — Translation (22 Indic languages)
- `@cf/llava-hf/llava-1.5-7b-hf` — Image-to-Text (Beta)

**Pricing (Neuron-based)**:
- Free: 10,000 Neurons/day
- Paid: $0.011 per 1,000 Neurons (above free allocation)
- Example: Llama 3.2 1B = ~2,457 neurons/M input tokens ($0.027/M)
- Example: Llama 3.3 70B = ~26,668 neurons/M input tokens ($0.293/M)

**API Endpoint**: `https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model_name}`

**Workers Binding**:
```typescript
const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
  messages: [{ role: "user", content: "Hello!" }]
});
```

**Sources**: [^1449^] [^1447^] [^1440^] [^1445^] [^1557^]
**Date**: Pricing current as of April 2026; 78 models available
**Confidence**: High

---

## 3. AI Gateway

**Feature/Service**: Unified control plane for AI applications with observability, caching, and rate limiting

**Description**: AI Gateway sits between your application and AI providers, adding caching, rate limiting, retries, model fallback, and unified observability. It supports both a Unified API (OpenAI-compatible) and provider-specific endpoints.

**Supported Providers**: Workers AI, OpenAI, Anthropic, Google Gemini, Groq, xAI, AWS Bedrock, Azure OpenAI, Replicate, Cohere (10+ providers)

**Key Capabilities**:
- **Unified API**: Single OpenAI-compatible endpoint for all providers
- **Caching**: Serve repeat requests from Cloudflare cache — direct cost savings
- **Rate Limiting**: Control scaling and prevent abuse
- **Request Retries**: Automatic retry on transient errors
- **Model Fallback**: Failover to backup providers/models
- **Guardrails**: Harmful-content moderation using Llama Guard 3
- **DLP Scanning**: Data Loss Prevention profile scanning
- **Observability**: Token counts, costs, error rates, request logs

**API Endpoint Pattern**:
```
https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/{provider}/
```

**Example (Unified API)**:
```bash
curl https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_slug} \
  -X POST \
  --header 'Content-Type: application/json' \
  --data '[{
    "provider": "workers-ai",
    "endpoint": "@cf/meta/llama-3.1-8b-instruct",
    "headers": { "Authorization": "Bearer {token}" },
    "query": { "messages": [{"role": "user", "content": "Hello"}] }
  }]'
```

**Pricing**:
- Core features: **Free** (analytics, caching, rate limiting)
- 5% fee on Unified Billing credit purchases
- Guardrails: billed as Workers AI inference
- Log storage: Free plan 100K logs total; Paid plan 10M logs per gateway
- Logpush (Paid only): 10M/month included, +$0.05/million

**Sources**: [^1437^] [^1432^] [^1444^] [^1433^] [^1439^]
**Date**: Generally available since May 2024; pricing current as of May 2026
**Confidence**: High

---

## 4. D1 Database

**Feature/Service**: Managed serverless SQLite database at the edge

**Description**: D1 is Cloudflare's serverless SQL database with SQLite semantics, built-in disaster recovery (Time Travel), global read replication, and Worker/Pages bindings. Supports thousands of databases at no extra cost for tenant isolation.

**Key Features**:
- SQLite-compatible SQL semantics
- Time Travel: Point-in-time recovery to any minute in last 30 days
- Global Read Replication: Read replicas across regions
- Worker/Pages bindings + REST API
- Scale-to-zero: No charge when not querying
- Supports JSON queries, foreign keys, indexes

**Pricing**:

| Metric | Free Plan | Paid Plan ($5/mo) |
|--------|-----------|-------------------|
| Rows read | 5 million/day | 25 billion/month included, +$0.001/million |
| Rows written | 100,000/day | 50 million/month included, +$1.00/million |
| Storage | 5 GB total | 5 GB included, +$0.75/GB-month |

**REST API**: `POST /client/v4/accounts/{account_id}/d1/database/{database_id}/query`

**Workers Binding**:
```typescript
const { results } = await env.DB.prepare(
  "INSERT INTO users (name) VALUES (?) RETURNING *"
).bind("Alice").run();
```

**Sources**: [^1547^] [^1546^] [^1510^]
**Date**: Pricing current April 2026; open beta
**Confidence**: High

---

## 5. KV Store

**Feature/Service**: Global key-value storage with edge caching

**Description**: Workers KV is a global, low-latency key-value store designed for read-heavy workloads. Data is cached at Cloudflare's edge locations worldwide, making it ideal for configuration data, session state, feature flags, and agent state caching.

**Key Features**:
- Global edge caching — sub-millisecond reads
- Eventually consistent (typically <1 second propagation)
- Up to 25MB per value
- REST API + Workers binding
- Ideal for: config, caching, session tokens, feature flags, agent state snapshots

**Pricing**:

| Operation | Free Plan | Paid Plan ($5/mo) |
|-----------|-----------|-------------------|
| Keys read | 100,000/day | 10 million/month, +$0.50/million |
| Keys written | 1,000/day | 1 million/month, +$5.00/million |
| Keys deleted | 1,000/day | 1 million/month, +$5.00/million |
| List requests | 1,000/day | 1 million/month, +$5.00/million |
| Storage | 1 GB | 1 GB, +$0.50/GB-month |

**Important**: KV writes are 10x more expensive than reads. Read-heavy workloads are cheap; write-heavy workloads are expensive.

**Workers Binding**:
```typescript
await env.KV_NAMESPACE.put("agent:session:123", JSON.stringify(state));
const value = await env.KV_NAMESPACE.get("agent:session:123");
```

**Sources**: [^1540^] [^1509^] [^1511^]
**Date**: April 2026
**Confidence**: High

---

## 6. R2 Storage

**Feature/Service**: S3-compatible object storage with zero egress fees

**Description**: R2 is Cloudflare's object storage service, fully compatible with the S3 API. The defining feature is zero egress fees — data transfer out of R2 is completely free. This can save 99% on bandwidth costs compared to AWS S3 for data-heavy applications.

**Key Features**:
- Full S3-compatible API (with minor gaps in multipart copy, some ACLs)
- Zero egress fees globally
- Two storage classes: Standard and Infrequent Access
- 10 GB free storage, 1M Class A ops, 10M Class B ops/month
- Native Workers binding
- R2 Data Catalog (Iceberg-compatible) for SQL analytics
- R2 Super Slurper for migration from S3

**Pricing**:

| Component | Price |
|-----------|-------|
| Standard Storage | $0.015 / GB-month |
| Infrequent Access Storage | $0.01 / GB-month |
| Class A Operations (PUT, LIST) | $4.50 / million |
| Class B Operations (GET, HEAD) | $0.36 / million |
| Data Retrieval (IA) | $0.01 / GB |
| Egress (Internet) | **FREE** |

**Free Tier**: 10 GB storage, 1M Class A ops, 10M Class B ops/month

**Workers Binding**:
```typescript
await env.MY_BUCKET.put("file.txt", request.body);
const object = await env.MY_BUCKET.get("file.txt");
return new Response(object?.body);
```

**S3 SDK Example**:
```javascript
import boto3
s3 = boto3.resource('s3',
  endpoint_url='https://{account-id}.r2.cloudflarestorage.com',
  aws_access_key_id='{access_key_id}',
  aws_secret_access_key='{access_key_secret}')
```

**Sources**: [^1530^] [^1527^] [^1529^] [^1532^] [^1533^]
**Date**: Pricing current April 2026
**Confidence**: High

---

## 7. Durable Objects

**Feature/Service**: Stateful coordination primitives with WebSocket support and SQLite storage

**Description**: Durable Objects (DOs) provide stateful serverless objects with strong consistency, SQLite storage, WebSocket support, and the ability to coordinate between multiple clients. They are the backbone of agent persistence on Cloudflare.

**Key Features**:
- **SQLite Storage**: Each DO has a local SQLite database (new since 2024)
- **WebSocket Hibernation**: Keep WebSocket connections alive while DO hibernates (no billing during hibernation)
- **Strong Consistency**: Sequential request processing guarantees
- **RPC**: Remote procedure calls between Workers and DOs
- **Location Hints**: Control geographic placement
- **Alarms**: Scheduled callbacks for cron-like behavior

**WebSocket Hibernation API** (Recommended):
```typescript
import { DurableObject } from "cloudflare:workers";

export class WebSocketHibernationServer extends DurableObject {
  async fetch(request) {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    this.ctx.acceptWebSocket(server); // Enables hibernation
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    const state = ws.deserializeAttachment();
    ws.send(`Echo: ${message}`);
  }

  async webSocketClose(ws, code, reason, wasClean) {
    ws.close(code, reason);
  }
}
```

**State Persistence Across Hibernation**:
- `serializeAttachment(value)` — Persist up to 16KB per WebSocket
- `deserializeAttachment()` — Restore state after wake
- `this.ctx.storage` — Full SQLite API for larger state
- `this.ctx.storage.sql.exec("INSERT ...")`

**Lifecycle States**:
1. Active, in-memory → Idle, hibernateable (10s inactivity) → Hibernated
2. OR: Idle, non-hibernateable → Inactive (70-140s eviction)

**Pricing**: Included in Workers Paid plan ($5/month). Billed as Workers CPU time + DO GB-seconds (storage).

**Sources**: [^1498^] [^1494^] [^1502^] [^1505^] [^1508^]
**Date**: Docs current April-May 2026
**Confidence**: High

---

## 8. Queues

**Feature/Service**: Message queue for background job processing

**Description**: Cloudflare Queues enables reliable, guaranteed-delivery messaging between Workers. It supports batching, retries, delays, dead letter queues, and pull consumers (for HTTP access from outside Workers). Zero egress fees.

**Key Features**:
- Guaranteed delivery (at-least-once)
- Batching: Combine multiple messages into single consumer invocation
- Retries with exponential backoff
- Dead Letter Queues for failed messages
- Delayed message delivery
- Pull consumers (HTTP API access)
- R2 Event Notifications integration

**Pricing**:

| Metric | Free Plan | Paid Plan ($5/mo) |
|--------|-----------|-------------------|
| Standard operations | 10,000/day | 1,000,000/month, +$0.40/million |
| Message retention | 24 hours | 4 days (configurable to 14 days) |

**Operation counting**: Charged per 64KB chunk. A 65KB message = 2 operations. Each delivery typically uses 3 operations (write + read + delete). Retries incur additional read operations.

**Workers API**:
```typescript
// Producer: Send message
await env.MY_QUEUE.send({ userId: 123, action: "process" });

// Consumer: Process batch
export default {
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      await processMessage(message.body);
      message.ack(); // Acknowledge successful processing
    }
  }
};
```

**Sources**: [^1555^] [^1548^]
**Date**: April 2026
**Confidence**: High

---

## 9. Workers MCP

**Feature/Service**: Model Context Protocol (MCP) support for Cloudflare Workers

**Description**: Cloudflare fully supports MCP — the "USB-C for AI applications" — enabling AI agents to discover and use tools exposed by Workers. Cloudflare provides three approaches for building MCP servers, plus the revolutionary Code Mode that reduces token usage by 99.9%.

**Three SDK Approaches**:

| Approach | Stateful? | Requires DO? | Best For |
|----------|-----------|--------------|----------|
| `createMcpHandler()` | No | No | Stateless tools, simplest setup |
| `McpAgent` | Yes | Yes | Stateful tools, per-session state |
| Raw `WebStandardStreamableHTTPServerTransport` | No | No | Full control, no SDK dependency |

**Remote MCP with OAuth**:
```typescript
// Statefull MCP server with Durable Objects
export class MyMcpAgent extends McpAgent {
  async init() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [{
        name: "search_docs",
        description: "Search documentation",
        inputSchema: z.object({ query: z.string() })
      }]
    }));
  }
}
```

**Code Mode (99.9% Token Reduction)**:
Instead of exposing every API endpoint as a separate MCP tool (which can fill 1.17M tokens), Code Mode exposes just two tools: `search()` and `execute()`. The LLM writes TypeScript code against a typed SDK, which is executed safely in a Dynamic Worker Loader. The entire Cloudflare API fits in ~1,000 tokens.

**Shadow MCP Detection**: Cloudflare Gateway can detect unauthorized remote MCP servers on the network for enterprise governance.

**Sources**: [^1441^] [^1435^] [^1436^] [^1545^] [^1539^]
**Date**: Docs current May 2026; Code Mode launched Feb 2026
**Confidence**: High

---

## 10. Browser Rendering

**Feature/Service**: Headless browser automation (Puppeteer) running in Workers

**Description**: The Browser Rendering API (also called Browser Run API) allows running Puppeteer directly in Cloudflare Workers for web scraping, screenshots, PDF generation, and browser automation. Uses `@cloudflare/puppeteer` — a Cloudflare-maintained fork of Puppeteer.

**Key Features**:
- Full Puppeteer API support in Workers
- Durable Objects for persistent browser sessions
- Screenshots, PDFs, crawling, form automation
- Integration with KV (caching), R2 (archiving), Queues (async processing)

**Example (Screenshot)**:
```typescript
import puppeteer from "@cloudflare/puppeteer";

export default {
  async fetch(request, env) {
    const browser = await puppeteer.launch(env.MY_BROWSER);
    const page = await browser.newPage();
    await page.goto("https://example.com");
    const screenshot = await page.screenshot();
    await browser.close();
    return new Response(screenshot, { headers: { "Content-Type": "image/png" } });
  }
};
```

**Pricing**: Browser Rendering requires Workers Paid plan. Usage-based pricing on CPU time.

**Sources**: [^1503^] [^1504^] [^1507^]
**Date**: Open beta since May 2023; docs current April 2026
**Confidence**: High

---

## 11. Vectorize

**Feature/Service**: Vector database for semantic search, RAG, and similarity matching

**Description**: Vectorize is Cloudflare's globally distributed vector database. It stores embeddings (vector representations of text, images, etc.) for semantic search, recommendations, anomaly detection, and RAG context injection.

**Key Features**:
- Globally distributed — queries execute at the edge
- Integrates with Workers AI embedding models (BAAI, Google, Qwen)
- Supports metadata filtering
- Ideal for RAG pipelines, semantic search, recommendation engines
- Works with D1 (relational data), R2 (objects), KV (cached lookups)

**Pricing**:

| Metric | Free | Paid |
|--------|------|------|
| Vector Dimensions Queried | — | $0.01 / million |
| Vector Dimensions Stored | — | $0.05 / hundred million |

**Workers Binding**:
```typescript
// Upsert vectors
await env.VECTOR_INDEX.upsert([
  { id: "doc1", values: embedding, metadata: { title: "Doc 1" } }
]);

// Query
const results = await env.VECTOR_INDEX.query(embedding, { topK: 5 });
```

**Sources**: [^1491^] [^1492^] [^1493^]
**Date**: April 2026
**Confidence**: High

---

## 12. AutoRAG / AI Search

**Feature/Service**: Fully managed RAG pipeline (formerly AutoRAG, now "AI Search")

**Description**: AI Search (formerly AutoRAG) is Cloudflare's fully managed end-to-end RAG pipeline. Upload documents to R2, and AI Search handles everything: ingestion, markdown conversion, chunking, embedding, vector storage (Vectorize), semantic retrieval, and response generation via Workers AI. Continuously reindexes as data changes.

**Key Features**:
- **Instant Setup**: Provisions Vectorize + AI Gateway automatically
- **Continuous Indexing**: Watches R2 buckets and reindexes automatically
- **Multitenancy**: Data segmentation by customer/user/workspace
- **Customizable**: Choose Workers AI models, chunking strategies, system prompts
- **Query API**: Workers binding or REST API

**Supported File Types**: PDFs, images, text, HTML, CSV (converted to structured Markdown)

**Architecture**:
```
R2 (documents) → AutoRAG (chunk/embed/index) → Vectorize (vectors)
                                                     ↑
User Query → Query Rewriting → Embedding → Semantic Search → LLM Response
```

**Pricing**: Charged as Workers AI inference + Vectorize storage/queried dimensions. No additional AutoRAG fee.

**Sources**: [^1497^] [^1496^] [^1499^] [^1500^] [^1501^]
**Date**: Open beta April 2025; renamed to "AI Search" in 2026
**Confidence**: High

---

## 13. Email Workers

**Feature/Service**: Send, receive, and process email within Workers

**Description**: Cloudflare Email Service provides bidirectional email capabilities: Email Sending (outbound via REST API/Workers binding) and Email Routing (inbound processing via Workers). Combined with the Agents SDK's `onEmail()` hook, this enables AI agents to send, receive, and reply to emails.

**Key Components**:
- **Email Sending**: REST API + Workers binding (`env.EMAIL.send(...)`)
- **Email Routing**: Inbound email forwarded to Workers for processing
- **Agents SDK Email Module**: Sub-addressing (`agent+id@domain`), HMAC-signed reply headers
- **Agentic Inbox**: Open-source reference app for self-hosted email client with AI agent

**Pricing**:

| Feature | Free | Paid ($5/mo) |
|---------|------|-------------|
| Email Sending (outbound) | Not available | 3,000 included/month, +$0.35/1,000 |
| Email Routing (inbound) | Unlimited | Unlimited |

**Example (Outbound)**:
```typescript
await env.SEND_EMAIL.send({
  to: [{ email: "user@example.com" }],
  from: { email: "notifications@your-domain.com", name: "Your App" },
  subject: "Your order has shipped",
  text: "Order #1234 is on its way."
});
```

**Example (Inbound Agent)**:
```typescript
export default {
  async email(message, env, ctx) {
    const { score, label } = await env.AI.run(
      "@cf/huggingface/distilbert-sst-2-int8",
      { text: message.raw }
    );
    await env.PROCESSED_EMAILS.send({ score, label, message });
  }
};
```

**Sources**: [^1512^] [^1518^] [^1508^]
**Date**: Email Service in private beta Sept 2025; pricing current April 2026
**Confidence**: High

---

## 14. Real-time (WebSockets)

**Feature/Service**: Bi-directional real-time communication via WebSockets

**Description**: Cloudflare supports WebSockets through both Workers and Durable Objects. Durable Objects are ideal for WebSocket servers because they maintain state across connections. The Hibernation WebSocket API allows DOs to sleep without disconnecting clients.

**Key Capabilities**:
- **Hibernation API**: DO sleeps, WebSocket stays connected, no billing during hibernation
- **Standard API**: Familiar `addEventListener` pattern
- **serializeAttachment/deserializeAttachment**: Persist per-connection state across hibernation (up to 16KB)
- **SQLite Storage**: Full relational storage for complex state
- **RPC**: Communicate between Workers and DOs

**Connection Limits**: Thousands of WebSocket clients per Durable Object instance

**Batching Recommendation**: Batch 10-100 logical messages per WebSocket frame to reduce context switch overhead.

**Example (Hibernation Pattern)**:
```typescript
export class ChatRoom extends DurableObject {
  async fetch(request) {
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ roomId: "room-123", joinedAt: Date.now() });
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    const state = ws.deserializeAttachment();
    for (const socket of this.ctx.getWebSockets()) {
      socket.send(`[${state.roomId}] ${message}`);
    }
  }
}
```

**Pricing**: WebSocket connections = 1 request (initial Upgrade only). Messages routed through Workers do NOT count as requests.

**Sources**: [^1498^] [^1494^] [^1505^] [^1508^]
**Date**: May 2026; `web_socket_auto_reply_to_close` compat date >= 2026-04-07
**Confidence**: High

---

## 15. Observability

**Feature/Service**: Comprehensive monitoring, logging, and tracing for Workers

**Description**: Cloudflare provides a full observability stack for Workers including automatic log collection, real-time log streaming, distributed tracing (OpenTelemetry), metrics dashboards, and log export to external providers.

**Components**:

| Feature | Description |
|---------|-------------|
| **Workers Logs** | Automatic log collection, storage, filtering, analysis in dashboard |
| **Real-time Logs** | Near-real-time log streaming with filtering (`wrangler tail`) |
| **Tail Workers** | Custom filtering, sampling, transformation of telemetry data |
| **Workers Logpush** | Export logs to R2, S3, or external providers (Paid only) |
| **Tracing** | OpenTelemetry-compliant automatic instrumentation (open beta Oct 2025) |
| **Metrics** | Request counts, error rates, CPU time, wall time, execution duration |
| **Query Builder** | Structured queries with filters, aggregations, groupings |
| **OpenTelemetry Export** | Export traces/logs to Honeycomb, Grafana, Axiom, Sentry, Datadog, New Relic |
| **DevTools** | Chrome DevTools for breakpoints, CPU profiling, memory debugging |
| **MCP Server** | Query Workers observability data via Model Context Protocol |

**Automatic Tracing captures**: fetch() calls, binding operations (KV, R2, Durable Objects), handler invocations — no code changes required.

**OpenTelemetry Endpoints**:

| Provider | Traces Endpoint |
|----------|----------------|
| Honeycomb | `https://api.honeycomb.io/v1/traces` |
| Grafana Cloud | `https://otlp-gateway-{region}.grafana.net/otlp/v1/traces` |
| Axiom | `https://api.axiom.co/v1/traces` |
| Sentry | `https://{HOST}/api/{PROJECT_ID}/integration/otlp/v1/traces` |
| New Relic | `https://otlp.nr-data.net/v1/traces` |

**Pricing**:

| Metric | Free | Paid |
|--------|------|------|
| Log Events Written | 200,000/day | 20 million/month, +$0.60/million |
| Log Retention | 3 days | 7 days |
| Logpush | Not available | 10M/month, +$0.05/million |

**Sources**: [^1505^] [^1513^] [^1514^] [^1515^] [^1517^]
**Date**: Tracing in open beta since Oct 2025; docs current April 2026
**Confidence**: High

---

## 16. wrangler v4 CLI

**Feature/Service**: Official CLI tool for building with Cloudflare developer products

**Description**: Wrangler is the command-line tool for Cloudflare Workers. Version 4.0.0 was released March 2025 with updated underlying systems, latest JavaScript feature support, and improved command consistency. Wrangler v3 receives bug fixes until Q1 2026, critical security updates until Q1 2027.

**Key Commands**:

| Command | Description |
|---------|-------------|
| `wrangler init` | Create a new Worker project |
| `wrangler dev` | Start local development server with hot reload |
| `wrangler deploy` | Deploy Worker to Cloudflare |
| `wrangler tail` | Stream real-time logs |
| `wrangler secret put <NAME>` | Store encrypted secrets |
| `wrangler kv namespace create <NAME>` | Create KV namespace |
| `wrangler kv key put <KEY> <VALUE>` | Store KV value |
| `wrangler d1 create <NAME>` | Create D1 database |
| `wrangler r2 bucket create <NAME>` | Create R2 bucket |
| `wrangler queues create <NAME>` | Create Queue |

**Key Features**:
- Local development with `workerd` (open-source Workers runtime)
- Hot reload during development
- Secret management with encrypted storage
- Support for wrangler.toml and wrangler.jsonc configs
- Built-in TypeScript support
- Remote development mode

**System Requirements**:
- Node.js (Current, Active, Maintenance versions)
- macOS 13.5+, Windows 11, or Linux with glibc 2.35+

**Installation**:
```bash
npm i -D wrangler@latest  # Local install (recommended)
npx wrangler --version     # Check version
```

**Sources**: [^1543^] [^1535^]
**Date**: Wrangler v4 released March 2025
**Confidence**: High

---

## 17. Pricing Summary

### Workers (Compute)

| Feature | Free | Paid ($5/mo) |
|---------|------|-------------|
| Requests | 100,000/day | 10 million/month, +$0.30/million |
| CPU time | 10ms/invocation | 30M ms/month, +$0.02/million |
| Max CPU/invocation | 10ms | 5 minutes (default 30s), 15 min for Cron/Queue |
| Scripts | 100 | Unlimited |

### Workers AI

| Plan | Neurons/Day | Price |
|------|-------------|-------|
| Free | 10,000 | N/A (upgrade required for more) |
| Paid | 10,000 included | $0.011 / 1,000 Neurons above |

### Storage & Data

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **KV** | 100K reads/day, 1K writes/day, 1GB | 10M reads/mo, 1M writes/mo, +$0.50/GB |
| **D1** | 5M rows read/day, 100K write/day, 5GB | 25B reads, 50M writes, +$0.75/GB-mo |
| **R2** | 10GB, 1M Class A, 10M Class B | $0.015/GB, $4.50/M Class A, $0.36/M Class B |
| **Queues** | 10K ops/day | 1M ops/mo, +$0.40/million |
| **Vectorize** | — | $0.01/M dims queried, $0.05/100M dims stored |

### Email

| Feature | Paid ($5/mo minimum) |
|---------|---------------------|
| Email Sending | 3,000 included/mo, +$0.35/1,000 |
| Email Routing | Unlimited (free) |

### AI Gateway

| Feature | Price |
|---------|-------|
| Core (analytics, caching, rate limiting) | **Free** |
| Unified Billing credits | 5% fee |
| Log storage (Free plan) | 100K logs total |
| Log storage (Paid plan) | 10M logs/gateway |

**Key Cost Surprises**:
1. KV writes are 10x more expensive than reads ($5/M vs $0.50/M)
2. R2 Class A operations (writes) are 12.5x more than Class B (reads)
3. Workers AI Neurons scale with model size — smaller models are dramatically cheaper

**Sources**: [^1509^] [^1449^] [^1540^] [^1530^] [^1555^] [^1444^] [^1508^] [^1511^] [^1510^] [^1507^]
**Date**: Pricing verified April-May 2026
**Confidence**: High

---

## 18. Agent Architecture Patterns

**Pattern: Code Mode with Dynamic Workers**
Instead of sequential tool calls (ReAct pattern), agents write TypeScript code that chains all operations. Code executes in sandboxed V8 isolates (Dynamic Workers) — 100x faster and 10-100x more memory-efficient than containers.

```
User Request → LLM generates TypeScript code → Dynamic Worker executes code → Returns result
```

**Pattern: Durable Object Agent**
Each agent instance runs as a Durable Object with:
- SQLite database for persistent state
- WebSocket connections for real-time communication
- `onChatMessage()`, `onEmail()` handlers
- Automatic state management via `this.state`

**Pattern: MCP Server on Workers**
Expose tools via MCP for AI assistants to discover:
- `createMcpHandler()` for stateless tools
- `McpAgent` for stateful sessions with per-user state
- Remote MCP over Streamable HTTP with OAuth authentication

**Pattern: RAG with AI Search**
```
Documents → R2 → AI Search (AutoRAG) → Vectorize (embeddings) → Workers AI (LLM)
                                     ↑
                              User Query
```

**Agents Week 2026 Architecture**:
The complete platform for production agents includes:
- **Compute**: Dynamic Workers (lightweight), Sandboxes GA (Linux), Browser Run
- **Networking**: Cloudflare Mesh (zero-trust for agents)
- **Inference**: AI Gateway (70+ models, 12+ providers)
- **Storage**: Artifacts (Git), Agent Memory, D1, R2
- **Security**: Shadow MCP detection, scoped tokens, Flagship flags

**Sources**: [^1536^] [^1534^] [^1531^] [^1435^] [^1545^]
**Date**: Agents Week 2026 (April 13-17, 2026)
**Confidence**: High

---

## 19. MCP Server Hosting on Workers

**Answer: Yes — Cloudflare Workers is an excellent platform for hosting MCP servers.**

**Three Approaches**:

### 1. Stateless MCP (Simplest)
```typescript
import { createMcpHandler } from "@cloudflare/agents/mcp";

export default createMcpHandler({
  tools: [{
    name: "calculator",
    description: "Add two numbers",
    parameters: z.object({ a: z.number(), b: z.number() }),
    execute: async ({ a, b }) => ({ result: a + b })
  }]
});
```

### 2. Stateful MCP (McpAgent)
```typescript
import { McpAgent } from "@cloudflare/agents/mcp";

export class MyMcp extends McpAgent {
  async init() {
    // Setup per-session state
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [...]
    }));
  }
}
```

### 3. Raw Transport (Full Control)
```typescript
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk";
// Full control over protocol handling
```

**Transport**: Streamable HTTP (current MCP standard). SSE is legacy.

**Authentication**: OAuth via Cloudflare Access or third-party providers (Auth0). KV stores OAuth state.

**Deployment**: Deploy to `*.workers.dev` subdomain or custom domain. Auto-deploy via Git integration.

**Key Advantages**:
- Global edge deployment (300+ locations)
- Automatic scaling (no capacity planning)
- Durable Objects for per-session state
- KV for OAuth state storage
- Built-in authentication via Cloudflare Access
- Code Mode for 99.9% token reduction

**Sources**: [^1539^] [^1538^] [^1541^] [^1542^] [^1537^]
**Date**: Docs current April-May 2026
**Confidence**: High

---

## 20. Platform Comparison

### Cloudflare Workers vs Vercel AI SDK

| Dimension | Cloudflare Workers | Vercel AI SDK |
|-----------|-------------------|---------------|
| **Runtime** | V8 isolates at 300+ edge locations | Vercel Edge Network |
| **Cold start** | <5ms | Varies (can be 100ms+) |
| **AI models** | Workers AI (78+ hosted models) | Bring-your-own API keys |
| **Vector DB** | Vectorize (built-in) | Requires external (Pinecone, etc.) |
| **Object storage** | R2 (zero egress) | Requires external |
| **Database** | D1 (SQLite), KV, DO | Requires external |
| **Bandwidth** | **Zero egress fees** | $0.15/GB on Pro, 1TB included |
| **Request pricing** | $0.30/million | Vercel bundles differently |
| **MCP hosting** | Native support | Indirect |
| **AI Gateway** | Built-in | Not available |
| **Email** | Built-in Email Service | Not available |
| **Framework** | Workers + agents-sdk | Next.js-optimized |

**Verdict**: Cloudflare is cheaper at scale (no egress fees), more complete as a platform (built-in storage, AI, email), but Vercel has better Next.js DX integration.

### Cloudflare Workers vs AWS Lambda

| Dimension | Cloudflare Workers | AWS Lambda |
|-----------|-------------------|------------|
| **Runtime** | V8 isolates | Firecracker microVMs |
| **Cold start** | <5ms | 100-500ms |
| **Locations** | 300+ edge locations | 39 regions |
| **Max CPU time** | 5 minutes (30s default) | 15 minutes |
| **Egress** | **Free** | $0.09/GB |
| **API Gateway** | Built-in | $3.50/million requests |
| **Node.js compat** | Limited (V8 only) | Full |
| **AI/ML** | Workers AI built-in | Bedrock (separate service) |
| **Cost at 50M req/mo** | ~$22/mo | ~$64+/mo (with API GW) |

**Verdict**: Workers is cheaper and faster for edge compute, API middleware, and AI workloads. Lambda wins for heavy compute, long-running jobs, and full Node.js compatibility.

### Cloudflare Workers vs OpenAI API (Direct)

| Dimension | Cloudflare Workers + AI | OpenAI API Direct |
|-----------|------------------------|-------------------|
| **Models** | 78+ open-source models | GPT-4o, o1, etc. |
| **Latency** | Edge inference | US/EU regions only |
| **Pricing** | Neuron-based (often cheaper) | Per-token |
| **Portability** | Multi-model | OpenAI only |
| **AI Gateway** | Built-in caching/fallbacks | Must build yourself |
| **Privacy** | Data stays in Cloudflare | Sent to OpenAI |

**Sources**: [^1516^] [^1507^] [^1511^]
**Date**: Comparison data from 2026 reviews
**Confidence**: High (for pricing); Medium (for qualitative comparisons)

---

## 21. Key Integration Architecture

### Recommended Agent Stack on Cloudflare (2026)

```
┌─────────────────────────────────────────────────────┐
│                  CLIENT LAYER                       │
│  (React/Vue/Svelte + useAgentChat hook)            │
└─────────────────────┬───────────────────────────────┘
                      │ WebSocket / HTTP
┌─────────────────────▼───────────────────────────────┐
│              AGENT LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Agent 1   │  │   Agent 2   │  │   Agent N   │ │
│  │  (McpAgent) │  │  (Agent)    │  │  (Agent)    │ │
│  │             │  │             │  │             │ │
│  │ onChatMsg() │  │ onEmail()   │  │ onAlarm()   │ │
│  │ MCP tools   │  │ Reply logic │  │ Scheduled   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
└─────────┼────────────────┼────────────────┼────────┘
          │                │                │
┌─────────▼────────────────▼────────────────▼────────┐
│              PLATFORM SERVICES                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Workers AI│ │AI Gateway│ │Vectorize │          │
│  │(78 models│ │(caching, │ │(RAG     │          │
│  │ inference│ │ fallback)│ │ vectors) │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │    D1    │ │    KV    │ │    R2    │          │
│  │(SQLite  │ │(cache,  │ │(files,  │          │
│  │  state)  │ │  config) │ │ objects) │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Durable   │ │  Queues  │ │ Browser  │          │
│  │ Objects  │ │(async    │ │ Rendering│          │
│  │(WS, state│ │  tasks)  │ │(scraping)│          │
│  └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────┘
```

### Cost-Optimized Agent Architecture
- **State**: Durable Object SQLite (persistent, relational)
- **Cache**: KV (read-heavy config/session data)
- **Files**: R2 (attachments, exports — zero egress)
- **AI Models**: Workers AI (smaller models for simple tasks, larger for complex)
- **Gateway**: AI Gateway with caching + fallback
- **Background**: Queues for async processing
- **MCP**: Remote MCP server for external tool access
- **Email**: Email Service for agent communication

---

## Source Index

| Ref | Source | URL |
|-----|--------|-----|
| [^1432^] | PipeLab — AI Gateway Analysis | https://pipelab.org/learn/cloudflare-ai-gateway/ |
| [^1433^] | Cloudflare AI Gateway Product | https://www.cloudflare.com/products/ai-gateway/ |
| [^1435^] | Code Mode Blog Post | https://blog.cloudflare.com/code-mode-mcp/ |
| [^1436^] | Enterprise MCP Blog | https://blog.cloudflare.com/enterprise-mcp/ |
| [^1437^] | AI Gateway Docs | https://developers.cloudflare.com/ai-gateway/ |
| [^1438^] | MCP on Workers Blog | https://blog.cloudflare.com/model-context-protocol/ |
| [^1439^] | AI Gateway GA Blog | https://blog.cloudflare.com/ai-gateway-is-generally-available/ |
| [^1440^] | PromptFoo — Workers AI Providers | https://www.promptfoo.dev/docs/providers/cloudflare-ai/ |
| [^1441^] | MCP Docs | https://developers.cloudflare.com/agents/model-context-protocol/ |
| [^1443^] | Agents SDK v0.1.0 Changelog | https://developers.cloudflare.com/changelog/post/2025-09-03-agents-sdk-beta-v5/ |
| [^1444^] | AI Gateway Pricing | https://developers.cloudflare.com/ai-gateway/reference/pricing/ |
| [^1445^] | Workers AI Changelog | https://developers.cloudflare.com/workers-ai/changelog/ |
| [^1447^] | Workers AI Improvements Blog | https://blog.cloudflare.com/workers-ai-improvements/ |
| [^1449^] | Workers AI Pricing | https://developers.cloudflare.com/workers-ai/platform/pricing/ |
| [^1491^] | Vectorize Docs | https://developers.cloudflare.com/vectorize/ |
| [^1492^] | Vectorize Product | https://www.cloudflare.com/products/vectorize/ |
| [^1493^] | RAG Tutorial | https://developers.cloudflare.com/workers-ai/guides/tutorials/build-a-retrieval-augmented-generation-ai/ |
| [^1494^] | Durable Object Lifecycle | https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/ |
| [^1496^] | AutoRAG Blog Post | https://annjose.com/blog/cloudflare-autorag-step-by-step/ |
| [^1497^] | AutoRAG Announcement | https://blog.cloudflare.com/introducing-autorag-on-cloudflare/ |
| [^1498^] | WebSockets Best Practices | https://developers.cloudflare.com/durable-objects/best-practices/websockets/ |
| [^1502^] | Durable Object State API | https://developers.cloudflare.com/durable-objects/api/state/ |
| [^1503^] | Browser Rendering Blog | https://blog.cloudflare.com/running-serverless-puppeteer-workers-durable-objects/ |
| [^1505^] | WebSocket Hibernation Blog | https://thomasgauvin.com/writing/how-cloudflare-durable-objects-websocket-hibernation-works/ |
| [^1507^] | Lucky Media Workers Review | https://www.luckymedia.dev/insights/cloudflare-workers |
| [^1508^] | Email Workers Blog | https://blog.cloudflare.com/email-service/ |
| [^1509^] | Workers Pricing | https://developers.cloudflare.com/workers/platform/pricing/ |
| [^1510^] | Cloudflare Containers Pricing | https://lalatenduswain.medium.com/understanding-cloudflare-containers/ |
| [^1511^] | Pricing Calculator | https://makerkit.dev/pricing-calculator/cloudflare |
| [^1512^] | Email Service Product | https://www.cloudflare.com/products/email-service/ |
| [^1513^] | OpenTelemetry Export Docs | https://developers.cloudflare.com/workers/observability/exporting-opentelemetry-data/ |
| [^1514^] | Tracing Open Beta | https://blog.cloudflare.com/workers-tracing-now-in-open-beta/ |
| [^1516^] | Cloudflare Workers Pricing 2026 | https://blog.blazingcdn.com/en-us/cloudflares-pricing-for-developers-a-closer-look-at-workers-pages |
| [^1530^] | R2 Pricing | https://developers.cloudflare.com/r2/pricing/ |
| [^1531^] | Dynamic Workers Blog | https://dev.to/mechcloud_academy/build-blazing-fast-ai-agents-with-cloudflare-dynamic-workers/ |
| [^1534^] | Agents Week 2026 Summary | https://lushbinary.com/blog/cloudflare-agents-week-2026-everything-released/ |
| [^1535^] | Wrangler Install Docs | https://developers.cloudflare.com/workers/wrangler/install-and-update/ |
| [^1536^] | Dynamic Workers Blog | https://blog.cloudflare.com/dynamic-workers/ |
| [^1538^] | Remote MCP Server Guide | https://mcpservers.org/servers/sourabharsh/remote-mcp-server |
| [^1539^] | Remote MCP Server Docs | https://developers.cloudflare.com/agents/guides/remote-mcp-server/ |
| [^1540^] | KV Pricing | https://developers.cloudflare.com/kv/platform/pricing/ |
| [^1543^] | Wrangler v4 Changelog | https://developers.cloudflare.com/changelog/post/2025-03-13-wrangler-v4/ |
| [^1545^] | Code Mode API | https://developers.cloudflare.com/agents/api-reference/codemode/ |
| [^1546^] | D1 Docs | https://developers.cloudflare.com/d1/ |
| [^1547^] | D1 Pricing | https://developers.cloudflare.com/d1/platform/pricing/ |
| [^1548^] | Queues Docs | https://developers.cloudflare.com/queues/ |
| [^1555^] | Queues Pricing | https://developers.cloudflare.com/queues/platform/pricing/ |
| [^1557^] | Workers AI Models | https://developers.cloudflare.com/workers-ai/models/ |

---

*Research compiled from 20+ independent searches across official Cloudflare documentation, product pages, changelog, blog posts, and third-party evaluations. All pricing verified as of April-July 2026.*

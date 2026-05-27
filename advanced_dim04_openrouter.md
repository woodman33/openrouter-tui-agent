# OpenRouter SDK/Agent — Deep Technical Research (2026)

> **Research Date**: June 2026
> **Searches Conducted**: 18 independent search queries across web, docs, GitHub, and community sources
> **Confidence Level**: High (sources from official OpenRouter docs, GitHub repos, announcements, and verified community sources)

---

## Table of Contents

1. [What is OpenRouter](#1-what-is-openrouter)
2. [Architecture](#2-architecture)
3. [SDKs](#3-sdks)
4. [API Structure](#4-api-structure)
5. [Model Routing](#5-model-routing)
6. [Function Calling](#6-function-calling)
7. [Streaming](#7-streaming)
8. [Reasoning Models](#8-reasoning-models)
9. [Multimodal](#9-multimodal)
10. [Pricing](#10-pricing)
11. [Rate Limits](#11-rate-limits)
12. [OpenRouter Agents](#12-openrouter-agents)
13. [MCP Support](#13-mcp-support)
14. [Structured Outputs](#14-structured-outputs)
15. [Embeddings](#15-embeddings)
16. [Image Generation](#16-image-generation)
17. [Context Caching](#17-context-caching)
18. [Observability](#18-observability)
19. [Self-Hosting](#19-self-hosting)
20. [Comparison](#20-comparison)
21. [Integration Patterns for TUI](#21-integration-patterns-for-tui)
22. [OpenRouter in CI/CD](#22-openrouter-in-cicd)

---

## 1. What is OpenRouter

**Feature**: Unified LLM API Gateway

**Description**: OpenRouter is a managed SaaS gateway that provides access to 300+ AI models from 60+ providers through a single OpenAI-compatible API. It handles routing, billing, failover, and governance across providers including OpenAI, Anthropic, Google, Meta, Mistral, DeepSeek, xAI, and hundreds more. It acts as a "Cloudflare between models" — a unified hub between LLM providers and application developers. [^1394^] [^1451^]

**Key capabilities**:
- 300+ models, one API key
- OpenAI-compatible API (drop-in replacement)
- Automatic routing with fallback
- Pay-per-token with no monthly fees
- Free tier for testing
- BYOK (Bring Your Own Key) support
- Multimodal: text, image, audio, video, embeddings, rerankers
- Enterprise features: SSO, ZDR, workspaces

**API Example**:
```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Pricing**: Free tier (50 req/day); Pay-as-you-go (5.5% platform fee on credit purchases); Enterprise (custom) [^1391^] [^1402^]

**Source**: https://openrouter.ai/docs/quickstart | https://openrouter.ai/pricing
**Date**: June 2026
**Confidence**: High

---

## 2. Architecture

**Feature**: Two-Hop Routing Architecture with Provider Abstraction

**Description**: OpenRouter uses a two-hop architecture where every request crosses two administrative boundaries: (1) client to OpenRouter (`api.openrouter.ai`), and (2) OpenRouter to the downstream provider. OpenRouter sees the prompt to route and log usage; the downstream provider receives the prompt to generate the response. The retention and training defaults are the union of both parties' policies. [^1491^] [^1503^]

**Architecture components**:
- **Edge distribution**: Infrastructure distributed across regions for lower latency (~25ms edge latency ideal, ~40ms average production)
- **Routing layer**: Intelligent routing powered by Not Diamond for `openrouter/auto`
- **Provider abstraction**: Normalizes request/response formats across all providers
- **Fallback system**: Automatic provider switching when primary fails
- **Auto Exacto**: Adaptive quality routing that re-evaluates providers every 5 minutes using throughput, tool-call telemetry, and benchmark scores [^1522^]
- **Response Healing**: Automatic repair of malformed JSON responses (reduces structured-output defects by 80-99.8%) [^1518^]

**No self-hosting option**: OpenRouter operates as a fully managed SaaS with no private deployment option. [^1451^]

**API Example** — Routing with provider preferences:
```json
{
  "model": "anthropic/claude-sonnet-4",
  "provider": {
    "sort": "price",
    "zdr": true
  },
  "messages": [{"role": "user", "content": "Hello!"}]
}
```

**Pricing**: No additional routing fee for `openrouter/auto`; billed at selected model's normal rate
**Source**: https://openrouter.ai/docs/api/reference/overview | https://openrouter.ai/announcements/auto-exacto
**Date**: March 2026 | June 2026
**Confidence**: High

---

## 3. SDKs

### 3.1 Official TypeScript SDK (`@openrouter/sdk`)

**Feature**: Auto-generated types from OpenAPI spec, full type safety

**Description**: The TypeScript SDK was released first (before Python). It is intentionally lean — a thin layer over the REST API with auto-generated types. [^1453^] [^1401^]

**Install**: `npm install @openrouter/sdk`

**API Example**:
```typescript
import { OpenRouter } from '@openrouter/sdk';

const client = new OpenRouter({
  apiKey: '<OPENROUTER_API_KEY>',
  httpReferer: '<YOUR_SITE_URL>',
  appTitle: '<YOUR_SITE_NAME>',
});

const completion = await client.chat.send({
  model: '~openai/gpt-latest',
  messages: [{ role: 'user', content: 'What is the meaning of life?' }],
});
```

### 3.2 Agent SDK (`@openrouter/agent`)

**Feature**: Model-agnostic agent framework with `callModel`

**Description**: Packages multi-turn tool calling, streaming, stop conditions, and cost tracking into a single function. Works with any of the 300+ models on OpenRouter. [^1494^] [^1497^]

**Install**: `npm install @openrouter/agent`

**API Example**:
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

// Stream progress
for await (const delta of result.getTextStream()) {
  process.stdout.write(delta);
}
```

### 3.3 Python SDK (`openrouter`)

**Feature**: Python 3.9+ toolkit for AI-powered features

**Description**: Full Python SDK with sync and async support, streaming, and provider routing options. [^1455^]

**Install**: `pip install openrouter` | `uv add openrouter` | `poetry add openrouter`

**API Example**:
```python
from openrouter import OpenRouter

with OpenRouter(api_key=os.getenv("OPENROUTER_API_KEY")) as open_router:
    res = open_router.chat.send(messages=[
        {"role": "user", "content": "Hello, how are you?"},
    ], model="anthropic/claude-4.5-sonnet", provider={
        "zdr": True,
        "sort": "price",
    }, stream=True)
```

### 3.4 Third-Party SDK Compatibility

OpenRouter works with any OpenAI SDK by changing the base URL:
```python
from openai import OpenAI
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="your-openrouter-key"
)
```

**Source**: https://openrouter.ai/sdk | https://github.com/OpenRouterTeam/python-sdk | https://openrouter.ai/docs/quickstart
**Date**: April-June 2026
**Confidence**: High

---

## 4. API Structure

**Feature**: OpenAI-compatible REST API with extended endpoints

**Description**: OpenRouter implements the OpenAI API specification with additional endpoints for its routing, governance, and multimodal features. [^1401^] [^1415^]

### Base Configuration
| Parameter | Value |
|-----------|-------|
| Base URL | `https://openrouter.ai/api/v1` |
| Authentication | `Authorization: Bearer <OPENROUTER_API_KEY>` |
| Optional Headers | `HTTP-Referer`, `X-OpenRouter-Title`, `X-OpenRouter-Cache` |

### Core Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/chat/completions` | POST | Main chat completion endpoint |
| `/completions` | POST | Legacy completions |
| `/models` | GET | List all available models |
| `/api/v1/key` | GET | Check rate limits and credits remaining |
| `/api/v1/audio/speech` | POST | Text-to-speech |
| `/api/v1/audio/transcriptions` | POST | Speech-to-text |
| `/api/v1/videos` | POST | Video generation (async jobs) |
| `/rerank` | POST | Document reranking |
| `/images/generations` | POST | Image generation |

### Request Structure
```json
{
  "model": "anthropic/claude-sonnet-4",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 1000,
  "provider": {
    "sort": "price",
    "zdr": true
  },
  "tools": [...],
  "response_format": {
    "type": "json_schema",
    "json_schema": {...}
  }
}
```

**Source**: https://openrouter.ai/docs/api/reference/overview
**Date**: June 2026
**Confidence**: High

---

## 5. Model Routing

**Feature**: Intelligent Model Selection with Multiple Routing Strategies

**Description**: OpenRouter provides several routing mechanisms to automatically or manually select the best model/provider for each request. [^1452^] [^1501^]

### Routing Options
| Strategy | Slug Suffix | Description |
|----------|-------------|-------------|
| **Auto Router** | `openrouter/auto` | Powered by Not Diamond; selects best model based on cost/speed/performance. No extra fee. |
| **Exacto** | `:exacto` | Quality-weighted routing using adaptive provider scoring. Re-evaluates every 5 min. |
| **Nitro** | `:nitro` | Routes to fastest provider (throughput-optimized) |
| **Floor** | `:floor` | Routes to cheapest provider (price-optimized) |
| **Specific Model** | `provider/model` | Pin exact model and provider |

### Provider Routing Parameters
```json
{
  "provider": {
    "sort": "price",
    "zdr": true,
    "require_parameters": true,
    "fallback": "openai/gpt-4o"
  }
}
```

### Auto Exacto (Adaptive Quality Routing)
- On by default for tool-calling requests (since March 2026)
- Re-evaluates providers every ~5 minutes across three signals:
  1. **Throughput** — provider capacity and speed
  2. **Tool-call telemetry** — billions of tool calls scored for validity
  3. **Benchmark scores** — standardized quality measurements
- Reduced tool-call error rates by 88% for GLM-5 and 80% for GLM-4.7 [^1522^]

### Provider Sort Options
- `price` — Lowest cost provider
- `throughput` — Fastest provider
- `latency` — Lowest latency provider

**API Example**:
```json
{
  "model": "anthropic/claude-sonnet-4:exacto",
  "messages": [{"role": "user", "content": "Hello!"}]
}
```

**Pricing**: No extra fee for auto-router; billed at selected model's normal rate
**Source**: https://openrouter.ai/announcements/auto-exacto | https://openrouter.ai/docs/provider-routing
**Date**: March 2026
**Confidence**: High

---

## 6. Function Calling

**Feature**: Tool Use Across 300+ Models

**Description**: OpenRouter normalizes tool calling across all supported models. Since August 2025, OpenRouter has scored every `tool_call` response across the platform, measuring: (1) valid JSON, (2) tool name matches provided tools, (3) schema conformance. Billions of tool calls measured. [^1522^] [^1494^]

**Key features**:
- Automatic tool execution in Agent SDK
- Input/output validation with Zod schemas
- Parallel tool calling support
- Tool approval gates (human-in-the-loop)
- `nextTurnParams` for tools to modify subsequent requests

**API Example — Direct API**:
```json
{
  "model": "anthropic/claude-sonnet-4",
  "messages": [{"role": "user", "content": "What's the weather in Paris?"}],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get weather for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {"type": "string"}
          },
          "required": ["location"]
        }
      }
    }
  ]
}
```

**API Example — Agent SDK**:
```typescript
const weatherTool = tool({
  name: 'get_weather',
  inputSchema: z.object({ location: z.string() }),
  execute: async ({ location }) => {
    return { temperature: await fetchTemperature(location) };
  },
});

const result = client.callModel({
  model: 'openai/gpt-5-nano',
  input: 'What is the weather in Paris?',
  tools: [weatherTool],
});
```

**Source**: https://openrouter.ai/docs/sdks/typescript/call-model/tools | https://openrouter.ai/announcements/auto-exacto
**Date**: April 2026
**Confidence**: High

---

## 7. Streaming

**Feature**: Server-Sent Events (SSE) for Real-Time Responses

**Description**: Streaming uses server-sent events for real-time token delivery. Set `stream: true` to enable. The Agent SDK provides multiple streaming methods that can be consumed concurrently. [^1395^] [^1494^]

**Streaming methods in Agent SDK**:
| Method | Description |
|--------|-------------|
| `result.getTextStream()` | Text delta stream |
| `result.getToolCallsStream()` | Tool call stream |
| `result.getReasoningStream()` | Reasoning content stream |

**API Example — Direct API**:
```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

**API Example — Agent SDK**:
```typescript
const result = client.callModel({ model: 'gpt-5-nano', input: 'Hello!' });
for await (const delta of result.getTextStream()) {
  process.stdout.write(delta);
}
```

**Source**: https://openrouter.ai/docs/api/reference/streaming | https://openrouter.ai/sdk
**Date**: June 2026
**Confidence**: High

---

## 8. Reasoning Models

**Feature**: Reasoning Content Extraction from DeepSeek R1, o1, o3-mini

**Description**: OpenRouter supports reasoning models and provides access to reasoning traces. Different models expose reasoning content differently. [^1418^] [^1411^]

**Supported reasoning models** (June 2026):
- `deepseek/deepseek-reasoner` (DeepSeek R1) — reasoning via `include_reasoning`
- `openai/o1`, `openai/o1-mini`, `openai/o3-mini` — reasoning via `reasoning_effort` parameter
- `openai/o3-mini` supports `reasoning_effort`: "high", "medium", "low"

**Extracting reasoning content**:
- **DeepSeek R1 via OpenRouter**: Must include `extra_body: { include_reasoning: true }`
  - Reasoning appears in `response.choices[0].message.reasoning_content`
  - Final answer in `response.choices[0].message.content`
- **OpenAI o1/o3-mini**: Reasoning content NOT exposed in API responses (as of early 2025)
- **Agent SDK**: Access via `result.getReasoningStream()` for supported models

**API Example — DeepSeek R1 with reasoning**:
```python
import openai
client = openai.OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="$OPENROUTER_API_KEY"
)

completion = client.chat.completions.create(
    model="deepseek/deepseek-reasoner",
    messages=[{"role": "user", "content": "Is 9.9 bigger than 9.11?"}],
    extra_body={"include_reasoning": True}
)
print(completion.choices[0].message.reasoning)  # Chain-of-thought
print(completion.choices[0].message.content)     # Final answer
```

**Source**: https://openrouter.ai/docs/models/reasoning | Community sources
**Date**: June 2026
**Confidence**: High

---

## 9. Multimodal

**Feature**: Vision, Audio, Video, and Image Support

**Description**: OpenRouter supports multiple modalities through normalized APIs. As of mid-2026, video generation and audio APIs are live alongside text, image, and vision capabilities. [^1493^] [^1492^] [^1495^]

### Modalities Supported
| Modality | Status | Endpoint |
|----------|--------|----------|
| **Text** | Production | `/chat/completions` |
| **Vision** | Production | `/chat/completions` (base64 or URL images) |
| **Audio (TTS)** | Production (May 2026) | `/api/v1/audio/speech` |
| **Audio (STT)** | Production (May 2026) | `/api/v1/audio/transcriptions` |
| **Video Generation** | Production (April 2026) | `/api/v1/videos` |
| **Image Generation** | Production | Via server tools or `/images` |
| **Reranking** | Production | `/rerank` |

### Audio Models
- **TTS**: OpenAI GPT-4o Mini TTS, Google Gemini Flash TTS, Mistral Voxtral Mini TTS
- **STT**: OpenAI Whisper
- Output: MP3 or PCM format
- Provider-specific options pass through (e.g., OpenAI's `instructions` field for tone control)

### Video Generation (April 2026)
- Models: Seedance 2.0, Veo 3.1, Wan 2.7, Sora 2 Pro
- Text-to-video and image-to-video
- Async job tracking (generations take minutes)
- Normalized parameters: resolution, duration, aspect ratio, audio gen
- Capability discovery API

**API Example — Audio TTS**:
```bash
curl https://openrouter.ai/api/v1/audio/speech \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini-tts",
    "input": "Hello, this is a test.",
    "voice": "alloy",
    "response_format": "mp3"
  }' \
  --output speech.mp3
```

**API Example — Video Generation**:
```bash
curl https://openrouter.ai/api/v1/videos \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/veo-3.1",
    "prompt": "A serene mountain landscape at sunset",
    "resolution": "1080p",
    "duration": 5
  }'
# Returns job ID; poll for completion
```

**Source**: https://openrouter.ai/announcements/announcing-audio-apis | https://openrouter.ai/announcements/video-generation | https://openrouter.ai/announcements/agentic-web-tools
**Date**: April-May 2026
**Confidence**: High

---

## 10. Pricing

**Feature**: Pay-Per-Token with Transparent Pricing

**Description**: OpenRouter uses a credit-based system. Credits are deducted per-token as you make API calls. No minimum purchase, no expiration, no monthly fees. Provider rates are passed through at or near cost. [^1390^] [^1391^] [^1402^]

### Pricing Tiers
| Tier | Platform Fee | Models | Rate Limits |
|------|-------------|--------|-------------|
| **Free** | No fees | 25+ free models | 50 req/day, 20 RPM |
| **Pay-as-you-go** | 5.5% per credit purchase | 300+ models | Free models: 1000 req/day (with $10+ credits); Paid: no limits |
| **Enterprise** | Volume discounts | All models | Custom limits, SLAs |

### Sample Model Pricing (per 1M tokens, June 2026)
| Model | Input | Output | Notes |
|-------|-------|--------|-------|
| Claude Opus 4.7 | $15.00 | $75.00 | Same as direct |
| Claude Sonnet 5 | $3.00 | $15.00 | Same as direct |
| GPT-5.5 Standard | $5.00 | $30.00 | Same as direct |
| GPT-4o | ~$2.50 | ~$10.00 | Pass-through |
| DeepSeek V4-Pro | $0.435 | $0.87 | Permanent pricing |
| Gemini 2.5 Flash | ~$0.15 | ~$0.60 | Ultra-cheap |

### Cost Optimization Features
- **Response Caching**: Zero cost for identical requests (cache hit = 80-300ms, $0)
- **Free Models Router**: `openrouter/free` automatically selects free models
- **BYOK**: 1M free requests/month, then 5% fee
- **Floor routing**: `:floor` suffix routes to cheapest provider

**Source**: https://openrouter.ai/pricing | https://costgoat.com/pricing/openrouter
**Date**: June 2026
**Confidence**: High

---

## 11. Rate Limits

**Feature**: Tiered Rate Limit System

**Description**: Rate limits depend on account tier. Pay-as-you-go and Enterprise users have no platform-level rate limits on paid models. [^1399^] [^1400^] [^1402^]

### Rate Limit Structure
| Tier | Free Models | Paid Models | RPM |
|------|-------------|-------------|-----|
| **Free (<$10 credits)** | 50 req/day | N/A (need credits) | 20 |
| **Paid ($10+ credits)** | 1,000 req/day | No limits | 20 (free models only) |
| **Enterprise** | Custom | Custom | Custom |

### BYOK Rate Limits
- 1M free BYOK requests/month (since October 2025)
- After 1M: 5% fee on additional usage
- Resets at midnight UTC at month end
- Same features: failover, routing, spend controls

### Checking Limits
```javascript
const keyInfo = await openRouter.apiKeys.getCurrent();
console.log(keyInfo.data);
// {
//   label: "my-key",
//   limit: 100,
//   limit_remaining: 45.23,
//   usage: 54.77,
//   usage_daily: 12.50,
//   is_free_tier: false
// }
```

### Handling 429s
- Free-tier usage of popular models can be rate-limited by providers during peak times
- Failed attempts still count toward daily quota
- Use exponential backoff for retries
- No platform rate limits for paid/enterprise users (only provider limits)

**Source**: https://openrouter.ai/docs/api/reference/limits | https://openrouter.ai/docs/faq
**Date**: June 2026
**Confidence**: High

---

## 12. OpenRouter Agents

**Feature**: Agent SDK with `callModel` for Multi-Turn Workflows

**Description**: The `@openrouter/agent` SDK provides a single function `callModel` that turns chat completions into multi-step agents with tool calls, stop conditions, and cost tracking across 300+ models. [^1494^] [^1497^] [^1456^]

### Core Concepts
| Feature | Description |
|---------|-------------|
| `callModel()` | One function for any model — handles multi-turn loops |
| `tool()` | Define tools with Zod schemas; SDK validates and executes |
| `stopWhen` | Composable stop conditions: `stepCountIs()`, `maxCost()`, `hasToolCall()` |
| `getTextStream()` | Stream text deltas |
| `getToolCallsStream()` | Stream tool calls |
| `getReasoningStream()` | Stream reasoning content |
| Tool Approval | Human-in-the-loop gates for dangerous tools |
| Cost Tracking | `result.getResponse().usage` for token/cost data |

### Stop Conditions
```typescript
stopWhen: [
  stepCountIs(10),        // Max 10 turns
  maxCost(1.00),           // $1.00 max spend
  maxTokensUsed(10000),    // 10K tokens max
  hasToolCall('finish'),   // Stop when finish tool called
  finishReasonIs('stop'),  // Stop on natural completion
]
```

### Scaffolding Skills
1. **`create-agent-tui`**: Scaffold a full terminal UI agent (interactive)
2. **`create-headless-agent`**: Scaffold a headless agent for scripts/pipelines

**Install**: `gh skill install OpenRouterTeam/skills create-agent-tui`

**API Example — Complete Agent**:
```typescript
import { OpenRouter, tool, stepCountIs, hasToolCall } from '@openrouter/agent';
import { z } from 'zod';

const client = new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

const searchTool = tool({
  name: 'web_search',
  inputSchema: z.object({ query: z.string() }),
  execute: async ({ query }) => {
    // Search implementation
    return { results: [...] };
  }
});

const finishTool = tool({
  name: 'finish',
  inputSchema: z.object({ answer: z.string() }),
  execute: async ({ answer }) => ({ answer })
});

const result = client.callModel({
  model: 'openai/gpt-5-nano',
  instructions: 'You are a research assistant.',
  input: 'Latest quantum computing developments?',
  tools: [searchTool, finishTool],
  stopWhen: [stepCountIs(10), hasToolCall('finish')]
});

for await (const tc of result.getToolCallsStream()) {
  console.log(`[${tc.name}] ${JSON.stringify(tc.arguments)}`);
}
```

**Source**: https://openrouter.ai/announcements/agent-sdk-with-callmodel | https://openrouter.ai/docs/sdks/typescript/call-model/overview
**Date**: April 2026
**Confidence**: High

---

## 13. MCP Support

**Feature**: Community MCP Servers + OpenRouter as MCP Tool Router

**Description**: OpenRouter does not natively implement an MCP gateway, but multiple community MCP servers exist that expose OpenRouter's model catalog through the Model Context Protocol. OpenRouter models can process MCP tool calls when used through MCP clients. [^1398^] [^1404^] [^1407^] [^1405^]

### Community MCP Servers
| Server | Features |
|--------|----------|
| `openrouter-mcp` | 400+ models, model search, chat, comparison, side-by-side responses |
| `@stabgan/openrouter-mcp-multimodal` | Vision, audio, video, image generation, web search, reranking, reasoning tokens |
| `@mcpservers/openrouterai` | Model access, caching, rate limit management, backoff |

### MCP Server Features (multimodal variant)
- Collective Intelligence System: 5 specialized tools for ensemble reasoning
- Multi-Model Access: 200+ models
- Vision/Multimodal Support: base64 images, image URLs
- Streaming Support: Real-time response streaming
- Advanced Model Benchmarking: Side-by-side comparison
- Usage Tracking: Monitor API usage, costs, token consumption
- MCP 2025-06-18 spec compliance: `outputSchema`, progress notifications

### Installation (MCP Server)
```bash
npm install @stabgan/openrouter-mcp-multimodal
# or
npx @stabgan/openrouter-mcp-multimodal
```

**Note**: While OpenRouter itself doesn't provide a native MCP gateway (competitors like Bifrost do), its Agent SDK handles tool calling patterns that are semantically equivalent to MCP. The `tool()` helper with Zod schemas and automatic execution mirrors MCP's tool definition protocol. [^1403^]

**Source**: https://lobehub.com/mcp/yourusername-openrouter-mcp | https://www.mcpserverfinder.com/servers/heltonteixeira/openrouterai
**Date**: June 2026
**Confidence**: High

---

## 14. Structured Outputs

**Feature**: JSON Schema Enforcement with Streaming Support

**Description**: OpenRouter supports structured outputs via `response_format` with `json_schema` type. Supports both streaming and non-streaming structured outputs. Response Healing automatically repairs malformed JSON. [^1415^] [^1408^] [^1410^]

### Supported Modes
| Mode | Type Value | Schema Adherence | Description |
|------|-----------|------------------|-------------|
| **JSON Schema** | `json_schema` | Yes (strict) | Enforces full schema compliance |
| **JSON Object** | `json_object` | No | Ensures valid JSON only |

### Key Details
- Use `"type": "json_schema"` (NOT `json_object`) for schema enforcement [^1414^]
- Streaming structured outputs: combine `response_format: { type: "json_schema" }` with `stream: true` [^1408^]
- Response Healing: Automatic repair of malformed JSON (reduces defects by 80% for Gemini 2.0 Flash, 99.8% for Qwen3 235B) [^1518^]
- Not all providers support structured outputs equally — behavior varies by upstream provider

**API Example**:
```json
{
  "model": "anthropic/claude-sonnet-4",
  "messages": [{"role": "user", "content": "Extract: Jason is 25"}],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "user",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "age": {"type": "integer"}
        },
        "required": ["name", "age"],
        "additionalProperties": false
      }
    }
  }
}
```

**API Example — with Instructor (Python)**:
```python
from pydantic import BaseModel
import instructor

class User(BaseModel):
    name: str
    age: int

client = instructor.from_provider(
    "openrouter/google/gemini-2.0-flash-lite-001",
    base_url="https://openrouter.ai/api/v1"
)

user = client.create(
    messages=[{"role": "user", "content": "Extract: Jason is 25"}],
    response_model=User,
    extra_body={"provider": {"require_parameters": True}}
)
```

**Source**: https://openrouter.ai/docs/api/reference/overview | https://python.useinstructor.com/integrations/openrouter/
**Date**: June 2026
**Confidence**: High

---

## 15. Embeddings

**Feature**: Limited Embedding Model Access

**Description**: As of early 2025, OpenRouter did not provide access to embedding models through its API. However, a reranking API is available via Cohere models. [^1420^] [^1520^]

### Current Status
- **Text Embeddings**: NOT directly available through OpenRouter (use provider APIs directly)
- **Reranking**: Available via `/rerank` endpoint with Cohere models (Rerank v3.5, Rerank 4 Pro, Rerank 4 Fast)
- **Cohere Rerank v3.5**: 4,096 context, $0.001 per search, supports 100+ languages

### Workarounds
- Use provider APIs directly for embeddings (OpenAI, Cohere, etc.)
- Use the rerank API for search relevance refinement
- BYOK with your own embedding provider keys

**API Example — Reranking**:
```bash
curl https://openrouter.ai/api/v1/rerank \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "cohere/rerank-v3.5",
    "query": "What is machine learning?",
    "documents": ["ML is...", "AI refers to..."]
  }'
```

**Source**: https://openrouter.ai/cohere/rerank-v3.5/api | https://community.n8n.io/t/how-to-use-embedding-models-with-openrouter/74678
**Date**: June 2026
**Confidence**: High

---

## 16. Image Generation

**Feature**: Image Generation via Server Tools and API

**Description**: Image generation is available on OpenRouter through server-side tools and dedicated endpoints. Models from multiple providers supported. [^1411^] [^1396^]

### Supported Image Models
- DALL-E (OpenAI)
- Stable Diffusion variants
- FLUX (Black Forest Labs)
- Gemini 2.5 Flash Image Preview (Google)
- GPT Image 2

### Access Methods
1. **Server Tool**: `openrouter:image_generation` (zero client code needed)
2. **Direct API**: `/images/generations` endpoint
3. **Agent SDK**: Built-in image generation tool

**API Example — via Agent SDK tool**:
```typescript
const result = client.callModel({
  model: 'gpt-4o',
  input: 'Generate an image of a futuristic city',
  tools: ['openrouter:image_generation']  // Server-side tool
});
```

**Source**: https://openrouter.ai/announcements | https://www.npmjs.com/package/@stabgan/openrouter-mcp-multimodal
**Date**: June 2026
**Confidence**: Medium

---

## 17. Context Caching

**Feature**: Response Caching with Zero Cost for Identical Requests

**Description**: OpenRouter provides two caching mechanisms: (1) Response Caching (OpenRouter-managed, zero cost on hit), and (2) Prompt Caching (provider-managed, reduces prompt costs for repeated prefixes). [^1409^] [^1412^] [^1422^]

### Response Caching (April 2026)
- Header-based: `X-OpenRouter-Cache: true`
- First call hits provider and gets billed normally
- Every identical call after: cached response in 80-300ms, zero tokens billed
- Cache key: hashes request body, model, API key, and streaming mode
- Works for streaming and non-streaming
- Supports text, images, audio, documents, tool calls
- TTL control: `X-OpenRouter-Cache-TTL` (1 second to 24 hours, default 5 min)
- Cache busting: `X-OpenRouter-Cache-Clear: true`
- Cache status in response headers: `X-OpenRouter-Cache-Status: HIT/MISS`

### Prompt Caching (Provider-level)
- Reduces cost of prompt portion when messages share common prefix
- Anthropic models: cache reads at 0.1x original price (90% savings)
- Explicit caching via `cache_control` markers on messages
- Available for large documentation queries, multi-turn conversations, RAG workflows

**API Example — Response Caching**:
```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "X-OpenRouter-Cache: true" \
  -H "X-OpenRouter-Cache-TTL: 3600" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [{"role": "user", "content": "Summarize this document"}]
  }'
```

**Pricing**: Response cache hits = $0; Prompt cache = provider-dependent (typically 0.1x for cached tokens)
**Source**: https://openrouter.ai/announcements/response-caching | https://openrouter.ai/docs/guides/features/structured-outputs
**Date**: April-May 2026
**Confidence**: High

---

## 18. Observability

**Feature**: OpenTelemetry Tracing, Grafana/LangFuse Integration

**Description**: OpenRouter provides multiple observability mechanisms: OpenRouter Broadcast (OpenTelemetry), request metadata, usage tracking, and third-party integrations. [^1493^] [^1494^]

### Observability Features
| Feature | Description |
|---------|-------------|
| **OpenRouter Broadcast** | Auto-generates OpenTelemetry traces for every request; no SDK install needed |
| **Request Metadata** | Model used, provider, tokens, cost, timing, status |
| **Usage Tracking** | Per-model, per-API-key, per-creator tracking |
| **Credits API** | Live credit balance and usage data |
| **Activity Dashboard** | Historical usage filtering by model, provider, API key |

### OpenTelemetry Attributes
- Model information (requested, actual, provider)
- Token usage (input, output, total)
- Timing (duration, time-to-first-token, generation speed)
- Cost (USD per request)
- Status and errors
- Custom metadata (user IDs, session IDs, feature flags)

### Grafana Cloud Integration
- Traces sent via OTLP HTTP/JSON to Grafana Cloud Traces
- Query with TraceQL
- Build dashboards and alerts

### LangFuse Integration
```typescript
const trace = langfuse.trace({
  name: "chat-completion",
  userId: req.userId,
  input: messages,
  metadata: { model }
});
```

### Checking Credits via API
```javascript
const keyInfo = await openRouter.apiKeys.getCurrent();
// Returns: label, limit, limit_remaining, usage, usage_daily/weekly/monthly
```

**Source**: https://grafana.com/blog/how-openrouter-and-grafana-cloud-bring-observability-to-llm-powered-applications/
**Date**: March 2026
**Confidence**: High

---

## 19. Self-Hosting

**Feature**: Managed SaaS Only — No Self-Hosting Option

**Description**: OpenRouter operates as a fully managed SaaS. Your requests flow through their infrastructure to reach upstream providers. There is no self-hosted or private deployment option. [^1450^] [^1451^] [^1454^]

### Data Privacy Controls
| Feature | Availability |
|---------|-------------|
| Zero Data Retention (ZDR) | Yes — route only to ZDR-compliant endpoints |
| Regional routing | Yes — Enterprise and Pay-as-you-go |
| Provider data policies | Exposed in API and docs |
| No prompt storage | Default (unless opted in) |

### ZDR (Zero Data Retention)
- Not a single toggle; requires:
  1. Downstream provider supports ZDR on the endpoint
  2. OpenRouter and provider account eligible
  3. Endpoint is ZDR-eligible per documentation
- Per-request: `"provider": { "zdr": true }`
- Account-level: Enable in dashboard

### Compliance
- SOC 2 Type I Certification (mid-2026)
- Minimal metadata storage (timestamps, IDs, performance metrics)
- Note: Data may be transferred to US or countries outside EEA

### Alternatives for Self-Hosting
| Platform | Type | Best For |
|----------|------|----------|
| **LiteLLM** | Open-source proxy | Full control, data sovereignty |
| **Portkey** | Hybrid/airgapped | Enterprise compliance |
| **Bifrost** | Open-source gateway | MCP gateway, semantic caching |

**Source**: https://openrouter.ai/docs/guides/features/zdr | https://checkthat.ai/brands/openrouter/alternatives
**Date**: June 2026
**Confidence**: High

---

## 20. Comparison

### OpenRouter vs. Alternatives

| Dimension | OpenRouter | Direct API | Together AI | Groq | LiteLLM | Portkey |
|-----------|-----------|------------|-------------|------|---------|---------|
| **Models** | 300+ | 1 provider | ~100 | ~20 | 100+ | 500+ |
| **Self-host** | No | N/A | No | No | Yes | Hybrid |
| **Latency** | 25-40ms overhead | Direct | Direct | Ultra-fast | 2-13ms | 50-100ms |
| **Pricing** | 5.5% fee | Direct rate | Direct | Direct | Free (self) | Subscription |
| **Routing** | Auto/manual | None | Manual | Manual | Load balance | Conditional |
| **Fallback** | Yes | No | No | No | Yes | Yes |
| **Observability** | Basic | Provider | Basic | Basic | Basic | Full |
| **MCP Gateway** | No | N/A | No | No | No | No |

### Key Differentiators
- **OpenRouter**: Broadest model catalog (300+), simplest setup, credit-based billing
- **Direct APIs**: Lower cost at scale, provider SLAs, full feature access
- **Together AI**: Strong open-weight model inference, competitive pricing
- **Groq**: Fastest inference (LPU chips), limited model selection
- **Cerebras**: Ultra-fast inference on specialized hardware
- **LiteLLM**: Self-hosted, full control, free at routing layer
- **Portkey**: Enterprise governance, RBAC, audit trails, prompt management

### When to Use OpenRouter
- **Best**: Rapid prototyping, multi-model comparison, fallback protection
- **Best**: Teams using multiple providers without managing separate accounts
- **Best**: Applications needing easy model switching
- **Not ideal**: Enterprise with compliance requirements, cost-sensitive high-volume, guaranteed SLAs

**Source**: https://evolink.ai/blog/openrouter-alternatives-ai-model-routing-2026 | https://getmaxim.ai/articles/best-openrouter-alternative-in-2026-2/
**Date**: May-June 2026
**Confidence**: High

---

## 21. Integration Patterns for TUI

**Feature**: Native TUI Agent Scaffolding with `create-agent-tui`

**Description**: OpenRouter provides a skill-based scaffolding system for building terminal UI agents. The `create-agent-tui` skill generates a complete TypeScript project with customizable visual styles, tools, and harness modules. [^1456^] [^1515^]

### TUI Features
| Feature | Options |
|---------|---------|
| **Tool Display Styles** | `grouped` (tree), `emoji` (markers), `minimal` (one-liners), `hidden`, custom |
| **Input Styles** | `block` (full-width themed), `bordered` (lines), `plain` (readline), custom |
| **Loader Animations** | Gradient shimmer, spinner, trailing dots |
| **ASCII Banners** | Custom or generated |

### Generated Project Structure
```
my-agent/
  package.json              # @openrouter/agent, zod, tsx
  tsconfig.json             # ES2022, Node16, strict
  .env.example              # OPENROUTER_API_KEY
  src/
    config.ts               # Layered config
    agent.ts                # Core runner with retry
    cli.ts                  # Interactive REPL with streaming
    session.ts              # JSONL conversation persistence
    terminal-bg.ts          # Adaptive background detection
    renderer.ts             # Tool display renderer
    loader.ts               # Loader animation
    commands.ts             # Slash command registry
    tools/                  # Tool implementations
```

### Server Tools (Zero Client Code)
| Tool | Default | Description |
|------|---------|-------------|
| Web Search | on | Real-time web via `openrouter:web_search` |
| Datetime | on | Current date/time |
| Image Generation | off | Generate images |

### Slash Commands
- `/model` — Switch models on the fly
- `/new` — Fresh conversation
- `/export` — Save as Markdown

### Launch Options
```bash
npm start -- --banner "Acme Bot" --model '~anthropic/claude-sonnet-latest' \
  --input bordered --tool-display emoji
```

### Integration with Existing TUI Tools
- **Claude Code**: Use via `/connect` command; set `OPENAI_API_BASE` to OpenRouter
- **OpenCode**: Set `OPENAI_API_BASE=https://openrouter.ai/api/v1`
- **Aider**: `--model openrouter/anthropic/claude-sonnet-4`
- **General**: Any OpenAI-compatible tool can use OpenRouter by changing base URL

**Source**: https://openrouter.ai/docs/cookbook/building-agents/create-agent-harness-tui | https://dev.to/mozes721/kickstart-opencode-with-openrouter-32o7
**Date**: June 2026
**Confidence**: High

---

## 22. OpenRouter in CI/CD

**Feature**: Headless Agent for CI/CD Pipelines

**Description**: The `create-headless-agent` skill scaffolds a headless agent designed for CLI tools, API servers, queue workers, and automation pipelines. Combined with Response Caching, it's ideal for CI/CD workflows. [^1516^] [^1409^]

### CI/CD Use Cases
| Use Case | How OpenRouter Helps |
|----------|---------------------|
| **Code Review** | Headless agent analyzes PRs, suggests improvements |
| **Test Generation** | Generate test cases from code changes |
| **Documentation** | Auto-generate/update docs from code |
| **Linting/Analysis** | Multi-model code quality analysis |
| **Pipeline Automation** | Structured output for build decisions |

### Headless Agent Features
- NDJSON event streams
- Exit codes for CI integration
- Schema-validated responses
- No terminal UI — pure programmatic I/O
- Bun runtime for fast startup

### Response Caching for CI
```bash
# First run populates cache (costs tokens)
curl ... -H "X-OpenRouter-Cache: true" -d '{...test analysis...}'

# Subsequent runs: instant, free (cache hit)
# 80-300ms response, zero tokens billed
```

### Example — CI Code Review Script
```typescript
// src/cli.ts (generated by create-headless-agent)
import { OpenRouter, tool } from '@openrouter/agent';
import { z } from 'zod';

const reviewTool = tool({
  name: 'review_code',
  inputSchema: z.object({ diff: z.string() }),
  outputSchema: z.object({ issues: z.array(z.string()), approve: z.boolean() }),
  execute: async ({ diff }) => {
    // Review logic
  }
});

const result = client.callModel({
  model: 'anthropic/claude-sonnet-4',
  input: `Review this diff: ${process.env.DIFF}`,
  tools: [reviewTool],
  stopWhen: [stepCountIs(5), hasToolCall('review_code')]
});
```

**Source**: https://openrouter.ai/docs/cookbook/building-agents/create-headless-agent | https://openrouter.ai/announcements/response-caching
**Date**: April-June 2026
**Confidence**: High

---

## Appendix A: Web Search & Fetch (Built-in Tools)

**Feature**: Consistent Web Search and Page Fetch Across Every Model

**Description**: As of May 2026, OpenRouter provides built-in web search and web fetch tools that any tool-calling model can use. Replaces the older web search plugin. [^1498^]

### Web Search Engines
| Engine | How It Works | Pricing |
|--------|-------------|---------|
| **Auto** (default) | Native if supported, otherwise Exa | Varies |
| **Native** | Provider's built-in search | Provider pricing |
| **Exa** | Exa search | $0.005/req (10 results), $0.001/additional |
| **Parallel** | Parallel search | $0.005/req (10 results), $0.001/additional |

### Web Fetch Engines
| Engine | Pricing |
|--------|---------|
| **Auto** | Varies |
| **Native** | Provider pricing |
| **OpenRouter** | Free |
| **Exa** | $0.001/fetch |
| **Parallel** | $0.001/fetch |

**Migration from plugin**: Replace `plugins: [{ id: "web_search" }]` with `tools: ["openrouter:web_search"]`

**Source**: https://openrouter.ai/announcements/agentic-web-tools
**Date**: May 2026
**Confidence**: High

---

## Appendix B: Workspaces (April 2026)

**Feature**: Multi-Project Environment Isolation

**Description**: Workspaces allow organizing OpenRouter projects into separate environments, each with own API keys, routing defaults, guardrails, and observability. [^1493^]

- Default workspace contains existing setup
- Separate environments for dev/staging/production
- Per-workspace API keys with caps, alerts, activity logs

**Source**: https://openrouter.ai/announcements/introducing-workspaces
**Date**: April 2026
**Confidence**: High

---

## Appendix C: Summary of Key API Headers

| Header | Purpose | Values |
|--------|---------|--------|
| `Authorization` | Auth | `Bearer sk-or-...` |
| `HTTP-Referer` | Site URL for rankings | Your site URL |
| `X-OpenRouter-Title` | Site title for rankings | Your app name |
| `X-OpenRouter-Cache` | Enable response caching | `true` |
| `X-OpenRouter-Cache-TTL` | Cache TTL | `1` to `86400` (seconds) |
| `X-OpenRouter-Cache-Clear` | Bust cache | `true` |
| `X-OpenRouter-Cache-Status` | Response: HIT/MISS | (read-only) |

---

## Sources

[^1389^] https://openrouter.ai/announcements — OpenRouter Announcements and Blog
[^1390^] https://costgoat.com/pricing/openrouter — OpenRouter Pricing Calculator & Cost Guide (May 2026)
[^1391^] https://zenmux.ai/blog/openrouter-api-pricing-2026-full-breakdown-of-rates-tiers-and-usage-costs — OpenRouter API Pricing 2026
[^1394^] https://www.youtube.com/watch?v=q5oiQjfzYiA — OpenRouter 2026: One API for Every AI Model
[^1395^] https://openrouter.ai/docs/faq — OpenRouter FAQ
[^1396^] https://openrouter.ai/announcements/all — All OpenRouter Announcements
[^1397^] https://hallam.agency/blog/how-mcp-will-supercharge-ai-automation-in-2026/ — How MCP will supercharge AI automation in 2026
[^1398^] https://lobehub.com/mcp/yourusername-openrouter-mcp — OpenRouter MCP Server
[^1399^] https://openrouter.ai/docs/api/reference/limits — API Rate Limits
[^1400^] https://www.aibase.com/news/www.aibase.com/news/16952 — OpenRouter Adjusts API Policy
[^1401^] https://openrouter.ai/docs/quickstart — OpenRouter Quickstart Guide
[^1402^] https://openrouter.ai/pricing — OpenRouter Pricing Page
[^1403^] https://www.getmaxim.ai/articles/best-openrouter-alternative-in-2026-2/ — Best OpenRouter Alternative in 2026
[^1405^] https://www.getmaxim.ai/articles/5-best-mcp-gateways-for-developers-in-2026/ — 5 Best MCP Gateways for Developers in 2026
[^1408^] https://github.com/TanStack/ai/issues/526 — Streaming structured output support
[^1409^] https://openrouter.ai/announcements/response-caching — Response Caching
[^1410^] https://www.reddit.com/r/LLMDevs/comments/1inpm0v/structured_output_with_deepseekr1_how_to_account/ — Structured output with DeepSeek-R1
[^1411^] https://www.npmjs.com/package/@stabgan/openrouter-mcp-multimodal — OpenRouter MCP Multimodal
[^1414^] https://github.com/prism-php/prism/issues/644 — Incorrect response_format.type value
[^1415^] https://openrouter.ai/docs/api/reference/overview — OpenRouter API Reference
[^1418^] https://www.aidoczh.com/langroid/notes/reasoning-content/index.html — Reasoning content extraction
[^1420^] https://community.n8n.io/t/how-to-use-embedding-models-with-openrouter/74678 — Embedding models with OpenRouter
[^1422^] https://openrouter.ai/announcements/is-implicit-caching-prompt-retention — Implicit Caching
[^1450^] https://checkthat.ai/brands/openrouter/alternatives — OpenRouter Alternatives
[^1451^] https://jimmysong.io/blog/openrouter-insight/ — OpenRouter Insights
[^1452^] https://evolink.ai/blog/openrouter-alternatives-ai-model-routing-2026 — Best OpenRouter Alternatives in 2026
[^1453^] https://x.com/mickythompson/status/1986179202253824473 — TypeScript SDK release
[^1454^] https://inworld.ai/resources/ai-gateway-comparison — Vercel vs. Inworld vs. OpenRouter (2026)
[^1455^] https://github.com/OpenRouterTeam/python-sdk — OpenRouter Python SDK
[^1456^] https://openrouter.ai/docs/cookbook/building-agents/create-agent-harness-tui — Build Your Own Agent TUI
[^1491^] https://meetily.ai/llm-privacy/openrouter — OpenRouter Data Retention Policy
[^1492^] https://www.datastudios.org/post/openrouter-api-key-free-limits-free-routes-paid-access-and-byok — OpenRouter API Key Free Limits
[^1493^] https://openrouter.ai/announcements/april-release-spotlight — April Release Spotlight
[^1494^] https://openrouter.ai/announcements/agent-sdk-with-callmodel — Agent SDK
[^1497^] https://openrouter.ai/sdk — OpenRouter SDK Page
[^1498^] https://openrouter.ai/announcements/agentic-web-tools — Web Search and Fetch Tools
[^1500^] https://www.ai.cc/blogs/openai-sora-shutdown-best-ai-video-generation-api-alternatives-2026-migration-guide/ — AI Video Generation API Alternatives
[^1501^] https://openrouter.ai/docs/guides/features/sovereign-ai — Sovereign AI
[^1503^] https://medium.com/@theredpill_53001/openrouter-vs-direct-provider-apis-a-practical-comparison-f0fa13112d58 — OpenRouter vs Direct APIs
[^1507^] https://openrouter.ai/docs/guides/features/zdr — Zero Data Retention
[^1515^] https://openrouter.ai/announcements/create-agent-harness-with-agent-sdk — Build Your Own Harness
[^1516^] https://openrouter.ai/docs/cookbook/building-agents/create-headless-agent — Headless Agent
[^1518^] https://sacra.com/c/openrouter/ — OpenRouter revenue, valuation & funding
[^1520^] https://openrouter.ai/cohere/rerank-v3.5/api — Cohere Rerank v3.5 API
[^1522^] https://openrouter.ai/announcements/auto-exacto — Auto Exacto Adaptive Quality Routing

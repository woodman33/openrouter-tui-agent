# ☁️ CLOUDFLARE AI & EDGE DEVELOPER REFERENCE DIRECTORY
### TIMMY Swarm Console Companion • © 2026 William Meldman
*Creator Attribution Shield Active • Verified Systems Architecture*

---

Welcome to the unified developer directory for building, deploying, and observing stateful AI applications and edge systems on the Cloudflare Developer Platform. This directory aggregates the crucial commands, configuration bindings, API signatures, and architectural strategies documented across your workspace guides.

Use this directory as a centralized reference map. Each section links back to its detailed source guide for comprehensive implementation blueprints.

---

## 🗺️ Master Document Map

| Technology Area | Source Documentation File | Core Subject Matter |
| :--- | :--- | :--- |
| **Edge Feature Flagging** | [flagship-openfeature-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/flagship-openfeature-docs.md) | OpenFeature CNCF SDK & Flagship server/client providers. |
| **AI LLM Docs Protocol** | [docs-for-agents.md](file:///Users/williammeldman/Desktop/openrouter-tui/docs-for-agents.md) | Markdown endpoints, `llms.txt` specifications, and context windows. |
| **Model Context Protocol** | [cloudflare-mcp-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-mcp-docs.md) | Code Mode vs. domain-specific remote MCP servers. |
| **Contextual Agent Skills** | [cloudflare-agent-skills.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-agent-skills.md) | Auto-loading triggers for Cursor, Claude Code, and slash commands. |
| **Wrangler Developer CLI** | [cloudflare-wrangler-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-wrangler-docs.md) | Wrangler commands, types generation, and programmatic dev APIs. |
| **Serverless Types** | [cloudflare-workers-types-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-workers-types-docs.md) | TSConfig types entries, compatibility date mappings. |
| **Python Systems SDK** | [cloudflare-python-sdk-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-python-sdk-docs.md) | Stainless async/sync Python libraries, auto-pagination, error codes. |
| **Cloudflare Agents SDK** | [cloudflare-agent-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-agent-docs.md) | Stateful Durable Objects AI agents, SQLite state sync, React hooks. |
| **Swarm Templates** | [cloudflare-agent-templates-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-agent-templates-docs.md) | Quickstart templates for D1, Durable Chat, PartyKit, and Hyperdrive. |

---

## 🤖 1. Cloudflare Agents SDK & Durable Objects
> Detailed source guides: [cloudflare-agent-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-agent-docs.md) and [cloudflare-agent-templates-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-agent-templates-docs.md)

Stateful AI agents are built on Cloudflare using the **Agents SDK**, powered by **Durable Objects** with co-located SQLite databases for zero-latency memories.

### Core Implementation
Extend the base `Agent` or `AIChatAgent` class and declare state schemas and RPC-callable endpoints:

```typescript
import { Agent, callable } from "agents";

export interface CounterState { count: number; }

export class CounterAgent extends Agent<Env, CounterState> {
  initialState: CounterState = { count: 0 };

  @callable()
  async increment() {
    this.setState({ count: this.state.count + 1 });
    return this.state.count;
  }
}
```

### Essential API Commands
* **`routeAgentRequest(request, env)`**: Placed inside the Worker's entry point to intercept agent routing:
  ```typescript
  export default {
    async fetch(request, env) {
      return (await routeAgentRequest(request, env)) || new Response("Not found", { status: 404 });
    }
  }
  ```
* **`getAgentByName(env.Binding, instanceName)`**: Fetches an active stateful agent instance in serverless code:
  ```typescript
  const counter = await getAgentByName(env.CounterAgent, "shared-instance-1");
  const value = await counter.increment();
  ```

### Frontend Orchestration
* **React Hooks**: Use `useAgent` and `useAgentChat` to automatically manage connections, message streams, client-side browser tools, and human-in-the-loop approvals:
  ```typescript
  import { useAgentChat } from "@cloudflare/ai-chat/react";
  const { messages, sendMessage, addToolApprovalResponse } = useAgentChat({ agent });
  ```
* **Vanilla JS**: Connect using `AgentClient`:
  ```typescript
  const client = new AgentClient({ agent: "CounterAgent", onStateUpdate: (s) => console.log(s) });
  ```

---

## ⚡ 2. Flagship & OpenFeature SDK
> Detailed source guide: [flagship-openfeature-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/flagship-openfeature-docs.md)

The `@cloudflare/flagship` SDK implements the CNCF OpenFeature standard for highly optimized feature flag evaluations at the global edge.

### Wrangler Binding Configuration (Zero-HTTP Overhead)
The recommended approach for Workers is to bind Flagship natively in `wrangler.jsonc`:
```json
{
  "flagship": [
    {
      "binding": "FLAGS",
      "app_id": "<YOUR_FLAGSHIP_APP_ID>"
    }
  ]
}
```

### Evaluation Syntaxes
* **Server-side (Workers / Node.js)**: Evaluate flags asynchronously. Passes `targetingKey` and custom rule context:
  ```typescript
  import { OpenFeature } from "@openfeature/server-sdk";
  import { FlagshipServerProvider } from "@cloudflare/flagship/server";

  await OpenFeature.setProviderAndWait(new FlagshipServerProvider({ binding: env.FLAGS }));
  const client = OpenFeature.getClient();
  const active = await client.getBooleanValue("new-checkout", false, {
    targetingKey: "user-42",
    plan: "enterprise"
  });
  ```
* **Client-side (Browser)**: Caches flags synchronously via the `FlagshipClientProvider`:
  ```typescript
  import { OpenFeature } from "@openfeature/web-sdk";
  import { FlagshipClientProvider } from "@cloudflare/flagship/web";

  await OpenFeature.setProviderAndWait(new FlagshipClientProvider({
    appId: "app-id", accountId: "account-id", authToken: "token",
    prefetchFlags: ["promo-banner", "dark-mode"]
  }));
  const client = OpenFeature.getClient();
  const showBanner = client.getBooleanValue("promo-banner", false); // Synchronous
  ```

---

## 🔌 3. Model Context Protocol (MCP) Servers
> Detailed source guide: [cloudflare-mcp-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-mcp-docs.md)

Cloudflare runs managed remote MCP servers to connect LLMs to your developer account resources.

### Architectural Triage

| MCP Server Category | Connection Endpoint / URL | Ideal Use Case |
| :--- | :--- | :--- |
| **Code Mode Server** | `https://mcp.cloudflare.com/mcp` | **Broad API access**: Exposes 2,500+ endpoints in ~1k tokens by executing generated Javascript in isolated Workers sandbox microVMs. |
| **Bindings Server** | `https://bindings.mcp.cloudflare.com/mcp` | Developing Workers apps with KV, D1, R2, and AI primitives. |
| **Observability Server** | `https://observability.mcp.cloudflare.com/mcp` | Debugging edge workers, scanning runtime logs and exceptions. |
| **Docs Server** | `https://docs.mcp.cloudflare.com/mcp` | Instant vector search over the latest platform documentation. |

### Configuration Stanza (e.g. Cursor / Claude Code)
Register the remote servers inside `mcpServers` using `mcp-remote`:
```json
{
  "mcpServers": {
    "cloudflare-api-codemode": {
      "url": "https://mcp.cloudflare.com/mcp"
    },
    "cloudflare-observability": {
      "command": "npx",
      "args": ["mcp-remote", "https://observability.mcp.cloudflare.com/mcp"]
    }
  }
}
```
*Note: To register every API endpoint individually instead of using Code Mode, append `?codemode=false` to the Code Mode URL. Note that this increases token cost from ~1k to ~244k tokens.*

---

## 🧠 4. Contextual Agent Skills Plugin Ecosystem
> Detailed source guide: [cloudflare-agent-skills.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-agent-skills.md)

Agent Skills are task-specific instructions that AI tools (like Claude Code, Cursor, OpenCode, and Codex) load on demand to gain platform expertise.

### Available Skill Modules
* **`agents-sdk`**: Guides creating stateful AI classes, RPC callables, alarms, and websocket triggers.
* **`wrangler`**: Resolves CLI syntax for managing KV, R2, D1, and deploy configurations.
* **`durable-objects`**: Audits DO synchronization locks, SQLite memory, and testing with Vitest.
* **`sandbox-sdk`**: Handles untrusted execution of Python/JS scripts inside microVM containers.
* **`web-perf`**: Profiles Core Web Vitals (LCP, INP, CLS) using Chrome DevTools.

### CLI Installation
* **Claude Code**: `/plugin marketplace add cloudflare/skills`
* **Cursor**: Configure `Remote Rule (Github)` pointing to `cloudflare/skills`.
* **Universal CLI**: `npx skills add https://github.com/cloudflare/skills`

---

## 🛠️ 5. Wrangler CLI & Programmatic APIs
> Detailed source guide: [cloudflare-wrangler-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-wrangler-docs.md)

Wrangler is the developer command-line gateway to the Cloudflare Developer Platform.

### Crucial CLI Commands
* **`wrangler init [name]`**: Scaffolds a new project via C3 with options for web frameworks.
* **`wrangler dev [script]`**: Starts a local development server running the high-fidelity `workerd` runtime with UTC timezone locking. Key flags:
  * `--local`: Disables remote bindings.
  * `--persist-to <dir>`: Sets custom directories for persistent local storage.
  * `--tunnel`: Exposes local development ports globally over Cloudflare Tunnel.
* **`wrangler deploy`**: Bundles and deploys Workers, auto-detecting framework settings if no config file exists.
* **`wrangler types`**: Generates a type definition file (`worker-configuration.d.ts`) based on Wrangler bindings.
* **`wrangler secret put <KEY>`** / **`wrangler secret bulk <file>`**: Uploads encrypted secrets.

### Programmatic Integration APIs
* **`experimental_generateTypes(options)`**: Programmatically generates TypeScript bindings without writing them to disk:
  ```typescript
  import { experimental_generateTypes } from "wrangler";
  const result = await experimental_generateTypes({ config: "wrangler.json" });
  fs.writeFileSync(result.path, result.content);
  ```
* **`unstable_startWorker(options)`**: Starts a programmatically-controlled dev server inside testing suites (modern successor to `unstable_dev`):
  ```typescript
  import { unstable_startWorker } from "wrangler";
  const worker = await unstable_startWorker({ config: "wrangler.json" });
  const res = await worker.fetch("http://example.com");
  await worker.dispose();
  ```
* **`getPlatformProxy(options)`**: Emulates local KV, R2, D1, and Durable Object bindings in a Node.js process:
  ```typescript
  import { getPlatformProxy } from "wrangler";
  const { env, dispose } = await getPlatformProxy();
  console.log(env.MY_ENV_VAR);
  await dispose();
  ```

---

## 🐍 6. Cloudflare Python Systems SDK
> Detailed source guide: [cloudflare-python-sdk-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-python-sdk-docs.md)

The Python API library provides fully-typed access to all Cloudflare REST endpoints, generated via Stainless.

### Synchronous & Asynchronous Usage
The SDK exports both standard and async clients powered by `httpx` and `aiohttp`:

```python
import os
from cloudflare import Cloudflare

client = Cloudflare(api_token=os.environ.get("CLOUDFLARE_API_TOKEN"))
zone = client.zones.create(
    account={"id": "023e105f4ecef8ad9ca31a8372d0c353"},
    name="example.com",
    type="full"
)
```

For asynchronous execution (e.g. using `aiohttp` for high concurrency):
```python
from cloudflare import AsyncCloudflare, DefaultAioHttpClient

async with AsyncCloudflare(http_client=DefaultAioHttpClient()) as client:
    zone = await client.zones.create(
        account={"id": "023e105f4ecef8ad9ca31a8372d0c353"},
        name="example.com"
    )
```

### Auto-Pagination & Lists
Iterating through resources handles paging in the background automatically:
```python
# Automatically fetches successive pages as needed
for account in client.accounts.list():
    print(account.name)
```

### API Error Handling

| HTTP Code | Raised SDK Exception |
| :--- | :--- |
| **400** | `BadRequestError` |
| **401** | `AuthenticationError` |
| **403** | `PermissionDeniedError` |
| **404** | `NotFoundError` |
| **429** | `RateLimitError` |
| **$\ge$ 500** | `InternalServerError` |
| **Timeout** | `APITimeoutError` |

*Note: The SDK automatically retries failed requests twice (exponential backoff) for Connection errors, HTTP 408, 409, 429, and $\ge$ 500.*

---

## 📝 7. Cloudflare Docs for Agents Standard
> Detailed source guide: [docs-for-agents.md](file:///Users/williammeldman/Desktop/openrouter-tui/docs-for-agents.md)

Cloudflare documentation publishes content in highly structured, lightweight Markdown formats specifically optimized for AI LLM context windows to minimize token usage.

### Fetching Agent-Optimized Markdown
* **Append `/index.md`**: Add `index.md` to any product page URL:
  `https://developers.cloudflare.com/workers/get-started/index.md`
* **Send Header Request**: Send requests with an `Accept: text/markdown` header:
  ```bash
  curl "https://developers.cloudflare.com/workers/get-started/" \
    -H "Accept: text/markdown"
  ```
  *Note: The response will return an `x-markdown-tokens` header indicating the exact token weight of the document.*
* **Site-Wide Index Directory**: Fetch site-wide indices complying with the `llms.txt` standard:
  * `/llms.txt` — Map of all products and links.
  * `/llms-full.txt` — Full combined documentation corpus for offline indexing and RAG vectorization.

---

### Verification and System Integrity
* **Signature**: *TIMMY V2.0 System Directory finalized by William Meldman • Core Integrity Shields Verified.*
* All workspace links verified to match native file scopes. Ready for local compilation.

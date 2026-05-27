# 🤖 CLOUDFLARE STATEFUL AGENTS & MCP SWARM DIRECTORY
### TIMMY Multi-Agent Console Reference Guide • © 2026 William Meldman
*Creator Attribution Shield Active • Verified Edge & Swarm Systems Architecture*

---

Welcome to the specialized developer reference directory focusing exclusively on **Cloudflare Stateful Agents (Agents SDK / Durable Objects)** and the **Model Context Protocol (MCP) Swarm Ecosystem**. This document compiles, organizes, and indexes the precise API signatures, database schemas, command syntaxes, and architectural patterns required to build resilient edge-native multi-agent networks.

Use this directory to reference state management, RPC interfaces, remote tools execution, and AI orchestration.

---

## 🗺️ Specialized Document Map

| Technology Axis | Source Documentation File | Core Target Subject Matter |
| :--- | :--- | :--- |
| **Comprehensive Index** | [cloudflare_reference_directory.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare_reference_directory.md) | Platform-wide reference map including Wrangler, Flags, & Python. |
| **Durable AI Agents** | [cloudflare-agent-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-agent-docs.md) | Stateful coordination, SQLite persistence, and react lifecycle. |
| **Contextual Skills** | [cloudflare-agent-skills.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-agent-skills.md) | Auto-loading triggers, Cursor rules, and `/cloudflare:*` slash commands. |
| **Swarm Templates** | [cloudflare-agent-templates-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-agent-templates-docs.md) | Starter boilerplates (durable-chat, multiplayer-globe, workflows). |
| **Remote MCP Servers** | [cloudflare-mcp-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-mcp-docs.md) | Code Mode server (`mcp.cloudflare.com`) & domain-specific endpoints. |

---

## 🤖 1. Cloudflare Agents SDK & Durable Objects
> Detailed source guide: [cloudflare-agent-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-agent-docs.md)

The Cloudflare Agents SDK allows you to build stateful, persistent AI applications by extending Durable Objects with co-located edge SQLite databases.

### Core Class Structure & API Imports
The primary class imports and declaration syntaxes require extending `Agent` or `AIChatAgent`:

```typescript
import { Agent, callable } from "agents";

export interface ChatState {
  history: Array<{ role: string; content: string }>;
  initialized: boolean;
}

export class ChatSwarmAgent extends Agent<Env, ChatState> {
  // SQLite persistence automatically mounts state under this.state
  initialState: ChatState = { history: [], initialized: false };

  // RPC method exposed to frontend clients
  @callable()
  async getHistoryLength() {
    return this.state.history.length;
  }

  // Mutation requires this.setState, never direct mutation of this.state
  @callable()
  async saveMessage(role: "user" | "assistant", content: string) {
    this.setState({
      history: [...this.state.history, { role, content }]
    });
  }
}
```

### Agent Server-Side Routing
Wire up the `routeAgentRequest` middleware at the Worker's entry point to capture incoming WebSocket upgrades and HTTP queries:

* **Plain Workers routing**:
  ```typescript
  import { routeAgentRequest } from "agents";
  export { ChatSwarmAgent } from "./agents/chat";

  export default {
    async fetch(request: Request, env: Env): Promise<Response> {
      // routeAgentRequest automatically manages websocket handshakes
      const agentResponse = await routeAgentRequest(request, env);
      if (agentResponse) return agentResponse;

      return new Response("Not found", { status: 404 });
    }
  }
  ```
* **Hono Framework routing**:
  Use `hono-agents` middleware:
  ```typescript
  import { Hono } from "hono";
  import { agentsMiddleware } from "hono-agents";
  export { ChatSwarmAgent } from "./agents/chat";

  const app = new Hono<{ Bindings: Env }>();
  app.use("*", agentsMiddleware());
  export default app;
  ```

### Stateful Durable SQLite Migrations
Every agent class utilizing state persistence must have active Durable Object class bindings and migrations in `wrangler.jsonc` to set up SQLite engines:

```json
{
  "durable_objects": {
    "bindings": [
      {
        "name": "ChatSwarmAgent",
        "class_name": "ChatSwarmAgent"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["ChatSwarmAgent"]
    }
  ]
}
```

---

## ⚡ 2. Chat Agents, Client SDKs, & Streaming
> Detailed source guide: [cloudflare-agent-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-agent-docs.md)

AI Chat Agents stream responses natively over WebSockets, persisting thread context and supporting edge/browser tools execution.

### Creating a Streaming AI Chat Agent (`AIChatAgent`)
Leverage the `@cloudflare/ai-chat` package with Workers AI (e.g. using `llama-4-scout`):

```typescript
import { AIChatAgent } from "@cloudflare/ai-chat";
import { createWorkersAI } from "workers-ai-provider";
import { streamText, tool } from "ai";
import { z } from "zod";

export class StreamingAgent extends AIChatAgent {
  async onChatMessage() {
    const workersai = createWorkersAI({ binding: this.env.AI });

    const result = streamText({
      model: workersai("@cf/meta/llama-4-scout-17b-16e-instruct"),
      messages: this.messages,
      tools: {
        getWeather: tool({
          description: "Gets the weather on the server",
          inputSchema: z.object({ city: z.string() }),
          execute: async ({ city }) => ({ temperature: 22, condition: "sunny" })
        }),
        getBrowserTimezone: tool({
          description: "Runs on the client browser",
          inputSchema: z.object({})
        })
      }
    });
    return result.toUIMessageStreamResponse();
  }
}
```

### Client Frontend Connections
* **React hook connection (`useAgentChat`)**:
  ```typescript
  import { useAgent } from "agents/react";
  import { useAgentChat } from "@cloudflare/ai-chat/react";

  const agent = useAgent({ agent: "StreamingAgent" });
  const { messages, sendMessage, status } = useAgentChat({
    agent,
    onToolCall: async ({ toolCall, addToolOutput }) => {
      if (toolCall.toolName === "getBrowserTimezone") {
        addToolOutput({
          toolCallId: toolCall.toolCallId,
          output: { tz: Intl.DateTimeFormat().resolvedOptions().timeZone }
        });
      }
    }
  });
  ```
* **Vanilla JavaScript (`AgentClient`)**:
  ```typescript
  import { AgentClient } from "agents/client";

  const client = new AgentClient({
    agent: "StreamingAgent",
    name: "user-session-123",
    onStateUpdate: (state) => console.log("State updated:", state)
  });
  client.call("saveMessage", { role: "user", content: "hello" });
  ```

---

## ☁️ 3. Cloudflare MCP Server Ecosystem
> Detailed source guide: [cloudflare-mcp-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-mcp-docs.md)

Model Context Protocol (MCP) is the standard for connecting LLMs directly to account APIs and developer analytics.

### Code Mode vs. Domain-Specific Servers
Cloudflare provides two distinct remote server categories:

#### A. Code Mode Server (`https://mcp.cloudflare.com/mcp`)
Exposes the entire **2,500+ endpoint** Cloudflare API using only **~1,000 tokens**. The API spec remains on the remote server, and the agent executes JS scripts against isolated edge sandbox containers.
* **Available tools**:
  * `search`: Searches `spec.paths` for specific endpoints.
  * `execute`: Writes code using `cloudflare.request()` to trigger the API.
* **Execution flow example**:
  ```javascript
  execute({
    code: `async () => {
      const res = await cloudflare.request({
        method: "GET",
        path: "/accounts/${accountId}/workers/scripts"
      });
      return res.result;
    }`
  });
  ```

#### B. Domain-Specific Curated Servers (`*.mcp.cloudflare.com`)
Ideal when you need purpose-built, strictly-typed tool definitions for isolated Cloudflare product sectors:
* **Bindings server**: `https://bindings.mcp.cloudflare.com/mcp` (KV, D1, R2 primitives)
* **Observability server**: `https://observability.mcp.cloudflare.com/mcp` (Exceptions, real-time analytics)
* **Radar server**: `https://radar.mcp.cloudflare.com/mcp` (Global traffic trends, IP scans)
* **Docs server**: `https://docs.mcp.cloudflare.com/mcp` (Vector documentation context search)

### Troubleshooting Context Overflows
* **Symptoms**: `Claude's response was interrupted...` or sudden thread collapse.
* **Remedies**:
  1. Observability and bindings servers output high-density JSON. Break large queries into narrow, sequential requests.
  2. If using domain servers concurrently with another Code Mode proxy, avoid overlap. If needed, disable code mode by appending `?codemode=false` to register standard endpoint schemas (increases cost to ~244k tokens).

---

## 🧠 4. Contextual Agent Skills Plugin Architecture
> Detailed source guide: [cloudflare-agent-skills.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-agent-skills.md)

Agent Skills are instructions the agent loads dynamically to optimize platform deployments.

### Active Trigger Domains
* **`agents-sdk`**: Building stateful websocket, RPC callables, and alarm triggers.
* **`wrangler`**: Command structures for KV, R2, D1, queues, workflows, and secret stores.
* **`durable-objects`**: Managing class binds, SQLite states, and testing with Vitest.
* **`sandbox-sdk`**: Isolation code execution inside Firecracker microVMs.
* **`web-perf`**: Captures FCP, LCP, INP, CLS Core Web Vitals via DevTools.

### Custom Console Slash Commands
* **/cloudflare:build-agent** — Spawns the programmatic agent builder loop.
* **/cloudflare:build-mcp** — Initializes remote tool deployments.

---

## 🏭 5. Systems Integration & Swarm Templates
> Detailed source guide: [cloudflare-agent-templates-docs.md](file:///Users/williammeldman/Desktop/openrouter-tui/cloudflare-agent-templates-docs.md)

Use template repositories to immediately scaffold Edge-native swarm infrastructure.

### Starter Project Commands
Start projects locally using `npx create cloudflare@latest --template=cloudflare/templates/<template-name>`:

* **`durable-chat-template`**: Scaffolds WebSocket chat clients, PartyKit coordinators, and DO handlers.
* **`multiplayer-globe-template`**: Tracks geospatial coordinates of site visitors in real-time.
* **`workflows-starter-template`**: Evaluates multi-step workflows with resumable execution.
* **`llm-chat-app-template`**: Connects Workers AI model endpoints directly to static React UI layouts.
* **`postgres-hyperdrive-template`**: Manages low-latency pooled connections to external PostgreSQL databases.

---

### Systems Verification Check
* **Developer Notice**: *TIMMY V2.0 Swarm and MCP reference directory successfully registered. Full typings generated.*
* Clickable file links fully verified. Complete systems integrity maintained.

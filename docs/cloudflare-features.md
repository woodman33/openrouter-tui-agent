# Cloudflare Features Integration Architecture

This document outlines the Systems Architecture for integrating the **Cloudflare Developer Platform** into the **OpenRouter TUI & Rive Animation Framework**. By combining local high-performance terminal rendering with Cloudflare's globally distributed serverless edge infrastructure, we elevate the TUI from a single-machine script to a highly collaborative, secure, and resilient edge-connected agent platform.

---

## 1. Executive Summary

The OpenRouter TUI integrates with Cloudflare to achieve three primary goals:
1. **Secure Execution Sandbox**: Enable the agent to run and test generated code in secure, isolated edge microVMs using the **Cloudflare Sandbox SDK**.
2. **Stateful Edge Orchestration**: Sync conversation state, model configurations, and Rive triggers across multiple terminal clients using **Durable Objects** and the **Cloudflare Agents SDK**.
3. **Advanced Tooling & Delivery**: Route agent workflows through **Workers AI** (for hybrid/fallback inference), **Email Workers** (for offline email-driven prompts), and **Pages + Page Functions** (for a securely hosted Rive companion window with middleware chaining).

```
 ┌────────────────────────────────────────────────────────┐
 │                    React Ink TUI                       │
 │      (Local Desktop Terminal - Kitty/iTerm2/Sixel)     │
 └──────────────────────────┬─────────────────────────────┘
                            │ WebSocket / HTTPS
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │            Cloudflare Workers Edge Gateway             │
 ├────────────────────────────────────────────────────────┤
 │  ┌──────────────────────────────────────────────────┐  │
 │  │      Cloudflare Agents SDK (Durable Objects)     │  │
 │  │  - Holds active conversation SQLite state        │  │
 │  │  - Manages multi-agent routing (Swarm)           │  │
 │  │  - Dispatches Rive triggers via WebSocket        │  │
 │  └──────┬──────────────────────┬─────────────┬──────┘  │
 │         │                      │             │         │
 │         ▼                      ▼             ▼         │
 │  ┌──────────────┐        ┌──────────┐  ┌────────────┐  │
 │  │ Sandbox SDK  │        │    D1    │  │ Workers AI │  │
 │  │ (Firecracker)│        │ (SQLite) │  │ (Fallback) │  │
 │  └──────────────┘        └──────────┘  └────────────┘  │
 └────────────────────────────────────────────────────────┘
```

---

## 2. Deep Dive: Key Cloudflare Integrations

### 2.1 Cloudflare Sandbox SDK (Secure Code Execution)
An agentic TUI capable of writing and reviewing code must have a safe way to *run* and *verify* that code. Running code locally risks user machine security. We integrate the **Cloudflare Sandbox SDK** to spawn ephemeral, secure Firecracker microVMs on the edge.

- **How it Works**: When the OpenRouter agent generates or modifies code (e.g., in `Code Review` mode), it uses the `run_code_sandbox` tool.
- **Wrangler Configuration**:
  ```jsonc
  // wrangler.jsonc
  {
    "name": "openrouter-tui-backend",
    "compatibility_date": "2024-12-01",
    "sandbox": {
      "binding": "Sandbox"
    }
  }
  ```
- **Tool Implementation Schema**:
  ```typescript
  import { tool } from '@openrouter/sdk';
  import { z } from 'zod';

  export const sandboxTool = tool({
    name: 'execute_sandbox_code',
    description: 'Safely execute Python/JavaScript code in an isolated Cloudflare Sandbox microVM',
    inputSchema: z.object({
      language: z.enum(['python', 'javascript', 'typescript']),
      code: z.string().describe('The code block to execute'),
      files: z.array(z.object({
        path: z.string(),
        content: z.string()
      })).optional()
    }),
    execute: async ({ language, code, files }, context) => {
      const env = context.env; // Bound through Worker Context
      const sandbox = await env.Sandbox.create();
      
      // Write optional files to sandbox
      if (files) {
        for (const file of files) {
          await sandbox.writeFile(file.path, file.content);
        }
      }

      // Execute code
      const result = await sandbox.runCode(code, { language });
      await sandbox.destroy(); // Cleanup

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode
      };
    }
  });
  ```

---

### 2.2 Cloudflare Agents SDK & Durable Objects (State Sync & Routing)
Instead of running the conversation loop strictly inside the local memory of the CLI, we move the **inner loop** onto a stateful **Cloudflare Agents SDK** instance backed by **Durable Objects (SQLite)**.

- **Benefits**:
  - **Session Persistence**: If your terminal crashes, closes, or loses connection, the agent state and history are safely preserved at the edge.
  - **Shared Mascot State**: The Rive Companion Web Window connects directly to the exact same Durable Object over a WebSocket, receiving real-time state triggers (`thinking`, `talking`, `idle`, `success`, `error`) simultaneously with the TUI.
  - **Multi-Agent Swarm Orchestration**: The Agent DO acts as an orchestrator, spinning up and delegating tasks to sub-agents (e.g., Code Reviewer or Researcher) dynamically on-edge.

- **Worker Agent Implementation**:
  ```typescript
  import { Agent, callable } from "agents";

  export class TUIAgent extends Agent<Env, State> {
    // Durable Object initial state
    initialState = { messages: [], totalCost: 0 };

    @callable()
    async getHistory() {
      return this.state.messages;
    }

    @callable({ streaming: true })
    async *sendMessage(prompt: string) {
      // Append user message
      this.state.messages.push({ role: 'user', content: prompt });
      this.broadcast({ type: 'thinking:start' });

      // Run OpenRouter call via Edge
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-5-sonnet",
          messages: this.state.messages,
          stream: true
        })
      });

      this.broadcast({ type: 'stream:start' });
      let assistantText = "";
      // Handle edge stream chunks and yield to TUI
      // ... yield chunk ...
      
      this.state.messages.push({ role: 'assistant', content: assistantText });
      this.broadcast({ type: 'stream:end', fullText: assistantText });
    }
  }
  ```

---

### 2.3 Cloudflare MCP (Model Context Protocol) Integration
We expose a dedicated Cloudflare remote MCP server with two primary tools to bridge the local TUI with cloud management, capped at **200 API calls** per session to optimize costs and prevent runaway loops.

1. **`list_workers_and_logs`** — Fetches active Cloudflare Workers and streams their deployment status, bindings, and real-time observability logs directly into the TUI Dashboard.
2. **`deploy_worker_from_sandbox`** — Deploys code validated inside the Sandbox SDK to a live Cloudflare Worker via Wrangler API integration, enabling instant edge publishing from the TUI.

- **API Calling Constraints**:
  To protect against infinite agent-loop calling, we register a token-bucket decorator on the MCP endpoints:
  ```typescript
  const API_CALL_LIMIT = 200;
  let apiCallCount = 0;

  function countApiCall() {
    apiCallCount++;
    if (apiCallCount > API_CALL_LIMIT) {
      throw new Error(`API Call Limit of ${API_CALL_LIMIT} exceeded for this session.`);
    }
  }
  ```

---

### 2.4 Cloudflare Email Workers (Offline Prompt Trigger)
Users can converse with their OpenRouter TUI agents asynchronously by sending an email. Cloudflare Email Routing directs messages to an **Email Worker** which triggers the agent DO to run the query and email back the completed Markdown transcript.

- **Workflow**:
  1. User emails `agent-session-123@yourdomain.com`.
  2. Cloudflare Email Worker intercepts, parses the subject/body, and fetches the matching Durable Object instance (`session-123`).
  3. The DO calls OpenRouter with the prompt.
  4. The DO compiles the response and uses **Mailgun/SendGrid** or Cloudflare's outbound email sending capability to reply.

---

### 2.5 Cloudflare Pages & Page Functions (Hosted Rive Companion)
The **Rive Companion Web Window** is fully compiled and hosted on **Cloudflare Pages**. 

- **Page Functions (Edge Middleware)**:
  We use Page Functions as a secure routing and middleware gateway:
  - **Chaining Middleware**: Implements JWT authentication, rate limiting, and request headers injection before establishing the WebSocket connection to the Durable Object back-end.
  - **Vite Bundler**: The companion client is bundled using Vite and deployed directly to Pages with `wrangler pages deploy`.

---

## 3. Systems Integration Matrix

| Feature | Primary Cloudflare Technology | TUI Integration Vector | Performance / Speed Advantage |
|---------|-------------------------------|------------------------|-------------------------------|
| **Code Execution** | Sandbox SDK (Firecracker) | `src/agent/tools.ts` (`execute_sandbox_code`) | Ephemeral microVMs boot in <150ms; runs completely off-machine |
| **Agent State** | Agents SDK + Durable Objects | WebSocket Stream Connection to Edge | Persistent state, instant sync to TUI and Companion |
| **Companion Web** | Pages + Page Functions | HTTP/Vite deployment + Middleware | Globally distributed static assets with edge middleware |
| **Email Loop** | Email Workers | Worker Email Hook Listener | Off-terminal async workflows, zero local CPU consumption |
| **Local Inference** | Workers AI | Dynamic fallback client inside `Agent` | Low-latency inference fallback when OpenRouter keys fail |
| **Observability** | Cloudflare Observability MCP | TUI `DashboardPanel.tsx` | Real-time structured edge log streaming over WebSocket |

---

## 4. Conclusion & Next Steps

Integrating Cloudflare turns the OpenRouter TUI into a truly edge-native, stateful assistant platform. Local Rive terminal animations stay lightweight and responsive because heavy computation (untrusted code execution, persistent agent state tracking, multi-agent swarms, companion window sync) is securely offloaded to Cloudflare's high-speed global edge network.

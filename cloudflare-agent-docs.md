---
title: Add to existing project
description: Add the Agents SDK to an existing Cloudflare Workers project with state management and real-time connections.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/agents/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Add to existing project

This guide shows how to add agents to an existing Cloudflare Workers project. If you are starting fresh, refer to [Building a chat agent](https://developers.cloudflare.com/agents/getting-started/build-a-chat-agent/) instead.

## Prerequisites

* An existing Cloudflare Workers project with a Wrangler configuration file
* Node.js 18 or newer

## 1\. Install the package

 npm  yarn  pnpm  bun 

```
npm i agents
```

```
yarn add agents
```

```
pnpm add agents
```

```
bun add agents
```

For React applications, no additional packages are needed — React bindings are included.

For Hono applications:

 npm  yarn  pnpm  bun 

```
npm i agents hono-agents
```

```
yarn add agents hono-agents
```

```
pnpm add agents hono-agents
```

```
bun add agents hono-agents
```

## 2\. Create an Agent

Create a new file for your agent (for example, `src/agents/counter.ts`):

* [  JavaScript ](#tab-panel-4346)
* [  TypeScript ](#tab-panel-4347)

JavaScript

```

import { Agent, callable } from "agents";


export class CounterAgent extends Agent {

  initialState = { count: 0 };


  @callable()

  increment() {

    this.setState({ count: this.state.count + 1 });

    return this.state.count;

  }


  @callable()

  decrement() {

    this.setState({ count: this.state.count - 1 });

    return this.state.count;

  }

}


```

TypeScript

```

import { Agent, callable } from "agents";


export type CounterState = {

  count: number;

};


export class CounterAgent extends Agent<Env, CounterState> {

  initialState: CounterState = { count: 0 };


  @callable()

  increment() {

    this.setState({ count: this.state.count + 1 });

    return this.state.count;

  }


  @callable()

  decrement() {

    this.setState({ count: this.state.count - 1 });

    return this.state.count;

  }

}


```

## 3\. Update Wrangler configuration

Add the Durable Object binding and migration:

* [  wrangler.jsonc ](#tab-panel-4336)
* [  wrangler.toml ](#tab-panel-4337)

JSONC

```

{

  "name": "my-existing-project",

  "main": "src/index.ts",

  // Set this to today's date

  "compatibility_date": "2026-05-26",

  "compatibility_flags": ["nodejs_compat"],


  "durable_objects": {

    "bindings": [

      {

        "name": "CounterAgent",

        "class_name": "CounterAgent",

      },

    ],

  },


  "migrations": [

    {

      "tag": "v1",

      "new_sqlite_classes": ["CounterAgent"],

    },

  ],

}


```

TOML

```

name = "my-existing-project"

main = "src/index.ts"

# Set this to today's date

compatibility_date = "2026-05-26"

compatibility_flags = [ "nodejs_compat" ]


[[durable_objects.bindings]]

name = "CounterAgent"

class_name = "CounterAgent"


[[migrations]]

tag = "v1"

new_sqlite_classes = [ "CounterAgent" ]


```

**Key points:**

* `name` in bindings becomes the property on `env` (for example, `env.CounterAgent`)
* `class_name` must exactly match your exported class name
* `new_sqlite_classes` enables SQLite storage for state persistence
* `nodejs_compat` flag is required for the agents package

## 4\. Configure TypeScript and Vite

If you use `@callable()` decorators (as in the example above), you need two build configurations.

**tsconfig.json** — extend `agents/tsconfig` (or set `"target": "ES2021"` manually):

```

{

  "extends": "agents/tsconfig"

}


```

If you have an existing `tsconfig.json` with custom settings, you can extend and override:

```

{

  "extends": "agents/tsconfig",

  "compilerOptions": {

    "paths": { "~/*": ["./src/*"] }

  }

}


```

**vite.config.ts** — add the `agents()` plugin (handles TC39 decorator transforms for Vite 8):

* [  JavaScript ](#tab-panel-4340)
* [  TypeScript ](#tab-panel-4341)

JavaScript

```

import agents from "agents/vite";


export default defineConfig({

  plugins: [

    agents(),

    // ... your existing plugins

  ],

});


```

TypeScript

```

import agents from "agents/vite";


export default defineConfig({

  plugins: [

    agents(),

    // ... your existing plugins

  ],

});


```

If your project does not use Vite, the `tsconfig.json` change alone is sufficient — your bundler must support TC39 decorators (stage 3, version `2023-11`).

For more details, refer to the [TypeScript configuration](https://developers.cloudflare.com/agents/api-reference/configuration/#typescript-configuration) and [Vite configuration](https://developers.cloudflare.com/agents/api-reference/configuration/#vite-configuration) reference.

## 5\. Export the Agent class

Your agent class must be exported from your main entry point. Update your `src/index.ts`:

* [  JavaScript ](#tab-panel-4344)
* [  TypeScript ](#tab-panel-4345)

JavaScript

```

// Export the agent class (required for Durable Objects)

export { CounterAgent } from "./agents/counter";


// Your existing exports...

export default {

  // ...

};


```

TypeScript

```

// Export the agent class (required for Durable Objects)

export { CounterAgent } from "./agents/counter";


// Your existing exports...

export default {

  // ...

} satisfies ExportedHandler<Env>;


```

## 6\. Wire up routing

Choose the approach that matches your project structure:

### Plain Workers (fetch handler)

* [  JavaScript ](#tab-panel-4352)
* [  TypeScript ](#tab-panel-4353)

JavaScript

```

import { routeAgentRequest } from "agents";

export { CounterAgent } from "./agents/counter";


export default {

  async fetch(request, env, ctx) {

    // Try agent routing first

    const agentResponse = await routeAgentRequest(request, env);

    if (agentResponse) return agentResponse;


    // Your existing routing logic

    const url = new URL(request.url);

    if (url.pathname === "/api/hello") {

      return Response.json({ message: "Hello!" });

    }


    return new Response("Not found", { status: 404 });

  },

};


```

TypeScript

```

import { routeAgentRequest } from "agents";

export { CounterAgent } from "./agents/counter";


export default {

  async fetch(request: Request, env: Env, ctx: ExecutionContext) {

    // Try agent routing first

    const agentResponse = await routeAgentRequest(request, env);

    if (agentResponse) return agentResponse;


    // Your existing routing logic

    const url = new URL(request.url);

    if (url.pathname === "/api/hello") {

      return Response.json({ message: "Hello!" });

    }


    return new Response("Not found", { status: 404 });

  },

} satisfies ExportedHandler<Env>;


```

### Hono

* [  JavaScript ](#tab-panel-4348)
* [  TypeScript ](#tab-panel-4349)

JavaScript

```

import { Hono } from "hono";

import { agentsMiddleware } from "hono-agents";

export { CounterAgent } from "./agents/counter";


const app = new Hono();


// Add agents middleware - handles WebSocket upgrades and agent HTTP requests

app.use("*", agentsMiddleware());


// Your existing routes continue to work

app.get("/api/hello", (c) => c.json({ message: "Hello!" }));


export default app;


```

TypeScript

```

import { Hono } from "hono";

import { agentsMiddleware } from "hono-agents";

export { CounterAgent } from "./agents/counter";


const app = new Hono<{ Bindings: Env }>();


// Add agents middleware - handles WebSocket upgrades and agent HTTP requests

app.use("*", agentsMiddleware());


// Your existing routes continue to work

app.get("/api/hello", (c) => c.json({ message: "Hello!" }));


export default app;


```

### With static assets

If you are serving static assets alongside agents, static assets are served first by default. Your Worker code only runs for paths that do not match a static asset:

* [  JavaScript ](#tab-panel-4354)
* [  TypeScript ](#tab-panel-4355)

JavaScript

```

import { routeAgentRequest } from "agents";

export { CounterAgent } from "./agents/counter";


export default {

  async fetch(request, env, ctx) {

    // Static assets are served automatically before this runs

    // This only handles non-asset requests


    // Route to agents

    const agentResponse = await routeAgentRequest(request, env);

    if (agentResponse) return agentResponse;


    return new Response("Not found", { status: 404 });

  },

};


```

TypeScript

```

import { routeAgentRequest } from "agents";

export { CounterAgent } from "./agents/counter";


export default {

  async fetch(request: Request, env: Env, ctx: ExecutionContext) {

    // Static assets are served automatically before this runs

    // This only handles non-asset requests


    // Route to agents

    const agentResponse = await routeAgentRequest(request, env);

    if (agentResponse) return agentResponse;


    return new Response("Not found", { status: 404 });

  },

} satisfies ExportedHandler<Env>;


```

Configure assets in the Wrangler configuration file:

* [  wrangler.jsonc ](#tab-panel-4334)
* [  wrangler.toml ](#tab-panel-4335)

JSONC

```

{

  "assets": {

    "directory": "./public",

  },

}


```

TOML

```

[assets]

directory = "./public"


```

## 7\. Generate TypeScript types

Do not hand-write your `Env` interface. Run [wrangler types](https://developers.cloudflare.com/workers/wrangler/commands/general/#types) to generate a type definition file that matches your Wrangler configuration. This catches mismatches between your config and code at compile time instead of at deploy time.

Re-run `wrangler types` whenever you add or rename a binding.

Terminal window

```

npx wrangler types


```

This creates a type definition file with all your bindings typed, including your agent Durable Object namespaces. The `Agent` class defaults to using the generated `Env` type, so you do not need to pass it as a type parameter — `extends Agent` is sufficient unless you need to pass a second type parameter for state (for example, `Agent<Env, CounterState>`).

Refer to [Configuration](https://developers.cloudflare.com/agents/api-reference/configuration/#generating-types) for more details on type generation.

## 8\. Connect from the frontend

### React

* [  JavaScript ](#tab-panel-4362)
* [  TypeScript ](#tab-panel-4363)

JavaScript

```

import { useState } from "react";

import { useAgent } from "agents/react";


function CounterWidget() {

  const [count, setCount] = useState(0);


  const agent = useAgent({

    agent: "CounterAgent",

    onStateUpdate: (state) => setCount(state.count),

  });


  return (

    <>

      {count}

      <button onClick={() => agent.stub.increment()}>+</button>

      <button onClick={() => agent.stub.decrement()}>-</button>

    </>

  );

}


```

TypeScript

```

import { useState } from "react";

import { useAgent } from "agents/react";

import type { CounterAgent, CounterState } from "./agents/counter";


function CounterWidget() {

  const [count, setCount] = useState(0);


  const agent = useAgent<CounterAgent, CounterState>({

    agent: "CounterAgent",

    onStateUpdate: (state) => setCount(state.count),

  });


  return (

    <>

      {count}

      <button onClick={() => agent.stub.increment()}>+</button>

      <button onClick={() => agent.stub.decrement()}>-</button>

    </>

  );

}


```

### Vanilla JavaScript

* [  JavaScript ](#tab-panel-4358)
* [  TypeScript ](#tab-panel-4359)

JavaScript

```

import { AgentClient } from "agents/client";


const agent = new AgentClient({

  agent: "CounterAgent",

  name: "user-123", // Optional: unique instance name

  onStateUpdate: (state) => {

    document.getElementById("count").textContent = state.count;

  },

});


// Call methods

document.getElementById("increment").onclick = () => agent.call("increment");


```

TypeScript

```

import { AgentClient } from "agents/client";


const agent = new AgentClient({

  agent: "CounterAgent",

  name: "user-123", // Optional: unique instance name

  onStateUpdate: (state) => {

    document.getElementById("count").textContent = state.count;

  },

});


// Call methods

document.getElementById("increment").onclick = () => agent.call("increment");


```

## Adding multiple agents

Add more agents by extending the configuration:

* [  JavaScript ](#tab-panel-4356)
* [  TypeScript ](#tab-panel-4357)

JavaScript

```

// src/agents/chat.ts

export class Chat extends Agent {

  // ...

}


// src/agents/scheduler.ts

export class Scheduler extends Agent {

  // ...

}


```

TypeScript

```

// src/agents/chat.ts

export class Chat extends Agent {

  // ...

}


// src/agents/scheduler.ts

export class Scheduler extends Agent {

  // ...

}


```

Update the Wrangler configuration file:

* [  wrangler.jsonc ](#tab-panel-4342)
* [  wrangler.toml ](#tab-panel-4343)

JSONC

```

{

  "durable_objects": {

    "bindings": [

      { "name": "CounterAgent", "class_name": "CounterAgent" },

      { "name": "Chat", "class_name": "Chat" },

      { "name": "Scheduler", "class_name": "Scheduler" },

    ],

  },

  "migrations": [

    {

      "tag": "v1",

      "new_sqlite_classes": ["CounterAgent", "Chat", "Scheduler"],

    },

  ],

}


```

TOML

```

[[durable_objects.bindings]]

name = "CounterAgent"

class_name = "CounterAgent"


[[durable_objects.bindings]]

name = "Chat"

class_name = "Chat"


[[durable_objects.bindings]]

name = "Scheduler"

class_name = "Scheduler"


[[migrations]]

tag = "v1"

new_sqlite_classes = [ "CounterAgent", "Chat", "Scheduler" ]


```

Export all agents from your entry point:

* [  JavaScript ](#tab-panel-4350)
* [  TypeScript ](#tab-panel-4351)

JavaScript

```

export { CounterAgent } from "./agents/counter";

export { Chat } from "./agents/chat";

export { Scheduler } from "./agents/scheduler";


```

TypeScript

```

export { CounterAgent } from "./agents/counter";

export { Chat } from "./agents/chat";

export { Scheduler } from "./agents/scheduler";


```

## Common integration patterns

### Agents behind authentication

Check auth before routing to agents:

* [  JavaScript ](#tab-panel-4366)
* [  TypeScript ](#tab-panel-4367)

JavaScript

```

export default {

  async fetch(request, env) {

    // Check auth for agent routes

    if (request.url.includes("/agents/")) {

      const authResult = await checkAuth(request, env);

      if (!authResult.valid) {

        return new Response("Unauthorized", { status: 401 });

      }

    }


    const agentResponse = await routeAgentRequest(request, env);

    if (agentResponse) return agentResponse;


    // ... rest of routing

  },

};


```

TypeScript

```

export default {

  async fetch(request: Request, env: Env) {

    // Check auth for agent routes

    if (request.url.includes("/agents/")) {

      const authResult = await checkAuth(request, env);

      if (!authResult.valid) {

        return new Response("Unauthorized", { status: 401 });

      }

    }


    const agentResponse = await routeAgentRequest(request, env);

    if (agentResponse) return agentResponse;


    // ... rest of routing

  },

} satisfies ExportedHandler<Env>;


```

### Custom agent path prefix

By default, agents are routed at `/agents/{agent-name}/{instance-name}`. You can customize this:

* [  JavaScript ](#tab-panel-4360)
* [  TypeScript ](#tab-panel-4361)

JavaScript

```

import { routeAgentRequest } from "agents";


const agentResponse = await routeAgentRequest(request, env, {

  prefix: "/api/agents", // Now routes at /api/agents/{agent-name}/{instance-name}

});


```

TypeScript

```

import { routeAgentRequest } from "agents";


const agentResponse = await routeAgentRequest(request, env, {

  prefix: "/api/agents", // Now routes at /api/agents/{agent-name}/{instance-name}

});


```

Refer to [Routing](https://developers.cloudflare.com/agents/api-reference/routing/) for more options including CORS, custom instance naming, and location hints.

### Accessing agents from server code

You can interact with agents directly from your Worker code:

* [  JavaScript ](#tab-panel-4368)
* [  TypeScript ](#tab-panel-4369)

JavaScript

```

import { getAgentByName } from "agents";


export default {

  async fetch(request, env) {

    if (request.url.endsWith("/api/increment")) {

      // Get a specific agent instance

      const counter = await getAgentByName(env.CounterAgent, "shared-counter");

      const newCount = await counter.increment();

      return Response.json({ count: newCount });

    }

    // ...

  },

};


```

TypeScript

```

import { getAgentByName } from "agents";


export default {

  async fetch(request: Request, env: Env) {

    if (request.url.endsWith("/api/increment")) {

      // Get a specific agent instance

      const counter = await getAgentByName(env.CounterAgent, "shared-counter");

      const newCount = await counter.increment();

      return Response.json({ count: newCount });

    }

    // ...

  },

} satisfies ExportedHandler<Env>;


```

## Troubleshooting

### Agent not found, or 404 errors

1. **Check the export** \- Agent class must be exported from your main entry point.
2. **Check the binding** \- `class_name` in the Wrangler configuration file must exactly match the exported class name.
3. **Check the route** \- Default route is `/agents/{agent-name}/{instance-name}`.

### No such Durable Object class error

Add the migration to the Wrangler configuration file:

* [  wrangler.jsonc ](#tab-panel-4338)
* [  wrangler.toml ](#tab-panel-4339)

JSONC

```

{

  "migrations": [

    {

      "tag": "v1",

      "new_sqlite_classes": ["YourAgentClass"],

    },

  ],

}


```

TOML

```

[[migrations]]

tag = "v1"

new_sqlite_classes = [ "YourAgentClass" ]


```

### WebSocket connection fails

Ensure your routing passes the response unchanged:

* [  JavaScript ](#tab-panel-4364)
* [  TypeScript ](#tab-panel-4365)

JavaScript

```

// Correct - return the response directly

const agentResponse = await routeAgentRequest(request, env);

if (agentResponse) return agentResponse;


// Wrong - this breaks WebSocket connections

if (agentResponse) return new Response(agentResponse.body);


```

TypeScript

```

// Correct - return the response directly

const agentResponse = await routeAgentRequest(request, env);

if (agentResponse) return agentResponse;


// Wrong - this breaks WebSocket connections

if (agentResponse) return new Response(agentResponse.body);


```

### State not persisting

Check that:

1. You are using `this.setState()`, not mutating `this.state` directly.
2. The agent class is in `new_sqlite_classes` in migrations.
3. You are connecting to the same agent instance name.

## Next steps

[ State management ](https://developers.cloudflare.com/agents/api-reference/store-and-sync-state/) Manage and synchronize agent state. 

[ Schedule tasks ](https://developers.cloudflare.com/agents/api-reference/schedule-tasks/) Background tasks and cron jobs. 

[ Agent class internals ](https://developers.cloudflare.com/agents/concepts/agent-class/) Full lifecycle and methods reference. 

[ Agents API ](https://developers.cloudflare.com/agents/api-reference/agents-api/) Complete API reference for the Agents SDK. 

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/agents/","name":"Agents"}},{"@type":"ListItem","position":3,"item":{"@id":"/agents/getting-started/","name":"Getting started"}},{"@type":"ListItem","position":4,"item":{"@id":"/agents/getting-started/add-to-existing-project/","name":"Add to existing project"}}]}
```
---
title: Testing your Agents
description: Write and run tests for Cloudflare Agents using Vitest and the Workers test pool.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/agents/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Testing your Agents

Because Agents run on Cloudflare Workers and Durable Objects, they can be tested using the same tools and techniques as Workers and Durable Objects.

## Writing and running tests

### Setup

Note

The `agents-starter` template and new Cloudflare Workers projects already include the relevant `vitest` and `@cloudflare/vitest-pool-workers` packages, as well as a valid `vitest.config.js` file.

Before you write your first test, install the necessary packages:

Terminal window

```

npm install vitest@^4.1.0 @cloudflare/vitest-pool-workers --save-dev


```

Ensure that your `vitest.config.js` has the `cloudflareTest` plugin configured:

JavaScript

```

import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

import { defineConfig } from "vitest/config";


export default defineConfig({

  plugins: [

    cloudflareTest({

      wrangler: { configPath: "./wrangler.jsonc" },

    }),

  ],

});


```

### Write a test

Note

Review the [Vitest documentation ↗](https://vitest.dev/) for more information on testing, including the test API reference and advanced testing techniques.

Tests use the `vitest` framework. A basic test suite for your Agent can validate how your Agent responds to requests, but can also unit test your Agent's methods and state.

TypeScript

```

import { env, exports } from "cloudflare:workers";

import {

  createExecutionContext,

  waitOnExecutionContext,

} from "cloudflare:test";

import { describe, it, expect } from "vitest";

import worker from "../src";

import { Env } from "../src";


interface ProvidedEnv extends Env {}


describe("make a request to my Agent", () => {

  // Unit testing approach

  it("responds with state", async () => {

    // Provide a valid URL that your Worker can use to route to your Agent

    // If you are using routeAgentRequest, this will be /agents/:agent/:name

    const request = new Request<unknown, IncomingRequestCfProperties>(

      "http://example.com/agents/my-agent/agent-123",

    );

    const ctx = createExecutionContext();

    const response = await worker.fetch(request, env, ctx);

    await waitOnExecutionContext(ctx);

    expect(await response.json()).toEqual({ hello: "from your agent" });

  });


  it("also responds with state", async () => {

    const request = new Request("http://example.com/agents/my-agent/agent-123");

    const response = await exports.default.fetch(request);

    expect(await response.json()).toEqual({ hello: "from your agent" });

  });

});


```

### Run tests

Running tests is done using the `vitest` CLI:

Terminal window

```

npm run test

# or run vitest directly

npx vitest


```

```

  MyAgent

    ✓ should return a greeting (1 ms)


Test Files  1 passed (1)


```

Review the [documentation on testing](https://developers.cloudflare.com/workers/testing/vitest-integration/write-your-first-test/) for additional examples and test configuration.

## Running Agents locally

You can also run an Agent locally using the `wrangler` CLI:

Terminal window

```

npx wrangler dev


```

```

Your Worker and resources are simulated locally via Miniflare. For more information, see: https://developers.cloudflare.com/workers/testing/local-development.


Your worker has access to the following bindings:

- Durable Objects:

  - MyAgent: MyAgent

  Starting local server...

[wrangler:inf] Ready on http://localhost:53645


```

This spins up a local development server that runs the same runtime as Cloudflare Workers, and allows you to iterate on your Agent's code and test it locally without deploying it.

Visit the [wrangler dev ↗](https://developers.cloudflare.com/workers/wrangler/commands/general/#dev) docs to review the CLI flags and configuration options.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/agents/","name":"Agents"}},{"@type":"ListItem","position":3,"item":{"@id":"/agents/getting-started/","name":"Getting started"}},{"@type":"ListItem","position":4,"item":{"@id":"/agents/getting-started/testing-your-agent/","name":"Testing your Agents"}}]}
```
---
title: Build a chat agent
description: Build a streaming AI chat agent with tools using Workers AI — no API keys required.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/agents/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Build a chat agent

Build a chat agent that streams AI responses, calls server-side tools, executes client-side tools in the browser, and asks for user approval before sensitive actions.

**What you will build:** A chat agent powered by Workers AI with three tool types — automatic, client-side, and approval-gated.

**Time:** \~15 minutes

This tutorial starts from a minimal Hello World Worker so you can see each moving part. If you want a complete starter app with the same core pieces already wired together, start with the [quick start](https://developers.cloudflare.com/agents/getting-started/quick-start/) and then return here to understand how the chat pieces fit together.

**Prerequisites:**

* Node.js 18+
* A Cloudflare account (free tier works)

## 1\. Create the project

Terminal window

```

npm create cloudflare@latest chat-agent


```

Select **"Hello World" Worker** when prompted. Then install the dependencies:

Terminal window

```

cd chat-agent

npm install agents @cloudflare/ai-chat ai workers-ai-provider zod


```

## 2\. Configure Wrangler

Replace your `wrangler.jsonc` with:

* [  wrangler.jsonc ](#tab-panel-4370)
* [  wrangler.toml ](#tab-panel-4371)

JSONC

```

{

  "name": "chat-agent",

  "main": "src/server.ts",

  // Set this to today's date

  "compatibility_date": "2026-05-26",

  "compatibility_flags": ["nodejs_compat"],

  "ai": { "binding": "AI" },

  "durable_objects": {

    "bindings": [{ "name": "ChatAgent", "class_name": "ChatAgent" }],

  },

  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["ChatAgent"] }],

}


```

TOML

```

name = "chat-agent"

main = "src/server.ts"

# Set this to today's date

compatibility_date = "2026-05-26"

compatibility_flags = [ "nodejs_compat" ]


[ai]

binding = "AI"


[[durable_objects.bindings]]

name = "ChatAgent"

class_name = "ChatAgent"


[[migrations]]

tag = "v1"

new_sqlite_classes = [ "ChatAgent" ]


```

Key settings:

* `ai` binds Workers AI — no API key needed
* `durable_objects` registers your chat agent class
* `new_sqlite_classes` enables SQLite storage for message persistence

## 3\. Write the server

Create `src/server.ts`. This is where your agent lives:

* [  JavaScript ](#tab-panel-4372)
* [  TypeScript ](#tab-panel-4373)

JavaScript

```

import { AIChatAgent } from "@cloudflare/ai-chat";

import { routeAgentRequest } from "agents";

import { createWorkersAI } from "workers-ai-provider";

import {

  streamText,

  convertToModelMessages,

  pruneMessages,

  tool,

  stepCountIs,

} from "ai";

import { z } from "zod";


export class ChatAgent extends AIChatAgent {

  async onChatMessage() {

    const workersai = createWorkersAI({ binding: this.env.AI });


    const result = streamText({

      model: workersai("@cf/meta/llama-4-scout-17b-16e-instruct"),

      system:

        "You are a helpful assistant. You can check the weather, " +

        "get the user's timezone, and run calculations.",

      messages: pruneMessages({

        messages: await convertToModelMessages(this.messages),

        toolCalls: "before-last-2-messages",

      }),

      tools: {

        // Server-side tool: runs automatically on the server

        getWeather: tool({

          description: "Get the current weather for a city",

          inputSchema: z.object({

            city: z.string().describe("City name"),

          }),

          execute: async ({ city }) => {

            // Replace with a real weather API in production

            const conditions = ["sunny", "cloudy", "rainy"];

            const temp = Math.floor(Math.random() * 30) + 5;

            return {

              city,

              temperature: temp,

              condition:

                conditions[Math.floor(Math.random() * conditions.length)],

            };

          },

        }),


        // Client-side tool: no execute function — the browser handles it

        getUserTimezone: tool({

          description: "Get the user's timezone from their browser",

          inputSchema: z.object({}),

        }),


        // Approval tool: requires user confirmation before executing

        calculate: tool({

          description:

            "Perform a math calculation with two numbers. " +

            "Requires user approval for large numbers.",

          inputSchema: z.object({

            a: z.number().describe("First number"),

            b: z.number().describe("Second number"),

            operator: z

              .enum(["+", "-", "*", "/", "%"])

              .describe("Arithmetic operator"),

          }),

          needsApproval: async ({ a, b }) =>

            Math.abs(a) > 1000 || Math.abs(b) > 1000,

          execute: async ({ a, b, operator }) => {

            const ops = {

              "+": (x, y) => x + y,

              "-": (x, y) => x - y,

              "*": (x, y) => x * y,

              "/": (x, y) => x / y,

              "%": (x, y) => x % y,

            };

            if (operator === "/" && b === 0) {

              return { error: "Division by zero" };

            }

            return {

              expression: `${a} ${operator} ${b}`,

              result: ops[operator](a, b),

            };

          },

        }),

      },

      stopWhen: stepCountIs(5),

    });


    return result.toUIMessageStreamResponse();

  }

}


export default {

  async fetch(request, env) {

    return (

      (await routeAgentRequest(request, env)) ||

      new Response("Not found", { status: 404 })

    );

  },

};


```

TypeScript

```

import { AIChatAgent } from "@cloudflare/ai-chat";

import { routeAgentRequest } from "agents";

import { createWorkersAI } from "workers-ai-provider";

import {

  streamText,

  convertToModelMessages,

  pruneMessages,

  tool,

  stepCountIs,

} from "ai";

import { z } from "zod";


export class ChatAgent extends AIChatAgent {

  async onChatMessage() {

    const workersai = createWorkersAI({ binding: this.env.AI });


    const result = streamText({

      model: workersai("@cf/meta/llama-4-scout-17b-16e-instruct"),

      system:

        "You are a helpful assistant. You can check the weather, " +

        "get the user's timezone, and run calculations.",

      messages: pruneMessages({

        messages: await convertToModelMessages(this.messages),

        toolCalls: "before-last-2-messages",

      }),

      tools: {

        // Server-side tool: runs automatically on the server

        getWeather: tool({

          description: "Get the current weather for a city",

          inputSchema: z.object({

            city: z.string().describe("City name"),

          }),

          execute: async ({ city }) => {

            // Replace with a real weather API in production

            const conditions = ["sunny", "cloudy", "rainy"];

            const temp = Math.floor(Math.random() * 30) + 5;

            return {

              city,

              temperature: temp,

              condition:

                conditions[Math.floor(Math.random() * conditions.length)],

            };

          },

        }),


        // Client-side tool: no execute function — the browser handles it

        getUserTimezone: tool({

          description: "Get the user's timezone from their browser",

          inputSchema: z.object({}),

        }),


        // Approval tool: requires user confirmation before executing

        calculate: tool({

          description:

            "Perform a math calculation with two numbers. " +

            "Requires user approval for large numbers.",

          inputSchema: z.object({

            a: z.number().describe("First number"),

            b: z.number().describe("Second number"),

            operator: z

              .enum(["+", "-", "*", "/", "%"])

              .describe("Arithmetic operator"),

          }),

          needsApproval: async ({ a, b }) =>

            Math.abs(a) > 1000 || Math.abs(b) > 1000,

          execute: async ({ a, b, operator }) => {

            const ops: Record<string, (x: number, y: number) => number> = {

              "+": (x, y) => x + y,

              "-": (x, y) => x - y,

              "*": (x, y) => x * y,

              "/": (x, y) => x / y,

              "%": (x, y) => x % y,

            };

            if (operator === "/" && b === 0) {

              return { error: "Division by zero" };

            }

            return {

              expression: `${a} ${operator} ${b}`,

              result: ops[operator](a, b),

            };

          },

        }),

      },

      stopWhen: stepCountIs(5),

    });


    return result.toUIMessageStreamResponse();

  }

}


export default {

  async fetch(request: Request, env: Env) {

    return (

      (await routeAgentRequest(request, env)) ||

      new Response("Not found", { status: 404 })

    );

  },

} satisfies ExportedHandler<Env>;


```

### What each tool type does

| Tool            | execute? | needsApproval?      | Behavior                                        |
| --------------- | -------- | ------------------- | ----------------------------------------------- |
| getWeather      | Yes      | No                  | Runs on the server automatically                |
| getUserTimezone | No       | No                  | Sent to the client; browser provides the result |
| calculate       | Yes      | Yes (large numbers) | Pauses for user approval, then runs on server   |

## 4\. Write the client

Create `src/client.tsx`:

* [  JavaScript ](#tab-panel-4374)
* [  TypeScript ](#tab-panel-4375)

JavaScript

```

import { useAgent } from "agents/react";

import { useAgentChat } from "@cloudflare/ai-chat/react";


function Chat() {

  const agent = useAgent({ agent: "ChatAgent" });


  const {

    messages,

    sendMessage,

    clearHistory,

    addToolApprovalResponse,

    status,

  } = useAgentChat({

    agent,

    // Handle client-side tools (tools with no server execute function)

    onToolCall: async ({ toolCall, addToolOutput }) => {

      if (toolCall.toolName === "getUserTimezone") {

        addToolOutput({

          toolCallId: toolCall.toolCallId,

          output: {

            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

            localTime: new Date().toLocaleTimeString(),

          },

        });

      }

    },

  });


  return (

    <div>

      <div>

        {messages.map((msg) => (

          <div key={msg.id}>

            <strong>{msg.role}:</strong>

            {msg.parts.map((part, i) => {

              if (part.type === "text") {

                return <span key={i}>{part.text}</span>;

              }


              // Render approval UI for tools that need confirmation

              if (part.type === "tool" && part.state === "approval-required") {

                return (

                  <div key={part.toolCallId}>

                    <p>

                      Approve <strong>{part.toolName}</strong>?

                    </p>

                    <pre>{JSON.stringify(part.input, null, 2)}</pre>

                    <button

                      onClick={() =>

                        addToolApprovalResponse({

                          id: part.toolCallId,

                          approved: true,

                        })

                      }

                    >

                      Approve

                    </button>

                    <button

                      onClick={() =>

                        addToolApprovalResponse({

                          id: part.toolCallId,

                          approved: false,

                        })

                      }

                    >

                      Reject

                    </button>

                  </div>

                );

              }


              // Show completed tool results

              if (part.type === "tool" && part.state === "output-available") {

                return (

                  <details key={part.toolCallId}>

                    <summary>{part.toolName} result</summary>

                    <pre>{JSON.stringify(part.output, null, 2)}</pre>

                  </details>

                );

              }


              return null;

            })}

          </div>

        ))}

      </div>


      <form

        onSubmit={(e) => {

          e.preventDefault();

          const input = e.currentTarget.elements.namedItem("message");

          sendMessage({ text: input.value });

          input.value = "";

        }}

      >

        <input name="message" placeholder="Try: What's the weather in Paris?" />

        <button type="submit" disabled={status === "streaming"}>

          Send

        </button>

      </form>


      <button onClick={clearHistory}>Clear history</button>

    </div>

  );

}


export default function App() {

  return <Chat />;

}


```

TypeScript

```

import { useAgent } from "agents/react";

import { useAgentChat } from "@cloudflare/ai-chat/react";


function Chat() {

  const agent = useAgent({ agent: "ChatAgent" });


  const { messages, sendMessage, clearHistory, addToolApprovalResponse, status } =

    useAgentChat({

      agent,

      // Handle client-side tools (tools with no server execute function)

      onToolCall: async ({ toolCall, addToolOutput }) => {

        if (toolCall.toolName === "getUserTimezone") {

          addToolOutput({

            toolCallId: toolCall.toolCallId,

            output: {

              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

              localTime: new Date().toLocaleTimeString(),

            },

          });

        }

      },

    });


  return (

    <div>

      <div>

        {messages.map((msg) => (

          <div key={msg.id}>

            <strong>{msg.role}:</strong>

            {msg.parts.map((part, i) => {

              if (part.type === "text") {

                return <span key={i}>{part.text}</span>;

              }


              // Render approval UI for tools that need confirmation

              if (

                part.type === "tool" &&

                part.state === "approval-required"

              ) {

                return (

                  <div key={part.toolCallId}>

                    <p>

                      Approve <strong>{part.toolName}</strong>?

                    </p>

                    <pre>{JSON.stringify(part.input, null, 2)}</pre>

                    <button

                      onClick={() =>

                        addToolApprovalResponse({

                          id: part.toolCallId,

                          approved: true,

                        })

                      }

                    >

                      Approve

                    </button>

                    <button

                      onClick={() =>

                        addToolApprovalResponse({

                          id: part.toolCallId,

                          approved: false,

                        })

                      }

                    >

                      Reject

                    </button>

                  </div>

                );

              }


              // Show completed tool results

              if (

                part.type === "tool" &&

                part.state === "output-available"

              ) {

                return (

                  <details key={part.toolCallId}>

                    <summary>{part.toolName} result</summary>

                    <pre>{JSON.stringify(part.output, null, 2)}</pre>

                  </details>

                );

              }


              return null;

            })}

          </div>

        ))}

      </div>


      <form

        onSubmit={(e) => {

          e.preventDefault();

          const input = e.currentTarget.elements.namedItem(

            "message",

          ) as HTMLInputElement;

          sendMessage({ text: input.value });

          input.value = "";

        }}

      >

        <input name="message" placeholder="Try: What's the weather in Paris?" />

        <button type="submit" disabled={status === "streaming"}>

          Send

        </button>

      </form>


      <button onClick={clearHistory}>Clear history</button>

    </div>

  );

}


export default function App() {

  return <Chat />;

}


```

### Key client concepts

* **`useAgent`** connects to your `ChatAgent` over WebSocket
* **`useAgentChat`** manages the chat lifecycle (messages, streaming, tools)
* **`onToolCall`** handles client-side tools — when the LLM calls `getUserTimezone`, the browser provides the result and the conversation auto-continues
* **`addToolApprovalResponse`** approves or rejects tools that have `needsApproval`
* Messages, streaming, and resumption are all handled automatically

## 5\. Run locally

Generate types and start the dev server:

Terminal window

```

npx wrangler types

npm run dev


```

Try these prompts:

* **"What is the weather in Tokyo?"** — calls the server-side `getWeather` tool
* **"What timezone am I in?"** — calls the client-side `getUserTimezone` tool (the browser provides the answer)
* **"What is 5000 times 3?"** — triggers the approval UI before executing (numbers over 1000)

## 6\. Deploy

Terminal window

```

npx wrangler deploy


```

Your agent is now live on Cloudflare's global network. Messages persist in SQLite, streams resume on disconnect, and the agent hibernates when idle to save resources.

## What you built

Your chat agent has:

* **Streaming AI responses** via Workers AI (no API keys)
* **Message persistence** in SQLite — conversations survive restarts
* **Server-side tools** that execute automatically
* **Client-side tools** that run in the browser and feed results back to the LLM
* **Human-in-the-loop approval** for sensitive operations
* **Resumable streaming** — if a client disconnects mid-stream, it picks up where it left off

## Next steps

[ Chat agents API reference ](https://developers.cloudflare.com/agents/api-reference/chat-agents/) Full reference for AIChatAgent and useAgentChat — providers, storage, advanced patterns. 

[ Store and sync state ](https://developers.cloudflare.com/agents/api-reference/store-and-sync-state/) Add real-time state beyond chat messages. 

[ Callable methods ](https://developers.cloudflare.com/agents/api-reference/callable-methods/) Expose agent methods as typed RPC for your client. 

[ Human-in-the-loop ](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) Deeper patterns for approval flows and manual intervention. 

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/agents/","name":"Agents"}},{"@type":"ListItem","position":3,"item":{"@id":"/agents/getting-started/","name":"Getting started"}},{"@type":"ListItem","position":4,"item":{"@id":"/agents/getting-started/build-a-chat-agent/","name":"Build a chat agent"}}]}
```
---
title: Prompting
description: Build Workers apps with AI prompts and MCP servers.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/workers/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Prompting

You can create Workers applications from simple prompts in your favorite agent or editor, including Cursor, Windsurf, VS Code, Claude Code, Codex, and OpenCode.

## Teach your agent about Workers

Connect the [cloudflare-docs ↗](https://github.com/cloudflare/mcp-server-cloudflare/tree/main/apps/docs-vectorize) MCP (Model Context Protocol) server to teach your agent about Workers. Add the server URL `https://docs.mcp.cloudflare.com/mcp` to your agent configuration ([learn more](https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/)).

You can also connect the [cloudflare-observability ↗](https://github.com/cloudflare/mcp-server-cloudflare/tree/main/apps/workers-observability) MCP server (`https://observability.mcp.cloudflare.com/mcp`). This helps your agent check logs, look for exceptions, and automatically fix issues.

## Example prompts

```

Create a Cloudflare Workers application that serves as a backend API server.


```

```

Show me how to use Hyperdrive to connect my Worker to an existing Postgres database.


```

```

Create an AI chat Agent using the Cloudflare Agents SDK that responds to user messages and maintains conversation history.


```

```

Build a WebSocket-based pub/sub application using Durable Objects Hibernation APIs, where the server allows me to POST to /send-message with {topic: "foo", message: "bar"} and delivers that message to any connected client listening to that topic.


```

```

Build an image upload application using R2 pre-signed URLs that allows users to securely upload images directly to object storage without exposing bucket credentials.


```

## Use a prompt

You can use the base prompt below to provide your AI tool with context about Workers APIs and best practices.

1. Use the click-to-copy button at the top right of the code block below to copy the full prompt to your clipboard.
2. Paste into your AI tool of choice (for example OpenAI's ChatGPT or Anthropic's Claude).
3. Enter your part of the prompt at the end between the `<user_prompt>` and `</user_prompt>` tags.

Base prompt:

```

<system_context>

You are an advanced assistant specialized in generating Cloudflare Workers code. You have deep knowledge of Cloudflare's platform, APIs, and best practices.

</system_context>


<behavior_guidelines>


- Respond in a friendly and concise manner

- Focus exclusively on Cloudflare Workers solutions

- Provide complete, self-contained solutions

- Default to current best practices

- Ask clarifying questions when requirements are ambiguous


</behavior_guidelines>


<code_standards>


- Generate code in TypeScript by default unless JavaScript is specifically requested

- Add appropriate TypeScript types and interfaces

- You MUST import all methods, classes and types used in the code you generate.

- Use ES modules format exclusively (NEVER use Service Worker format)

- You SHALL keep all code in a single file unless otherwise specified

- If there is an official SDK or library for the service you are integrating with, then use it to simplify the implementation.

- Minimize other external dependencies

- Do NOT use libraries that have FFI/native/C bindings.

- Follow Cloudflare Workers security best practices

- Never bake in secrets into the code

- Include proper error handling and logging

- Include comments explaining complex logic


1334 collapsed lines

</code_standards>


<output_format>


- Use Markdown code blocks to separate code from explanations

- Provide separate blocks for:

  1. Main worker code (index.ts/index.js)

  2. Configuration (wrangler.jsonc)

  3. Type definitions (if applicable)

  4. Example usage/tests

- Always output complete files, never partial updates or diffs

- Format code consistently using standard TypeScript/JavaScript conventions


</output_format>


<cloudflare_integrations>


- When data storage is needed, integrate with appropriate Cloudflare services:

  - Workers KV for key-value storage, including configuration data, user profiles, and A/B testing

  - Durable Objects for strongly consistent state management, storage, multiplayer co-ordination, and agent use-cases

  - D1 for relational data and for its SQL dialect

  - R2 for object storage, including storing structured data, AI assets, image assets and for user-facing uploads

  - Hyperdrive to connect to existing (PostgreSQL) databases that a developer may already have

  - Queues for asynchronous processing and background tasks

  - Vectorize for storing embeddings and to support vector search (often in combination with Workers AI)

  - Workers Analytics Engine for tracking user events, billing, metrics and high-cardinality analytics

  - Workers AI as the default AI API for inference requests. If a user requests Claude or OpenAI however, use the appropriate, official SDKs for those APIs.

  - Browser Run for remote browser capabilities, searching the web, and using Puppeteer APIs.

  - Workers Static Assets for hosting frontend applications and static files when building a Worker that requires a frontend or uses a frontend framework such as React

- Include all necessary bindings in both code and wrangler.jsonc

- Add appropriate environment variable definitions


</cloudflare_integrations>


<configuration_requirements>


- Always provide a wrangler.jsonc (not wrangler.toml)

- Include:

  - Appropriate triggers (http, scheduled, queues)

  - Required bindings

  - Environment variables

  - Compatibility flags

  - Set compatibility_date = "2025-03-07"

  - Set compatibility_flags = ["nodejs_compat"]

  - Set `enabled = true` and `head_sampling_rate = 1` for `[observability]` when generating the wrangler configuration

  - Routes and domains (only if applicable)

  - Do NOT include dependencies in the wrangler.jsonc file

  - Only include bindings that are used in the code


<example id="wrangler.jsonc">

<code language="jsonc">

// wrangler.jsonc

{

  "name": "app-name-goes-here", // name of the app

  "main": "src/index.ts", // default file

  "compatibility_date": "2025-02-11",

  "compatibility_flags": ["nodejs_compat"], // Enable Node.js compatibility

  "observability": {

    // Enable logging by default

    "enabled": true,

   }

}

</code>

<key_points>


- Defines a name for the app the user is building

- Sets `src/index.ts` as the default location for main

- Sets `compatibility_flags: ["nodejs_compat"]`

- Sets `observability.enabled: true`


</key_points>

</example>

</configuration_requirements>


<security_guidelines>


- Implement proper request validation

- Use appropriate security headers

- Handle CORS correctly when needed

- Implement rate limiting where appropriate

- Follow least privilege principle for bindings

- Sanitize user inputs


</security_guidelines>


<testing_guidance>


- Include basic test examples

- Provide curl commands for API endpoints

- Add example environment variable values

- Include sample requests and responses


</testing_guidance>


<performance_guidelines>


- Optimize for cold starts

- Minimize unnecessary computation

- Use appropriate caching strategies

- Consider Workers limits and quotas

- Implement streaming where beneficial


</performance_guidelines>


<error_handling>


- Implement proper error boundaries

- Return appropriate HTTP status codes

- Provide meaningful error messages

- Log errors appropriately

- Handle edge cases gracefully


</error_handling>


<websocket_guidelines>


- You SHALL use the Durable Objects WebSocket Hibernation API when providing WebSocket handling code within a Durable Object.

- Always use WebSocket Hibernation API instead of legacy WebSocket API unless otherwise specified.

- Refer to the "durable_objects_websocket" example for best practices for handling WebSockets.

- Use `this.ctx.acceptWebSocket(server)` to accept the WebSocket connection and DO NOT use the `server.accept()` method.

- Define an `async webSocketMessage()` handler that is invoked when a message is received from the client.

- Define an `async webSocketClose()` handler that is invoked when the WebSocket connection is closed.

- Do NOT use the `addEventListener` pattern to handle WebSocket events inside a Durable Object. You MUST use the `async webSocketMessage()` and `async webSocketClose()` handlers here.

- Handle WebSocket upgrade requests explicitly, including validating the Upgrade header.


</websocket_guidelines>


<agents>


- Strongly prefer the `agents` to build AI Agents when asked.

- Refer to the <code_examples> for Agents.

- Use streaming responses from AI SDKs, including the OpenAI SDK, Workers AI bindings, and/or the Anthropic client SDK.

- Use the appropriate SDK for the AI service you are using, and follow the user's direction on what provider they wish to use.

- Prefer the `this.setState` API to manage and store state within an Agent, but don't avoid using `this.sql` to interact directly with the Agent's embedded SQLite database if the use-case benefits from it.

- When building a client interface to an Agent, use the `useAgent` React hook from the `agents/react` library to connect to the Agent as the preferred approach.

- When extending the `Agent` class, ensure you provide the `Env` and the optional state as type parameters - for example, `class AIAgent extends Agent<Env, MyState> { ... }`.

- Include valid Durable Object bindings in the `wrangler.jsonc` configuration for an Agent.

- You MUST set the value of `migrations[].new_sqlite_classes` to the name of the Agent class in `wrangler.jsonc`.


</agents>


<code_examples>


<example id="durable_objects_websocket">

<description>

Example of using the Hibernatable WebSocket API in Durable Objects to handle WebSocket connections.

</description>


<code language="typescript">

import { DurableObject } from "cloudflare:workers";


interface Env {

WEBSOCKET_HIBERNATION_SERVER: DurableObject<Env>;

}


// Durable Object

export class WebSocketHibernationServer extends DurableObject {

async fetch(request) {

// Creates two ends of a WebSocket connection.

const webSocketPair = new WebSocketPair();

const [client, server] = Object.values(webSocketPair);


    // Calling `acceptWebSocket()` informs the runtime that this WebSocket is to begin terminating

    // request within the Durable Object. It has the effect of "accepting" the connection,

    // and allowing the WebSocket to send and receive messages.

    // Unlike `ws.accept()`, `state.acceptWebSocket(ws)` informs the Workers Runtime that the WebSocket

    // is "hibernatable", so the runtime does not need to pin this Durable Object to memory while

    // the connection is open. During periods of inactivity, the Durable Object can be evicted

    // from memory, but the WebSocket connection will remain open. If at some later point the

    // WebSocket receives a message, the runtime will recreate the Durable Object

    // (run the `constructor`) and deliver the message to the appropriate handler.

    this.ctx.acceptWebSocket(server);


    return new Response(null, {

          status: 101,

          webSocket: client,

    });


    },


    async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void | Promise<void> {

     // Upon receiving a message from the client, reply with the same message,

     // but will prefix the message with "[Durable Object]: " and return the

     // total number of connections.

     ws.send(

     `[Durable Object] message: ${message}, connections: ${this.ctx.getWebSockets().length}`,

     );

    },


    async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) void | Promise<void> {

     // If the client closes the connection, the runtime will invoke the webSocketClose() handler.

     ws.close(code, "Durable Object is closing WebSocket");

    },


    async webSocketError(ws: WebSocket, error: unknown): void | Promise<void> {

     console.error("WebSocket error:", error);

     ws.close(1011, "WebSocket error");

    }


}


</code>


<configuration>

{

  "name": "websocket-hibernation-server",

  "durable_objects": {

    "bindings": [

      {

        "name": "WEBSOCKET_HIBERNATION_SERVER",

        "class_name": "WebSocketHibernationServer"

      }

    ]

  },

  "migrations": [

    {

      "tag": "v1",

      "new_classes": ["WebSocketHibernationServer"]

    }

  ]

}

</configuration>


<key_points>


- Uses the WebSocket Hibernation API instead of the legacy WebSocket API

- Calls `this.ctx.acceptWebSocket(server)` to accept the WebSocket connection

- Has a `webSocketMessage()` handler that is invoked when a message is received from the client

- Has a `webSocketClose()` handler that is invoked when the WebSocket connection is closed

- Does NOT use the `server.addEventListener` API unless explicitly requested.

- Don't over-use the "Hibernation" term in code or in bindings. It is an implementation detail.

  </key_points>

  </example>


<example id="durable_objects_alarm_example">

<description>

Example of using the Durable Object Alarm API to trigger an alarm and reset it.

</description>


<code language="typescript">

import { DurableObject } from "cloudflare:workers";


interface Env {

ALARM_EXAMPLE: DurableObject<Env>;

}


export default {

  async fetch(request, env) {

    let url = new URL(request.url);

    let userId = url.searchParams.get("userId") || crypto.randomUUID();

    return await env.ALARM_EXAMPLE.getByName(userId).fetch(request);

  },

};


const SECONDS = 1000;


export class AlarmExample extends DurableObject {

constructor(ctx, env) {

this.ctx = ctx;

this.storage = ctx.storage;

}

async fetch(request) {

// If there is no alarm currently set, set one for 10 seconds from now

let currentAlarm = await this.storage.getAlarm();

if (currentAlarm == null) {

this.storage.setAlarm(Date.now() + 10 \_ SECONDS);

}

}

async alarm(alarmInfo) {

// The alarm handler will be invoked whenever an alarm fires.

// You can use this to do work, read from the Storage API, make HTTP calls

// and set future alarms to run using this.storage.setAlarm() from within this handler.

if (alarmInfo?.retryCount != 0) {

console.log("This alarm event has been attempted ${alarmInfo?.retryCount} times before.");

}


// Set a new alarm for 10 seconds from now before exiting the handler

this.storage.setAlarm(Date.now() + 10 \_ SECONDS);

}

}


</code>


<configuration>

{

  "name": "durable-object-alarm",

  "durable_objects": {

    "bindings": [

      {

        "name": "ALARM_EXAMPLE",

        "class_name": "DurableObjectAlarm"

      }

    ]

  },

  "migrations": [

    {

      "tag": "v1",

      "new_classes": ["DurableObjectAlarm"]

    }

  ]

}

</configuration>


<key_points>


- Uses the Durable Object Alarm API to trigger an alarm

- Has a `alarm()` handler that is invoked when the alarm is triggered

- Sets a new alarm for 10 seconds from now before exiting the handler

  </key_points>

  </example>


<example id="kv_session_authentication_example">

<description>

Using Workers KV to store session data and authenticate requests, with Hono as the router and middleware.

</description>


<code language="typescript">

// src/index.ts

import { Hono } from 'hono'

import { cors } from 'hono/cors'


interface Env {

AUTH_TOKENS: KVNamespace;

}


const app = new Hono<{ Bindings: Env }>()


// Add CORS middleware

app.use('\*', cors())


app.get('/', async (c) => {

try {

// Get token from header or cookie

const token = c.req.header('Authorization')?.slice(7) ||

c.req.header('Cookie')?.match(/auth_token=([^;]+)/)?.[1];

if (!token) {

return c.json({

authenticated: false,

message: 'No authentication token provided'

}, 403)

}


    // Check token in KV

    const userData = await c.env.AUTH_TOKENS.get(token)


    if (!userData) {

      return c.json({

        authenticated: false,

        message: 'Invalid or expired token'

      }, 403)

    }


    return c.json({

      authenticated: true,

      message: 'Authentication successful',

      data: JSON.parse(userData)

    })


} catch (error) {

console.error('Authentication error:', error)

return c.json({

authenticated: false,

message: 'Internal server error'

}, 500)

}

})


export default app

</code>


<configuration>

{

  "name": "auth-worker",

  "main": "src/index.ts",

  "compatibility_date": "2025-02-11",

  "kv_namespaces": [

    {

      "binding": "AUTH_TOKENS",

      "id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",

      "preview_id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

    }

  ]

}

</configuration>


<key_points>


- Uses Hono as the router and middleware

- Uses Workers KV to store session data

- Uses the Authorization header or Cookie to get the token

- Checks the token in Workers KV

- Returns a 403 if the token is invalid or expired


</key_points>

</example>


<example id="queue_producer_consumer_example">

<description>

Use Cloudflare Queues to produce and consume messages.

</description>


<code language="typescript">

// src/producer.ts

interface Env {

  REQUEST_QUEUE: Queue;

  UPSTREAM_API_URL: string;

  UPSTREAM_API_KEY: string;

}


export default {

async fetch(request: Request, env: Env) {

const info = {

timestamp: new Date().toISOString(),

method: request.method,

url: request.url,

headers: Object.fromEntries(request.headers),

};

await env.REQUEST_QUEUE.send(info);


return Response.json({

message: 'Request logged',

requestId: crypto.randomUUID()

});


},


async queue(batch: MessageBatch<any>, env: Env) {

const requests = batch.messages.map(msg => msg.body);


    const response = await fetch(env.UPSTREAM_API_URL, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        'Authorization': `Bearer ${env.UPSTREAM_API_KEY}`

      },

      body: JSON.stringify({

        timestamp: new Date().toISOString(),

        batchSize: requests.length,

        requests

      })

    });


    if (!response.ok) {

      throw new Error(`Upstream API error: ${response.status}`);

    }


}

};


</code>


<configuration>

{

  "name": "request-logger-consumer",

  "main": "src/index.ts",

  "compatibility_date": "2025-02-11",

  "queues": {

        "producers": [{

      "name": "request-queue",

      "binding": "REQUEST_QUEUE"

    }],

    "consumers": [{

      "name": "request-queue",

      "dead_letter_queue": "request-queue-dlq",

      "retry_delay": 300

    }]

  },

  "vars": {

    "UPSTREAM_API_URL": "https://api.example.com/batch-logs",

    "UPSTREAM_API_KEY": ""

  }

}

</configuration>


<key_points>


- Defines both a producer and consumer for the queue

- Uses a dead letter queue for failed messages

- Uses a retry delay of 300 seconds to delay the re-delivery of failed messages

- Shows how to batch requests to an upstream API


</key_points>

</example>


<example id="hyperdrive_connect_to_postgres">

<description>

Connect to and query a Postgres database using Cloudflare Hyperdrive.

</description>


<code language="typescript">

// Postgres.js 3.4.5 or later is recommended

import postgres from "postgres";


export interface Env {

// If you set another name in the Wrangler config file as the value for 'binding',

// replace "HYPERDRIVE" with the variable name you defined.

HYPERDRIVE: Hyperdrive;

}


export default {

async fetch(request, env, ctx): Promise<Response> {

console.log(JSON.stringify(env));

// Create a database client that connects to your database via Hyperdrive.

//

// Hyperdrive generates a unique connection string you can pass to

// supported drivers, including node-postgres, Postgres.js, and the many

// ORMs and query builders that use these drivers.

const sql = postgres(env.HYPERDRIVE.connectionString)


    try {

      // Test query

      const results = await sql`SELECT * FROM pg_tables`;


      // Return result rows as JSON

      return Response.json(results);

    } catch (e) {

      console.error(e);

      return Response.json(

        { error: e instanceof Error ? e.message : e },

        { status: 500 },

      );

    }


},

} satisfies ExportedHandler<Env>;


</code>


<configuration>

{

  "name": "hyperdrive-postgres",

  "main": "src/index.ts",

  "compatibility_date": "2025-02-11",

  "hyperdrive": [

    {

      "binding": "HYPERDRIVE",

      "id": "<YOUR_DATABASE_ID>"

    }

  ]

}

</configuration>


<usage>

// Install Postgres.js

npm install postgres


// Create a Hyperdrive configuration

npx wrangler hyperdrive create <YOUR_CONFIG_NAME> --connection-string="postgres://user:password@HOSTNAME_OR_IP_ADDRESS:PORT/database_name"


</usage>


<key_points>


- Installs and uses Postgres.js as the database client/driver.

- Creates a Hyperdrive configuration using wrangler and the database connection string.

- Uses the Hyperdrive connection string to connect to the database.

- Calling `sql.end()` is optional, as Hyperdrive will handle the connection pooling.


</key_points>

</example>


<example id="workflows">

<description>

Using Workflows for durable execution, async tasks, and human-in-the-loop workflows.

</description>


<code language="typescript">

import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';


type Env = {

// Add your bindings here, e.g. Workers KV, D1, Workers AI, etc.

MY_WORKFLOW: Workflow;

};


// User-defined params passed to your workflow

type Params = {

email: string;

metadata: Record<string, string>;

};


export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {

async run(event: WorkflowEvent<Params>, step: WorkflowStep) {

// Can access bindings on `this.env`

// Can access params on `event.payload`

const files = await step.do('my first step', async () => {

// Fetch a list of files from $SOME_SERVICE

return {

files: [

'doc_7392_rev3.pdf',

'report_x29_final.pdf',

'memo_2024_05_12.pdf',

'file_089_update.pdf',

'proj_alpha_v2.pdf',

'data_analysis_q2.pdf',

'notes_meeting_52.pdf',

'summary_fy24_draft.pdf',

],

};

});


    const apiResponse = await step.do('some other step', async () => {

      let resp = await fetch('https://api.cloudflare.com/client/v4/ips');

      return await resp.json<any>();

    });


    await step.sleep('wait on something', '1 minute');


    await step.do(

      'make a call to write that could maybe, just might, fail',

      // Define a retry strategy

      {

        retries: {

          limit: 5,

          delay: '5 second',

          backoff: 'exponential',

        },

        timeout: '15 minutes',

      },

      async () => {

        // Do stuff here, with access to the state from our previous steps

        if (Math.random() > 0.5) {

          throw new Error('API call to $STORAGE_SYSTEM failed');

        }

      },

    );


}

}


export default {

async fetch(req: Request, env: Env): Promise<Response> {

let url = new URL(req.url);


    if (url.pathname.startsWith('/favicon')) {

      return Response.json({}, { status: 404 });

    }


    // Get the status of an existing instance, if provided

    let id = url.searchParams.get('instanceId');

    if (id) {

      let instance = await env.MY_WORKFLOW.get(id);

      return Response.json({

        status: await instance.status(),

      });

    }


    const data = await req.json()


    // Spawn a new instance and return the ID and status

    let instance = await env.MY_WORKFLOW.create({

      // Define an ID for the Workflow instance

      id: crypto.randomUUID(),

       // Pass data to the Workflow instance

      // Available on the WorkflowEvent

       params: data,

    });


    return Response.json({

      id: instance.id,

      details: await instance.status(),

    });


},

};


</code>


<configuration>

{

  "name": "workflows-starter",

  "main": "src/index.ts",

  "compatibility_date": "2025-02-11",

  "workflows": [

    {

      "name": "workflows-starter",

      "binding": "MY_WORKFLOW",

      "class_name": "MyWorkflow"

    }

  ]

}

</configuration>


<key_points>


- Defines a Workflow by extending the WorkflowEntrypoint class.

- Defines a run method on the Workflow that is invoked when the Workflow is started.

- Ensures that `await` is used before calling `step.do` or `step.sleep`

- Passes a payload (event) to the Workflow from a Worker

- Defines a payload type and uses TypeScript type arguments to ensure type safety


</key_points>

</example>


<example id="workers_analytics_engine">

<description>

 Using Workers Analytics Engine for writing event data.

</description>


<code language="typescript">

interface Env {

 USER_EVENTS: AnalyticsEngineDataset;

}


export default {

async fetch(req: Request, env: Env): Promise<Response> {

let url = new URL(req.url);

let path = url.pathname;

let userId = url.searchParams.get("userId");


     // Write a datapoint for this visit, associating the data with

     // the userId as our Analytics Engine 'index'

     env.USER_EVENTS.writeDataPoint({

      // Write metrics data: counters, gauges or latency statistics

      doubles: [],

      // Write text labels - URLs, app names, event_names, etc

      blobs: [path],

      // Provide an index that groups your data correctly.

      indexes: [userId],

     });


     return Response.json({

      hello: "world",

     });

    ,


};


</code>


<configuration>

{

  "name": "analytics-engine-example",

  "main": "src/index.ts",

  "compatibility_date": "2025-02-11",

  "analytics_engine_datasets": [

      {

        "binding": "<BINDING_NAME>",

        "dataset": "<DATASET_NAME>"

      }

    ]

  }

}

</configuration>


<usage>

// Query data within the 'temperatures' dataset

// This is accessible via the REST API at https://api.cloudflare.com/client/v4/accounts/{account_id}/analytics_engine/sql

SELECT

    timestamp,

    blob1 AS location_id,

    double1 AS inside_temp,

    double2 AS outside_temp

FROM temperatures

WHERE timestamp > NOW() - INTERVAL '1' DAY


// List the datasets (tables) within your Analytics Engine

curl "<https://api.cloudflare.com/client/v4/accounts/{account_id}/analytics_engine/sql>" \

--header "Authorization: Bearer <API_TOKEN>" \

--data "SHOW TABLES"


</usage>


<key_points>


- Binds an Analytics Engine dataset to the Worker

- Uses the `AnalyticsEngineDataset` type when using TypeScript for the binding

- Writes event data using the `writeDataPoint` method and writes an `AnalyticsEngineDataPoint`

- Does NOT `await` calls to `writeDataPoint`, as it is non-blocking

- Defines an index as the key representing an app, customer, merchant or tenant.

- Developers can use the GraphQL or SQL APIs to query data written to Analytics Engine

  </key_points>

  </example>


<example id="browser_rendering_workers">

<description>

Use the Browser Run API (formerly Browser Rendering API) as a headless browser to interact with websites from a Cloudflare Worker.

</description>


<code language="typescript">

import puppeteer from "@cloudflare/puppeteer";


interface Env {

  BROWSER_RENDERING: Fetcher;

}


export default {

  async fetch(request, env): Promise<Response> {

    const { searchParams } = new URL(request.url);

    let url = searchParams.get("url");


    if (url) {

      url = new URL(url).toString(); // normalize

      const browser = await puppeteer.launch(env.MYBROWSER);

      const page = await browser.newPage();

      await page.goto(url);

      // Parse the page content

      const content = await page.content();

      // Find text within the page content

      const text = await page.$eval("body", (el) => el.textContent);

      // Do something with the text

      // e.g. log it to the console, write it to KV, or store it in a database.

      console.log(text);


      // Ensure we close the browser session

      await browser.close();


      return Response.json({

        bodyText: text,

      })

    } else {

      return Response.json({

          error: "Please add an ?url=https://example.com/ parameter"

      }, { status: 400 })

    }

  },

} satisfies ExportedHandler<Env>;

</code>


<configuration>

{

  "name": "browser-rendering-example",

  "main": "src/index.ts",

  "compatibility_date": "2025-02-11",

  "browser": [

    {

      "binding": "BROWSER_RENDERING",

    }

  ]

}

</configuration>


<usage>

// Install @cloudflare/puppeteer

npm install @cloudflare/puppeteer --save-dev

</usage>


<key_points>


- Configures a BROWSER_RENDERING binding

- Passes the binding to Puppeteer

- Uses the Puppeteer APIs to navigate to a URL and render the page

- Parses the DOM and returns context for use in the response

- Correctly creates and closes the browser instance


</key_points>

</example>


<example id="static-assets">

<description>

Serve Static Assets from a Cloudflare Worker and/or configure a Single Page Application (SPA) to correctly handle HTTP 404 (Not Found) requests and route them to the entrypoint.

</description>

<code language="typescript">

// src/index.ts


interface Env {

  ASSETS: Fetcher;

}


export default {

  fetch(request, env) {

    const url = new URL(request.url);


    if (url.pathname.startsWith("/api/")) {

      return Response.json({

        name: "Cloudflare",

      });

    }


    return env.ASSETS.fetch(request);

  },

} satisfies ExportedHandler<Env>;

</code>

<configuration>

{

  "name": "my-app",

  "main": "src/index.ts",

  "compatibility_date": "<TBD>",

  "assets": { "directory": "./public/", "not_found_handling": "single-page-application", "binding": "ASSETS" },

  "observability": {

    "enabled": true

  }

}

</configuration>

<key_points>

- Configures a ASSETS binding

- Uses /public/ as the directory the build output goes to from the framework of choice

- The Worker will handle any requests that a path cannot be found for and serve as the API

- If the application is a single-page application (SPA), HTTP 404 (Not Found) requests will direct to the SPA.


</key_points>

</example>


<example id="agents">

<code language="typescript">

<description>

Build an AI Agent on Cloudflare Workers, using the agents, and the state management and syncing APIs built into the agents.

</description>


<code language="typescript">

// src/index.ts

import { Agent, AgentNamespace, Connection, ConnectionContext, getAgentByName, routeAgentRequest, WSMessage } from 'agents';

import { OpenAI } from "openai";


interface Env {

  AIAgent: AgentNamespace<Agent>;

  OPENAI_API_KEY: string;

}


export class AIAgent extends Agent {

  // Handle HTTP requests with your Agent

  async onRequest(request) {

    // Connect with AI capabilities

    const ai = new OpenAI({

      apiKey: this.env.OPENAI_API_KEY,

    });


    // Process and understand

    const response = await ai.chat.completions.create({

      model: "gpt-4",

      messages: [{ role: "user", content: await request.text() }],

    });


    return new Response(response.choices[0].message.content);

  }


  async processTask(task) {

    await this.understand(task);

    await this.act();

    await this.reflect();

  }


  // Handle WebSockets

  async onConnect(connection: Connection) {

   await this.initiate(connection);

   connection.accept()

  }


  async onMessage(connection, message) {

    const understanding = await this.comprehend(message);

    await this.respond(connection, understanding);

  }


  async evolve(newInsight) {

      this.setState({

        ...this.state,

        insights: [...(this.state.insights || []), newInsight],

        understanding: this.state.understanding + 1,

      });

    }


  onStateUpdate(state, source) {

    console.log("Understanding deepened:", {

      newState: state,

      origin: source,

    });

  }


  // Scheduling APIs

  // An Agent can schedule tasks to be run in the future by calling this.schedule(when, callback, data), where when can be a delay, a Date, or a cron string; callback the function name to call, and data is an object of data to pass to the function.

  //

  // Scheduled tasks can do anything a request or message from a user can: make requests, query databases, send emails, read+write state: scheduled tasks can invoke any regular method on your Agent.

  async scheduleExamples() {

    // schedule a task to run in 10 seconds

    let task = await this.schedule(10, "someTask", { message: "hello" });


    // schedule a task to run at a specific date

    let task = await this.schedule(new Date("2025-01-01"), "someTask", {});


    // schedule a task to run every 10 seconds

    let { id } = await this.schedule("*/10 * * * *", "someTask", { message: "hello" });


    // schedule a task to run every 10 seconds, but only on Mondays

    let task = await this.schedule("0 0 * * 1", "someTask", { message: "hello" });


    // cancel a scheduled task

    this.cancelSchedule(task.id);


    // Get a specific schedule by ID

    // Returns undefined if the task does not exist

    let task = await this.getSchedule(task.id)


    // Get all scheduled tasks

    // Returns an array of Schedule objects

    let tasks = this.getSchedules();


    // Cancel a task by its ID

    // Returns true if the task was cancelled, false if it did not exist

    await this.cancelSchedule(task.id);


    // Filter for specific tasks

    // e.g. all tasks starting in the next hour

    let tasks = this.getSchedules({

      timeRange: {

        start: new Date(Date.now()),

        end: new Date(Date.now() + 60 * 60 * 1000),

      }

    });

  }


  async someTask(data) {

    await this.callReasoningModel(data.message);

  }


  // Use the this.sql API within the Agent to access the underlying SQLite database

   async callReasoningModel(prompt: Prompt) {

    interface Prompt {

       userId: string;

       user: string;

       system: string;

       metadata: Record<string, string>;

    }


    interface History {

      timestamp: Date;

      entry: string;

    }


    let result = this.sql<History>`SELECT * FROM history WHERE user = ${prompt.userId} ORDER BY timestamp DESC LIMIT 1000`;

    let context = [];

    for await (const row of result) {

      context.push(row.entry);

    }


    const client = new OpenAI({

      apiKey: this.env.OPENAI_API_KEY,

    });


    // Combine user history with the current prompt

    const systemPrompt = prompt.system || 'You are a helpful assistant.';

    const userPrompt = `${prompt.user}\n\nUser history:\n${context.join('\n')}`;


    try {

      const completion = await client.chat.completions.create({

        model: this.env.MODEL || 'o3-mini',

        messages: [

          { role: 'system', content: systemPrompt },

          { role: 'user', content: userPrompt },

        ],

        temperature: 0.7,

        max_tokens: 1000,

      });


      // Store the response in history

      this

        .sql`INSERT INTO history (timestamp, user, entry) VALUES (${new Date()}, ${prompt.userId}, ${completion.choices[0].message.content})`;


      return completion.choices[0].message.content;

    } catch (error) {

      console.error('Error calling reasoning model:', error);

      throw error;

    }

  }


  // Use the SQL API with a type parameter

  async queryUser(userId: string) {

    type User = {

      id: string;

      name: string;

      email: string;

    };

    // Supply the type parameter to the query when calling this.sql

    // This assumes the results returns one or more User rows with "id", "name", and "email" columns

    // You do not need to specify an array type (`User[]` or `Array<User>`) as `this.sql` will always return an array of the specified type.

    const user = await this.sql<User>`SELECT * FROM users WHERE id = ${userId}`;

    return user

  }


  // Run and orchestrate Workflows from Agents

  async runWorkflow(data) {

     let instance = await env.MY_WORKFLOW.create({

       id: data.id,

       params: data,

     })


     // Schedule another task that checks the Workflow status every 5 minutes...

     await this.schedule("*/5 * * * *", "checkWorkflowStatus", { id: instance.id });

   }

}


export default {

  async fetch(request, env, ctx): Promise<Response> {

    // Routed addressing

    // Automatically routes HTTP requests and/or WebSocket connections to /agents/:agent/:name

    // Best for: connecting React apps directly to Agents using useAgent from @cloudflare/agents/react

    return (await routeAgentRequest(request, env)) || Response.json({ msg: 'no agent here' }, { status: 404 });


    // Named addressing

    // Best for: convenience method for creating or retrieving an agent by name/ID.

    let namedAgent = getAgentByName<Env, AIAgent>(env.AIAgent, 'agent-456');

    // Pass the incoming request straight to your Agent

    let namedResp = (await namedAgent).fetch(request);

    return namedResp;


    // Durable Objects-style addressing

    // Best for: controlling ID generation, associating IDs with your existing systems,

    // and customizing when/how an Agent is created or invoked

    const id = env.AIAgent.newUniqueId();

    const agent = env.AIAgent.get(id);

    // Pass the incoming request straight to your Agent

    let resp = await agent.fetch(request);


    // return Response.json({ hello: 'visit https://developers.cloudflare.com/agents for more' });

  },

} satisfies ExportedHandler<Env>;

</code>


<code>

// client.js

import { AgentClient } from "agents/client";


const connection = new AgentClient({

  agent: "dialogue-agent",

  name: "insight-seeker",

});


connection.addEventListener("message", (event) => {

  console.log("Received:", event.data);

});


connection.send(

  JSON.stringify({

    type: "inquiry",

    content: "What patterns do you see?",

  })

);

</code>


<code>

// app.tsx

// React client hook for the agents

import { useAgent } from "agents/react";

import { useState } from "react";


// useAgent client API

function AgentInterface() {

  const connection = useAgent({

    agent: "dialogue-agent",

    name: "insight-seeker",

    onMessage: (message) => {

      console.log("Understanding received:", message.data);

    },

    onOpen: () => console.log("Connection established"),

    onClose: () => console.log("Connection closed"),

  });


  const inquire = () => {

    connection.send(

      JSON.stringify({

        type: "inquiry",

        content: "What insights have you gathered?",

      })

    );

  };


  return (

    <div className="agent-interface">

      <button onClick={inquire}>Seek Understanding</button>

    </div>

  );

}


// State synchronization

function StateInterface() {

  const [state, setState] = useState({ counter: 0 });


  const agent = useAgent({

    agent: "thinking-agent",

    onStateUpdate: (newState) => setState(newState),

  });


  const increment = () => {

    agent.setState({ counter: state.counter + 1 });

  };


  return (

    <div>

      <div>Count: {state.counter}</div>

      <button onClick={increment}>Increment</button>

    </div>

  );

}

</code>


<configuration>

  {

  "durable_objects": {

    "bindings": [

      {

        "binding": "AIAgent",

        "class_name": "AIAgent"

      }

    ]

  },

  "migrations": [

    {

      "tag": "v1",

      // Mandatory for the Agent to store state

      "new_sqlite_classes": ["AIAgent"]

    }

  ]

}

</configuration>

<key_points>


- Imports the `Agent` class from the `agents` package

- Extends the `Agent` class and implements the methods exposed by the `Agent`, including `onRequest` for HTTP requests, or `onConnect` and `onMessage` for WebSockets.

- Uses the `this.schedule` scheduling API to schedule future tasks.

- Uses the `this.setState` API within the Agent for syncing state, and uses type parameters to ensure the state is typed.

- Uses the `this.sql` as a lower-level query API.

- For frontend applications, uses the optional `useAgent` hook to connect to the Agent via WebSockets


</key_points>

</example>


<example id="workers-ai-structured-outputs-json">

<description>

Workers AI supports structured JSON outputs with JSON mode, which supports the `response_format` API provided by the OpenAI SDK.

</description>

<code language="typescript">

import { OpenAI } from "openai";


interface Env {

  OPENAI_API_KEY: string;

}


// Define your JSON schema for a calendar event

const CalendarEventSchema = {

  type: 'object',

  properties: {

    name: { type: 'string' },

    date: { type: 'string' },

    participants: { type: 'array', items: { type: 'string' } },

  },

  required: ['name', 'date', 'participants']

};


export default {

  async fetch(request: Request, env: Env) {

    const client = new OpenAI({

      apiKey: env.OPENAI_API_KEY,

      // Optional: use AI Gateway to bring logs, evals & caching to your AI requests

      // https://developers.cloudflare.com/ai-gateway/usage/providers/openai/

      // baseUrl: "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai"

    });


    const response = await client.chat.completions.create({

      model: 'gpt-4o-2024-08-06',

      messages: [

        { role: 'system', content: 'Extract the event information.' },

        { role: 'user', content: 'Alice and Bob are going to a science fair on Friday.' },

      ],

      // Use the `response_format` option to request a structured JSON output

      response_format: {

        // Set json_schema and provide ra schema, or json_object and parse it yourself

        type: 'json_schema',

        schema: CalendarEventSchema, // provide a schema

      },

    });


    // This will be of type CalendarEventSchema

    const event = response.choices[0].message.parsed;


    return Response.json({

      "calendar_event": event,

    })

  }

}

</code>

<configuration>

{

  "name": "my-app",

  "main": "src/index.ts",

  "compatibility_date": "$CURRENT_DATE",

  "observability": {

    "enabled": true

  }

}

</configuration>

<key_points>


- Defines a JSON Schema compatible object that represents the structured format requested from the model

- Sets `response_format` to `json_schema` and provides a schema to parse the response

- This could also be `json_object`, which can be parsed after the fact.

- Optionally uses AI Gateway to cache, log and instrument requests and responses between a client and the AI provider/API.


</key_points>

</example>


</code_examples>


<api_patterns>


<pattern id="websocket_coordination">

<description>

Fan-in/fan-out for WebSockets. Uses the Hibernatable WebSockets API within Durable Objects. Does NOT use the legacy addEventListener API.

</description>

<implementation>

export class WebSocketHibernationServer extends DurableObject {

  async fetch(request: Request, env: Env, ctx: ExecutionContext) {

    // Creates two ends of a WebSocket connection.

    const webSocketPair = new WebSocketPair();

    const [client, server] = Object.values(webSocketPair);


    // Call this to accept the WebSocket connection.

    // Do NOT call server.accept() (this is the legacy approach and is not preferred)

    this.ctx.acceptWebSocket(server);


    return new Response(null, {

          status: 101,

          webSocket: client,

    });

},


async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void | Promise<void> {

  // Invoked on each WebSocket message.

  ws.send(message)

},


async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) void | Promise<void> {

  // Invoked when a client closes the connection.

  ws.close(code, "<message>");

},


async webSocketError(ws: WebSocket, error: unknown): void | Promise<void> {

  // Handle WebSocket errors

}

}

</implementation>

</pattern>

</api_patterns>


<user_prompt>

{user_prompt}

</user_prompt>


```

The prompt above adopts several best practices, including:

* Using `<xml>` tags to structure the prompt
* API and usage examples for products and use cases
* Guidance on how to generate configuration (for example, `wrangler.jsonc`) as part of the model's response
* Recommendations on Cloudflare products to use for specific storage or state needs

### Additional uses

You can use the prompt in several ways:

* Within the user context window, with your own user prompt inserted between the `<user_prompt>` tags (**easiest**)
* As the `system` prompt for models that support system prompts
* Adding it to the prompt library or file context in your preferred IDE:  
   * Cursor: add the prompt to [your Project Rules ↗](https://docs.cursor.com/context/rules-for-ai)  
   * Zed: use [the /file command ↗](https://zed.dev/docs/assistant/assistant-panel) to add the prompt to the Assistant context  
   * Windsurf: use [the @-mention command ↗](https://docs.codeium.com/chat/overview) to include a file containing the prompt to your Chat  
   * Claude Code: add the prompt to your `CLAUDE.md` configuration after running `/init` to include best practices to a Workers project  
   * GitHub Copilot: create the [.github/copilot-instructions.md ↗](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot) file at the root of your project and add the prompt

Note

The prompts here are examples and should be adapted to your specific use case.

Depending on the model and user prompt, it may generate invalid code, configuration, or other errors. Review and test the generated code before deploying it.

## Use docs in your editor

AI-enabled editors, including Cursor and Windsurf, can index documentation. Cursor includes the Cloudflare Developer Docs by default: you can use the [@Docs ↗](https://cursor.com/docs/context/mentions#docs) command.

In other editors, such as Zed or Windsurf, you can use `llms-full.txt` files to provide comprehensive documentation context for indexing. For Workers-specific documentation indexing, use [https://developers.cloudflare.com/workers/llms-full.txt ↗](https://developers.cloudflare.com/workers/llms-full.txt). For the complete Cloudflare documentation archive, use the root level [https://developers.cloudflare.com/llms-full.txt ↗](https://developers.cloudflare.com/llms-full.txt) instead.

You can also link an agent to `llms.txt` files while prompting to provide similar context without the need for offline indexing. For workers-specific documentation, use [https://developers.cloudflare.com/workers/llms.txt ↗](https://developers.cloudflare.com/workers/llms.txt). For context of the entire Cloudflare documentation, use the root level [https://developers.cloudflare.com/llms.txt ↗](https://developers.cloudflare.com/llms.txt).

The _Copy Page_ button is also available on any individual page to paste that page's content directly.

You can combine these with the Workers system prompt on this page to improve your editor or agent's understanding of the Workers APIs.

## Additional resources

To get the most out of AI models and tools, review the following guides on prompt engineering and structure:

* OpenAI's [prompt engineering ↗](https://platform.openai.com/docs/guides/prompt-engineering) guide and [best practices ↗](https://platform.openai.com/docs/guides/reasoning-best-practices) for using reasoning models.
* The [prompt engineering ↗](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) guide from Anthropic.
* Google's [quick start guide ↗](https://services.google.com/fh/files/misc/gemini-for-google-workspace-prompting-guide-101.pdf) for writing effective prompts.
* Meta's [prompting documentation ↗](https://www.llama.com/docs/how-to-guides/prompting/) for their Llama model family.
* GitHub's guide for [prompt engineering ↗](https://docs.github.com/en/copilot/using-github-copilot/copilot-chat/prompt-engineering-for-copilot-chat) when using Copilot Chat.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/workers/","name":"Workers"}},{"@type":"ListItem","position":3,"item":{"@id":"/workers/get-started/","name":"Getting started"}},{"@type":"ListItem","position":4,"item":{"@id":"/workers/get-started/prompting/","name":"Prompting"}}]}
```

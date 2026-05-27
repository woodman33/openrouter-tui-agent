# Cloudflare MCP Server

> A token-efficient MCP server for the entire Cloudflare API. 2500 endpoints in 1k tokens, powered by [Code Mode](https://blog.cloudflare.com/code-mode-mcp/).

## Token Comparison

| Approach                                    | Tools | Token cost | Context used (200K) |
| ------------------------------------------- | ----- | ---------- | ------------------- |
| Raw OpenAPI spec in prompt                  | —     | ~2,000,000 | 977%                |
| Native MCP (full schemas)                   | 2,594 | 1,170,523  | 585%                |
| Native MCP (minimal — required params only) | 2,594 | 244,047    | 122%                |
| Code mode                                   | 2     | 1,069      | 0.5%                |

## Get Started

MCP URL: `https://mcp.cloudflare.com/mcp`

### Option 1: OAuth (Recommended)

Just connect to the MCP server URL - you'll be redirected to Cloudflare to authorize and select permissions.

#### Example JSON Configuration

```json
{
  "mcpServers": {
    "cloudflare-api": {
      "url": "https://mcp.cloudflare.com/mcp"
    }
  }
}
```

### Option 2: API Token

For CI/CD, automation, or if you prefer managing tokens yourself.

Create a [Cloudflare API token](https://dash.cloudflare.com/profile/api-tokens) with the permissions you need. Both **user tokens** and **account tokens** are supported. For account tokens, include the **Account Resources : Read** permission so the server can auto-detect your account ID.

> **Note:** API tokens with **Client IP Address Filtering** enabled are not currently supported.

### Add to Agent

| Setting      | Value                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| MCP URL      | `https://mcp.cloudflare.com/mcp`                                            |
| Bearer Token | Your [Cloudflare API Token](https://dash.cloudflare.com/profile/api-tokens) |

### Disable Code Mode

If your MCP client already uses code mode, or you're composing this server with another server that uses code mode, you can disable it with the `?codemode=false` query parameter. This registers an individual tool for each of the ~2,500 Cloudflare API endpoints instead of the 2 code mode tools.

```
https://mcp.cloudflare.com/mcp?codemode=false
```

#### Example JSON Configuration

```json
{
  "mcpServers": {
    "cloudflare-api": {
      "url": "https://mcp.cloudflare.com/mcp?codemode=false"
    }
  }
}
```

When code mode is disabled:
- Each API endpoint is registered as its own tool (e.g., `get_workers_scripts`, `post_d1_database`)
- Tool input schemas are derived from the endpoint's path parameters, query parameters, and request body
- Tools make direct API calls — no code execution involved
- Path parameters like `account_id` are auto-resolved when possible (single account)

> **Note:** Disabling code mode significantly increases the token cost (~244k tokens vs ~1k tokens). Only disable it when necessary for composition with other code mode systems.

## The Problem

The Cloudflare OpenAPI spec is **2 million tokens**. Even with native MCP tools using minimal schemas, it's still **~244k tokens**. Traditional MCP servers that expose every endpoint as a tool leak this entire context to the main agent.

This server solves the problem by using **code execution** in a [Code Mode](https://blog.cloudflare.com/code-mode-mcp/) pattern - the spec lives on the server, and only the result of the code execution is returned to the agent.

## Tools

Agent writes code to search the spec and execute API calls.

| Tool      | Description                                                                   |
| --------- | ----------------------------------------------------------------------------- |
| `search`  | Write JavaScript to query `spec.paths` and find endpoints                     |
| `execute` | Write JavaScript to call `cloudflare.request()` with the discovered endpoints |

```
Agent                         MCP Server
  │                               │
  ├──search({code: "..."})───────►│ Execute code against spec.json
  │◄──[matching endpoints]────────│
  │                               │
  ├──execute({code: "..."})──────►│ Execute code against Cloudflare API
  │◄──[API response]──────────────│
```

## Supported Products

Workers, KV, R2, D1, Pages, DNS, Firewall, Load Balancers, Stream, Images, AI Gateway, Vectorize, Access, Gateway, and more. See the full [Cloudflare API schemas](https://github.com/cloudflare/api-schemas).

## Usage

Once configured, just ask your agent to do things with Cloudflare:

- "List all my Workers"
- "Create a KV namespace called 'my-cache'"
- "Add an A record for api.example.com pointing to 192.0.2.1"

The agent will search for the right endpoints and execute the API calls. Here's what happens behind the scenes:

```javascript
// 1. Search for endpoints
search({
  code: `async () => {
    const results = [];
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        if (op.tags?.some(t => t.toLowerCase() === 'workers')) {
          results.push({ method: method.toUpperCase(), path, summary: op.summary });
        }
      }
    }
    return results;
  }`,
});

// 2. Execute API call (user token - account_id required)
execute({
  code: `async () => {
    const response = await cloudflare.request({
      method: "GET",
      path: \`/accounts/\${accountId}/workers/scripts\`
    });
    return response.result;
  }`,
  account_id: "your-account-id",
});

// 2. Execute API call (account token - account_id auto-detected)
execute({
  code: `async () => {
    const response = await cloudflare.request({
      method: "GET",
      path: \`/accounts/\${accountId}/workers/scripts\`
    });
    return response.result;
  }`,
});
```

### GraphQL Analytics API

The server automatically detects and handles Cloudflare's GraphQL Analytics API endpoints. GraphQL queries work seamlessly through the same `execute` tool:

```javascript
execute({
  code: `async () => {
    const response = await cloudflare.request({
      method: "POST",
      path: "/client/v4/graphql",
      body: {
        query: \`query {
          viewer {
            zones(filter: { zoneTag: "your-zone-id" }) {
              httpRequests1dGroups(limit: 7, orderBy: [date_ASC]) {
                dimensions {
                  date
                }
                sum {
                  requests
                  bytes
                  cachedBytes
                }
              }
            }
          }
        }\`,
        variables: {}
      }
    });
    return response.result;
  }`,
  account_id: "your-account-id",
});
```

## Build a Code Mode MCP Server

Code execution uses Cloudflare's [Dynamic Worker Loader API](https://developers.cloudflare.com/workers/runtime-apis/bindings/worker-loader/) to run generated code in isolated Workers, following the [Code Mode pattern](https://github.com/cloudflare/agents/tree/main/packages/codemode).

Read the [Code Mode SDK docs](https://developers.cloudflare.com/agents/api-reference/codemode/) for more info.

### Resources

- [Code Mode blog post](https://blog.cloudflare.com/code-mode/)
- [Build your own remote MCP server](https://developers.cloudflare.com/agents/guides/remote-mcp-server/)
- [Cloudflare's own MCP Servers](https://github.com/cloudflare/mcp-server-cloudflare# Cloudflare MCP Server

Model Context Protocol (MCP) is a [new, standardized protocol](https://modelcontextprotocol.io/introduction) for managing context between large language models (LLMs) and external systems. In this repository, you can find several MCP servers allowing you to connect to Cloudflare's service from an MCP client (e.g. Cursor, Claude) and use natural language to accomplish tasks through your Cloudflare account.

These MCP servers allow your [MCP Client](https://modelcontextprotocol.io/clients) to read configurations from your account, process information, make suggestions based on data, and even make those suggested changes for you. All of these actions can happen across Cloudflare's many services including application development, security and performance.

They support both the `streamable-http` transport via `/mcp` and the `sse` transport (deprecated) via `/sse`.

The following servers are included in this repository:

| Server Name                                                    | Description                                                                                     | Server URL                                     |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [**Documentation server**](/apps/docs-vectorize)               | Get up to date reference information on Cloudflare                                              | `https://docs.mcp.cloudflare.com/mcp`          |
| [**Workers Bindings server**](/apps/workers-bindings)          | Build Workers applications with storage, AI, and compute primitives                             | `https://bindings.mcp.cloudflare.com/mcp`      |
| [**Workers Builds server**](/apps/workers-builds)              | Get insights and manage your Cloudflare Workers Builds                                          | `https://builds.mcp.cloudflare.com/mcp`        |
| [**Observability server**](/apps/workers-observability)        | Debug and get insight into your application's logs and analytics                                | `https://observability.mcp.cloudflare.com/mcp` |
| [**Radar server**](/apps/radar)                                | Get global Internet traffic insights, trends, URL scans, and other utilities                    | `https://radar.mcp.cloudflare.com/mcp`         |
| [**Container server**](/apps/sandbox-container)                | Spin up a sandbox development environment                                                       | `https://containers.mcp.cloudflare.com/mcp`    |
| [**Browser rendering server**](/apps/browser-rendering)        | Fetch web pages, convert them to markdown and take screenshots                                  | `https://browser.mcp.cloudflare.com/mcp`       |
| [**Logpush server**](/apps/logpush)                            | Get quick summaries for Logpush job health                                                      | `https://logs.mcp.cloudflare.com/mcp`          |
| [**AI Gateway server**](/apps/ai-gateway)                      | Search your logs, get details about the prompts and responses                                   | `https://ai-gateway.mcp.cloudflare.com/mcp`    |
| [**Audit Logs server**](/apps/auditlogs)                       | Query audit logs and generate reports for review                                                | `https://auditlogs.mcp.cloudflare.com/mcp`     |
| [**DNS Analytics server**](/apps/dns-analytics)                | Optimize DNS performance and debug issues based on current set up                               | `https://dns-analytics.mcp.cloudflare.com/mcp` |
| [**Digital Experience Monitoring server**](/apps/dex-analysis) | Get quick insight on critical applications for your organization                                | `https://dex.mcp.cloudflare.com/mcp`           |
| [**Cloudflare One CASB server**](/apps/cloudflare-one-casb)    | Quickly identify any security misconfigurations for SaaS applications to safeguard users & data | `https://casb.mcp.cloudflare.com/mcp`          |
| [**GraphQL server**](/apps/graphql/)                           | Get analytics data using Cloudflare’s GraphQL API                                               | `https://graphql.mcp.cloudflare.com/mcp`       |

## Which Cloudflare MCP server should you use?

Cloudflare provides two categories of MCP servers:

- **Code Mode server** (`mcp.cloudflare.com`) in [`cloudflare/mcp`](https://github.com/cloudflare/mcp):
  best when you want broad access across Cloudflare's APIs through code execution.
- **Domain-specific servers** (`*.mcp.cloudflare.com`) in this repository:
  best when you want curated, typed tools for a specific Cloudflare product area.

### When should you use each?

Use the **Code Mode server** when:

- you need broad API coverage across many Cloudflare products
- you prefer a smaller set of general-purpose tools
- your workflow is better served by code execution

Use the **domain-specific servers** in this repository when:

- you want purpose-built tools for a specific product area
- you want more guided, typed interactions
- you are working primarily within one Cloudflare domain such as observability, bindings, Radar, or Browser Rendering

Learn more about the Code Mode server here: [`cloudflare/mcp`](https://github.com/cloudflare/mcp).

## Access the remote MCP server from any MCP client

If your MCP client has first class support for remote MCP servers, the client will provide a way to accept the server URL directly within its interface (e.g. [Cloudflare AI Playground](https://playground.ai.cloudflare.com/))

If your client does not yet support remote MCP servers, you will need to set up its respective configuration file using mcp-remote (https://www.npmjs.com/package/mcp-remote) to specify which servers your client can access.

```json
{
	"mcpServers": {
		"cloudflare-observability": {
			"command": "npx",
			"args": ["mcp-remote", "https://observability.mcp.cloudflare.com/mcp"]
		},
		"cloudflare-bindings": {
			"command": "npx",
			"args": ["mcp-remote", "https://bindings.mcp.cloudflare.com/mcp"]
		}
	}
}
```

## Using Cloudflare's MCP servers from the OpenAI Responses API

To use one of Cloudflare's MCP servers with [OpenAI's responses API](https://openai.com/index/new-tools-and-features-in-the-responses-api/), you will need to provide the Responses API with an API token that has the scopes (permissions) required for that particular MCP server.

For example, to use the [Browser Rendering MCP server](https://github.com/cloudflare/mcp-server-cloudflare/tree/main/apps/browser-rendering) with OpenAI, create an API token in the Cloudflare dashboard [here](https://dash.cloudflare.com/profile/api-tokens), with the following permissions:

<img width="937" alt="Screenshot 2025-05-21 at 10 38 02 AM" src="https://github.com/user-attachments/assets/872e253f-23ce-43b3-983c-45f9d0f66100" />

## Need access to more Cloudflare tools?

We're continuing to add more functionality to this remote MCP server repo. If you'd like to leave feedback, file a bug or provide a feature request, [please open an issue](https://github.com/cloudflare/mcp-server-cloudflare/issues/new/choose) on this repository

## Troubleshooting

"Claude's response was interrupted ... "

If you see this message, Claude likely hit its context-length limit and stopped mid-reply. This happens most often on servers that trigger many chained tool calls such as the observability server.

To reduce the chance of running in to this issue:

- Try to be specific, keep your queries concise.
- If a single request calls multiple tools, try to to break it into several smaller tool calls to keep the responses short.

## Paid Features

Some features may require a paid Cloudflare Workers plan. Ensure your Cloudflare account has the necessary subscription level for the features you intend to use.

## Contributing

Interested in contributing, and running this server locally? See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.)
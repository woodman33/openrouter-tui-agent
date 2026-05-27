# Cloudflare Skills

A collection of [Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) for building on Cloudflare, Workers, the Agents SDK, and the wider Cloudflare Developer Platform.

## Installing

These skills work with any agent that supports the Agent Skills standard, including Claude Code, OpenCode, OpenAI Codex, and Pi.

### Claude Code

Install using the [plugin marketplace](https://code.claude.com/docs/en/discover-plugins#add-from-github):

```
/plugin marketplace add cloudflare/skills
/plugin install cloudflare@cloudflare
```

### Cursor

Install from the Cursor Marketplace or add manually via **Settings > Rules > Add Rule > Remote Rule (Github)** with `cloudflare/skills`.

### npx skills

Install using the [`npx skills`](https://skills.sh) CLI:

```
npx skills add https://github.com/cloudflare/skills
```

### Clone / Copy

Clone this repo and copy the skill folders into the appropriate directory for your agent:

| Agent | Skill Directory | Docs |
|-------|-----------------|------|
| Claude Code | `~/.claude/skills/` | [docs](https://code.claude.com/docs/en/skills) |
| Cursor | `~/.cursor/skills/` | [docs](https://cursor.com/docs/context/skills) |
| OpenCode | `~/.config/opencode/skills/` | [docs](https://opencode.ai/docs/skills/) |
| OpenAI Codex | `~/.codex/skills/` | [docs](https://developers.openai.com/codex/skills/) |
| Pi | `~/.pi/agent/skills/` | [docs](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent#skills) |

## Commands

Commands are user-invocable slash commands that you explicitly call.

| Command | Description |
|---------|-------------|
| `/cloudflare:build-agent` | Build an AI agent on Cloudflare using the Agents SDK |
| `/cloudflare:build-mcp` | Build an MCP server on Cloudflare |

## Skills

Skills are contextual and auto-loaded based on your conversation. When a request matches a skill's triggers, the agent loads and applies the relevant skill to provide accurate, up-to-date guidance.

| Skill | Useful for |
|-------|------------|
| cloudflare | Comprehensive platform skill covering Workers, Pages, storage (KV, D1, R2), AI (Workers AI, Vectorize, Agents SDK), networking (Tunnel, Spectrum), security (WAF, DDoS), and IaC (Terraform, Pulumi) |
| agents-sdk | Building stateful AI agents with state, scheduling, RPC, MCP servers, email, and streaming chat |
| durable-objects | Stateful coordination (chat rooms, games, booking), RPC, SQLite, alarms, WebSockets |
| sandbox-sdk | Secure code execution for AI code execution, code interpreters, CI/CD systems, and interactive dev environments |
| wrangler | Deploying and managing Workers, KV, R2, D1, Vectorize, Queues, Workflows |
| web-perf | Auditing Core Web Vitals (FCP, LCP, TBT, CLS), render-blocking resources, network chains |
| building-mcp-server-on-cloudflare | Building remote MCP servers with tools, OAuth, and deployment |
| building-ai-agent-on-cloudflare | Building AI agents with state, WebSockets, and tool integration |

## MCP Servers

This plugin includes [Cloudflare's remote MCP servers](https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/) for enhanced functionality:

| Server | Purpose |
|--------|---------|
| cloudflare-api | Manage Cloudflare account resources, zones, and settings |
| cloudflare-docs | Up-to-date Cloudflare documentation and reference |
| cloudflare-bindings | Build Workers applications with storage, AI, and compute primitives |
| cloudflare-builds | Manage and get insights into Workers builds |
| cloudflare-observability | Debug and analyze application logs and analytics |

## Resources

- [Cloudflare Agents Documentation](https://developers.cloudflare.com/agents/)
- [Cloudflare MCP Guide](https://developers.cloudflare.com/agents/model-context-protocol/)
- [Agents SDK Repository](https://github.com/cloudflare/agents)
- [Agents Starter Template](https://github.com/cloudflare/agents-starterSkills are instructions the agent loads on demand. The cloudflare/skills bundle covers every layer of the platform — so the agent knows your conventions without you re-explaining them.
agents-sdk Build AI agents on Cloudflare Workers using the Agents SDK. Load when creating stateful agents, durable workflows, real-time WebSocket apps, scheduled tasks, MCP servers, chat applications, voice agents, or browser automation. Covers Agent class, state management, callable RPC, Workflows, durable execution, queues, retries, observability, and React hooks. Biases towards retrieval from Cloudflare docs over pre-trained knowledge.
cloudflare Comprehensive Cloudflare platform skill covering Workers, Pages, storage (KV, D1, R2), AI (Workers AI, Vectorize, Agents SDK), feature flags (Flagship), networking (Tunnel, Spectrum), security (WAF, DDoS), and infrastructure-as-code (Terraform, Pulumi). Use for any Cloudflare development task. Biases towards retrieval from Cloudflare docs over pre-trained knowledge.
cloudflare-email-service Send and receive transactional emails with Cloudflare Email Service (Email Sending + Email Routing). Use when building email sending (Workers binding or REST API), email routing, Agents SDK email handling, or integrating email into any app — Workers, Node.js, Python, Go, etc. Also use for email deliverability, SPF/DKIM/DMARC, wrangler email setup, MCP email tools, or when a coding agent needs to send emails. Even for simple requests like "add email to my Worker" — this skill has critical config details.
durable-objects Create and review Cloudflare Durable Objects. Use when building stateful coordination (chat rooms, multiplayer games, booking systems), implementing RPC methods, SQLite storage, alarms, WebSockets, or reviewing DO code for best practices. Covers Workers integration, wrangler config, and testing with Vitest. Biases towards retrieval from Cloudflare docs over pre-trained knowledge.
sandbox-sdk Build sandboxed applications for secure code execution. Load when building AI code execution, code interpreters, CI/CD systems, interactive dev environments, or executing untrusted code. Covers Sandbox SDK lifecycle, commands, files, code interpreter, and preview URLs. Biases towards retrieval from Cloudflare docs over pre-trained knowledge.
web-perf Analyzes web performance using Chrome DevTools MCP. Measures Core Web Vitals (LCP, INP, CLS) and supplementary metrics (FCP, TBT, Speed Index), identifies render-blocking resources, network dependency chains, layout shifts, caching issues, and accessibility gaps. Use when asked to audit, profile, debug, or optimize page load performance, Lighthouse scores, or site speed. Biases towards retrieval from current documentation over pre-trained knowledge.
workers-best-practices Reviews and authors Cloudflare Workers code against production best practices. Load when writing new Workers, reviewing Worker code, configuring wrangler.jsonc, or checking for common Workers anti-patterns (streaming, floating promises, global state, secrets, bindings, observability). Biases towards retrieval from Cloudflare docs over pre-trained knowledge.
wrangler Cloudflare Workers CLI for deploying, developing, and managing Workers, KV, R2, D1, Vectorize, Hyperdrive, Workers AI, Containers, Queues, Workflows, Pipelines, and Secrets Store. Load before running wrangler commands to ensure correct syntax and best practices. Biases towards retrieval from Cloudflare docs over pre-trained knowledge.
MCP servers provide typed tools to call into Cloudflare at runtime. There are two options: Code Mode — a single server that covers the entire Cloudflare API (2,500+ endpoints in ~1,000 tokens) — or a set of focused, domain-specific servers hosted in the cloudflare/mcp-server-cloudflare repo. The full catalog is also in the MCP servers for Cloudflare docs.
Code mode API CODE MODE  Broad access to the full Cloudflare API via code execution, with minimal token overhead
https://mcp.cloudflare.com/mcp
AI Gateway server Search your logs, get details about the prompts and responses
https://ai-gateway.mcp.cloudflare.com/mcp
Audit Logs server Query audit logs and generate reports for review
https://auditlogs.mcp.cloudflare.com/mcp
Workers Bindings server Build Workers applications with storage, AI, and compute primitives
https://bindings.mcp.cloudflare.com/mcp
Browser rendering server Fetch web pages, convert them to markdown and take screenshots
https://browser.mcp.cloudflare.com/mcp
Workers Builds server Get insights and manage your Cloudflare Workers Builds
https://builds.mcp.cloudflare.com/mcp
Cloudflare One CASB server Quickly identify any security misconfigurations for SaaS applications to safeguard users & data
https://casb.mcp.cloudflare.com/mcp
Container server Spin up a sandbox development environment
https://containers.mcp.cloudflare.com/mcp
Digital Experience Monitoring server Get quick insight on critical applications for your organization
https://dex.mcp.cloudflare.com/mcp
DNS Analytics server Optimize DNS performance and debug issues based on current set up
https://dns-analytics.mcp.cloudflare.com/mcp
Documentation server Get up to date reference information on Cloudflare
https://docs.mcp.cloudflare.com/mcp
GraphQL server Get analytics data using Cloudflare’s GraphQL API
https://graphql.mcp.cloudflare.com/mcp
Logpush server Get quick summaries for Logpush job health
https://logs.mcp.cloudflare.com/mcp
Observability server Debug and get insight into your application's logs and analytics
https://observability.mcp.cloudflare.com/mcp
Radar server Get global Internet traffic insights, trends, URL scans, and other utilities
https://radar.mcp.cloudflare.com/mcp)
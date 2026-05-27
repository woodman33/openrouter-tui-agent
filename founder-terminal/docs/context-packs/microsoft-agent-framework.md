---
id: microsoft-agent-framework
version: 1.0.0
title: Microsoft Agent Framework Context Pack
description: Official guidelines, playbooks, and multi-agent orchestration designs for the Microsoft Agent Framework (enterprise‑ready successor to AutoGen).
last_verified: 2026-05-26
source_type: official docs
source_url: https://github.com/microsoft/autogen
license: MIT
citation_map:
  maf_core: https://github.com/microsoft/autogen
  migration_guide: https://microsoft.github.io/autogen/docs/migration-guide
unstable_api_flags:
  - maf/agent-chat-streaming-beta
deprecated_api_flags:
  - autogen/v0.2-legacy-framework
---

# Microsoft Agent Framework Context Pack

This document outlines the standard operational specifications for the **Microsoft Agent Framework (MAF)** (formerly AutoGen in Maintenance Mode).

> [!IMPORTANT]
> **AutoGen Succession & Enterprise Support**:
> * AutoGen v0.2 is in **community maintenance mode** and will not receive new features.
> * **Microsoft Agent Framework (MAF) 1.0** is the production-ready enterprise successor featuring stable APIs, multi-provider model support, and cross-runtime interoperability via Agent-to-Agent (A2A) and MCP.

## Installation

```bash
# Install AgentChat and OpenAI client from Extensions
pip install -U "autogen-agentchat" "autogen-ext[openai]"

# Install AutoGen Studio for no-code GUI
pip install -U "autogenstudio"
```

## MCP Resources

The framework natively implements client-side MCP Stdio and WebSocket parameters:

### playwright_mcp_config
Playwright browser automation MCP workbench client specification:
```python
from autogen_ext.tools.mcp import StdioServerParams

server_params = StdioServerParams(
    command="npx",
    args=["@playwright/mcp@latest", "--headless"],
)
```

## MCP Prompts

### maf_hello_world
Use the following hello world runner:
```python
import asyncio
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient

async def main() -> None:
    model_client = OpenAIChatCompletionClient(model="gpt-4o")
    agent = AssistantAgent("assistant", model_client=model_client)
    print(await agent.run(task="Say 'Hello World!'"))
    await model_client.close()

asyncio.run(main())
```

### multi_agent_orchestration
Multi-agent expert tools orchestration structure:
```python
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.tools import AgentTool
from autogen_agentchat.ui import Console

math_agent = AssistantAgent("math_expert", model_client=model_client, system_message="Math expert.")
math_agent_tool = AgentTool(math_agent, return_value_as_last_message=True)

general_agent = AssistantAgent(
    "assistant",
    model_client=model_client,
    tools=[math_agent_tool],
    max_tool_iterations=10,
)
```

## MCP Tools

- **run_maf_agent**: Spin up an isolated Microsoft Agent Framework worker.
- **deploy_mcp_workbench**: Bind multiple MCP Stdio servers to the agent workspace.

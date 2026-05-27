---
id: openrouter-agent-sdk
version: 1.1.0
title: OpenRouter Agent SDK Context Pack
description: Canonical developer guidelines and context for the @openrouter/agent SDK runtime.
last_verified: 2026-05-26
source_type: official docs
source_url: https://openrouter.ai/docs/sdks/typescript/call-model/overview
license: MIT
citation_map:
  sdk_core: https://openrouter.ai/docs/sdks
  auto_exacto: https://openrouter.ai/announcements/auto-exacto
unstable_api_flags:
  - openrouter/auto-exacto-v2 (unstable beta)
deprecated_api_flags:
  - openrouter/legacy-completion-api
---

# OpenRouter Agent SDK Context Pack

This document outlines the standard operational specifications for the **OpenRouter Agent SDK** integration.

## MCP Resources

The following resources are exposed for AI coding agents to reference API parameters:

### call_model_docs
The core `callModel` function parameters are:
- `model` (string, required): Model identifier from OpenRouter catalog.
- `messages` (array, required): Array of chat message objects (`role`, `content`).
- `tools` (array, optional): Array of tool definition schemas.
- `options` (object, optional): Includes context caching configurations.

### caching_caching
To enforce context caching on OpenRouter, add the header:
`X-OpenRouter-Cache: true`
This significantly lowers prompt tokens overhead for large recurring prompt templates.

## MCP Prompts

### call_model_brief
Use the following prompt format when writing model routing integrations:
```markdown
Write a stateful model selection adapter that checks spent session costs and dynamically falls back from Anthropic Claude Sonnet 4 to google/gemini-2.5-pro or emergency flash targets.
```

## MCP Tools

The context pack exposes these tools for automated validations:
- **search_docs**: Search the local OpenRouter SDK guidelines.
- **cite_claim**: Validate API calls against core OpenRouter parameters.

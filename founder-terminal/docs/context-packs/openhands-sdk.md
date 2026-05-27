---
id: openhands-sdk
version: 1.0.0
title: OpenHands SDK Context Pack
description: Governing guidelines and context for invoking OpenHands external agent runner securely.
last_verified: 2026-05-27
source_type: official docs
source_url: https://github.com/All-Hands-AI/OpenHands
license: MIT
citation_map:
  cli_usage: https://github.com/All-Hands-AI/OpenHands/wiki/CLI
unstable_api_flags: []
deprecated_api_flags: []
---

# OpenHands SDK Context Pack

This document outlines the governed operational specifications for running the **OpenHands** external agent sandbox within TIMMY.

## MCP Resources

### openhands_cli_specs
CLI usage:
- `openhands --task "<task>"`: Executes the specified task in the sandbox.
- `--mode`: Can be `headless` or `gui` mode.

## MCP Prompts

### run_headless_prompt
Standard system task prompt for headless runs:
```markdown
Run the OpenHands CLI in headless governed mode with safe read-only operations.
```

## MCP Tools

The context pack exposes these tools for automated validations:
- **validate_task**: Ensure tasks don't violate safety guidelines.

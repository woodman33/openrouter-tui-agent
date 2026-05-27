---
id: canva-apps-sdk
version: 2.3.0
title: Canva Apps SDK Context Pack
description: Canonical developer guidelines and API references for Canva App extension and integration layouts.
last_verified: 2026-05-26
source_type: official docs
source_url: https://www.canva.dev/docs/apps/
license: Canva Developer License
citation_map:
  sdk_core: https://www.canva.dev/docs/apps/getting-started/
  ui_kit: https://www.canva.dev/docs/apps/design-system/
unstable_api_flags:
  - canva/ai-generation-v2 (unstable beta)
deprecated_api_flags:
  - canva/legacy-media-uploader
---

# Canva Apps SDK Context Pack

This document outlines the standard operational specifications for the **Canva Apps SDK** integration.

## MCP Resources

The following resources are exposed for AI coding agents to reference:

### app_layout_spec
Canva extensions require responsive layouts utilizing grid configurations.
- Use Canva design system components.
- Do not inject custom style files that override the host canvas layer.
- Retain proper tap targets sizing (>= 48px).

### auth_flow_spec
Canvas SDK authentication uses OAuth 2.0 PKCE authentication flow.

## MCP Prompts

### layout_scaffold_brief
Use the following prompt format when creating Canva integrations:
```markdown
Scaffold a canvas-app UI element rendering a modern, responsive grid. Retain accessibility tags (ARIA labels) and secure callback handlers.
```

## MCP Tools

- **validate_api_usage**: Verify API usage compatibility.
- **diff_against_docs**: Verify implementation diff against the canvas guidelines.

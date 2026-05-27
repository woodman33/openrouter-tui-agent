---
id: openverse-openapi
version: 0.1.0
title: Openverse OpenAPI Context Pack
description: Governing guidelines and OpenAPI endpoint mappings for the openly licensed Openverse digital media search platform.
last_verified: 2026-05-26
source_type: official docs
source_url: https://api.openverse.org/v1/
license: Creative Commons CC0
citation_map:
  media_specs: https://api.openverse.org/v1/image/
unstable_api_flags:
  - openverse/image-search-beta
deprecated_api_flags: []
---

# Openverse OpenAPI Context Pack

This document outlines the standard operational specifications for the **Openverse OpenAPI** media search integration.

> [!WARNING]
> **Openverse License & Compliance Warning**:
> * Openverse is an openly licensed and public domain media discovery platform.
> * While the platform indexes open creative works, **individual asset licenses must still be verified** by the operator before any commercial use.
> * Ingestion of this context pack grants documentation context and API integration specs only; it does not grant or transfer any media usage rights or guarantees.

## MCP Resources

The following resources are exposed for creative-media asset workflows:

### image_search_spec
The core `/v1/images/` endpoint requires:
- `q` (string, required): Query string to search for openly licensed digital media assets.
- `license` (string, optional): CC0, CC-BY, etc.
- `page_size` (number, optional): Page footprint constraint.

### audio_search_spec
The audio search endpoints `/v1/audio/` allows filtering by sound effects, duration, and artist metadata.

## MCP Prompts

### media_attribution_brief
Use the following prompt format when compiling license manifests:
```markdown
Formulate an automated license attribution manifest for all ingested Creative Commons media assets, verifying license metadata before commercial distribution.
```

## MCP Tools

- **search_media**: Search Openverse programmatic CC digital assets catalog.
- **validate_license**: Verify Creative Commons license declarations.

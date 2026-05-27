# TIMMY Strategy — Go To Market & Monetization Blueprint

This document outlines the market launch and pricing framework for TIMMY.

---

## 💰 The Monetization Engine: Context Pack Store
The primary bottleneck for AI coding agents is context: **agents fail because their context is stale, missing, or unsafe.** 

Instead of a generic TUI extension store, TIMMY monetizes the actual bottleneck by selling **verified coding context packs** by subscription tier.

### 💳 Pricing & Subscriptions Matrix

| Product Tier | Price Target | What Buyer Gets | Active Registry Packs |
|---|---|---|---|
| **Free Context Packs** | $0 | OpenRouter SDK, Openverse OpenAPI, public specs | `openrouter-agent-sdk`, `openverse-openapi` |
| **Builder Packs** | $19 / mo | Cloudflare Workers, OpenHands SDK, x-cmd profiles, RAG packs | `cloudflare-workers` |
| **Pro Packs** | $49 / mo | Canva Apps SDK, Shopify Functions, Stripe Apps, advanced templates | `canva-apps-sdk` |
| **Team Packs** | $199+ / mo | Private codebase maps, team doctrine, custom MCP tools, run tracking | `private-docs` |
| **Enterprise** | Custom | On-prem context embassy, compliance receipts, automated citation audits | Custom namespaces |

---

## 🚀 V1.6+ Roadmap: The Context Supply Chain Moat - "Context Refinery"
Our strategic roadmap leverages high-performance hardware (DGX Sparks + NAS) as the **Context Refinery**:
1. **DGX Sparks**: Continuously scrape docs, parse OpenAPI specifications, create MCP tool bindings, and execute automated citation audits and LLM benchmarks against each pack.
2. **NAS Storage**: Persist raw source snapshots, pack histories, and Vectorize semantic embeddings.
3. **Cloudflare Gateway**: Expose and distribute future signed context pack registry indexes to local TIMMY clients gated by AgentPass entitlements.
4. **TIMMY (Local Trust Layer)**: Gathers context packs locally, verifies their hashes and freshness, gates execution, and exports replayable `.agentrun` proof packages. Cloudflare Durable Objects and WebSocket Hibernation belong in future scope until built.

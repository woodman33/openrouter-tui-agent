# TIMMY Porter: Ingestion & Translation Bridge

## Definition

**TIMMY Porter** (also referred to as the **MCPorter Bridge**) is our high-performance protocol translation layer. It acts as the ingestion bridge that translates third-party capabilities—MCP servers, OpenAPI specifications, SDK documentation, GitHub repositories, and package archives—into cleanly governed CLI commands and context packs.

---

## Ingestion Flow: URL ➔ Capability ➔ Control ➔ Proof ➔ Reuse

TIMMY Porter automates the path from third-party raw potential to structured governed work:

```
[Target URL] 
     │
     ▼
1. TIMMY Porter Ingestion (Proposes capability metadata & risk class)
     │
     ▼
2. AgentPass Scope Alignment (Operator grants visas & scopes)
     │
     ▼
3. Run Workspace Chamber (Executes commands in isolated sandbox)
     │
     ▼
4. .agentrun Receipt Stamp (Verifiable verification record)
     │
     ▼
5. .pi Pack Export (Reusable context registry packaging)
```

---

## Core Relationships

### 1. Model Context Protocol (MCP) Tools
* **Relationship**: TIMMY Porter ingests raw MCP servers or URLs and translates their schema declarations into highly reliable local CLI wrappers.

### 2. CLI Wrappers
* **Relationship**: Porter transforms complex API specifications into standard shell execution strings that TaskForge orchestrators can easily consume and track in background tmux cluster chambers.

### 3. AgentPass Authorization
* **Relationship**: Porter assigns a **Risk Class** (Low, Medium, High) to each ingested capability. High-risk actions automatically demand explicit AgentPass scopes or temporary visas from the operator before execution.

### 4. Receipts (.agentrun)
* **Relationship**: Ingested tools map their success markers directly to `.agentrun` receipt proof schema templates, ensuring every executed action generates a verifiable telemetry record.

---

## Tool Description Grading

Why do tool descriptions need strict grading?
1. **Semantic Route Clarity**: LLMs require crystal-clear, non-ambiguous tool schemas to make accurate decisions. Low-grade descriptions cause severe model hallucinations.
2. **Context Efficiency**: Bloated or vague descriptions waste valuable context length.
3. **Audit Readiness**: Clear schemas are required for expert graders to verify that execution matches intent.

---

## Safety Governance Rules

TIMMY Porter enforces strict defensive sandboxing:
1. **No Live Unknown URL Ingestion**: Proposing a URL parses the schema metadata in a safe local parser. It NEVER runs arbitrary scraping or ingestion streams on untrusted sources.
2. **No Arbitrary Code Execution**: Ingested scripts are mapped to static CLI commands. They are never executed directly outside of governed Daytona or Firecracker sandboxes.
3. **No Key Leaks**: Secrets and credential bindings are kept strictly inside the operator context vault and are never passed to the external Porter registry.

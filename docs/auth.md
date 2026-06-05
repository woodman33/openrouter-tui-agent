# TIMMY Auth Doctrine: Passports, Visas, Stamps, Receipts

TIMMY adapts the concept of agentic registration from modern human auth models (such as the WorkOS `auth.md` spec) into a governed, local authority framework custom-built for AI agents. 

> [!IMPORTANT]
> **Operational Scope Note**: The TIMMY `auth.md` document is a local **authority doctrine** and specification manual. It does **not** implement or initialize a runtime WorkOS client or live OAuth endpoints.
> - **Human Authentication**: A future-compatible identity layer (designed for WorkOS, Clerk, Cloudflare Access, Auth0, or SSO integrations) answering *"Who is the human operator?"*
> - **Agent Authority**: Active local enforcement of machine permissions (implemented through **Passports, Visas, AgentPass scopes, Stamps, and Receipts**) answering *"What is this agent allowed to do?"*

We separate human identity from machine permissions:
* **Humans log in** to establish the operator identity.
* **Agents show passports** to claim identity inside a team.
* **Tools require visas** to execute actions.
* **Receipts prove the trip** via a verifiable, audit-ready ledger.

---

## Technical Concept: Human Auth vs. Agent Authority

A critical distinction is maintained between human login mechanisms and agent operational boundaries:

1. **Human Authentication**:
   - Identifies the human operator.
   - Future-compatible with systems like Clerk, WorkOS, Cloudflare Access, Auth0, or enterprise SSO.
   - Answers: *"Who is the human operator?"*
2. **Agent Authority**:
   - Governs the sandboxed tasks, file interactions, and tool capabilities permitted for AI subagents.
   - Enforced locally through the **AgentPass** policy suite.
   - Answers: *"What is this agent allowed to do right now?"*

### Authority Flow

```
Human login
  ➔ selects TIMMY Workspace Root
    ➔ selects TIMMY Team
      ➔ agent presents Passport
        ➔ task requests Visa
          ➔ tool call receives Stamp
            ➔ run creates sealed TIMMY Receipt
```

---

## Comparison Matrix

| Aspect / Attribute | Human Authentication | Agent Authority |
| :--- | :--- | :--- |
| **Primary System** | Clerk / WorkOS / Cloudflare Access / SSO | AgentPass |
| **Core Actor** | Human Operator | AI Subagent / Tool Registry |
| **Identity Entity** | User Session | TIMMY Passport |
| **Permission Duration**| Persistent Session | Temporary Task-Bound Visa |
| **Action Record** | Browser Session Audits | Event-Level Stamp |
| **Verification Proof** | Auth Tokens (JWT) | Sealed TIMMY Receipt |

---

## Core Definitions

### TIMMY Passport
A persistent identity record representing a specific agent, subagent team, tool registry, or pipeline workflow.
- **Answers**: *"Who is acting?"*
- **Storage**: Defined locally in `auth/passports.md` or `.timmy/workspace.json`.

### TIMMY Visa
A temporary, context-bound permission grant issued for a single task, tool invocation, or execution pipeline.
- **Answers**: *"What is this actor allowed to do right now?"*
- **Mechanism**: Validated dynamically prior to executing any sandboxed CLI or shell commands.

### AgentPass Scope
A machine-readable permission identifier prefix denoting structural capability boundaries.
- **Examples**:
  - `model.openrouter.execute` — Allow executing OpenRouter prompts.
  - `tool.canva.inspect` — Permit reading Canva MCP schemas.
  - `tool.wavespeed.generate_image` — Allow invoking image synthesis tools.
  - `fs.read.workspace` — Allow scanning the local file tree.
  - `fs.write.approved` — Authorize approved file mutations.
  - `receipt.local.write` — Permit committing records to the receipt ledger.
  - `porter.mcp.inspect` — Enable searching MCP capability configurations.

### TIMMY Stamp
An event-level audit marker generated during a tool invocation, human approval, execution block, or receipt state transition.
- **Answers**: *"What happened at this step?"*

### TIMMY Receipt
A final, tamper-evident, hash-bound, verifiable proof artifact summarizing the run input, agent responses, command telemetry, and file mutations.
- **Answers**: *"What happened across the entire run?"*
- **Guarantees**: Sealed receipts are hash-bound to a full 64-character SHA-256 manifest hash of the execution run workspace snapshot.

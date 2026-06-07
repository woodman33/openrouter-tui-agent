# TIMMY Workspace Root: Governed Local-First Operations

The **TIMMY Workspace Root** establishes a secure, local-first runtime foundation for TIMMYTUI. Rather than operating as a heavy, bloated IDE, TIMMY serves as an intelligent local workspace coordinator, orchestrating toolchains, sandboxes, policies, and evidence receipts under one unified root folder.

---

## Workspace Directory Structure

A fully initialized governed TIMMY Workspace Root contains the following subfolders and descriptors:

```
TIMMY_WORKSPACE_ROOT/
├── code/                         # Active project files and working codebases
├── agents/                       # Local agent process allocations
├── skills/                       # Capability definitions (e.g., example-skill/SKILL.md)
├── souls/                        # Agent behavior/mission configurations (e.g., SOUL.md)
├── context/                      # Ingested documentation books and long-term memory
├── porter-packs/                 # Governed MCP/CLI protocol adapter tool packs
├── receipts/                     # Local verifiable run receipt summaries (.agentrun)
├── .timmy/                       # Internal workspace metadata directory
│   ├── workspace.json            # Active workspace metadata
│   ├── policies.json             # Enforced AgentPass scopes & security rules
│   └── index.json                # Local receipts history registry
└── README.md                     # Governed workspace manual
```

---

## Secret-Aware Path Filtering

To guarantee absolute credentials security, TIMMY Workspace Root implements a rigorous, defensive blocklist filter. Blocked paths are completely excluded from indexing and UI tree scanning:

* **Config/Env Files**: `.env`, `.env.*`, `.dev.vars`, `.dev.vars.*`
* **Credentials/Keys**: `*.pem`, `*.key`, `*.p12`, `*.mobileprovision`, `id_rsa`, `id_ed25519`
* **Large Dependencies**: `node_modules/`, `.git/`, `.wrangler/`, `.vercel/`, `.turbo/`, `.next/`
* **Build Targets**: `dist/`, `build/`, `logs/`, `.runs/`
* **Proof Subfolders**: `.timmy/receipts/raw/`
* **Semantic Blockers**: Any path containing key phrases such as `secret`, `private`, or `credential`.

---

## Capability & Identity Definitions

### 1. SKILL.md (Capability Badge)
* `SKILL.md` defines custom capabilities, Zod validation schemas, and temporary execution permissions.
* The Files page inspects and validates skills without executing local code until a valid AgentPass scope (`fs.write.approved`) is authorized.

### 2. SOUL.md (Soul Badge)
* `SOUL.md` encapsulates the behavior, personality, tone, and active instruction rules of a specialized agent.
* The explorer enables operators to inspect agent missions and preview behavior templates safely.

---

## Governed Actions & Scopes

Every file action in TIMMYTUI requires explicit AgentPass permissions:

| Enforced Scope | Action Name | Risk Class | Operation Type |
| :--- | :--- | :--- | :--- |
| **`fs.read.workspace`** | `[Inspect]`, `[Summarize]`, `[Explain]` | `filesystem_read` | Local read-only |
| **`fs.inspect.workspace`** | `[Inspect Skill]`, `[Inspect Soul]` | `workspace_inspect` | Metadata scanning |
| **`fs.patch.preview`** | `[Generate Patch]`, `[Preview Diff]` | `workspace_patch_preview` | Non-mutating Dry Run |
| **`fs.write.approved`** | `[Apply With Approval]` | `workspace_mutation` | Sealed Mutation |

---

## Auth Files in the Workspace Root

TIMMY stores authority records directly inside the governed workspace root for transparent audits and local inspection. While runtime authentication is not wired dynamically in this pass, the files provide human-readable templates and future-ready registry files:

```
TIMMY_WORKSPACE_ROOT/
├── auth/
│   ├── auth.md            # Branded TIMMY Auth Doctrine guide
│   ├── passports.md       # Persistent agent identity passport registry
│   ├── visas.md           # Permission grants policies
│   └── scopes.md          # Machine-readable AgentPass scopes list
```

---

## Future Optional Adapters (Planned Only)

While TIMMY's local root remains the absolute, local-first launch source of truth, optional cloud/network adapters are planned for future integration. These are **not** implemented in the current release:

1. **Google Drive Folder Sync**: Mirroring receipts and `.timmy/index.json` ledgers to a shared drive.
2. **NAS Mount**: Offloading heavy vector databases or long-term context databases to a local network attached storage mount.
3. **Daytona Workspace**: Direct stateful workspace sync using Daytona serverless workspace containers.
4. **Cloudflare R2 Mirror**: Replicating tamper-evident evidence packages (.agentrun) to globally replicated edge storage buckets.
5. **GitHub Repo Mirror**: Committing approved code patches automatically to private GitHub codebases.

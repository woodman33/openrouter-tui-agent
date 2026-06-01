# TIMMY Product Doctrine: Agent Trust OS

## Core Philosophy

TIMMY is an **Agent Trust OS for Verifiable Agent Operations**. 

We operate under a simple, rigorous value chain:

$$\text{Capability} \longrightarrow \text{Control} \longrightarrow \text{Proof} \longrightarrow \text{Reuse}$$

Our core guiding principle dictates:
* **Any tool** can become a command.
* **Any command** can become governed work.
* **Any governed work** can become proof.
* **Any proof** can become reusable context.
* **Any reusable context** can become a `.pi` pack.

---

## The Verifiable Operations Value Chain

### 1. Capability (Raw Potential)
* **Definition**: Raw programmatic actions an agent can execute.
* **Platform Mapping**: **MCP tools** represent raw capability. We translate these actions through **MCPorter** (TIMMY Porter), which acts as our high-performance MCP-to-CLI adapter bridge.

### 2. Control (Governed Intent)
* **Definition**: Establishing strict rules, signature checks, and execution policies on what capabilities can execute.
* **Platform Mapping**: **AgentPass** acts as our core cryptographic control layer, verifying JTI tokens and enforcing security boundaries. The **TaskForge** orchestrator runtime governs team and orchestrator planning configurations.

### 3. Proof (Evidentiary Capture)
* **Definition**: Tamper-evident, cryptographically signed records demonstrating exactly what took place inside the execution sandbox.
* **Platform Mapping**: **RMUX Evidence** operates as our workspace flight recorder, capturing screenshots and transaction traces. These are recorded immutably on the **.agentrun** receipt/proof ledger, backed by **Cloudflare** as our hosted receipt and context ground layer database.

### 4. Reuse (Encapsulated Swarms)
* **Definition**: Re-packaging verified, graded, and proven swarm configurations into modular bundles that can be redeployed instantly.
* **Platform Mapping**: **.pi Workspaces** represent the reusable agent organization pack format. These packs are discovered, selected, and upgraded via the **.pi registry** marketplace.

---

## Core Naming Definitions

To guarantee absolute clarity across the codebase and user interface, we enforce strict naming rules:
1. **.pi**: Refers exclusively to the **workspace / pack file format** (e.g., `Code Swarm Pack`).
2. **TaskForge**: Refers exclusively to the **orchestrator planning and execution runtime** balancing the 75/25 management ratio.
3. **Pi Agent**: Refers exclusively to the individual **Pi Agent** daemon (backed by inflection/pi-3) running within a work chamber cell. We do not use the term "Pi" ambiguously.

---

## First-Party Wedge: Code Swarm Pack

For launch, TIMMY focuses on a singular, highly optimized first-party workspace pack:
* **Code Swarm Pack**: Our premier virtual `.pi` pack format, pre-configured with active coding builders (OpenCode CLI), research validators (Hermes CLI), and D1 SQLite edge registries to construct, compile, and audit codebases in fully verifiable sandboxes.

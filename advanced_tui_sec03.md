## 3. Layer 3: AI Agents — OpenHands & The Autonomous Development Stack

The preceding layers gave us a real-time terminal (Layer 1) and a command platform with hundreds of utilities (Layer 2). Layer 3 adds the autonomous reasoning engine: AI agents that plan, code, debug, and deploy with minimal human intervention. Where `x-cmd` provides the *verbs* of terminal interaction, OpenHands provides the *agent* — a system that decides which verbs to invoke, in what order, and how to recover when they fail. This chapter examines OpenHands, the leading open-source autonomous development agent, its integration with OpenRouter for model-agnostic LLM access, and the multi-agent workflow patterns that emerge when OpenHands is combined with complementary tools.

### 3.1 OpenHands Deep Dive

**OpenHands** (formerly OpenDevin, renamed in 2024) is an open-source autonomous AI software development agent maintained by All Hands AI. With **69,000+ GitHub stars** and **$23.8M in funding** across Seed and Series A rounds[^1512^], it represents the most mature open-source entry in the autonomous coding agent category. Installation follows two paths: `uv tool install openhands` for Python-native setups, or Docker for sandboxed execution:

```bash
# Install with uv (Python 3.12+ required)
uv tool install openhands --python 3.12

# Or run via Docker with full sandboxing
docker run -it --rm --pull=always \
  -e LOG_ALL_EVENTS=true \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ~/.openhands:/.openhands \
  -p 3000:3000 \
  --add-host host.docker.internal:host-gateway \
  --name openhands-app \
  docker.all-hands.dev/all-hands-ai/openhands:0.34
```

Its core design philosophy is simple but powerful: instead of providing the LLM with twenty bespoke tools, each with its own JSON schema, give it **bash, Python, a file editor, and a browser** — then let the model express everything as code[^1419^]. This "Code is the universal action" approach dramatically reduces tool-learning overhead and parsing failures, enabling the system to achieve **~77% on SWE-Bench Verified** with Claude Sonnet 4.5[^1419^].

#### 3.1.1 Architecture: V1 SDK — Runtime, AgentHub, ActionExecutor, Event-Sourced State

OpenHands underwent a major architectural redesign in November 2025, documented in the V1 SDK paper (arXiv 2511.03690)[^1427^]. V0 was monolithic: mandatory Docker sandboxing, 140+ configuration fields across 15 classes, and tightly coupled agent-sandbox processes. V1 replaced this with a **modular four-package SDK** built on four principles: optional isolation (Docker is opt-in, `LocalWorkspace` runs in-process by default), statelessness with a single mutable `ConversationState`, strict SDK/application separation, and composability at both package and component levels[^1427^].

The V1 mental model has four components. The **Agent** is a pure function from history to the next Action — stateless, configured by LLM, tools, condenser, and MCP. `agent.step()` is the core loop. The **Conversation** owns the `ConversationState` and persists to an append-only `EventLog` — the *only* mutable entity. The **Workspace** abstracts execution across `LocalWorkspace` (in-process), `DockerWorkspace` (containerized), and `RemoteAPIWorkspace` (HTTP-based). The **Event Stream** is the append-only log; replaying it reconstructs the full conversation[^1419^][^1427^].

```
openhands.sdk       — Core abstractions (Agent, Conversation, LLM, Tool, MCP, Event)
openhands.tools     — Concrete tool implementations (bash, IPython, browser, editor)
openhands.workspace — Execution environments (Docker, local, remote API)
openhands.agent_server — REST/WebSocket API server for remote execution
```

Every action and observation is a typed **Pydantic model**. An `IPythonRunCellAction` carrying Python code yields an `IPythonRunCellObservation` with output and exit status. A `BrowseURLAction` yields a `BrowserOutputObservation` containing the rendered DOM. This event-sourced architecture means the entire conversation state can be reconstructed by replaying the event log — a property that enables deterministic debugging, session resumption, and audit trails[^1419^].

V1 demonstrated a **61% reduction in system-attributable failures** relative to V0 during a 15-day production comparison, validating the architectural bet on modularity and immutability[^1505^]. The SDK's 31-feature comparison with OpenAI Agents SDK, Claude Agent SDK, and Google ADK identified 16 features unique to OpenHands, including native remote execution, production server with sandboxing, model-agnostic multi-LLM routing across 100+ providers, security analyzer, flexible lifecycle control (pause/resume, sub-agent delegation, history restore), and built-in QA instrumentation[^1427^].

#### 3.1.2 CLI Modes: Interactive TUI, Headless, Web GUI

OpenHands ships with a **rich command-line interface** supporting multiple execution modes. The interactive TUI launches with a bare `openhands` command, presenting a full-screen terminal interface where users can type natural-language tasks, observe the agent's reasoning in real time, and approve or reject individual actions. For IDE integration, `openhands acp` exposes an Agent Communication Protocol endpoint compatible with Toad, Zed, VSCode, and JetBrains[^1416^].

| Mode | Command | Best For |
|------|---------|----------|
| **TUI (Terminal UI)** | `openhands` | Interactive development with human-in-the-loop approval |
| **IDE Integration** | `openhands acp` | Toad, Zed, VSCode, JetBrains plugin connectivity |
| **Headless** | `openhands --headless -t "task"` | CI/CD pipelines, scripting, batch automation |
| **Web Interface** | `openhands web` | Browser-based TUI with streaming output |
| **GUI Server** | `openhands serve` | Full React web frontend on port 3000 |

The **headless mode** is critical for CI/CD integration. It accepts tasks via `-t` (inline string) or `-f` (file path), outputs structured JSON with `--json`, and always operates in `always-approve` mode — meaning the agent executes every action without human confirmation[^1461^]. This design choice makes headless mode unsuitable for untrusted codebases without Docker sandboxing, but ideal for automated pipelines where the environment is ephemeral.

```bash
# Interactive TUI — human approves each action
openhands

# Headless with inline task — outputs to stdout
openhands --headless -t "Write unit tests for auth.py"

# Headless with task file — JSON output for pipeline parsing
openhands --headless --json -f instructions.md -t "Create a Flask app" > output.jsonl

# Web GUI server with current directory mounted
openhands serve --mount-cwd

# Auto-approve all actions (interactive mode, use with caution)
openhands --always-approve  # alias: --yolo

# LLM-based security review of each action
openhands --llm-approve
```

Confirmation modes provide a sliding scale of autonomy. The default mode prompts for approval on each action. `--always-approve` (or `--yolo`) grants full autonomy for trusted workflows. `--llm-approve` routes each action through a secondary LLM call that analyzes the action for safety before execution — a middle ground that catches obviously destructive operations without requiring human attention for every file read[^1416^].

#### 3.1.3 Agents: CodeActAgent, BrowsingAgent, DelegatorAgent, GPTSwarm

OpenHands implements multiple agent strategies through its **AgentHub**, each optimized for different task categories. The system is designed around delegation: a primary agent can spawn sub-agents with specialized capabilities, creating a hierarchical multi-agent topology.

**CodeActAgent** is the default and flagship agent. Built on the CodeAct framework, it treats every task as a code execution problem. At each step, the agent can converse in natural language, execute bash or Python code, edit files, browse the web, or delegate to sub-agents. Its system prompt imposes a strict **four-phase methodology**: Exploration (read repository, locate relevant files), Analysis (form a hypothesis via `ThinkTool`), Implementation (smallest change that addresses the analysis), and Verification (re-run tests, lints, and builds before calling `finish`)[^1419^]. With Claude Sonnet 4.5, CodeActAgent achieves approximately **77% resolution on SWE-Bench Verified**[^1419^].

| Agent | Role | Key Capability | SWE-Bench Impact |
|-------|------|---------------|------------------|
| **CodeActAgent** | Default generalist | Bash + Python + browser DSL as unified action space | 77% (Claude Sonnet 4.5)[^1419^] |
| **BrowsingAgent** | Web specialist | Chromium via Playwright/BrowserGym for web-based tasks | Delegated research tasks |
| **DelegatorAgent** | Orchestrator | Routes sub-tasks to specialized agents, parallel exploration | Enables multi-agent workflows |
| **GPTSwarm** | Multi-agent graph | Optimizable graphs for multi-agent collaboration with automatic edge optimization | Complex parallel task decomposition |

**BrowsingAgent** handles web-based tasks using a headless Chromium browser via Playwright and BrowserGym. It operates with zero-shot prompting — no task-specific fine-tuning required — and can navigate, fill forms, extract data, and interact with JavaScript-heavy sites[^1431^]. **DelegatorAgent** orchestrates task delegation between agents; for example, CodeActAgent can hand off a research sub-task to BrowsingAgent while continuing with implementation[^1424^]. **GPTSwarm** takes a different approach, using optimizable graphs to construct multi-agent systems where both the nodes (agents) and edges (communication patterns) are automatically optimized for the target task[^1431^].

#### 3.1.4 Actions: Bash, IPython, Browser, File Editor, MCP Tools, Sub-Agent Delegation

The OpenHands action system follows a strict **Action → Observation** pattern. Every action the agent takes is a typed Pydantic model, and every observation returned is equally typed. This symmetry enables automatic serialization, event logging, and programmatic consumption.

| Action | Observation | Purpose |
|--------|-------------|---------|
| `CmdRunAction(command, cwd, blocking)` | `CmdOutputObservation(stdout, exit_code)` | Execute shell commands in the workspace |
| `IPythonRunCellAction(code)` | `IPythonRunCellObservation` | Persistent Python kernel with state across cells |
| `FileReadAction` / `FileWriteAction` / `FileEditAction` | `FileReadObservation` / `FileEditObservation` | File operations via `str_replace_editor` |
| `BrowseURLAction(url)` / `BrowseInteractiveAction(code)` | `BrowserOutputObservation` | Headless Chromium browsing via Playwright |
| `AgentDelegateAction(agent, inputs)` | `AgentDelegateObservation` | Spawn sub-agent with isolated context |
| `MCPAction` | `MCPObservation` | Execute external MCP tool |
| `RecallAction(query)` | `RecallObservation` | Pull microagent knowledge snippets |
| `AgentThinkAction(thought)` | (none) | Explicit reasoning slot for hypothesis formation |
| `AgentFinishAction(outputs)` | (terminates) | Signal task completion with deliverables |

The **IPython action** maintains a persistent kernel where variables and imports survive across calls. The built-in `AgentSkills` library provides `edit_file`, `scroll_up`/`scroll_down`, `parse_image`, and `parse_pdf` automatically imported into the kernel[^1431^]. **Sub-agent delegation** via `AgentDelegateAction` enables parallel exploration: the primary agent spawns sub-agents with isolated contexts to investigate different code regions simultaneously, preventing context-window congestion[^1424^].

#### 3.1.5 Sandboxing: Docker, LocalWorkspace, RemoteAPIWorkspace

OpenHands V1 introduced **optional isolation** — Docker is opt-in, with `LocalWorkspace` as the default for rapid prototyping[^1427^]. For production, the **Docker sandbox** uses two containers: an `openhands-app-*` "command tower" on port 3000 and an `openhands-runtime-*` "workshop" on random high ports (38000–55000)[^1423^]. The runtime is built dynamically from the user's base image, with the `ActionExecutor` communicating via REST API over the Docker bridge[^1420^].

```python
# Local execution — default in V1, no Docker required
from openhands.sdk import Conversation, LLM
from openhands.tools.preset.default import get_default_agent

llm = LLM(model="anthropic/claude-sonnet-4-5-20250929")
agent = get_default_agent(llm=llm)
conversation = Conversation(agent=agent)
conversation.send_message("Create hello.py")
conversation.run()

# Docker sandbox — add 3 lines for full isolation
from openhands.workspace import DockerWorkspace
with DockerWorkspace(
    server_image="ghcr.io/openhands/agent-server:1.19.1-python"
) as workspace:
    conversation = Conversation(agent=agent, workspace=workspace)
    conversation.send_message("Clone the repo and run tests")
    conversation.run()
```

`RemoteAPIWorkspace` enables cloud deployments, and third-party integrations like **Daytona Sandboxes** add further runtime options[^1426^]. A security gap remains: sandboxing controls *where* the agent acts, but the **authorization layer** for *what* it does within the container is coarse — the agent can still refactor beyond scope or `curl` arbitrary URLs[^1425^]. Production deployments should combine Docker sandboxing with `--llm-approve` and strict volume mounts.

#### 3.1.6 MCP: `openhands mcp add/list/enable/disable`

OpenHands V1 features **native MCP (Model Context Protocol) integration**, replacing V0's duplicated local tool implementations[^1427^]. MCP servers extend the agent's capabilities by providing additional tools and context — filesystem access, GitHub operations, web search, database queries — through a standardized protocol.

```bash
# List configured MCP servers
openhands mcp list

# Add an MCP server (filesystem access)
openhands mcp add filesystem

# Add a remote MCP server (GitHub)
openhands mcp add github

# Add with custom transport and command
openhands mcp add tavily --transport stdio \
  npx -- -y mcp-remote "https://mcp.tavily.com/mcp/?tavilyApiKey=<key>"

# Enable/disable servers without removing configuration
openhands mcp enable tavily
openhands mcp disable tavily

# View server details
openhands mcp get tavily

# Remove a server
openhands mcp remove tavily
```

MCP configuration is stored in `~/.openhands/mcp.json`, supporting both HTTP/SSE servers with authentication and stdio-based local servers[^1462^]. When an MCP server is enabled, its tools are automatically available to the agent without additional configuration. The security posture of MCP in OpenHands warrants attention: external MCP servers execute with the agent's full privileges, so they must be treated like dependencies — pinned to specific versions and audited for malicious behavior[^1419^].

### 3.2 OpenRouter as the LLM Backend

OpenHands is model-agnostic by design, routing all LLM calls through **LiteLLM** as a provider abstraction layer. While OpenHands supports 100+ providers directly[^1460^], OpenRouter emerges as the optimal backend for terminal-centric workflows because it provides access to **300+ models** through a single API key, with intelligent routing, automatic fallback, and cost optimization features that are particularly valuable when an autonomous agent may consume thousands of tokens per task[^1394^].

#### 3.2.1 Configuration: `openrouter/<provider>/<model>` via LiteLLM

Configuring OpenHands to use OpenRouter requires three parameters. OpenHands uses LiteLLM's provider prefix system, where models are specified as `openrouter/<provider>/<model>`. The base URL points to OpenRouter's OpenAI-compatible endpoint, and the API key is passed through the standard `LLM_API_KEY` environment variable.

```toml
# ~/.openhands/config.toml — OpenRouter configuration
[llm]
model = "openrouter/anthropic/claude-sonnet-4"
api_key = "${OPENROUTER_API_KEY}"
base_url = "https://openrouter.ai/api/v1"
num_retries = 4
retry_min_wait = 5
retry_max_wait = 30
retry_multiplier = 2
caching_prompt = true
```

Alternatively, via environment variables:

```bash
export LLM_API_KEY="sk-or-v1-xxxxxxxx"
export LLM_MODEL="openrouter/moonshotai/kimi-k2.6"
export LLM_BASE_URL="https://openrouter.ai/api/v1"
export LLM_CACHING_PROMPT="true"
openhands
```

For teams running multiple agents, a **LiteLLM Proxy** between OpenHands and OpenRouter adds request logging, rate limiting, and cost tracking without modifying the agent configuration:

```yaml
# litellm_config.yaml
model_list:
  - model_name: coding-agent
    litellm_params:
      model: openrouter/moonshotai/kimi-k2.6
      api_key: "os.environ/OPENROUTER_API_KEY"
  - model_name: cheap-agent
    litellm_params:
      model: openrouter/deepseek/deepseek-v4-pro
      api_key: "os.environ/OPENROUTER_API_KEY"
```

#### 3.2.2 Recommended Models: GLM-5.1, Kimi-K2.6, DeepSeek-V4

OpenRouter provides access to the full spectrum of commercial and open-weight models. The OpenHands Index — a continuously updated leaderboard at **index.openhands.dev** — scores models across five benchmark categories including SWE-Bench, GAIA, and SWE-Bench Pro[^1472^].

| Model | OpenHands Model String | OpenHands Index | Cost (per 1M out) | Best For |
|-------|----------------------|-----------------|-------------------|----------|
| **GLM-5.1** | `openrouter/z-ai/glm-5.1` | 58.2 | ~$0.87 | Strongest open-weight; no proprietary lock-in |
| **Kimi-K2.6** | `openrouter/moonshotai/kimi-k2.6` | 57.1 | ~$1.20 | Strong coding with excellent context following |
| **DeepSeek-V4-Pro** | `openrouter/deepseek/deepseek-v4-pro` | 51.3 | $0.87 | Best cost-performance ratio for batch CI jobs |
| **Claude Sonnet 4.5** | `anthropic/claude-sonnet-4-5-20250929` | 77.0 | $15.00 | Maximum accuracy; use for critical path tasks |
| **minimax-m2.7** | `openrouter/minimax/minimax-m2.7` | 43.4 | ~$0.50 | Lower-cost exploratory work |

The performance gap between Claude Sonnet 4.5 (77%) and the best open-weight options (58% for GLM-5.1) is significant but not disqualifying for many workflows[^1460^]. For tasks where the agent operates in a tight loop with human review — fixing known bugs, adding tests, refactoring — the open-weight models provide sufficient accuracy at a fraction of the cost. The **62x price difference** between Claude Sonnet 4.5 ($15.00/M output tokens) and DeepSeek-V4-Pro ($0.87/M) makes model selection a genuine engineering decision, not merely a quality one.

#### 3.2.3 Cost Optimization: Context Caching, Model Routing, Rate Limits

OpenRouter provides several mechanisms to control agent-driven token consumption. **Response Caching**, enabled via the `X-OpenRouter-Cache: true` header, stores the full request-response pair. Identical subsequent requests return in 80–300ms with zero token billing[^1409^]. For OpenHands workflows, this is particularly effective when the agent repeatedly queries the same documentation or context during a long session. Cache TTL is configurable from 1 second to 24 hours via `X-OpenRouter-Cache-TTL`.

**Auto Exacto** is OpenRouter's adaptive quality routing system, enabled by default for tool-calling requests since March 2026. It re-evaluates providers every five minutes across three signals: throughput capacity, tool-call telemetry (billions of calls scored for validity), and standardized benchmark scores. Auto Exacto reduced tool-call error rates by **88% for GLM-5** and **80% for GLM-4.7**[^1522^] — a critical reliability improvement for agents that depend on consistent tool-call formatting.

Additional routing strategies include `:exacto` (quality-weighted), `:nitro` (fastest provider), and `:floor` (cheapest provider). The **free tier** provides 50 requests per day on 25+ models; the pay-as-you-go tier ($10+ in credits) raises free-model limits to 1,000 requests per day and removes limits on paid models[^1391^][^1402^].

#### 3.2.4 Fallback Chains: Kimi → DeepSeek → GPT-4o

Production agent deployments require resilience against provider outages and rate limits. OpenRouter's fallback system enables automatic provider switching, but OpenHands' own retry configuration provides the first line of defense. A production-grade fallback chain might configure:

```toml
[llm]
# Primary: strong coding model
model = "openrouter/moonshotai/kimi-k2.6"
# Fallbacks are handled by OpenRouter's provider routing
# when combined with LiteLLM proxy routing
num_retries = 4
retry_min_wait = 5
retry_max_wait = 30
```

For critical CI pipelines, a **LiteLLM Proxy** configuration provides explicit fallback ordering:

```yaml
model_list:
  - model_name: production-agent
    litellm_params:
      model: openrouter/moonshotai/kimi-k2.6
    fallback: ["openrouter/deepseek/deepseek-v4-pro"]
  - model_name: openrouter/deepseek/deepseek-v4-pro
    litellm_params:
      model: openrouter/deepseek/deepseek-v4-pro
    fallback: ["openrouter/openai/gpt-4o"]
```

This three-tier chain — Kimi-K2.6 → DeepSeek-V4-Pro → GPT-4o — provides graceful degradation. If the primary model is rate-limited or down, the request flows to the cheaper DeepSeek model. If that also fails, GPT-4o serves as the final backstop. The total latency overhead of OpenRouter's two-hop routing (client → OpenRouter → provider) is typically **25–40ms** at the edge[^1491^], negligible compared to LLM generation time.

### 3.3 OpenHands in a tmux Pane — The Workflow

The terminal-centric developer does not live in a single window. The most productive OpenHands integration places the agent in a dedicated tmux pane, running continuously alongside the editor and shell — a **three-pane command center** where the agent observes the same terminal context as the human operator.

#### 3.3.1 Setup: 3 Panes (OpenHands, Editor, Terminal)

The layout is straightforward but requires deliberate sizing. The left pane (50% width) runs the editor — Neovim, Helix, or Zed. The right side splits vertically: the top-right pane (60% height) runs OpenHands in interactive TUI mode, and the bottom-right pane (40% height) remains a standard shell for manual commands, git operations, and deployment.

```bash
# ~/.tmux.conf — add a binding for the OpenHands layout
bind-key O run-shell '
    tmux new-window -n "openhands-session" \; \
    split-window -h -p 50 \; \
    split-window -v -p 40 \; \
    select-pane -t 0 \; \
    send-keys "nvim ." C-m \; \
    select-pane -t 1 \; \
    send-keys "openhands --always-approve --llm-approve" C-m \; \
    select-pane -t 2 \; \
    send-keys "git status" C-m'
```

Launch with `Ctrl-b O` (capital O for "agent"). The agent pane runs OpenHands with `--llm-approve` for safety in long sessions. The workflow assumes the project is in a working state — committed or stashed changes, passing tests, and ideally an `AGENTS.md` file documenting build commands, test commands, and code style conventions[^1487^].

#### 3.3.2 Workflow: Describe → Code → Review → Deploy

The four-phase workflow mirrors the agent's own methodology at human scale. In the **Describe** phase, the developer types a task into the OpenHands pane — e.g., *"Add cursor-based pagination to `/api/users` defaulting to 50 items."* The agent explores the codebase to locate the route, query layer, and existing patterns.

In the **Code** phase, the agent generates the implementation — modifying the handler, adding utilities, writing tests. With `--llm-approve` enabled, destructive actions (file deletion, `DROP TABLE`, outbound calls) are flagged for human confirmation; reads and benign writes proceed automatically.

The **Review** phase happens in the editor pane. The developer examines the diff, verifies edge cases (empty results, last-page detection), and either edits directly or sends follow-up prompts to OpenHands.

The **Deploy** phase uses the shell pane: `git add -p`, `git commit`, `git push`. The agent stays running for the next task.

#### 3.3.3 Headless CI: GitHub Actions Resolver (`fix-me` Label → Auto-Fix → PR)

The **OpenHands GitHub Issue Resolver** extends the workflow into CI/CD. After adding the official resolver workflow to `.github/workflows/openhands-resolver.yml`, any issue labeled `fix-me` (or any comment starting with `@openhands-agent`) triggers an autonomous resolution pipeline[^1511^][^1509^]:

1. OpenHands checks out the repository in a sandboxed Docker container
2. Reads the issue description and any linked code
3. Explores the codebase to identify the fix location
4. Implements the fix and runs the test suite
5. Creates a pull request with the fix
6. Comments on the issue with a summary and PR link

```yaml
# .github/workflows/openhands-resolver.yml (official action)
# Trigger: add "fix-me" label to any issue
# or comment "@openhands-agent" on an issue
```

For teams not ready for fully autonomous issue resolution, the **headless mode** provides a middle ground. A workflow triggered on pull request can run OpenHands against specific files:

```bash
# In CI: review a PR diff
openhands --headless --json \
  -t "Review this PR for security issues, test coverage, and adherence to the style guide. Output a JSON report." \
  < pr_diff.txt > review_report.json
```

Headless mode always runs in `always-approve` mode and outputs structured JSON when `--json` is specified, making it suitable for pipeline integration[^1461^]. The critical constraint: always use Docker sandboxing in headless CI — never run with `LocalWorkspace` and `always-approve` on a shared runner.

#### 3.3.4 Integration with x-cmd: `x` Commands Inside OpenHands Sandbox

The convergence of Layer 2 and Layer 3 occurs inside the OpenHands sandbox. The default OpenHands runtime image (`nikolaik/python-nodejs`) includes a full Linux environment with Python, Node.js, and standard Unix tools. When x-cmd is installed on the host, the agent can invoke `x` commands within its sandbox — either because x-cmd is installed in the runtime image or because the agent uses the shell that has x-cmd sourced.

This means an OpenHands task like *"Find all TODO comments in the codebase and generate a summary"* can leverage `x rg` (x-cmd's ripgrep wrapper) or `x git todo` directly. The agent doesn't need to know that `x` is a custom tool — it simply executes shell commands, and the x-cmd aliases and modules are available in the environment. For teams that have built custom x-cmd modules (see Section 2.4), these become part of the agent's available toolset without any MCP configuration.

```bash
# Inside the OpenHands sandbox — x-cmd is available
$ x rg "TODO|FIXME|HACK" --json | x jq -s 'group_by(.file) | map({file: .[0].file, count: length})'
```

The practical integration: mount your x-cmd installation into the OpenHands runtime via `SANDBOX_VOLUMES`, or include x-cmd in a custom runtime Docker image derived from the official base.

### 3.4 Comparison: OpenHands vs Claude Code vs aider vs Codex CLI

The autonomous coding agent space has consolidated around four major tools, each with distinct architectural assumptions and optimal use cases. Understanding their differences is essential for building a multi-agent workflow.

#### 3.4.1 Feature Matrix

| Dimension | OpenHands | Claude Code | aider | Codex CLI |
|-----------|-----------|-------------|-------|-----------|
| **Autonomy Level** | Highest — multi-hour sessions with self-correction, sub-agents, memory management | High — terminal-native, but requires periodic human guidance | Medium — pair-programming model, human in the loop | High — autonomous but OpenAI-only |
| **TUI Quality** | Full TUI + Web GUI + headless mode | Excellent — purpose-built terminal interface | Good — clean split-view diff | Good — minimal, fast |
| **MCP Support** | **Native** — `openhands mcp add/list/enable/disable`[^1462^] | Native | No | Limited |
| **Sandboxing** | **Docker** (optional in V1), LocalWorkspace, RemoteAPIWorkspace | Local shell only | Local shell only | Local shell only |
| **CI Integration** | **Excellent** — headless mode, GitHub Actions resolver, JSON output | Partial — designed for interactive use | Good — works in CI but less feature-rich | Limited |
| **SWE-Bench Verified** | ~77%[^1419^] | **80.8%**[^1481^] | ~55% | 80.0%[^1481^] |
| **License** | **MIT** (open source) | Proprietary (closed) | **Apache-2.0** | Proprietary |
| **Pricing Model** | API cost only (no platform fee) | $20/month + API costs | API cost only | Free with ChatGPT Plus |
| **Model Support** | **100+ via LiteLLM** (any provider) | Claude only | Any via OpenRouter | OpenAI only |
| **GitHub Stars** | 69K | N/A | ~25K | 66K |

#### 3.4.2 When to Use Which

**OpenHands** excels in scenarios requiring full autonomy with sandboxed execution. Docker isolation makes it the safest choice for untrusted code or regulated environments. The model-agnostic design means teams can start with Claude Sonnet 4.5 for accuracy, then migrate to DeepSeek-V4-Pro or GLM-5.1 for cost reduction without workflow changes[^1460^]. The trade-off is setup complexity: Docker must be installed and running[^1478^].

**Claude Code** wins on simplicity and score. As Anthropic's purpose-built terminal agent, it requires no Docker and no server. Its 80.8% SWE-Bench score edges out OpenHands' 77%[^1481^], attributable to native Claude integration that eliminates LiteLLM's ~10–20% token overhead[^1419^]. The downside is lock-in: Claude only, no sandboxing, weaker CI integration.

**aider** occupies the pair-programming niche. Lighter than both competitors, it operates directly on the local filesystem with Git-native workflows and makes direct API calls without middleware overhead. Its ~55% SWE-Bench score reflects its augmented-coding design[^1489^] — best when the developer wants the AI to suggest and the human to decide.

**Codex CLI** matches Claude Code's 80% SWE-Bench score[^1481^] but is limited to OpenAI models and lacks sandboxing and mature MCP support. Its advantage is availability: bundled with ChatGPT Plus, requiring no separate API key.

#### 3.4.3 Multi-Agent Pattern: OpenHands Planning, Claude Code Reviewing, aider Implementing

The most sophisticated teams do not choose one agent — they compose a **multi-agent pipeline** that assigns each tool its comparative advantage. This pattern mirrors human software teams where architects design, senior engineers review, and implementers execute.

In the **planning phase**, OpenHands' CodeActAgent handles task decomposition. Given *"Add OAuth2 with GitHub and Google providers,"* it explores the codebase, identifies the auth layer, and produces a file-level implementation plan. Sub-agent delegation enables parallel exploration of provider libraries[^1424^].

In the **implementation phase**, aider takes over. The human feeds OpenHands' plan to aider, which generates code with inline diffs for human review — more efficient than OpenHands' full autonomy loop for well-specified tasks.

In the **review phase**, Claude Code provides security analysis: *"Check for CSRF protection, state validation, and secure cookies."* Its 80.8% SWE-Bench score and native Claude integration catch issues that implementation-focused tools miss[^1481^].

The workflow closes in OpenHands for **deployment automation**. A headless task handles CI pipeline changes — editing `.github/workflows/`, adding test fixtures, validating in the Docker sandbox — with output committed via the shell pane.

The result is a **composite capability** exceeding any single agent: OpenHands for exploration, aider for implementation, Claude Code for review — orchestrated by the developer across tmux panes. The architecture is cumulative: Layer 1 (tmux) provided the windowing system, Layer 2 (x-cmd) the command vocabulary, and Layer 3 (OpenHands) the reasoning engine that decides which commands to run, when to delegate, and how to recover. The terminal is no longer a passive shell — it is an **autonomous development environment** where human intent flows through AI agents to produce working code from a single interface.

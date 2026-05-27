# OpenHands (formerly OpenDevin) — Deep Technical Research

> **Research Date**: 2026-06-25
> **Organization**: OpenHands (originally All-Hands-AI/OpenHands, now OpenHands/OpenHands)
> **License**: MIT (core), with enterprise features
> **GitHub Stars**: 69,000+ (as of early 2026)
> **Funding**: $23.8M across 2 rounds ($5M Seed 2024, $18.8M Series A Nov 2025)

---

## Table of Contents

1. [What is OpenHands](#1-what-is-openhands)
2. [Architecture (V1 SDK)](#2-architecture-v1-sdk)
3. [CLI/TUI Mode](#3-clitui-mode)
4. [Installation Methods](#4-installation-methods)
5. [Runtime Backends & LLM Support](#5-runtime-backends--llm-support)
6. [Action System](#6-action-system)
7. [Sandboxing](#7-sandboxing)
8. [AgentHub & Available Agents](#8-agenthub--available-agents)
9. [MCP Support](#9-mcp-support)
10. [Cloudflare Integration](#10-cloudflare-integration)
11. [OpenRouter Integration](#11-openrouter-integration)
12. [Evaluation & Benchmarks](#12-evaluation--benchmarks)
13. [GitHub Actions / CI/CD](#13-github-actions--cicd)
14. [Programmatic API & Embedding](#14-programmatic-api--embedding)
15. [Community & Ecosystem](#15-community--ecosystem)
16. [Limitations](#16-limitations)
17. [Real-World Usage](#17-real-world-usage)
18. [Comparison with Competitors](#18-comparison-with-competitors)
19. [Configuration](#19-configuration)
20. [Security](#20-security)

---

## 1. What is OpenHands

**OpenHands** is an open-source autonomous AI software development agent formerly known as **OpenDevin**. It can plan, code, debug, browse the web, and execute development tasks autonomously in a sandboxed environment.

- **Origin**: Started as OpenDevin on March 12, 2024, inspired by Devin from Cognition AI. Renamed to OpenHands shortly after.
- **Core Philosophy**: "Code is the universal action" — instead of 20 bespoke tools, give the agent bash + Python + a file editor + a browser, and let it write code [^1419^]
- **Autonomy Level**: Runs multi-hour sessions with self-correction, memory management, stuck detection, and budget controls
- **Model Agnostic**: Works with 100+ LLM providers via LiteLLM integration
- **Key Achievement**: ~77% on SWE-Bench Verified with Claude Sonnet 4.5 [^1419^]

**Company**: All Hands AI, founded 2024 by Robert Brennan (CEO), Xingyao Wang (PhD UIUC), and Graham Neubig (Professor CMU). Investors include Menlo Ventures, Salesforce Ventures, and Hugging Face co-founders [^1512^]

---

## 2. Architecture (V1 SDK)

OpenHands underwent a **major architectural redesign in November 2025** (V0 → V1). The V0 monolithic architecture was replaced with a modular SDK.

### V0 → V1 Evolution

| Aspect | V0 (pre-Nov 2025) | V1 (Nov 2025+) |
|--------|-------------------|----------------|
| Architecture | Monolithic, tightly coupled | Modular 4-package SDK |
| Sandboxing | Mandatory Docker | Optional isolation (opt-in) |
| State Management | Mutable config (140+ fields) | Stateless components, immutable Pydantic models |
| Execution | Agent + sandbox separate processes | Unified single-process by default |
| MCP Support | Duplicated local implementations | Native MCP integration |
| Config | 140+ fields, 15 config classes, 2.8K LOC | Clean environment variables + minimal config |

Source: [^1427^] (arXiv 2511.03690)

### Four Core Components (V1 Mental Model)

1. **Agent** — Pure function from history → next Action. Stateless. Configured by LLM, Tools, Condenser, MCP config. `agent.step()` is the core loop.
2. **Conversation** — Owns `ConversationState`, drives the loop, persists the append-only `EventLog`. The ONLY mutable thing in the system.
3. **Workspace** — Knows how to execute commands and shuttle files. Three implementations:
   - `LocalWorkspace` — in-process execution
   - `DockerWorkspace` — containerized execution
   - `RemoteAPIWorkspace` — HTTP-based remote execution
4. **Event Stream** — Every interaction is an Event. Append-only, single source of truth. Replaying it reconstructs the entire conversation.

Source: [^1419^]

### Four Design Principles

1. **Optional isolation** — Agent runs locally by default, can switch to sandboxed Docker transparently
2. **Stateless by default, one source of truth** — All components immutable Pydantic models; only `ConversationState` is mutable
3. **Strict separation of concerns** — SDK never imports applications; CLI, GUI, GitHub App all consume SDK as library
4. **Two-layer composability** — Compose at package level (SDK, Tools, Workspace, Server) AND at component level (tools, LLMs, condensers)

Source: [^1427^]

### Modular Package Structure

```
openhands.sdk       — Core abstractions (Agent, Conversation, LLM, Tool, MCP, Event system)
openhands.tools     — Concrete tool implementations
openhands.workspace — Execution environments (Docker, hosted API)
openhands.agent_server — REST/WebSocket API server for remote execution
```

Source: [^1427^]

### 31-Feature Comparison with Other SDKs

OpenHands V1 SDK was systematically compared with OpenAI Agents SDK, Claude Agent SDK, and Google ADK:
- **15 features shared** with at least one other SDK
- **16 features unique to OpenHands**: native remote execution, production server with sandboxing, model-agnostic multi-LLM routing across 100+ providers, security analyzer, flexible lifecycle control (pause/resume, sub-agent delegation, history restore), built-in QA instrumentation

Source: [^1427^]

---

## 3. CLI/TUI Mode

### Yes — OpenHands has a full terminal interface.

There are **multiple ways** to run OpenHands from the command line:

| Mode | Command | Best For |
|------|---------|----------|
| **TUI (Terminal UI)** | `openhands` | Interactive development |
| **IDE Integration** | `openhands acp` | IDEs (Toad, Zed, VSCode, JetBrains) |
| **Headless** | `openhands --headless -t "task"` | CI/CD, scripts, automation |
| **Web Interface** | `openhands web` | Browser-based TUI |
| **GUI Server** | `openhands serve` | Full web GUI with React frontend |

Source: [^1416^]

### Headless Mode (Critical for CI/CD)

```bash
# Run a task in headless mode
openhands --headless -t "Write unit tests for auth.py"

# Load task from a file
openhands --headless -f instructions.md

# JSON output for parsing in pipelines
openhands --headless --json -t "Create a Flask app"
```

**Important**: Headless mode ALWAYS runs in `always-approve` mode. The agent executes all actions without confirmation. `--llm-approve` is not available in headless mode. Always use Docker in headless mode.

Source: [^1461^]

### Confirmation Modes

```bash
# Default: ask for confirmation on each action
openhands

# Auto-approve all actions
openhands --always-approve  # or --yolo

# LLM-based security analyzer
openhands --llm-approve
```

Source: [^1416^]

---

## 4. Installation Methods

### Option 1: Using `uv` (Recommended)

Requires Python 3.12+ and uv 0.11.6+:

```bash
# Install uv first (see https://docs.astral.sh/uv/getting-started/installation/)
# Then install OpenHands
uv tool install openhands --python 3.12

# Launch GUI server
openhands serve

# With GPU support (requires nvidia-docker)
openhands serve --gpu

# Mount current directory
openhands serve --mount-cwd

# Upgrade
uv tool upgrade openhands --python 3.12
```

Source: [^1417^]

### Option 2: Using pip

```bash
pip install openhands

# Launch
openhands serve
```

Note: You still need `uv` installed for default MCP servers to work properly.

Source: [^1417^]

### Option 3: Using Docker Directly

```bash
docker run -it --rm --pull=always \
  -e AGENT_SERVER_IMAGE_REPOSITORY=ghcr.io/openhands/agent-server \
  -e AGENT_SERVER_IMAGE_TAG=1.19.1-python \
  -e LOG_ALL_EVENTS=true \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ~/.openhands:/.openhands \
  -p 3000:3000 \
  --add-host host.docker.internal:host-gateway \
  --name openhands-app \
  docker.openhands.dev/openhands/openhands:1.7
```

Access at http://localhost:3000

Source: [^1417^]

### Option 4: Standalone Binary

```bash
curl -fsSL https://install.openhands.dev/install.sh | sh
```

Source: [^1416^]

### System Requirements

- macOS with Docker Desktop, Linux, or Windows with WSL2 + Docker Desktop
- Modern processor + minimum 4GB RAM
- Docker Desktop with "Allow default Docker socket" enabled

Source: [^1417^]

---

## 5. Runtime Backends & LLM Support

### 100+ Providers via LiteLLM

OpenHands uses **LiteLLM** as its provider abstraction layer, enabling model-agnostic routing across 100+ providers without code changes.

Supported provider categories:
- **Cloud APIs**: OpenAI, Anthropic (Claude), Google, Azure, AWS Bedrock, Groq
- **Routing Services**: OpenRouter, LiteLLM Proxy
- **Local/Self-hosted**: Ollama, LM Studio, SGLang, vLLM, llama.cpp, MLX

Source: [^1460^], [^1464^]

### Recommended Models

| Model | String | OpenHands Index | Notes |
|-------|--------|-----------------|-------|
| Claude Sonnet 4.5 | `anthropic/claude-sonnet-4-5-20250929` | 77% SWE-bench | Best overall performance |
| GLM-5.1 | `openrouter/z-ai/glm-5.1` | 58.2 | Strongest open-weight |
| Kimi-K2.6 | `openrouter/moonshotai/kimi-k2.6` | 57.1 | Strong coding option |
| DeepSeek-V4-Pro | `openrouter/deepseek/deepseek-v4-pro` | 51.3 | Good coding + test gen |
| Qwen3.6-35B-A3B | `openai/Qwen3.6-35B-A3B` or `openrouter/...` | Not yet listed | Recommended local model |

Source: [^1460^]

### Local Model Setup

For local models, use Qwen3.6-35B-A3B as the recommended starting point. See the official docs for LM Studio, Ollama, SGLang, and vLLM setup examples.

**Note**: Models smaller than 32B parameters are NOT recommended for complex coding tasks — instruction following degrades significantly.

Source: [^1460^], [^1421^]

---

## 6. Action System

Every interaction follows the **Action → Observation** pattern. Both are typed Pydantic models.

### Available Actions

| Action | Observation | Purpose |
|--------|-------------|---------|
| `CmdRunAction(command, cwd, blocking)` | `CmdOutputObservation(stdout, exit_code)` | Run shell commands |
| `IPythonRunCellAction(code)` | `IPythonRunCellObservation` | Persistent Python kernel |
| `FileReadAction` / `FileWriteAction` / `FileEditAction` | `FileReadObservation` / `FileEditObservation` | File operations with `str_replace_editor` |
| `BrowseURLAction(url)` / `BrowseInteractiveAction(code)` | `BrowserOutputObservation` | Headless Chromium browsing |
| `MessageAction(content, wait_for_response)` | (none) | Talk to user |
| `AgentThinkAction(thought)` | (none) | Reasoning slot |
| `AgentFinishAction(final_thought, outputs)` | (terminates) | Signal completion |
| `AgentDelegateAction(agent, inputs)` | `AgentDelegateObservation` | Spawn sub-agent |
| `RecallAction(query)` | `RecallObservation` | Pull microagent knowledge |
| `CondensationAction(...)` | (rewrites history) | Memory compression |
| `MCPAction` | `MCPObservation` | External MCP tool |

Source: [^1419^], [^1505^]

### CodeAct Philosophy

The flagship `CodeActAgent` is built on one key insight: instead of giving the LLM 20 bespoke tools each with their own JSON schema, give it **bash, Python, and a browser DSL**, and let it express anything as code. This generalizes far better and dramatically reduces parsing errors.

The system prompt imposes a 4-phase methodology:
1. **Exploration** — read repo, find relevant files
2. **Analysis** — form hypothesis about what to change (`ThinkTool`)
3. **Implementation** — smallest change that addresses analysis
4. **Verification** — re-run tests/lints/build before calling `finish`

Source: [^1419^]

### AgentSkills Library

Built-in Python utilities automatically imported into the Jupyter IPython environment:
- `edit_file` — modify existing file from specified line
- `scroll_up` / `scroll_down` — view different parts of files
- `parse_image` — extract info from images using vision models
- `parse_pdf` — read text from PDFs

Source: [^1431^]

---

## 7. Sandboxing

### Docker Sandbox (Default for Production)

OpenHands uses **Docker containers** as the primary sandbox mechanism:

- **`openhands-app-*` container** — "Command tower" (UI + API server) on port 3000
- **`openhands-runtime-*` container** — "Workshop" (sandbox where AI executes code) on random ports 38xxx-55xxx

Communication between app and runtime is via **REST API** over local Docker network.

Source: [^1423^]

### Architecture Flow

1. User provides a custom base Docker image
2. OpenHands builds a new "OH Runtime Image" containing the runtime client
3. Container starts from OH Runtime Image
4. `ActionExecutor` initializes inside the container
5. OpenHands backend communicates via RESTful API
6. Actions execute in the sandbox; observations return to backend

Source: [^1420^]

### Optional Isolation (V1)

```python
# Local execution (default in V1)
from openhands.sdk import Conversation, LLM
from openhands.tools.preset.default import get_default_agent

llm = LLM(model="anthropic/claude-sonnet-4.5")
agent = get_default_agent(llm=llm)
conversation = Conversation(agent=agent)
conversation.send_message("Create hello.py")
conversation.run()

# Docker sandbox (add 3 lines)
from openhands.workspace import DockerWorkspace
with DockerWorkspace(...) as workspace:
    conversation = Conversation(agent=agent, workspace=workspace)
    conversation.send_message("Create hello.py")
    conversation.run()
```

Source: [^1427^]

### Alternative Sandboxes

- **Daytona Sandboxes**: Third-party secure runtime integration available [^1426^]
- **LocalWorkspace**: In-process execution for dev/prototyping
- **RemoteAPIWorkspace**: HTTP-based for cloud deployments
- **Process Runtime**: `RUNTIME=process` (legacy local mode)

Source: [^1426^], [^1479^]

---

## 8. AgentHub & Available Agents

### CodeActAgent (Default)

The generalist agent based on the CodeAct framework. At each step, the agent can:
- Converse with humans in natural language
- Execute code (bash, Python, browser DSL) to perform tasks
- Edit files, browse the web, run programs
- Delegate to sub-agents for parallel exploration

Source: [^1431^], [^1424^]

### BrowsingAgent

A generalist web agent for web-based tasks. Uses Chromium browser via Playwright/BrowserGym. Zero-shot prompting approach.

Source: [^1431^]

### DelegatorAgent

Orchestrates task delegation between agents. For example, CodeActAgent can delegate to BrowsingAgent for web-related questions.

Source: [^1424^]

### GPTSwarm Agent

Uses optimizable graphs to construct agent systems with automatic optimization of nodes and edges for multi-agent collaboration.

Source: [^1431^]

---

## 9. MCP Support

### Yes — Full MCP Support

OpenHands has **native MCP (Model Context Protocol) integration**. MCP servers provide additional tools and context to agents.

### CLI Management

```bash
# List configured servers
openhands mcp list

# Add a server
openhands mcp add tavily --transport stdio \
  npx -- -y mcp-remote "https://mcp.tavily.com/mcp/?tavilyApiKey=<key>"

# Enable/disable servers
openhands mcp enable <server-name>
openhands mcp disable <server-name>

# View details
openhands mcp get <server-name>

# Remove
openhands mcp remove <server-name>
```

Source: [^1462^]

### Configuration

- Config file: `~/.openhands/mcp.json`
- Supports HTTP/SSE servers with authentication
- Supports stdio-based local servers
- Agent automatically has access to tools from enabled MCP servers

Source: [^1462^]

### Security Note

MCP integration adds attack surface. External MCP servers run with the agent's privileges. Treat them like dependencies — pin and audit.

Source: [^1419^]

---

## 10. Cloudflare Integration

### Direct Deployment to Workers

There is **no native built-in Cloudflare Workers deployment feature** in OpenHands. However, Cloudflare integration is possible through:

### Using Cloudflare AI as LLM Backend

Cloudflare Workers AI provides an **OpenAI-compatible API**, making it usable with OpenHands via LiteLLM:

```python
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("CLOUDFLARE_API_TOKEN"),
    base_url=f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1"
)

# Or configure in OpenHands:
# Base URL: https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1
# Model: @cf/zai-org/glm-4.7-flash or other Workers AI models
```

Source: [^1473^]

### Deploying OpenHands Outputs to Workers

Since OpenHands can write code and execute terminal commands, it can:
- Write Cloudflare Worker scripts (`worker.js`)
- Generate `wrangler.toml` configuration
- Use `wrangler deploy` command (if available in sandbox)

The OpenHands sandbox includes Node.js (in the `nikolaik/python-nodejs` base image), so wrangler CLI can be used.

Source: [^1468^]

---

## 11. OpenRouter Integration

### Native Support

OpenHands has **direct OpenRouter integration** documented as an official provider.

### Configuration

Set in the OpenHands UI Settings or via environment variables:
- **Provider**: OpenRouter
- **Model**: `openrouter/<provider>/<model>` (e.g., `openrouter/deepseek/deepseek-v4-pro`)
- **API Key**: Your OpenRouter API key
- **Base URL**: `https://openrouter.ai/api/v1` (if needed)

### Recommended OpenRouter Models

| Model | OpenHands Index | Cost Profile |
|-------|-----------------|--------------|
| `openrouter/z-ai/glm-5.1` | 58.2 | Best open-weight |
| `openrouter/moonshotai/kimi-k2.6` | 57.1 | Strong coding |
| `openrouter/deepseek/deepseek-v4-pro` | 51.3 | Good for coding |
| `openrouter/minimax/minimax-m2.7` | 43.4 | Lower cost option |
| `openrouter/qwen/qwen3.6-35b-a3b` | Not yet listed | Recommended local |

Source: [^1460^]

### Via LiteLLM Proxy

You can also run LiteLLM Proxy between OpenHands and OpenRouter for additional control:

```yaml
# litellm_config.yaml
model_list:
  - model_name: glm-4.7-flash
    litellm_params:
      model: openrouter/z-ai/glm-5.1
      api_key: "os.environ/OPENROUTER_API_KEY"
```

Then point OpenHands to `http://litellm:4000` with model `litellm_proxy/glm-4.7-flash`.

Source: [^1471^]

---

## 12. Evaluation & Benchmarks

### SWE-Bench Results

| Model | V0 Score | V1 Score | Notes |
|-------|----------|----------|-------|
| Claude Sonnet 4.5 | 64.6% | **72.8%** | +8.2 gain from extended thinking |
| Claude Sonnet 4 | 68.0% | 68.0% | Parity confirms redesign works |

With optimal configuration and Claude Sonnet 4.5, OpenHands achieves approximately **77% on SWE-Bench Verified**.

Source: [^1505^], [^1419^]

### OpenHands Index

Continuously updated leaderboard at https://index.openhands.dev covering 14+ models across 5 benchmark categories.

Source: [^1472^]

### Available Benchmarks (Evaluation Harness)

| Benchmark | Description | Status |
|-----------|-------------|--------|
| SWE-Bench | Software engineering tasks from GitHub issues | Active |
| SWE-Bench Pro | Long-horizon SE tasks | Active |
| GAIA | General AI assistant multi-step reasoning | Active |
| Commit0 | Python function implementation with unit tests | Active |
| OpenAgentSafety | AI agent safety in workplace scenarios | Active |
| ProgramBench | Rebuild program from compiled binary | Active |

Source: [^1472^]

### Comparison with Other Agents

| Tool | SWE-bench Verified | Type | Model |
|------|-------------------|------|-------|
| **Claude Code** | 80.8% | Terminal agent | Claude only |
| **OpenAI Codex** | 80.0% | Terminal agent | OpenAI only |
| **OpenHands** | ~77% | Autonomous sandbox | Any (via LiteLLM) |
| **Cursor** | 51.7% | IDE platform | Multiple |
| **SWE-Agent** | ~40% | Academic | Various |

Source: [^1481^], [^1419^]

---

## 13. GitHub Actions / CI/CD

### Official GitHub Action

OpenHands provides an official **GitHub Issue Resolver** that:
1. Watches for issues labeled `fix-me` or comments starting with `@openhands-agent`
2. Automatically clones the repo, attempts a fix in a sandboxed environment
3. Creates a PR with the fix
4. Comments on the issue with a summary

Source: [^1511^], [^1509^]

### Installation

Add the workflow file to `.github/workflows/openhands-resolver.yml` in your repository. Trigger by:
- Adding `fix-me` label to an issue
- Commenting `@openhands-agent` on an issue

Source: [^1511^]

### Third-Party GitHub Action

```yaml
name: Run OpenHands Task
on: [push, pull_request]

jobs:
  run-openhands:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Execute OpenHands Task
        uses: xinbenlv/openhands-action@v1.0.1-rc3
        with:
          prompt: "Your natural language task"
          llm_api_key: ${{ secrets.LLM_API_KEY }}
          llm_model: "anthropic/claude-3-7-sonnet-20250219"
```

Source: [^1463^]

### GitLab CI Support

Community has requested a GitLab Resolver Runner following the `renovate-runner` pattern for automated issue resolution via GitLab CI pipelines.

Source: [^1477^]

### Headless Mode for CI/CD

```bash
openhands --headless -t "Fix the failing tests"
openhands --headless -f instructions.md
openhands --headless --json -t "Create a Flask app" > output.jsonl
```

Source: [^1461^]

---

## 14. Programmatic API & Embedding

### Python SDK

```python
from pydantic import SecretStr
from openhands.sdk import LLM, Conversation, get_logger
from openhands.tools.preset.default import get_default_agent
from openhands.workspace import DockerWorkspace

# 1. Configure LLM
llm = LLM(
    model="anthropic/claude-sonnet-4-5-20250929",
    api_key=SecretStr("your-api-key"),
)

# 2. Create agent
agent = get_default_agent(llm=llm, cli_mode=True)

# 3. Create workspace (Docker for sandboxing)
with DockerWorkspace(server_image="ghcr.io/openhands/agent-server:latest-python") as workspace:
    # 4. Create conversation
    conversation = Conversation(agent=agent, workspace=workspace)
    
    # 5. Send message and run
    conversation.send_message("Read the repo and write 3 facts about the project into FACTS.txt")
    conversation.run()
    
    # 6. Check cost
    cost = conversation.conversation_stats.get_combined_metrics().accumulated_cost
    print(f"Cost: {cost}")
    
    # 7. Cleanup
    conversation.close()
```

Source: [^1480^]

### REST/WebSocket Server

The `openhands.agent_server` module exposes:
- **REST API**: `POST /conversations`, `GET /conversations/{id}`
- **WebSocket**: Event streaming for real-time UIs
- Remote conversation control and monitoring

Source: [^1427^]

### Event Callbacks

```python
received_events = []

def event_callback(event):
    event_type = type(event).__name__
    print(f"Event: {event_type}\n{event}")
    received_events.append(event)

conversation = Conversation(
    agent=agent,
    workspace=workspace,
    callbacks=[event_callback],
)
```

Source: [^1480^]

---

## 15. Community & Ecosystem

### GitHub Statistics

| Metric | Value (as of 2025-2026) |
|--------|------------------------|
| GitHub Stars | 69,000+ (OpenHands/OpenHands org) |
| Contributors | 250+ unique contributors |
| Commits | 3,500+ total commits |
| Daily Downloads | Thousands |
| Primary Repos | OpenHands (main), OpenHands-CLI, benchmarks, agent-server |

Source: [^1511^], [^1507^], [^1510^]

### Communication Channels

- **Slack**: https://dub.sh/openhands (primary community chat)
- **GitHub Issues**: Active issue tracking and feature requests
- **Documentation**: https://docs.openhands.dev
- **Blog**: https://www.openhands.dev/blog

### Funding & Backing

| Round | Date | Amount | Lead Investor |
|-------|------|--------|---------------|
| Seed | Sep 2024 | $5M | Menlo Ventures |
| Series A | Nov 2025 | $18.8M | Soma Somasegar |
| **Total** | | **$23.8M** | |

Notable angels: Hugging Face Co-Founder Thomas Wolf, Cloudera Co-Founder Jeff Hammerbacher, PyTorch creator Soumith Chintala.

Source: [^1512^], [^1507^]

### Notable Users

Used by engineers at various companies including individual developers automating routine tasks to large teams in complex refactoring projects.

Source: [^1511^], [^1488^]

---

## 16. Limitations

### Structural Limitations

1. **Docker Dependency**: Requires Docker installed, running, and properly configured. Creates friction in CI/CD with port-mapping, permission, and resource allocation issues.

2. **Setup Complexity**: Pulling Docker image, configuring API keys, volume mounts takes longer than Claude Code's simpler install.

3. **Inconsistent Output Quality**: Model-agnosticism means output varies significantly by provider. Weaker models (smaller than 32B) drop completion rates on complex multi-file tasks.

4. **Secrets Management**: OpenHands does NOT have a proper secrets management system. Credentials must be provided via:
   - Environment variables (theoretically passed to sandbox)
   - Files in the workspace
   - Prompt injection (credentials may appear in chat/terminal logs)

5. **Browsing Reliability**: Browser automation is the flakiest tool. Site changes, JS-heavy pages, and bot detection make it unreliable.

6. **Session Timeouts**: Long-running processes may hit session time limits.

7. **No Interactive Debugging**: Cannot set breakpoints interactively.

8. **Context Window Limits**: Cannot see entire large codebases at once.

9. **Middleware Latency**: Routing layer adds estimated 10-20% token overhead vs Claude Code's native client.

10. **V0 → V1 Documentation Gap**: Much public material describes V0 (different codebase). The original arXiv paper describes V0; check dates when reading.

11. **MCP Attack Surface**: External MCP servers run with agent privileges. Must be treated like dependencies — pin and audit.

12. **No Persistent Cross-Session State**: Previous sessions not remembered automatically.

Sources: [^1478^], [^1487^], [^1488^], [^1419^]

### Performance Caveats

- 77% on SWE-Bench Verified is **Claude Sonnet 4.5 dependent**
- Cheaper models drop hard: Qwen3 Coder 480B = 65%; smaller models = much worse
- The architecture isn't magic — it amplifies the underlying model's capability

Source: [^1419^]

---

## 17. Real-World Usage

### Use Cases

- **Individual developers**: Automating routine tasks, writing boilerplate, fixing bugs
- **Large teams**: Complex refactoring projects, automated issue resolution
- **CI/CD pipelines**: Headless mode for automated code review, testing, PR generation
- **Research**: Benchmarking agents on SWE-Bench, GAIA, and other academic benchmarks
- **Education**: Learning codebase structure, understanding new frameworks

Source: [^1511^], [^1488^]

### Case Study: GitHub Issue Resolution

The OpenHands Resolver workflow:
1. Label issue with `fix-me`
2. OpenHands checks out repo, reads issue description
3. Agent explores codebase, identifies fix location
4. Implements fix in sandbox
5. Runs tests to verify
6. Creates PR with fix
7. Comments on issue with summary and PR link

Source: [^1509^]

### Practical Tips for Success

1. **Clean state**: Commit or stash uncommitted changes before starting
2. **Working build**: Ensure the project builds
3. **Passing tests**: Start from a green state
4. **AGENTS.md**: Document build commands, test commands, code style, architecture overview
5. **Break tasks down**: Very long tasks may timeout

Source: [^1487^]

---

## 18. Comparison with Competitors

### High-Level Comparison

| Feature | OpenHands | Claude Code | Aider | Cursor | Codex CLI |
|---------|-----------|-------------|-------|--------|-----------|
| **Type** | Full agent platform | Terminal agent | CLI assistant | AI IDE | Terminal agent |
| **License** | MIT (open) | Proprietary (closed) | Apache-2.0 | Proprietary | Proprietary |
| **Cost** | API cost only | $20/mo + API | API cost only | $20/mo + API | Free with ChatGPT |
| **Models** | 100+ via LiteLLM | Claude only | Any via OpenRouter | Claude, GPT, Gemini | OpenAI only |
| **Sandbox** | Docker (optional) | Local shell | Local shell | None | Local shell |
| **SWE-bench** | ~77% | 80.8% | ~55% | 51.7% | 80.0% |
| **MCP Support** | Yes (native) | Yes | No | Yes | Limited |
| **Headless/CI** | Excellent | Partial | Good | No | Limited |
| **Autonomy** | Highest | High | Medium | Medium | High |
| **IDE Required** | No | No | No | Yes | No |
| **GitHub Stars** | 69K | N/A | ~25K | N/A | 66K |

Sources: [^1481^], [^1489^], [^1416^], [^1418^]

### Detailed Comparison

**vs Claude Code**:
- OpenHands is model-agnostic (Claude Code = Claude only)
- OpenHands has stronger sandboxing (Docker vs local shell)
- OpenHands has better CI/CD headless mode
- Claude Code has tighter Claude integration and higher SWE-bench (80.8% vs 77%)
- Claude Code is simpler to install (no Docker dependency)
- Claude Code has native MCP support

**vs Aider**:
- OpenHands is fully autonomous (Aider is augmented/pair-programming)
- OpenHands has Docker sandboxing (Aider runs locally)
- Aider is simpler, Git-native, more lightweight
- Aider has better cost control (direct API, no overhead)

**vs Cursor**:
- OpenHands is terminal-first (Cursor is IDE-first)
- OpenHands is open-source (Cursor is closed/proprietary)
- OpenHands has true autonomous execution (Cursor = approve/YOLO modes)
- Cursor has better visual diff views and IDE integration

**vs Codex CLI**:
- OpenHands is model-agnostic (Codex = OpenAI only)
- OpenHands has sandboxing (Codex runs locally)
- Codex has higher SWE-bench (80% vs 77%)
- Both have good terminal-first workflows

Sources: [^1484^], [^1485^], [^1489^]

---

## 19. Configuration

### V1 Configuration Model

Most user-facing configuration is done via the **Settings UI** in the Web app (LLM provider/model, integrations, MCP, secrets).

### Common Environment Variables

```bash
# LLM credentials
LLM_API_KEY=your-api-key
LLM_MODEL=anthropic/claude-sonnet-4-5-20250929
LLM_BASE_URL=https://custom-endpoint.com/v1  # Optional

# Persistence
OH_PERSISTENCE_DIR=~/.openhands

# Public URL (optional)
OH_WEB_URL=https://your-openhands-instance.com

# Sandbox
SANDBOX_VOLUMES="/host/path:/container/path"
AGENT_SERVER_IMAGE_REPOSITORY=ghcr.io/openhands/agent-server
AGENT_SERVER_IMAGE_TAG=1.19.1-python

# Runtime provider (legacy)
RUNTIME=docker        # default
RUNTIME=process       # local execution
RUNTIME=remote        # remote API

# Retry configuration
LLM_NUM_RETRIES=4
LLM_RETRY_MIN_WAIT=5
LLM_RETRY_MAX_WAIT=30
LLM_RETRY_MULTIPLIER=2

# Advanced LLM settings
LLM_API_VERSION=
LLM_EMBEDDING_MODEL=
LLM_DROP_PARAMS=true
LLM_DISABLE_VISION=false
LLM_CACHING_PROMPT=true
```

Source: [^1479^], [^1460^]

### config.toml (Development Mode)

```toml
[llm]
num_retries = 4
retry_min_wait = 5
retry_max_wait = 30
retry_multiplier = 2
```

Source: [^1460^]

### CLI Config Files

Stored in `~/.openhands/`:
- `agent_settings.json` — persisted agent settings (including condenser config)
- `cli_config.json` — CLI/TUI preferences (e.g., critic enabled)
- `mcp.json` — MCP server configuration

Source: [^1416^]

### Sandbox Runtime Configuration

```python
# Docker workspace configuration example
with DockerWorkspace(
    server_image="ghcr.io/openhands/agent-server:latest-python",
    host_port=8010,
    platform="linux/amd64",
    extra_ports=True,  # Expose VSCode (port+1) and VNC (port+2)
) as workspace:
```

Source: [^1480^]

---

## 20. Security

### Sandboxing Architecture

- **Container isolation**: Each session runs in an isolated Docker container
- **Controlled port mapping**: Only specific ports exposed to host
- **Directory mounting**: Only explicitly mounted directories accessible
- **Network restrictions**: Container network can be restricted

Source: [^1420^], [^1425^]

### Authorization Gap

**Important finding**: OpenHands has strong sandboxing (containing blast radius) but a weaker **authorization layer** for actions WITHIN the sandbox:

| | Sandboxing | Authorization |
|---|---|---|
| Question | Where can agent act? | What can agent do? |
| Mechanism | Container isolation | Policy per action |
| Granularity | Environment-level | Action-level |
| Example | Can't access host FS | Can read but can't delete files |

The agent can still: refactor modules beyond scope, run destructive commands on mounted workspace, `curl` arbitrary URLs, install packages from PyPI/npm.

Source: [^1425^]

### Confirmation Modes

- **Default**: Ask for confirmation on each action
- **Always-approve** (`--yolo`): Auto-approve all actions
- **LLM-approve** (`--llm-approve`): LLM-based security analyzer reviews actions

Source: [^1416^]

### Secrets Handling (Weak Point)

**OpenHands does NOT have a proper secrets management system.** Options for providing credentials:

1. Environment variables (passed to sandbox)
2. Files in the workspace
3. Prompt injection (credentials may appear in logs/chat)
4. GitHub/GitLab tokens via web interface (works for git operations)

**Risk**: Secrets may appear in the chat or terminal output with any of these methods.

Source: [^1488^], [^1425^]

### Security Best Practices

1. **Always use Docker in headless mode** — never use `always-approve` with `LocalWorkspace`
2. **Don't mount more than the working directory**
3. **Pin and audit MCP servers** — they run with agent privileges
4. **Use `--llm-approve` for risky operations**
5. **Set budget controls** — max iterations, max retries, cost tracking

Source: [^1419^], [^1480^]

### Production Reliability (V1 vs V0)

V1 showed a **61% reduction in system-attributable failures** relative to V0 in a 15-day production comparison.

Source: [^1505^]

---

## Appendix A: Key Source URLs

| Source | URL | Date |
|--------|-----|------|
| OpenHands V1 SDK Paper | https://arxiv.org/abs/2511.03690 | 2025-11 |
| Original OpenDevin Paper | https://arxiv.org/abs/2407.16741 | 2024-07 |
| OpenHands Docs (LLMs) | https://docs.openhands.dev/openhands/usage/llms/llms | 2026-05 |
| OpenHands Docs (MCP) | https://docs.openhands.dev/openhands/usage/cli/mcp-servers | 2026 |
| OpenHands Docs (Headless) | https://docs.openhands.dev/openhands/usage/cli/headless | 2026-01 |
| OpenHands Docs (Config) | https://docs.openhands.dev/openhands/usage/advanced/configuration-options | 2026-02 |
| OpenHands CLI Repo | https://github.com/OpenHands/OpenHands-CLI | 2026-05 |
| OpenHands Main Repo | https://github.com/OpenHands/OpenHands | 2026 |
| Benchmarks Repo | https://github.com/OpenHands/benchmarks | 2025-11 |
| GitHub Action Marketplace | https://github.com/marketplace/actions/openhands-ai-action | 2026 |
| Deep Dive Guide | https://dev.to/truongpx396/openhands-deep-dive-build-your-own-guide-1al0 | 2026-04 |
| Runtime Architecture (CN) | https://www.cnblogs.com/rossiXYZ/p/19656834 | 2026-03 |
| Daytona Sandbox Integration | https://www.daytona.io/dotfiles/building-a-secure-openhands-runtime-with-daytona-sandboxes | 2025-03 |
| OpenHands Blog (1 Year) | https://www.openhands.dev/blog/one-year-of-openhands | 2025-03 |
| Press Release ($5M) | https://www.openhands.dev/blog/press-release-all-hands-announces-5m | 2024-09 |
| OpenHands Index | https://index.openhands.dev | Ongoing |

---

## Appendix B: Quick Start Commands

```bash
# Install
uv tool install openhands --python 3.12

# Interactive TUI
openhands

# Headless for CI
openhands --headless -t "Fix the failing tests in auth.py"

# Web GUI
openhands serve

# With specific model via OpenRouter
LLM_API_KEY=sk-or-v1-xxx LLM_MODEL=openrouter/deepseek/deepseek-v4-pro openhands

# Add MCP server
openhands mcp add tavily --transport stdio npx -- -y mcp-remote "https://mcp.tavily.com/mcp/?tavilyApiKey=<key>"

# Check MCP status
openhands mcp list
```

---

*Research compiled from 15+ independent searches across official docs, academic papers, GitHub repositories, community guides, and technical analyses. All sources cited with [^N^] format. Confidence: HIGH for architecture and core features; MEDIUM for specific version details due to rapid project evolution.*

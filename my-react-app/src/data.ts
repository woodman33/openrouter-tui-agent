export interface PageItem {
  id: string;
  label: string;
  desc: string;
  glyph: string;
  accent: string;
}

export const PAGES: PageItem[] = [
  { id: "brief", label: "Brief", desc: "User intent & streaming agent dialog", glyph: "solar:chat-round-line-bold", accent: "#10b981" },
  { id: "discovery", label: "Discovery", desc: "Capability reveal & MCP tools scan", glyph: "solar:magic-stick-bold", accent: "#3b82f6" },
  { id: "teams", label: "Teams", desc: "Control & swarm orchestration DAG", glyph: "solar:users-group-two-rounded-bold", accent: "#f59e0b" },
  { id: "workspace", label: "Workspace", desc: "File evidence, terminal outputs & diffs", glyph: "solar:code-file-bold", accent: "#e11d48" },
  { id: "proof", label: "Proof", desc: "Verifiable receipts & conformed VM thread", glyph: "solar:shield-check-bold", accent: "#a78bfa" },
  { id: "porter", label: "Porter", desc: "MCP/CLI/tool installer & svix bridge", glyph: "solar:download-square-bold", accent: "#00f0ff" },
  { id: "options", label: "Options", desc: "Themes, animations, mascot & layout density", glyph: "solar:settings-bold", accent: "#ec4899" },
];

export interface ModelItem {
  id: string;
  name: string;
  role: string;
  lat: string;
  load: number;
}

export const MODELS: ModelItem[] = [
  { id: "claude-sonnet-4", name: "Claude 3.5 Sonnet", role: "lead", lat: "1.2s", load: 0.8 },
  { id: "qwen-2.5-coder", name: "Qwen 2.5 Coder 32B", role: "codegen", lat: "0.8s", load: 0.65 },
  { id: "hermes-3-llama", name: "Hermes 3 Llama 405B", role: "research", lat: "1.4s", load: 0.4 },
  { id: "llama-3.3-mcp", name: "Llama 3.3 MCP", role: "verify", lat: "0.6s", load: 0.3 }
];

export interface ToolItem {
  name: string;
  desc: string;
  schema: string;
  status: "active" | "idle" | "restricted";
  provider: string;
}

export const DISCOVERED_TOOLS: ToolItem[] = [
  { name: "stress", desc: "High-throughput load testing tool (oha wrapper)", schema: "url: string, requests?: number, concurrency?: number", status: "active", provider: "local-bin" },
  { name: "browser.open", desc: "Opens agent-controlled headless browser instance", schema: "url: string, headed?: boolean, session?: string", status: "active", provider: "agent-browser" },
  { name: "browser.snapshot", desc: "Fetches interactive DOM snapshot of active page", schema: "session?: string, depth?: number", status: "active", provider: "agent-browser" },
  { name: "browser.click", desc: "Simulates mouse click on specified DOM element ref", schema: "ref: string, session?: string", status: "active", provider: "agent-browser" },
  { name: "composio.help", desc: "Retrieves list of registered integration connectors", schema: "None", status: "idle", provider: "composio" },
  { name: "github.mcp", desc: "Clones, updates, and reviews files in GitHub repo", schema: "repo: string, branch?: string, action: string", status: "active", provider: "github-mcp-server" },
  { name: "cloudflare.kv", desc: "Reads/writes secure session state to Cloudflare", schema: "namespace: string, key: string, val?: string", status: "restricted", provider: "stratum-worker" },
];

export interface FileChangeItem {
  file: string;
  type: "modified" | "created" | "deleted";
  linesAdded: number;
  linesRemoved: number;
  diff: string[];
}

export const FILE_CHANGES: FileChangeItem[] = [
  {
    file: "src/founder_terminal/app.py",
    type: "modified",
    linesAdded: 14,
    linesRemoved: 2,
    diff: [
      "@@ -12,4 +12,16 @@",
      " import os",
      " import sys",
      "-print('Starting TUI client...')" +
      "+from founder_terminal.openrouter import detector",
      "+from founder_terminal.openrouter.env_writer import EnvWriter",
      "+",
      "+def initialize_secure_runtime():",
      "+    # Redact sensitive parameters during workspace boots",
      "+    writer = EnvWriter('.env')",
      "+    writer.backup_current()",
      "+    writer.chmod_secure()",
      "+    print('🔐 Sandbox boundary verified. Key redaction active.')",
      "+    return detector.check_key_redaction()",
    ]
  },
  {
    file: "docs/architecture/DOCTRINE.md",
    type: "modified",
    linesAdded: 5,
    linesRemoved: 0,
    diff: [
      "@@ -82,3 +82,8 @@",
      " ## 8. Anti-Scope-Creep Rules",
      " - Never implement untracked dashboard services.",
      "+- Enforce zero data retention (ZDR) globally on secret paths.",
      "+- Relay verified multi-agent VM threads natively on proof receipt."
    ]
  },
  {
    file: "src/integrations/svix.ts",
    type: "created",
    linesAdded: 25,
    linesRemoved: 0,
    diff: [
      "@@ -0,0 +1,25 @@",
      "+import { Svix } from 'svix';",
      "+",
      "+export async function dispatchWebhook(payload: any) {",
      "+    const svix = new Svix(process.env.SVIX_API_KEY || '');",
      "+    await svix.message.create('app_123', {",
      "+        eventType: 'agent.run_completed',",
      "+        payload: payload,",
      "+    });",
      "+}"
    ]
  }
];

export interface VMLogRow {
  t: string;
  lvl: "info" | "ok" | "warn" | "err";
  src: string;
  msg: string;
}

export const VM_LOGS: VMLogRow[] = [
  { t: "19:21:13", lvl: "info", src: "SYSTEM", msg: "Establishing Daytona VM sandbox isolation..." },
  { t: "19:21:14", lvl: "ok", src: "SANDBOX", msg: "Durable sandbox online: daytona-vm-382a" },
  { t: "19:21:15", lvl: "ok", src: "RUNNER", msg: "opencode: connected successfully via tmux-palette" },
  { t: "19:21:16", lvl: "info", src: "AGENTPASS", msg: "Passport check: AgentPass_Coding_v2 authenticated" },
  { t: "19:21:17", lvl: "ok", src: "DOCTRINE", msg: "Doctrine hash matched: sha256_e430f8219ab92cd0" },
  { t: "19:21:18", lvl: "warn", src: "GOVERNANCE", msg: "Command 'git push' requires manual approval (gated visa)" },
  { t: "19:21:19", lvl: "info", src: "OPENROUTER", msg: "Routing request for anthropic/claude-3-5-sonnet (normal budget zone)" },
  { t: "19:21:20", lvl: "ok", src: "SQLITE-D1", msg: "Committed Run run_jti_81f292 verifiable evidence" },
  { t: "19:21:21", lvl: "ok", src: "COMPILER", msg: "Vite + TypeScript compilation passed (0 errors)" },
  { t: "19:21:22", lvl: "info", src: "TELEMETRY", msg: "Relaying real-time run telemetry to companion websocket" },
  { t: "19:21:23", lvl: "ok", src: "SVIX-DISP", msg: "Dispatched verifiable proof to webhooks stream" }
];

export const NAV = [
  { id: "brief", label: "Brief", icon: "solar:chat-square-call-linear" },
  { id: "porter", label: "Porter", icon: "solar:transmission-linear" },
  { id: "workspace", label: "Workspace", icon: "solar:command-linear" },
  { id: "proof", label: "Proof", icon: "solar:shield-check-linear" },
  { id: "options", label: "Options", icon: "solar:settings-linear" },
];

export const PIPELINE = [
  { id: "url", label: "MCP Server URL", icon: "solar:link-linear" },
  { id: "scan", label: "MCPorter Scan", icon: "solar:radar-2-linear" },
  { id: "cli", label: "Generated CLI", icon: "solar:code-linear" },
  { id: "scope", label: "AgentPass Scope", icon: "solar:key-minimalistic-linear" },
  { id: "receipt", label: "TIMMY Receipt", icon: "solar:bill-check-linear" },
];

export const PORTER_CHIPS = [
  { cmd: "/porter add <url>", desc: "register an MCP server" },
  { cmd: "/porter list", desc: "show known servers" },
  { cmd: "/porter inspect", desc: "view generated CLI surface" },
  { cmd: "/porter approve", desc: "grant AgentPass scope" },
  { cmd: "/porter cli", desc: "open the command" },
];

export const PORTER_CARD = {
  source: "GitHub MCP Server",
  cli: "github-mcp-cli",
  risk: "medium",
  status: "gated",
  scope: "repo:read, issues:write",
  endpoint: "mcp://github.timmy.dev/v1",
  commands: 14,
  agentPass: "PENDING",
  visa: "HOLD",
};

export const RECEIPT = {
  id: "rcpt_8f4c21ad",
  task: "Triage open issues and label by severity",
  agent: "Hermes / Pi Agent",
  tools: ["github-mcp-cli", "label-engine"],
  approved: ["issues:write", "labels:create"],
  changed: "37 issues labeled · 4 milestones updated",
  manifest: "9a3f-bc81-d7e2-44a0-91ff-6c2b8e4d10ab",
  status: "SEALED",
  duration: "1m 42s",
  cost: "$0.0000",
};

export const WORKSPACES = [
  {
    id: "cmux",
    name: "cmux",
    role: "Clickable workspace shell",
    detail: "panes, browser, live agent surface",
    state: "installed / ready",
    stateColor: "var(--verified)",
    icon: "solar:window-frame-linear",
    primary: true,
  },
  {
    id: "tmux",
    name: "tmux",
    role: "Reliable fallback backend",
    detail: "durable execution, session resume",
    state: "active / fallback ready",
    stateColor: "var(--action)",
    icon: "solar:server-linear",
    primary: false,
  },
];

export const OPTIONS = [
  { label: "Theme", value: "Charcoal", desc: "Terminal-native dark surface", action: "Switch" },
  { label: "Animation", value: "Restrained", desc: "GSAP polish, reduced if you prefer", action: "Tune" },
  { label: "Mascot", value: "TIMMY", desc: "Quartermaster guide presence", action: "Toggle" },
  { label: "Layout density", value: "Comfortable", desc: "Spacing of the main stage", action: "Adjust" },
  { label: "OpenRouter", value: "Connected", desc: "Model routing backbone", action: "Manage" },
  { label: "Pi Agent", value: "Enabled", desc: "Local planning agent", action: "Configure" },
  { label: "Hermes", value: "Enabled", desc: "Execution agent runtime", action: "Configure" },
  { label: "MCPorter", value: "v0.4.2", desc: "MCP-to-CLI bridge", action: "Update" },
  { label: "cmux/tmux", value: "cmux default", desc: "Preferred workspace shell", action: "Set" },
  { label: "Proof style", value: "Sealed", desc: "Receipt presentation mode", action: "Change" },
];

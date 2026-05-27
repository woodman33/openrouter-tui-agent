cd ~

echo ""
echo "============================================================"
echo "TIMMY TOOLCHAIN REPAIR + INSTALL"
echo "============================================================"

echo ""
echo "1) Create safe local bin paths"
echo "------------------------------------------------------------"
mkdir -p "$HOME/.local/bin"
mkdir -p "$HOME/.npm-global/bin"

echo ""
echo "2) Back up ~/.zshrc"
echo "------------------------------------------------------------"
if [ -f "$HOME/.zshrc" ]; then
  cp "$HOME/.zshrc" "$HOME/.zshrc.backup-timmy-tools-$(date +%Y%m%d-%H%M%S)"
else
  touch "$HOME/.zshrc"
fi

echo ""
echo "3) Add safe PATH block to ~/.zshrc"
echo "------------------------------------------------------------"
if ! grep -q "TIMMY TOOLCHAIN PATHS" "$HOME/.zshrc"; then
  cat >> "$HOME/.zshrc" <<'EOF'

# TIMMY TOOLCHAIN PATHS
export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$HOME/.composio:$PATH"
EOF
fi

export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$HOME/.composio:$PATH"
source "$HOME/.zshrc"
hash -r 2>/dev/null || true
rehash 2>/dev/null || true

echo ""
echo "4) Verify current shell"
echo "------------------------------------------------------------"
echo "PWD:"
pwd
echo ""
echo "PATH contains:"
echo "$PATH" | tr ':' '\n' | grep -E "local/bin|npm-global|composio" || true

echo ""
echo "5) Fix Composio command"
echo "------------------------------------------------------------"
if [ -x "$HOME/.composio/composio" ]; then
  echo "Found Composio binary at $HOME/.composio/composio"
  ln -sf "$HOME/.composio/composio" "$HOME/.local/bin/composio"
else
  echo "Composio binary not found. Installing Composio..."
  curl -fsSL https://composio.dev/install | bash
  export PATH="$HOME/.composio:$PATH"
  if [ -x "$HOME/.composio/composio" ]; then
    ln -sf "$HOME/.composio/composio" "$HOME/.local/bin/composio"
  fi
fi

hash -r 2>/dev/null || true
rehash 2>/dev/null || true

echo ""
echo "Testing composio:"
command -v composio || true
composio --help | head -30 || true

echo ""
echo "6) Verify Node/npm from safe cwd"
echo "------------------------------------------------------------"
cd ~
echo "Node:"
which node || true
node -v || true
echo ""
echo "npm:"
which npm || true
npm -v || true

echo ""
echo "7) Configure npm to use user-owned global prefix"
echo "------------------------------------------------------------"
npm config set prefix "$HOME/.npm-global" || true
export PATH="$HOME/.npm-global/bin:$PATH"
source "$HOME/.zshrc"
hash -r 2>/dev/null || true
rehash 2>/dev/null || true

echo ""
echo "8) Install oha"
echo "------------------------------------------------------------"
if command -v oha >/dev/null 2>&1; then
  echo "oha already installed:"
  command -v oha
else
  if command -v brew >/dev/null 2>&1; then
    brew install oha || true
  else
    echo "Homebrew not found. Install oha later with: brew install oha"
  fi
fi

echo ""
echo "Testing oha:"
command -v oha || true
oha --version || true

echo ""
echo "9) Install agent-browser"
echo "------------------------------------------------------------"
if command -v agent-browser >/dev/null 2>&1; then
  echo "agent-browser already installed:"
  command -v agent-browser
else
  if command -v brew >/dev/null 2>&1; then
    brew install agent-browser || true
  fi

  if ! command -v agent-browser >/dev/null 2>&1; then
    cd ~
    npm install -g agent-browser
  fi
fi

hash -r 2>/dev/null || true
rehash 2>/dev/null || true

echo ""
echo "Testing agent-browser:"
command -v agent-browser || true
agent-browser --help | head -30 || true

echo ""
echo "10) Install agent-browser Chrome runtime"
echo "------------------------------------------------------------"
if command -v agent-browser >/dev/null 2>&1; then
  agent-browser install || true
  agent-browser doctor --quick || true
else
  echo "agent-browser is still not available. Check npm/brew output above."
fi

echo ""
echo "11) Smoke test agent-browser"
echo "------------------------------------------------------------"
if command -v agent-browser >/dev/null 2>&1; then
  agent-browser close --all || true
  agent-browser open https://example.com || true
  agent-browser snapshot -i -c || true
  agent-browser screenshot "$HOME/Desktop/timmy-agent-browser-smoke.png" || true
  agent-browser close || true
fi

echo ""
echo "12) Smoke test oha"
echo "------------------------------------------------------------"
if command -v oha >/dev/null 2>&1; then
  oha -n 10 -c 2 https://example.com || true
fi

echo ""
echo "13) Final command availability"
echo "------------------------------------------------------------"
echo "composio:"
command -v composio || true
echo ""
echo "agent-browser:"
command -v agent-browser || true
echo ""
echo "oha:"
command -v oha || true
echo ""
echo "node:"
command -v node || true
node -v || true
echo ""
echo "npm:"
command -v npm || true
npm -v || true

echo ""
echo "14) Return to TIMMY repo"
echo "------------------------------------------------------------"
cd /Users/williammeldman/Desktop/openrouter-tui || {
  echo "Repo not found at /Users/williammeldman/Desktop/openrouter-tui"
  exit 0
}

echo "Now in:"
pwd

echo ""
echo "15) Add TIMMY tool test scripts if package.json exists"
echo "------------------------------------------------------------"
if [ -f package.json ]; then
  npm install execa zod
  npm install -D tsx

  mkdir -p src/integrations src/timmy/tools scripts

  cat > src/integrations/runShell.ts <<'EOF'
import { execa } from "execa";

export type ShellResult = {
  ok: boolean;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
};

export async function runShell(
  command: string,
  args: string[] = [],
  options: { cwd?: string; timeoutMs?: number } = {}
): Promise<ShellResult> {
  try {
    const result = await execa(command, args, {
      cwd: options.cwd ?? process.cwd(),
      timeout: options.timeoutMs ?? 60_000,
      reject: false,
      all: false,
      env: {
        ...process.env,
        PATH: [
          `${process.env.HOME}/.local/bin`,
          `${process.env.HOME}/.npm-global/bin`,
          `${process.env.HOME}/.composio`,
          process.env.PATH ?? "",
        ].join(":"),
      },
    });

    return {
      ok: result.exitCode === 0,
      command: [command, ...args].join(" "),
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      exitCode: result.exitCode,
    };
  } catch (error: any) {
    return {
      ok: false,
      command: [command, ...args].join(" "),
      stdout: "",
      stderr: error?.message ?? String(error),
      exitCode: null,
    };
  }
}
EOF

  cat > src/integrations/oha.ts <<'EOF'
import { z } from "zod";
import { runShell } from "./runShell";

export const OhaInputSchema = z.object({
  url: z.string().url(),
  requests: z.number().int().positive().default(10),
  concurrency: z.number().int().positive().default(2),
  timeoutMs: z.number().int().positive().default(120_000),
});

export async function runOha(input: z.input<typeof OhaInputSchema>) {
  const parsed = OhaInputSchema.parse(input);

  const result = await runShell("oha", [
    "-n",
    String(parsed.requests),
    "-c",
    String(parsed.concurrency),
    parsed.url,
  ], {
    timeoutMs: parsed.timeoutMs,
  });

  return {
    tool: "oha",
    mode: "stress",
    input: parsed,
    ...result,
  };
}
EOF

  cat > src/integrations/agentBrowser.ts <<'EOF'
import { z } from "zod";
import { runShell } from "./runShell";

export const BrowserOpenSchema = z.object({
  url: z.string().url(),
  session: z.string().default("timmy"),
  headed: z.boolean().default(false),
});

export const BrowserSnapshotSchema = z.object({
  session: z.string().default("timmy"),
  interactiveOnly: z.boolean().default(true),
  compact: z.boolean().default(true),
  depth: z.number().int().positive().optional(),
});

export async function browserOpen(input: z.input<typeof BrowserOpenSchema>) {
  const parsed = BrowserOpenSchema.parse(input);
  const args = ["--session", parsed.session];

  if (parsed.headed) args.push("--headed");

  args.push("open", parsed.url);

  const result = await runShell("agent-browser", args, {
    timeoutMs: 60_000,
  });

  return {
    tool: "agent-browser",
    action: "open",
    input: parsed,
    ...result,
  };
}

export async function browserSnapshot(input: z.input<typeof BrowserSnapshotSchema> = {}) {
  const parsed = BrowserSnapshotSchema.parse(input);
  const args = ["--session", parsed.session, "snapshot"];

  if (parsed.interactiveOnly) args.push("-i");
  if (parsed.compact) args.push("-c");
  if (parsed.depth) args.push("-d", String(parsed.depth));

  const result = await runShell("agent-browser", args, {
    timeoutMs: 60_000,
  });

  return {
    tool: "agent-browser",
    action: "snapshot",
    input: parsed,
    ...result,
  };
}

export async function browserClick(ref: string, session = "timmy") {
  const result = await runShell("agent-browser", [
    "--session",
    session,
    "click",
    ref,
  ]);

  return {
    tool: "agent-browser",
    action: "click",
    input: { session, ref },
    ...result,
  };
}

export async function browserDashboardStart(port = 4848) {
  const result = await runShell("agent-browser", [
    "dashboard",
    "start",
    "--port",
    String(port),
  ]);

  return {
    tool: "agent-browser",
    action: "dashboard-start",
    input: { port },
    ...result,
  };
}
EOF

  cat > src/integrations/composio.ts <<'EOF'
import { runShell } from "./runShell";

export async function composioHelp() {
  return runShell("composio", ["--help"], {
    timeoutMs: 30_000,
  });
}

export async function composioLogin() {
  return runShell("composio", ["login"], {
    timeoutMs: 120_000,
  });
}
EOF

  cat > src/timmy/tools/toolRegistry.ts <<'EOF'
import { runOha } from "../../integrations/oha";
import {
  browserOpen,
  browserSnapshot,
  browserClick,
  browserDashboardStart,
} from "../../integrations/agentBrowser";
import { composioHelp } from "../../integrations/composio";

export type TimmyToolCall =
  | { name: "stress"; args: { url: string; requests?: number; concurrency?: number } }
  | { name: "browser.open"; args: { url: string; session?: string; headed?: boolean } }
  | { name: "browser.snapshot"; args: { session?: string } }
  | { name: "browser.click"; args: { ref: string; session?: string } }
  | { name: "browser.dashboard"; args: { port?: number } }
  | { name: "composio.help"; args: {} };

export async function runTimmyTool(call: TimmyToolCall) {
  switch (call.name) {
    case "stress":
      return runOha({
        url: call.args.url,
        requests: call.args.requests ?? 10,
        concurrency: call.args.concurrency ?? 2,
      });

    case "browser.open":
      return browserOpen({
        url: call.args.url,
        session: call.args.session ?? "timmy",
        headed: call.args.headed ?? false,
      });

    case "browser.snapshot":
      return browserSnapshot({
        session: call.args.session ?? "timmy",
        interactiveOnly: true,
        compact: true,
      });

    case "browser.click":
      return browserClick(call.args.ref, call.args.session ?? "timmy");

    case "browser.dashboard":
      return browserDashboardStart(call.args.port ?? 4848);

    case "composio.help":
      return composioHelp();

    default:
      throw new Error(`Unknown TIMMY tool: ${(call as any).name}`);
  }
}
EOF

  cat > scripts/test-timmy-toolchain.ts <<'EOF'
import { runTimmyTool } from "../src/timmy/tools/toolRegistry";

async function printResult(label: string, result: any) {
  console.log(`\n================ ${label} ================`);
  console.log("ok:", result.ok);
  console.log("command:", result.command);
  if (result.stdout) {
    console.log("\nstdout:\n", result.stdout.slice(0, 4000));
  }
  if (result.stderr) {
    console.log("\nstderr:\n", result.stderr.slice(0, 2000));
  }
}

async function main() {
  await printResult(
    "COMPOSIO HELP",
    await runTimmyTool({ name: "composio.help", args: {} })
  );

  await printResult(
    "AGENT-BROWSER DASHBOARD",
    await runTimmyTool({ name: "browser.dashboard", args: { port: 4848 } })
  );

  await printResult(
    "AGENT-BROWSER OPEN",
    await runTimmyTool({
      name: "browser.open",
      args: { url: "https://example.com", session: "timmy" },
    })
  );

  await printResult(
    "AGENT-BROWSER SNAPSHOT",
    await runTimmyTool({
      name: "browser.snapshot",
      args: { session: "timmy" },
    })
  );

  await printResult(
    "OHA STRESS TEST",
    await runTimmyTool({
      name: "stress",
      args: { url: "https://example.com", requests: 10, concurrency: 2 },
    })
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
EOF

  node <<'NODE'
const fs = require("fs");
const path = "package.json";

const pkg = JSON.parse(fs.readFileSync(path, "utf8"));
pkg.scripts = pkg.scripts || {};
pkg.scripts["timmy:toolchain"] = "tsx scripts/test-timmy-toolchain.ts";

fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
console.log("Added npm script: timmy:toolchain");
NODE

  echo ""
  echo "Running TIMMY toolchain test..."
  npm run timmy:toolchain
else
  echo "No package.json found in openrouter-tui. Skipping repo script setup."
fi

echo ""
echo "============================================================"
echo "COMPLETE"
echo "============================================================"
echo ""
echo "Next manual command if Composio is available:"
echo "composio login"
echo ""
echo "Next repo command:"
echo "cd /Users/williammeldman/Desktop/openrouter-tui && npm run timmy:toolchainNearbiJSX does NOT directly run native iPhone apps.

It runs AI-generated React JSX artifacts inside its own local React runtime.

FLOW:

AI (ChatGPT / Claude / Cursor / Timmy TUI)
→ generates JSX code
→ NearbiJSX imports the JSX
→ NearbiJSX compiles/renders it locally
→ the mini-app runs instantly on iPhone/iPad/Mac

SUPPORTED RUNTIME:
- React
- TailwindCSS
- shadcn/ui
- Lucide icons
- Recharts
- local/iCloud storage

HOW TO GET LIVE JSX INTO NEARBIXJSX:

1. COPY / PASTE
ChatGPT → Copy JSX → Paste into NearbiJSX

2. FILE IMPORT
Cursor/Claude → save artifact.jsx → import into NearbiJSX

3. SHARE SHEET
Share .jsx file → “Open in NearbiJSX”

4. ICLOUD SYNC
Save JSX into shared iCloud folder watched by NearbiJSX

5. CLOUDFLARE LIVE IMPORT (BEST)

Timmy TUI:
POST JSX artifact to Cloudflare Worker

Worker:
stores artifact in R2
returns signed URL

NearbiJSX:
opens:

nearbijsx://import?url=https://your-worker.dev/artifact/abc123

NearbiJSX downloads the JSX and instantly renders it.

BEST ARCHITECTURE:

Timmy TUI
→ OpenRouter generates JSX
→ Cloudflare Worker stores JSX
→ R2 stores artifacts
→ Durable Object stores session metadata
→ NearbiJSX imports signed URL
→ React runtime renders locally

EXAMPLE JSX:

export default function GDPChart() {
  return (
    <div className="p-6 text-white bg-black">
      <h1 className="text-3xl font-bold">GDP Dashboard</h1>
    </div>
  )
}

THAT IS THE ENTIRE MAGIC.

NearbiJSX is basically:
“AI-generated portable React mini-app runtime for Apple devices.”

NEXT:
Add this deep link support:

nearbijsx://import?url=

and make Timmy export JSX directly to Cloudflare R2.Cloudflare Pack:
- Worker templates
- Durable Object examples
- MCP server manifests
- deploy scripts
- docs cache

Daytona Pack:
- sandbox starter projects
- language runtimes config
- test harnesses

Trigger Pack:
- workflow templates
- retry policies
- job examples

Composio Pack:
- auth setup guides
- toolkit schemas
- example automationsOpenRouter runner
Cloudflare Worker/Agents
MCP registry
Daytona card
Trigger.dev card
Composio card
tmux/local bridge
approval queue
premium dashboard UILaunchpad Core App

  ↓

Apple-hosted Background Asset Packs

  ├─ Cloudflare Builder Pack

  ├─ MCP Server Pack

  ├─ Daytona Sandbox Pack

  ├─ Trigger Workflow Pack

  ├─ Composio Integration Pack

  ├─ Shopify Agent Pack
Essential pack:
- core UI assets
- default tool lane definitions
- basic docs
- onboarding examples

Prefetch pack:
- OpenRouter docs cache
- Cloudflare/MCP templates
- Daytona sample projects
- Trigger.dev workflows
- Composio integration examples

On-demand packs:
- Rive themes
- demo videos
- optional local model adapters
- vertical-specific toolpacks: Shopify, Canva, cards, media
  ├─ Canva App Builder Pack"
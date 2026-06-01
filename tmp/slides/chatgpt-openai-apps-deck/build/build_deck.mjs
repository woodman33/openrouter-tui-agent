const fs = await import("node:fs/promises");
const path = await import("node:path");
const { Presentation, PresentationFile } = await import("@oai/artifact-tool");

const W = 1280;
const H = 720;
const OUT_DIR = path.resolve("outputs/chatgpt-openai-apps-deck");
const SCRATCH_DIR = path.resolve("tmp/slides/chatgpt-openai-apps-deck");
const PREVIEW_DIR = path.join(SCRATCH_DIR, "preview");
const INSPECT_PATH = path.join(SCRATCH_DIR, "inspect.ndjson");

const C = {
  paper: "#F7F3EA",
  ink: "#111318",
  graphite: "#333940",
  muted: "#687079",
  line: "#24282D",
  white: "#FFFFFF",
  teal: "#20B486",
  tealDark: "#0B6A56",
  coral: "#E96B58",
  gold: "#D6A33A",
  blue: "#486DFF",
  lavender: "#A878FF",
  gray: "#E8E5DC",
  softTeal: "#DFF4ED",
  softCoral: "#FBE5E0",
  softGold: "#F7E8BD",
  softBlue: "#E4E9FF",
  transparent: "#00000000",
};

const FONT = {
  title: "Poppins",
  body: "Lato",
  mono: "Aptos Mono",
};

const sources = [
  "Apps SDK quickstart: https://developers.openai.com/apps-sdk/quickstart/",
  "Build MCP server: https://developers.openai.com/apps-sdk/build/mcp-server/",
  "Build ChatGPT UI: https://developers.openai.com/apps-sdk/build/chatgpt-ui/",
  "Define tools: https://developers.openai.com/apps-sdk/plan/tools/",
  "Deploy Apps SDK: https://developers.openai.com/apps-sdk/deploy/",
  "Submit Apps: https://developers.openai.com/apps-sdk/deploy/submission/",
  "Submission guidelines: https://developers.openai.com/apps-sdk/app-submission-guidelines/",
  "Responses migration: https://developers.openai.com/api/docs/guides/migrate-to-responses",
  "OpenAI tools: https://developers.openai.com/api/docs/guides/tools",
  "Function calling: https://developers.openai.com/api/docs/guides/function-calling",
];

const inspect = [];

function line(fill = C.transparent, width = 0, style = "solid") {
  return { style, fill, width };
}

function shape(slide, geometry, x, y, w, h, fill = C.transparent, stroke = C.transparent, strokeWidth = 0, role = "shape") {
  const s = slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: line(stroke, strokeWidth),
  });
  inspect.push({ kind: "shape", slide: currentSlideNo, role, bbox: [x, y, w, h] });
  return s;
}

let currentSlideNo = 0;

function text(slide, value, x, y, w, h, opts = {}) {
  const s = shape(slide, "rect", x, y, w, h, opts.fill ?? C.transparent, opts.stroke ?? C.transparent, opts.strokeWidth ?? 0, opts.role ?? "text");
  s.text = Array.isArray(value) ? value.join("\n") : String(value);
  s.text.fontSize = opts.size ?? 22;
  s.text.color = opts.color ?? C.ink;
  s.text.bold = Boolean(opts.bold);
  s.text.typeface = opts.face ?? FONT.body;
  s.text.alignment = opts.align ?? "left";
  s.text.verticalAlignment = opts.valign ?? "top";
  s.text.insets = opts.insets ?? { left: 0, right: 0, top: 0, bottom: 0 };
  if (opts.autoFit) s.text.autoFit = opts.autoFit;
  inspect.push({
    kind: "textbox",
    slide: currentSlideNo,
    role: opts.role ?? "text",
    text: Array.isArray(value) ? value.join("\n") : String(value),
    bbox: [x, y, w, h],
  });
  return s;
}

function title(slide, kicker, heading, subheading = "") {
  text(slide, kicker.toUpperCase(), 58, 32, 510, 22, {
    size: 12,
    bold: true,
    color: C.tealDark,
    face: FONT.mono,
    role: "kicker",
  });
  shape(slide, "rect", 58, 64, 1164, 2, C.line, C.transparent, 0, "rule");
  shape(slide, "ellipse", 52, 57, 16, 16, C.teal, C.line, 1.5, "marker");
  text(slide, heading, 58, 92, 790, 96, {
    size: 34,
    bold: true,
    color: C.ink,
    face: FONT.title,
    role: "title",
  });
  if (subheading) {
    text(slide, subheading, 60, 190, 690, 54, {
      size: 17,
      color: C.graphite,
      role: "subtitle",
    });
  }
  text(slide, `${String(currentSlideNo).padStart(2, "0")} / 10`, 1120, 32, 102, 22, {
    size: 12,
    bold: true,
    color: C.tealDark,
    face: FONT.mono,
    align: "right",
    role: "folio",
  });
}

function card(slide, x, y, w, h, label, body, accent = C.teal, fill = C.white) {
  shape(slide, "roundRect", x, y, w, h, fill, C.line, 1.1, `card ${label}`);
  shape(slide, "rect", x, y, 8, h, accent, C.transparent, 0, `card accent ${label}`);
  text(slide, label, x + 22, y + 18, w - 44, 26, {
    size: 13,
    bold: true,
    color: accent === C.gold ? "#7A5B0A" : accent,
    face: FONT.mono,
    role: "card label",
  });
  text(slide, body, x + 22, y + 54, w - 44, h - 68, {
    size: 16,
    color: C.ink,
    role: "card body",
    autoFit: "shrinkText",
  });
}

function miniCallout(slide, x, y, w, h, label, body, accent = C.teal) {
  shape(slide, "roundRect", x, y, w, h, C.white, C.line, 1.1, `mini callout ${label}`);
  shape(slide, "rect", x, y, 7, h, accent, C.transparent, 0, `mini accent ${label}`);
  text(slide, label, x + 22, y + 14, w - 44, 22, {
    size: 13,
    bold: true,
    color: accent,
    role: "mini label",
  });
  text(slide, body, x + 22, y + 40, w - 44, h - 48, {
    size: 12,
    color: C.graphite,
    role: "mini body",
    autoFit: "shrinkText",
  });
}

function code(slide, value, x, y, w, h, caption = "") {
  shape(slide, "roundRect", x, y, w, h, "#12151B", C.line, 1.2, "code block");
  shape(slide, "rect", x, y, w, 34, "#20242E", C.transparent, 0, "code topbar");
  shape(slide, "ellipse", x + 16, y + 11, 10, 10, C.coral, C.transparent, 0, "code dot");
  shape(slide, "ellipse", x + 34, y + 11, 10, 10, C.gold, C.transparent, 0, "code dot");
  shape(slide, "ellipse", x + 52, y + 11, 10, 10, C.teal, C.transparent, 0, "code dot");
  if (caption) {
    text(slide, caption, x + 76, y + 9, w - 92, 16, {
      size: 10,
      color: "#CAD1DA",
      face: FONT.mono,
      role: "code caption",
    });
  }
  text(slide, value, x + 20, y + 48, w - 40, h - 62, {
    size: 12,
    color: "#ECF2F8",
    face: FONT.mono,
    role: "code",
    autoFit: "shrinkText",
  });
}

function pill(slide, label, x, y, w, fill, stroke = C.line) {
  shape(slide, "roundRect", x, y, w, 38, fill, stroke, 1.1, `pill ${label}`);
  text(slide, label, x + 12, y + 9, w - 24, 18, {
    size: 12,
    bold: true,
    color: C.ink,
    face: FONT.mono,
    align: "center",
    role: "pill label",
  });
}

function arrow(slide, x1, y1, x2, y2, color = C.line) {
  const width = Math.max(26, x2 - x1);
  const height = Math.max(18, Math.abs(y2 - y1) + 18);
  const top = Math.min(y1, y2) - height / 2;
  const s = slide.shapes.add({
    geometry: "rightArrow",
    position: { left: x1, top, width, height },
    fill: color,
    line: line(C.transparent, 0),
  });
  inspect.push({ kind: "shape", slide: currentSlideNo, role: "flow arrow", bbox: [x1, top, width, height] });
  return s;
}

function notes(slide, extra = "") {
  slide.speakerNotes.setText(`${extra}\n\nSources:\n${sources.map((s) => `- ${s}`).join("\n")}`);
}

function begin(presentation, n) {
  currentSlideNo = n;
  const slide = presentation.slides.add();
  slide.background.fill = C.paper;
  return slide;
}

async function slide1(presentation) {
  const slide = begin(presentation, 1);
  shape(slide, "rect", 0, 0, W, H, C.paper, C.transparent, 0, "background");
  shape(slide, "rect", 70, 76, 8, 452, C.teal, C.transparent, 0, "accent");
  text(slide, "DEVELOPER WORKSHOP", 96, 88, 430, 24, { size: 13, bold: true, color: C.tealDark, face: FONT.mono, role: "kicker" });
  text(slide, "Programmatically build apps for ChatGPT and the OpenAI Platform", 94, 132, 820, 158, {
    size: 42,
    bold: true,
    face: FONT.title,
    role: "cover title",
  });
  text(slide, "Two paths, one mental model: expose capabilities as tools, decide who owns the UI, then deploy behind a secure HTTPS boundary.", 98, 314, 650, 70, {
    size: 19,
    color: C.graphite,
    role: "cover subtitle",
  });
  pill(slide, "Path A: ChatGPT Apps SDK", 100, 438, 260, C.softTeal);
  pill(slide, "Path B: OpenAI Platform API", 386, 438, 278, C.softBlue);
  card(slide, 820, 110, 330, 120, "What you will leave with", "Architecture choices, working code skeletons, UI setup steps, deployment expectations, and a submission-readiness checklist.", C.coral);
  card(slide, 820, 270, 330, 120, "Core choice", "Build inside ChatGPT when the conversation is the product surface. Build on the Platform when your own app owns the primary UX.", C.blue);
  card(slide, 820, 430, 330, 120, "Shared principle", "The model needs clear tool metadata, narrow schemas, explicit side-effect hints, and structured outputs it can reason about.", C.gold);
  notes(slide, "Opening slide. Emphasize that both paths are valid and often complementary.");
}

async function slide2(presentation) {
  const slide = begin(presentation, 2);
  title(slide, "Decision frame", "The two build paths", "Choose the runtime before you choose the framework. The fastest architecture is obvious once you decide where the user experiences the app.");
  card(slide, 74, 300, 330, 230, "ChatGPT-native app", "Use when users should invoke your capability in a ChatGPT conversation, see an inline widget, and let the model select tools from your MCP metadata.", C.teal, C.softTeal);
  card(slide, 476, 300, 330, 230, "Own product UI", "Use when your app controls navigation, auth, state, billing, and the primary interaction surface while OpenAI APIs power model behavior.", C.blue, C.softBlue);
  card(slide, 878, 300, 330, 230, "Hybrid", "Use the same backend capabilities in both places: MCP tools for ChatGPT, ordinary API endpoints for your web or mobile product.", C.coral, C.softCoral);
  pill(slide, "ChatGPT owns host UI", 130, 566, 224, C.white);
  pill(slide, "You own app shell", 530, 566, 224, C.white);
  pill(slide, "Shared service layer", 940, 566, 218, C.white);
  notes(slide, "Decision frame derived from Apps SDK architecture and Responses API guidance.");
}

async function slide3(presentation) {
  const slide = begin(presentation, 3);
  title(slide, "ChatGPT Apps path", "ChatGPT Apps architecture", "Expose tools via an MCP server, register widgets, and connect using the postMessage bridge.");
  const y = 322;
  card(slide, 68, y, 210, 120, "User prompt", "A request in ChatGPT triggers model tool selection.", C.coral, C.softCoral);
  card(slide, 328, y, 230, 120, "MCP tool", "Your server validates input and runs business logic.", C.teal, C.softTeal);
  card(slide, 608, y, 230, 120, "Tool result", "Return structuredContent for model and widget; _meta for widget-only payloads.", C.gold, C.softGold);
  card(slide, 888, y, 250, 120, "Widget iframe", "Render HTML with text/html;profile=mcp-app and receive bridge notifications.", C.blue, C.softBlue);
  arrow(slide, 278, y + 62, 328, y + 62);
  arrow(slide, 558, y + 62, 608, y + 62);
  arrow(slide, 838, y + 62, 888, y + 62);
  card(slide, 120, 532, 470, 76, "Tool design rule", "One job per tool. Split data tools from render tools when the UI should only mount after model-checked data.", C.teal);
  card(slide, 682, 532, 470, 76, "Security rule", "Set exact CSP domains, version template URIs, and mark read/write/destructive/open-world hints accurately.", C.coral);
  notes(slide, "Apps SDK server docs: MCP server defines tools, returns structuredContent/_meta/content, and points render tools at UI resources.");
}

async function slide4(presentation) {
  const slide = begin(presentation, 4);
  title(slide, "ChatGPT Apps code", "ChatGPT Apps server code", "Minimal TypeScript MCP server skeleton using registerAppResource and registerAppTool.");
  code(slide, `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";

const TEMPLATE_URI = "ui://widget/research-v1.html";
const server = new McpServer({ name: "research-app", version: "0.1.0" });

registerAppResource(server, "widget", TEMPLATE_URI, {}, async () => ({
  contents: [{
    uri: TEMPLATE_URI,
    mimeType: RESOURCE_MIME_TYPE,
    text: widgetHtml,
    _meta: {
      ui: {
        prefersBorder: true,
        domain: "https://research.example.com",
        csp: {
          connectDomains: ["https://api.example.com"],
          resourceDomains: ["https://persistent.oaistatic.com"]
        }
      },
      "openai/widgetDescription": "Shows selected research notes."
    }
  }]
}));`, 70, 274, 548, 356, "server/src/index.ts");
  code(slide, `registerAppTool(server, "search_notes", {
  title: "Search notes",
  description: "Use this when the user asks to find relevant notes.",
  inputSchema: { query: z.string().min(1) },
  outputSchema: { results: z.array(z.object({ id: z.string(), title: z.string() })) },
  annotations: { readOnlyHint: true },
}, async ({ query }) => {
  const results = await searchNotes(query);
  return {
    structuredContent: { results },
    content: [{ type: "text", text: JSON.stringify({ results }) }]
  };
});

registerAppTool(server, "render_notes", {
  title: "Render notes",
  description: "Render notes returned by search_notes.",
  inputSchema: { ids: z.array(z.string()) },
  outputSchema: { ids: z.array(z.string()) },
  _meta: {
    ui: { resourceUri: TEMPLATE_URI },
    "openai/outputTemplate": TEMPLATE_URI
  }
}, async ({ ids }) => ({ structuredContent: { ids } }));`, 654, 274, 556, 356, "data tool + render tool");
  notes(slide, "Key code points: resource MIME type, versioned URI, CSP, widget description, outputSchema, annotations, data/render split.");
}

async function slide5(presentation) {
  const slide = begin(presentation, 5);
  title(slide, "ChatGPT Apps widget code", "ChatGPT Apps widget code", "Render from tool results via notifications and call tools/send user messages via postMessage.");
  code(slide, `const root = document.querySelector("#root");
let rpcId = 0;
const pending = new Map();

function request(method, params) {
  const id = ++rpcId;
  window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

window.addEventListener("message", (event) => {
  if (event.source !== window.parent) return;
  const msg = event.data;
  if (!msg || msg.jsonrpc !== "2.0") return;

  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(msg.error) : resolve(msg.result);
  }

  if (msg.method === "ui/notifications/tool-result") {
    render(msg.params?.structuredContent);
  }
}, { passive: true });`, 74, 270, 532, 338, "web/src/component.js");
  code(slide, `async function rerunSearch(query) {
  const result = await request("tools/call", {
    name: "search_notes",
    arguments: { query }
  });
  render(result.structuredContent);
}

async function sendFollowUp(ids) {
  window.parent.postMessage({
    jsonrpc: "2.0",
    method: "ui/message",
    params: {
      role: "user",
      content: [{ type: "text", text: \`Summarize notes: \${ids.join(", ")}\` }]
    }
  }, "*");
}

// Optional ChatGPT extension:
await window.openai?.requestDisplayMode?.({ mode: "fullscreen" });`, 660, 270, 530, 338, "bridge calls + optional extension");
  miniCallout(slide, 92, 624, 504, 66, "Baseline", "JSON-RPC over postMessage: tool-result, tools/call, ui/message, and model-context updates.", C.teal);
  miniCallout(slide, 678, 624, 504, 66, "ChatGPT extras", "Feature-detect window.openai APIs for files, modals, fullscreen, checkout, and navigation.", C.blue);
  notes(slide, "ChatGPT UI docs recommend MCP Apps bridge as default and window.openai as compatibility plus extensions.");
}

async function slide6(presentation) {
  const slide = begin(presentation, 6);
  title(slide, "Using the ChatGPT UI", "Using the ChatGPT UI", "Developer Mode loop: run local server, open tunnel, install in ChatGPT, and test.");
  const steps = [
    ["1", "Run MCP server", "Start on http://localhost:<port>/mcp. Build the widget bundle first if you use React or Vite."],
    ["2", "Inspect locally", "Use MCP Inspector against the HTTP MCP URL to verify tool descriptors and widget rendering."],
    ["3", "Open tunnel", "Run ngrok http <port> and keep the HTTPS forwarding URL active during development."],
    ["4", "Create ChatGPT app", "Enable Developer Mode in Settings -> Apps & Connectors -> Advanced settings, then add the HTTPS /mcp URL."],
    ["5", "Exercise prompts", "Open a fresh chat, add your app from the + / More menu, and ask golden prompts plus negative prompts."],
    ["6", "Refresh after metadata changes", "When tools, schemas, CSP, or templates change, refresh the app in ChatGPT settings."],
  ];
  steps.forEach((s, i) => {
    const x = i % 2 === 0 ? 76 : 674;
    const y = 270 + Math.floor(i / 2) * 124;
    shape(slide, "ellipse", x, y + 8, 46, 46, i % 2 === 0 ? C.softTeal : C.softBlue, C.line, 1.2, "step number");
    text(slide, s[0], x, y + 19, 46, 18, { size: 14, bold: true, align: "center", face: FONT.mono, role: "step number" });
    text(slide, s[1], x + 62, y, 430, 24, { size: 18, bold: true, color: C.ink, role: "step title" });
    text(slide, s[2], x + 62, y + 34, 490, 50, { size: 14, color: C.graphite, role: "step body", autoFit: "shrinkText" });
  });
  notes(slide, "UI setup steps come from Apps SDK quickstart and deploy docs.");
}

async function slide7(presentation) {
  const slide = begin(presentation, 7);
  title(slide, "OpenAI Platform path", "OpenAI Platform architecture", "Your product frontend calls your backend, which calls OpenAI APIs, allowing you to own the entire UX surface.");
  card(slide, 80, 300, 220, 116, "Frontend", "React, Swift, mobile, CLI, or any UI you control.", C.blue, C.softBlue);
  card(slide, 364, 300, 220, 116, "Backend", "Holds API key, auth, app state, logs, and tool implementations.", C.teal, C.softTeal);
  card(slide, 648, 300, 220, 116, "Responses API", "Unified model call with built-in tools, custom functions, MCP, multimodal inputs, and state.", C.gold, C.softGold);
  card(slide, 932, 300, 220, 116, "External systems", "Databases, SaaS APIs, files, jobs, and private services.", C.coral, C.softCoral);
  arrow(slide, 300, 358, 364, 358, C.blue);
  arrow(slide, 584, 358, 648, 358, C.teal);
  arrow(slide, 868, 358, 932, 358, C.gold);
  card(slide, 132, 512, 450, 96, "When to use it", "You need custom UX, custom auth, account-specific state, mobile/native surfaces, streaming product interactions, or backend workflows beyond ChatGPT.", C.blue);
  card(slide, 700, 512, 450, 96, "Current default", "For new API projects, use Responses instead of Chat Completions unless an existing migration constraint says otherwise.", C.teal);
  notes(slide, "Responses docs describe it as the recommended primitive for new projects and an agentic loop with built-in tools.");
}

async function slide8(presentation) {
  const slide = begin(presentation, 8);
  title(slide, "Platform API code", "Platform API code", "Minimal Node/Express server route utilizing the unified Responses tool calling API.");
  code(slide, `// server.js
import OpenAI from "openai";
import express from "express";

const app = express();
app.use(express.json());
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function lookupOrder({ order_id }) {
  return { status: "shipped", eta: "2026-06-02" };
}

app.post("/api/assistant", async (req, res) => {
  const first = await openai.responses.create({
    model: "gpt-5.5",
    instructions: "You help users track orders.",
    input: req.body.message,
    tools: [{
      type: "function",
      name: "lookup_order",
      description: "Use this when the user asks for order status.",
      strict: true,
      parameters: {
        type: "object",
        properties: { order_id: { type: "string" } },
        required: ["order_id"],
        additionalProperties: false
      }
    }]
  });`, 60, 260, 560, 370, "server route: first model call");
  code(slide, `  const functionCalls = first.output.filter(
    (item) => item.type === "function_call"
  );

  const toolOutputs = functionCalls.map((call) => ({
    type: "function_call_output",
    call_id: call.call_id,
    output: JSON.stringify(
      call.name === "lookup_order"
        ? lookupOrder(JSON.parse(call.arguments))
        : { error: "unknown tool" }
    )
  }));

  const final = await openai.responses.create({
    model: "gpt-5.5",
    previous_response_id: first.id,
    input: toolOutputs
  });

  res.json({ text: final.output_text });
});

app.listen(3000);`, 660, 260, 560, 370, "server route: return tool output");
  notes(slide, "Function calling flow: request with tools, receive tool call, execute app code, send function_call_output, receive final response.");
}

async function slide9(presentation) {
  const slide = begin(presentation, 9);
  title(slide, "Platform UI & Product UI", "Using the Platform UI and product UI", "Prototype in the Playground/Dashboard, then build and ship in your own interface.");
  card(slide, 76, 282, 346, 112, "Dashboard / Playground", "Generate and iterate on prompts, function schemas, model choices, structured outputs, eval cases, and API keys.", C.gold, C.softGold);
  card(slide, 468, 282, 346, 112, "Backend service", "Store secrets in environment variables, stream Responses events, execute tools, and write logs around user requests.", C.teal, C.softTeal);
  card(slide, 860, 282, 346, 112, "Your app UI", "Chat surface, form workflow, command palette, document editor, mobile view, or internal ops console.", C.blue, C.softBlue);
  code(slide, `// Browser UI calls your backend, not OpenAI directly
async function sendMessage(message) {
  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message })
  });
  const data = await res.json();
  appendAssistantMessage(data.text);
}`, 96, 470, 486, 160, "frontend");
  card(slide, 674, 466, 458, 160, "Production habit", "Keep tool definitions small at the start of each turn. Use built-in tools when they fit, custom functions when your app owns the action, and remote MCP when the capability already exists behind a server.", C.coral);
  notes(slide, "Playground vs. Production: Dashboard Playground is great for prompt tuning, but the final app requires Express/Next.js routes. Tools parameter in Responses controls built-in functions, custom tools, and remote MCP. Keep API keys strictly server-side.");
}

async function slide10(presentation) {
  const slide = begin(presentation, 10);
  title(slide, "Launch preparation", "Deployment and submission checklist", "Secure endpoints, narrow tools, tested UIs, and review-ready metadata are key.");
  card(slide, 66, 268, 260, 228, "Build", "Define one user intent per tool. Add inputSchema, outputSchema, accurate descriptions, and side-effect annotations. Keep structuredContent concise.", C.teal, C.softTeal);
  card(slide, 366, 268, 260, 228, "Secure", "Keep keys server-side. Minimize user data. Set exact CSP domains for widgets. Do not expose secrets in structuredContent, content, or _meta.", C.coral, C.softCoral);
  card(slide, 666, 268, 260, 228, "Validate", "Run MCP Inspector for ChatGPT apps. Run API route tests for Platform apps. Test golden prompts, bad inputs, retries, and mobile layouts.", C.gold, C.softGold);
  card(slide, 966, 268, 260, 228, "Launch", "Use stable HTTPS, reliable TLS, logs, metrics, latency visibility, and review-safe demo credentials if auth is required.", C.blue, C.softBlue);
  miniCallout(slide, 148, 548, 412, 82, "Private/internal", "Use Developer Mode for ChatGPT Apps, or ship your Platform app privately with normal auth and access control.", C.teal);
  miniCallout(slide, 718, 548, 412, 82, "Public ChatGPT app", "Submit only after org verification, CSP, screenshots, privacy policy, test cases, and production MCP URL are ready.", C.coral);
  notes(slide, "Submission checklist: Deploy to stable HTTPS with reliable TLS. Restrict CSP widget domains. Validate tools with MCP Inspector. Submit org verification, screenshots, privacy policy, and valid test credentials.");
}

async function build() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });
  presentation.theme.colorScheme = {
    name: "OpenAI Builder Workshop",
    themeColors: {
      accent1: C.teal,
      accent2: C.coral,
      accent3: C.gold,
      accent4: C.blue,
      bg1: C.paper,
      bg2: C.white,
      tx1: C.ink,
      tx2: C.graphite,
    },
  };

  await slide1(presentation);
  await slide2(presentation);
  await slide3(presentation);
  await slide4(presentation);
  await slide5(presentation);
  await slide6(presentation);
  await slide7(presentation);
  await slide8(presentation);
  await slide9(presentation);
  await slide10(presentation);

  inspect.unshift({ kind: "deck", slideCount: presentation.slides.count, slideSize: { width: W, height: H } });
  await fs.writeFile(INSPECT_PATH, inspect.map((x) => JSON.stringify(x)).join("\n") + "\n", "utf8");

  for (let i = 0; i < presentation.slides.items.length; i += 1) {
    const blob = await presentation.export({ slide: presentation.slides.items[i], format: "png", scale: 1 });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    await fs.writeFile(path.join(PREVIEW_DIR, `slide-${String(i + 1).padStart(2, "0")}.png`), bytes);
  }

  const pptx = await PresentationFile.exportPptx(presentation);
  const output = path.join(OUT_DIR, "output.pptx");
  await pptx.save(output);
  console.log(output);
}

await build();

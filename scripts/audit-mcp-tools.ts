// p10 feature audit — drive the real MCP server over stdio like a client:
// initialize → tools/list → tools/call for every tool with minimal input.
// Records {tool, ok, snippet} per tool. Honest results only: key-gated lanes
// return needs_key/not_configured; that IS their verified behavior.
import { spawn } from 'child_process';

const MIN: Record<string, unknown> = {
  timmy_env_lock: {},
  timmy_events_tail: { n: 3 },
  timmy_receipt_verify: { stream: 'runs' },
  timmy_clip_replay: { jobId: 'audit-none' },
  timmy_gen_run: { prompt: 'audit ping' },
  timmy_promo_apply: { beats: [] },
  timmy_llm_call: { model: 'local/qwen3.8:27b-mlx', prompt: 'ping' },
  timmy_fusion_plan: {},
  timmy_promo_judge: { threshold: 0.7 },
  timmy_allyson_run: { prompt: 'x', svg_path: '/tmp/audit.svg', output_path: '/tmp/audit.tsx' },
  timmy_apify_run: { tool: 'get-actor-list' },
  timmy_3minapi_run: { tool: 'help' },
  timmy_openhands_run: { task: 'echo audit', acceptance: ['true'], wall_ms: 20000 },
  timmy_oapi_run: { spec_url: 'https://petstore3.swagger.io/api/v3/openapi.json', list: true },
  timmy_roboflow_run: { action: 'detect', project: 'audit' },
  timmy_list_lanes: {},
  timmy_plan_dispatch: {
    plan: {
      schema_version: 'dispatch/0.1', objective: 'audit', deliverables: ['x'], acceptance_tests: ['true'],
      harnesses: ['pi'], model_policy: { requested: 'local/qwen', allow_paid: false, max_spend_usd: 0 },
      copies: 1, cadence: { mode: 'parallel', depends_on: [] }, context_manifest: [], repo_ref: 'main',
      workspace: { kind: 'host-ephemeral' }, permissions: { filesystem: 'rw-ephemeral', network: false, tools: [], secrets: [] },
      limits: { cost_usd: 0, wall_ms: 60000 }, retry_limit: 1, approval: { required: true, mode: 'manual' },
      expected_artifacts: ['x.md'], telemetry: { redact: true, events: true }
    }
  },
  timmy_mission_compile: { doc: { nodes: [{ id: 'c', kind: 'capsule', objective: 'audit' }], edges: [] } },
  timmy_dispatch_plan: { id: 'audit-none' },
  timmy_tail_lane: { id: 'audit-none' },
  timmy_pause_or_cancel_lane: { id: 'audit-none', action: 'hold' },
  timmy_collect_run: { id: 'audit-none' },
  timmy_judge_loop: { prompt: 'audit' }
};

const TIMEOUTS: Record<string, number> = {
  timmy_openhands_run: 150000, timmy_promo_judge: 150000, timmy_oapi_run: 45000, timmy_llm_call: 60000
};

const child = spawn('npx', ['tsx', 'src/mcp/server.ts'], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = '';
const pending = new Map<number, (r: unknown) => void>();
let nextId = 1;

child.stdout.on('data', d => {
  buf += d.toString();
  let i: number;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)!(msg); pending.delete(msg.id); }
    } catch { /* partial */ }
  }
});

const rpc = (method: string, params: unknown, timeout = 30000): Promise<unknown> => new Promise((res) => {
  const id = nextId++;
  const t = setTimeout(() => { pending.delete(id); res({ error: 'timeout' }); }, timeout);
  pending.set(id, r => { clearTimeout(t); res(r); });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
});

const main = async () => {
  await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'audit', version: '0' } });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const list = await rpc('tools/list', {}) as { result?: { tools: { name: string }[] } };
  const names = (list.result?.tools ?? []).map(t => t.name);
  console.log('TOOLS_LISTED:', names.length);
  for (const name of names) {
    const r = await rpc('tools/call', { name, arguments: MIN[name] ?? {} }, TIMEOUTS[name] ?? 30000) as {
      result?: { content?: { text?: string }[]; isError?: boolean }; error?: unknown;
    };
    const text = r.result?.content?.[0]?.text ?? JSON.stringify(r.error ?? 'no-response');
    let ok = !r.result?.isError && !(r as { error?: unknown }).error;
    let parsed: { ok?: boolean; state?: string; error?: string } = {};
    try { parsed = JSON.parse(text); ok = ok && parsed.ok !== false; } catch { /* text result */ }
    if (parsed.state === 'not_configured' || /needs_key|not_configured/.test(text)) ok = true; // honest fail-closed IS verified behavior
    console.log(JSON.stringify({ tool: name, ok, snippet: text.replace(/\s+/g, ' ').slice(0, 140) }));
  }
  child.kill();
  process.exit(0);
};
main();

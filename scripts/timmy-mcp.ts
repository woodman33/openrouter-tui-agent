import { execFileSync, spawn } from 'child_process';

// timmy mcp — opt-in MCP wire visibility. Two lenses, same rule:
//   inspect → mcpsnoop   (Wireshark for MCP: traffic, latency, hung calls)
//   probe   → mcp-probe  (MCP protocol debugger / interactive TUI)
// Timmy stays the policy authority: these inspect, never act. Raw traces are
// the operator's to redact/store; the capture hash can ride a receipt once stored.

const has = (bin: string): boolean => {
  try { execFileSync('sh', ['-c', `command -v ${bin}`], { stdio: 'ignore' }); return true; }
  catch { return false; }
};

const launch = (bin: string, args: string[]) => {
  const child = spawn(bin, args, { stdio: 'inherit' });
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
};

const sub = process.argv[2] || 'status';

if (sub === 'status') {
  const snoop = has('mcpsnoop');
  const probe = has('mcp-probe');
  console.log(`timmy mcp — wire visibility (opt-in; inspectors never act)`);
  console.log(`  mcpsnoop   ${snoop ? 'installed · timmy mcp inspect' : 'missing · traffic/latency/hung-call view'}`);
  console.log(`  mcp-probe  ${probe ? 'installed · timmy mcp probe' : 'missing · protocol debugger / interactive TUI'}`);
  console.log('  capture is opt-in; redact raw traces before storing anything.');
  process.exit(0);
}

if (sub === 'inspect') {
  if (!has('mcpsnoop')) {
    console.log('mcpsnoop not found on PATH.');
    console.log('install mcpsnoop (MCP traffic inspector) and re-run — then this shows');
    console.log('MCP requests, results, latency, errors, hung calls and schema drift.');
    process.exit(0);
  }
  launch('mcpsnoop', process.argv.slice(3));
} else if (sub === 'probe') {
  if (!has('mcp-probe')) {
    console.log('mcp-probe not found on PATH.');
    console.log('install mcp-probe (MCP protocol debugger, interactive TUI) and re-run —');
    console.log('then this steps a live MCP session: handshakes, tool calls, results.');
    process.exit(0);
  }
  launch('mcp-probe', process.argv.slice(3));
} else {
  console.error('Usage: timmy mcp [status|inspect|probe] [args…]');
  process.exit(2);
}

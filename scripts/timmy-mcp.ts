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
  const probe = has('mcp-probe') || has('mcp-cli');
  const snip = has('apisnip');
  console.log(`timmy mcp — wire visibility (opt-in; inspectors never act)`);
  console.log(`  mcpsnoop   ${snoop ? 'installed · timmy mcp inspect' : 'missing · traffic/latency/hung-call view (brew install mcpsnoop)'}`);
  console.log(`  mcp-probe  ${probe ? 'installed · timmy mcp probe' : 'missing · protocol debugger (mcp-probe, or cargo mcp-cli fallback)'}`);
  console.log(`  apisnip    ${snip ? 'installed · timmy mcp snip' : 'missing · OpenAPI spec trimmer (cargo install apisnip)'}`);
  console.log('  capture is opt-in; redact raw traces before storing anything.');
  process.exit(0);
}

if (sub === 'snip') {
  if (!has('apisnip')) {
    console.log('apisnip not found on PATH.');
    console.log('install apisnip (OpenAPI spec trimmer) and re-run — then this trims');
    console.log('specs to the operations you actually serve. Specs are data; trim, don\'t hand-edit.');
    process.exit(0);
  }
  launch('apisnip', process.argv.slice(3));
} else if (sub === 'inspect') {
  if (!has('mcpsnoop')) {
    console.log('mcpsnoop not found on PATH.');
    console.log('install mcpsnoop (MCP traffic inspector) and re-run — then this shows');
    console.log('MCP requests, results, latency, errors, hung calls and schema drift.');
    process.exit(0);
  }
  launch('mcpsnoop', process.argv.slice(3));
} else if (sub === 'probe') {
  if (has('mcp-probe')) {
    launch('mcp-probe', process.argv.slice(3));
  } else if (has('mcp-cli')) {
    console.log('mcp-probe not installed — using cargo mcp-cli as the probe lens.');
    launch('mcp-cli', process.argv.slice(3));
  } else {
    console.log('mcp-probe not found on PATH.');
    console.log('install mcp-probe (or cargo mcp-cli) and re-run — then this steps');
    console.log('a live MCP session: handshakes, tool calls, results.');
    process.exit(0);
  }
} else {
  console.error('Usage: timmy mcp [status|inspect|probe] [args…]');
  process.exit(2);
}

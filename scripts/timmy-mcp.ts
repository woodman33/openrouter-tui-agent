import { execFileSync, spawn } from 'child_process';

// timmy mcp inspect — opt-in MCP wire visibility via mcpsnoop (Wireshark for
// MCP). Timmy stays the policy authority: the snooper inspects, never acts.
// Raw traces are the operator's to redact/store; the capture hash can ride a
// receipt once stored.

const sub = process.argv[2] || 'inspect';
if (sub !== 'inspect') {
  console.error('Usage: timmy mcp inspect [mcpsnoop args…]');
  process.exit(2);
}

try {
  execFileSync('sh', ['-c', 'command -v mcpsnoop'], { stdio: 'ignore' });
} catch {
  console.log('mcpsnoop not found on PATH.');
  console.log('install mcpsnoop (MCP traffic inspector) and re-run — then this shows');
  console.log('MCP requests, results, latency, errors, hung calls and schema drift.');
  console.log('capture is opt-in; redact raw traces before storing anything.');
  process.exit(0);
}

const child = spawn('mcpsnoop', process.argv.slice(3), { stdio: 'inherit' });
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});

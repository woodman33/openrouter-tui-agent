#!/usr/bin/env node
// raw MCP stdio client: timmy-mcp-call <tool> '<json-args>'
// lets any shell/agent (including this Qwen session) call INTO timmy.
import { spawn } from 'child_process';
import { join } from 'path';

const [, , tool, argsJson] = process.argv;
if (!tool) {
  console.error('usage: timmy-mcp-call <tool> [json-args]');
  process.exit(2);
}
const server = spawn(process.execPath, ['--import', 'tsx', join(import.meta.dirname ?? '.', '../src/mcp/server.ts')], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = '';
let id = 0;
const send = (o: unknown) => server.stdin.write(JSON.stringify(o) + '\n');
server.stdout.on('data', d => {
  buf += d.toString();
  let i: number;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    let msg: any;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id === 1) {
      send({ jsonrpc: '2.0', method: 'notifications/initialized' });
      send({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: tool, arguments: argsJson ? JSON.parse(argsJson) : {} } });
    } else if (msg.id === 2) {
      console.log(msg.result?.content?.[0]?.text ?? JSON.stringify(msg));
      server.kill();
      process.exit(msg.result?.isError ? 1 : 0);
    }
  }
});
server.on('error', e => { console.error(`server error: ${e.message}`); process.exit(1); });
send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'qwen-session', version: '1' } } });
setTimeout(() => { console.error('timeout'); server.kill(); process.exit(1); }, Number(process.env.TIMMY_MCP_TIMEOUT ?? 180000));

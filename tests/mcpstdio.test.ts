import { describe, expect, it } from 'vitest';
import { mcpSession, pickArgs, type McpTool } from '../src/utils/mcpstdio.js';

// Fake MCP server over stdio: newline-delimited JSON-RPC, three methods.
const FAKE_SERVER = `
let buf = '';
process.stdin.on('data', d => {
  buf += d;
  let i;
  while ((i = buf.indexOf('\\n')) >= 0) {
    const line = buf.slice(0, i);
    buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    const m = JSON.parse(line);
    if (m.method === 'initialize') {
      console.log(JSON.stringify({ jsonrpc: '2.0', id: m.id, result: { protocolVersion: '2024-11-05', capabilities: {}, serverInfo: { name: 'fake' } } }));
    } else if (m.method === 'tools/list') {
      console.log(JSON.stringify({ jsonrpc: '2.0', id: m.id, result: { tools: [ { name: 'design', inputSchema: { type: 'object', properties: { prompt: { type: 'string' } } } } ] } }));
    } else if (m.method === 'tools/call') {
      console.log(JSON.stringify({ jsonrpc: '2.0', id: m.id, result: { content: [ { type: 'text', text: 'wrote /tmp/fake-design.png' } ] } }));
    }
  }
});
`;

describe('mcp stdio client', () => {
  it('handshakes, lists tools, calls one', async () => {
    const session = await mcpSession({ command: 'node', args: ['-e', FAKE_SERVER] });
    expect(session.tools.map(t => t.name)).toContain('design');
    const result = await session.call('design', { prompt: 'a receipt-stamped poster' });
    expect(JSON.stringify(result)).toContain('/tmp/fake-design.png');
    session.close();
  }, 20000);

  it('maps prompts onto prompt-ish schema props', () => {
    const tool: McpTool = { name: 'x', inputSchema: { properties: { title: { type: 'string' }, prompt: { type: 'string' } } } };
    expect(pickArgs(tool, 'hi')).toEqual({ prompt: 'hi' });
    const odd: McpTool = { name: 'y', inputSchema: { properties: { seed: { type: 'number' }, body: { type: 'string' } } } };
    expect(pickArgs(odd, 'hi')).toEqual({ body: 'hi' });
  });
});

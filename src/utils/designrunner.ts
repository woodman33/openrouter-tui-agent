import { OPEN_DESIGN_MCP, openDesignInstalled, mcpSession, pickArgs } from './mcpstdio.js';
import { listGenerations, updateGeneration } from './generations.js';
import { appendEvent } from './eventbus.js';
import { appendReceipt } from './receipts.js';

// Open Design runner: GENS queues an open-design gen; this executes it over
// the Open Design daemon MCP and seals what happened. The MCP server designs;
// timmy notarizes.

export interface DesignRunResult { ok: boolean; note?: string; artifact?: string }

export async function runOpenDesignGen(genId: string): Promise<DesignRunResult> {
  if (!openDesignInstalled()) return { ok: false, note: 'Open Design app not found (/Applications/Open Design.app)' };
  const rec = listGenerations({}).find(g => g.id === genId);
  if (!rec) return { ok: false, note: `no generation ${genId}` };

  let session;
  try {
    session = await mcpSession(OPEN_DESIGN_MCP);
  } catch (e) {
    return { ok: false, note: `open-design MCP handshake failed: ${(e as Error).message}` };
  }
  try {
    const tool = session.tools.find(t => /design|generate|create|image|render/i.test(t.name)) ?? session.tools[0];
    if (!tool) {
      updateGeneration(genId, { status: 'failed' });
      return { ok: false, note: 'Open Design MCP exposed no tools' };
    }
    const result = await session.call(tool.name, pickArgs(tool, rec.prompt));
    const text = ((result?.content ?? []) as { text?: string }[]).map(c => c.text ?? '').join(' ').trim();
    const urlMatch = text.match(/(\/[^\s"']+\.(png|jpg|jpeg|webp|svg|html))|(https?:\/\/[^\s"']+)/i);
    const artifact = urlMatch?.[0];
    updateGeneration(genId, { status: 'done', ...(artifact ? { artifact } : {}) });
    appendEvent('gen.status', { genId, event: 'done', tool: tool.name });
    appendReceipt('runs', {
      kind: 'run',
      subject: `open-design · ${genId}`,
      policy: 'human-gated',
      spans: [{ name: `mcp ${tool.name}`, kind: 'execute_tool' }],
      cost_usd: 0
    });
    return { ok: true, artifact, note: artifact ? `artifact: ${artifact}` : `tool ${tool.name} ran; no artifact path in its output` };
  } catch (e) {
    updateGeneration(genId, { status: 'failed' });
    appendEvent('gen.status', { genId, event: 'failed' });
    return { ok: false, note: (e as Error).message };
  } finally {
    session.close();
  }
}

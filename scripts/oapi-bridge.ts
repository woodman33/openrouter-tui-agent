// TIMMY oapi bridge (deno): orthodox MCP SDK client over oapi-invoker-mcp.
// stdin JSON {spec_url, tool?, args?, list?} -> stdout JSON result.
import { Client } from "npm:@modelcontextprotocol/sdk@1.12.0/client/index.js";
import { StdioClientTransport } from "npm:@modelcontextprotocol/sdk@1.12.0/client/stdio.js";

const req = JSON.parse(await new Response(Deno.stdin.readable).text());
const serverArgs = Deno.env.get("OAPI_SERVER_ARGS")?.split(" ")
  ?? ["run", "--allow-all", "--node-modules-dir=auto", "jsr:@mcpc/oapi-invoker-mcp/bin"];
const transport = new StdioClientTransport({
  command: "deno",
  args: serverArgs,
  env: { ...Deno.env.toObject(), SPEC_URL: req.spec_url },
  stderr: "ignore",
});
const client = new Client({ name: "timmy-oapi-bridge", version: "0.5.0" });
await client.connect(transport);
try {
  if (req.list) {
    const { tools } = await client.listTools();
    console.log(JSON.stringify({ ok: true, tools: tools.map(t => t.name) }));
  } else {
    const r = await client.callTool({ name: req.tool, arguments: req.args ?? {} });
    const text = (r.content as any[] ?? []).map(c => c.text ?? "").join("\n");
    console.log(JSON.stringify({ ok: !r.isError, result: text.slice(0, 4000) }));
  }
} catch (e) {
  console.log(JSON.stringify({ ok: false, note: String(e).slice(0, 300) }));
}
await client.close();

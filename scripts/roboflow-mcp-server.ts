// Roboflow MCP entry: standalone stdio MCP server exposing the observer lane
// (upload | detect | sample) to ANY MCP client. Key-gated; every call also
// seals a TIMMY receipt via roboflowRun.
import { roboflowRun, type RoboflowReq } from '../src/utils/roboflow-adapter.js';

const TOOLS = [
  { name: 'roboflow_upload', description: 'Upload an image to a roboflow project version.', inputSchema: { type: 'object', properties: { project: { type: 'string' }, path: { type: 'string' }, version: { type: 'number' }, workspace: { type: 'string' } }, required: ['project', 'path'] } },
  { name: 'roboflow_detect', description: 'Run detection on an image with a project model.', inputSchema: { type: 'object', properties: { project: { type: 'string' }, path: { type: 'string' }, version: { type: 'number' }, confidence: { type: 'number' }, workspace: { type: 'string' } }, required: ['project', 'path'] } },
  { name: 'roboflow_sample', description: 'Observer: sample N frames from a video (ffmpeg) and upload as evidence.', inputSchema: { type: 'object', properties: { project: { type: 'string' }, video: { type: 'string' }, frames: { type: 'number' }, every: { type: 'number' }, version: { type: 'number' }, workspace: { type: 'string' } }, required: ['project', 'video'] } }
];

const call = (name: string, args: any) => {
  const req: RoboflowReq = {
    action: name === 'roboflow_upload' ? 'upload' : name === 'roboflow_detect' ? 'detect' : 'sample',
    project: args?.project ?? '', path: args?.path, video: args?.video,
    frames: args?.frames, every: args?.every, version: args?.version,
    confidence: args?.confidence, workspace: args?.workspace
  };
  return roboflowRun(req);
};

let buf = '';
process.stdin.on('data', d => {
  buf += d.toString();
  let i: number;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    let msg: any;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.method === 'initialize') {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'timmy-roboflow', version: '0.5.0' } } }) + '\n');
    } else if (msg.method === 'notifications/initialized') {
      // no response for notifications
    } else if (msg.method === 'tools/list') {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { tools: TOOLS } }) + '\n');
    } else if (msg.method === 'tools/call') {
      const result = call(msg.params?.name, msg.params?.arguments);
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { content: [{ type: 'text', text: JSON.stringify(result) }] } }) + '\n');
    }
  }
});

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

// TIMMY Porter fleet — the connectors TIMMY speaks to. "MCP" here means the
// whole family: sdk + mcp + api + cli (user convention: all forms of app
// communication). Houdini/SceneForge is #1, Roboflow #2, ComfyUI isolated #3.

export interface FleetConnector {
  id: string;
  rank: number;
  forms: string[]; // sdk | mcp | api | cli
  detect?: { cmd?: string; url?: string };
  note: string;
}

export const DEFAULT_FLEET: FleetConnector[] = [
  { id: 'houdini-sceneforge', rank: 1, forms: ['mcp', 'sdk', 'api', 'cli'], detect: { cmd: 'mcporter' }, note: 'Houdini/SceneForge control plane on your Cloudflare worker' },
  { id: 'roboflow', rank: 2, forms: ['mcp', 'sdk', 'api', 'cli'], detect: { cmd: 'roboflow' }, note: 'train models on REAL logs/frames — pip install roboflow · roboflow MCP server' },
  { id: 'comfyui', rank: 3, forms: ['api', 'cli'], detect: { url: 'http://127.0.0.1:8188' }, note: 'isolated Docker ComfyUI (lab/comfy) — never system python' },
  { id: 'runcomfy', rank: 4, forms: ['api', 'cli'], note: 'burst cloud ComfyUI, per-generation billing' },
  { id: 'comfydeploy', rank: 5, forms: ['api'], note: 'hosted ComfyUI API endpoints' },
  { id: 'wavespeed', rank: 6, forms: ['api'], note: 'free Z-Image tier + fast video lanes' },
  { id: 'croc', rank: 7, forms: ['cli'], detect: { cmd: 'croc' }, note: 'encrypted p2p file share — /share' },
  { id: 'ttyd', rank: 8, forms: ['cli'], detect: { cmd: 'ttyd' }, note: 'terminal-in-browser — /demo (auth-gated)' }
];

export function fleetPath(dir: string = process.cwd()): string {
  return join(dir, '.timmy', 'fleet.json');
}

export function loadFleet(dir?: string): FleetConnector[] {
  try {
    const raw = JSON.parse(readFileSync(fleetPath(dir), 'utf8'));
    if (Array.isArray(raw) && raw.length) return raw;
  } catch { /* fall through to defaults */ }
  return DEFAULT_FLEET;
}

export function saveFleet(fleet: FleetConnector[], dir?: string): void {
  const p = fleetPath(dir);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(fleet, null, 2), 'utf8');
}

export interface FleetStatus extends FleetConnector {
  status: 'ready' | 'reachable' | 'configured';
}

export function detectFleet(dir?: string): FleetStatus[] {
  return loadFleet(dir)
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map(c => {
      let status: FleetStatus['status'] = 'configured';
      if (c.detect?.cmd) {
        try { execSync(`command -v ${c.detect.cmd}`, { stdio: 'ignore' }); status = 'ready'; } catch { status = 'configured'; }
      } else if (c.detect?.url) {
        try {
          execSync(`curl -s -o /dev/null --max-time 1 ${JSON.stringify(c.detect.url)}`, { stdio: 'ignore' });
          status = 'reachable';
        } catch { status = 'configured'; }
      }
      return { ...c, status };
    });
}

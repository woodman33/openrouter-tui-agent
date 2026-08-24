// FORGE wire stubs (p13; decisions.md D1/D5). houdini-mcp and usd-mcp lanes
// connect through the EXISTING cmcp WIRE slot only — no mcporter, bindpuppet,
// or new WIRE dependency. A wire.dep receipt is sealed ONLY if a server
// literally cannot connect through cmcp (never the case for these stubs).
import { spawnSync } from 'node:child_process';

export type WireLane = 'houdini' | 'usd';

export interface WireStatus {
  lane: WireLane;
  flag: string;
  enabled: boolean;
  via: 'cmcp';
  server_bin: string;
  status: 'ready' | 'not_configured' | 'flag_off';
  note: string;
}

const LANES: Record<WireLane, { flag: string; bin: string }> = {
  houdini: { flag: 'TIMMY_HOUDINI_MCP', bin: 'houdini-mcp' },
  usd: { flag: 'TIMMY_USD_MCP', bin: 'usd-mcp' },
};

export function probeWire(lane: WireLane): WireStatus {
  const { flag, bin } = LANES[lane];
  if (process.env[flag] !== '1') {
    return { lane, flag, enabled: false, via: 'cmcp', server_bin: bin, status: 'flag_off', note: `set ${flag}=1 to arm the lane (D1)` };
  }
  const which = spawnSync('which', [bin], { encoding: 'utf8' });
  if (which.status !== 0) {
    return { lane, flag, enabled: true, via: 'cmcp', server_bin: bin, status: 'not_configured', note: `${bin} absent — cmcp wire slot reserved, honest not_configured` };
  }
  return { lane, flag, enabled: true, via: 'cmcp', server_bin: bin, status: 'ready', note: 'cmcp client-exec will spawn the server on first tool call' };
}

export const wireLanes = (): WireStatus[] => [probeWire('houdini'), probeWire('usd')];

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// AgentPass — clearance levels for agents over the ICEBERG + effect gateway.
// Auth providers are pluggable (user owns accounts + SDKs for all of them);
// 'local' is the zero-account default. Clearances mirror the T0–T4 policy
// tiers from the research rulings.

export type ClearanceProvider = 'local' | 'clerk' | 'workos' | 'auth0' | 'cloudflare-access';

export const CLEARANCE_LEVELS = [
  'T0 · read public branches',
  'T1 · workspace write',
  'T2 · lane spawn + delegate',
  'T3 · spend (metered calls)',
  'T4 · irreversible (publish/kill/sign)'
];

export interface AgentPassConfig {
  provider: ClearanceProvider;
  levels: Record<string, string>; // agent/lane id → T0..T4
  // proven rollout pattern: LOG_ONLY first (decisions recorded in receipts),
  // ENFORCE only once the policy has been dogfooded (denials actually block).
  enforce?: boolean;
}

export function agentPassPath(dir: string = process.cwd()): string {
  return join(dir, '.timmy', 'agentpass.json');
}

export function loadAgentPass(dir?: string): AgentPassConfig {
  try {
    const raw = JSON.parse(readFileSync(agentPassPath(dir), 'utf8'));
    return { provider: raw.provider || 'local', levels: raw.levels || {} };
  } catch {
    return { provider: 'local', levels: {} };
  }
}

export function saveAgentPass(cfg: AgentPassConfig, dir?: string): void {
  const p = agentPassPath(dir);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf8');
}

export function detectProvider(): { provider: ClearanceProvider; via: string } {
  if (process.env.CLERK_SECRET_KEY) return { provider: 'clerk', via: 'CLERK_SECRET_KEY' };
  if (process.env.WORKOS_API_KEY) return { provider: 'workos', via: 'WORKOS_API_KEY' };
  if (process.env.AUTH0_DOMAIN) return { provider: 'auth0', via: 'AUTH0_DOMAIN' };
  if (process.env.CF_ACCESS_TEAM_DOMAIN || process.env.CF_ACCESS_TOKEN) return { provider: 'cloudflare-access', via: 'CF_ACCESS_*' };
  return { provider: 'local', via: 'no provider keys — local passports' };
}

export function clearanceFor(laneId: string, dir?: string): string {
  const cfg = loadAgentPass(dir);
  return cfg.levels[laneId] || 'T1';
}

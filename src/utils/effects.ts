// Typed-effect catalog + PDP-lite. From the research rulings: default-deny,
// denial-as-observation, tiers roll out LOG_ONLY → ENFORCE. The TUI (or a
// TUI-delegated key) is the only thing that raises clearance / approves.

export type Tier = 'T0' | 'T1' | 'T2' | 'T3';

export const TIER_RANK: Record<Tier, number> = { T0: 0, T1: 1, T2: 2, T3: 3 };

export interface EffectDef {
  name: string;
  capability: string;
  tier: Tier;
  sandbox: string;
}

// The 15-effect homelab catalog — new effects require a real user story.
export const EFFECT_CATALOG: EffectDef[] = [
  { name: 'Read<File>', capability: 'fs:read', tier: 'T0', sandbox: 'workspace jail' },
  { name: 'Write<File>', capability: 'fs:write', tier: 'T1', sandbox: 'workspace jail' },
  { name: 'Patch<Repo>', capability: 'git:write', tier: 'T1', sandbox: 'git worktree' },
  { name: 'Execute<Cmd>', capability: 'shell:exec', tier: 'T2', sandbox: 'gVisor/microVM if untrusted' },
  { name: 'Query<DB>', capability: 'db:read', tier: 'T1', sandbox: 'connection-scoped creds' },
  { name: 'Search<Web>', capability: 'net:read', tier: 'T0', sandbox: 'WASM scoped HTTP' },
  { name: 'Generate<Media>', capability: 'gpu:job+model:id', tier: 'T1', sandbox: 'container on GPU host' },
  { name: 'Invoke<Model>', capability: 'model:id', tier: 'T0', sandbox: 'gateway (paid leg = T1)' },
  { name: 'Provision<GPU>', capability: 'fleet:gpu', tier: 'T2', sandbox: 'fleet scheduler' },
  { name: 'Deploy<Worker>', capability: 'cf:deploy', tier: 'T2', sandbox: 'Cloudflare scoped token' },
  { name: 'Spawn<Agent>', capability: 'agent:spawn', tier: 'T2', sandbox: 'child ⊆ parent grants' },
  { name: 'AskHuman<Approval>', capability: 'gate', tier: 'T0', sandbox: 'TUI only' },
  { name: 'Purchase<Resource>', capability: 'spend:budget', tier: 'T3', sandbox: 'hard cap in PDP' },
  { name: 'Publish<Website>', capability: 'net:publish', tier: 'T2', sandbox: 'Pages/R2' },
  { name: 'Send<Message>', capability: 'msg:send', tier: 'T2', sandbox: 'allowlisted channels' }
];

export interface PolicyDecision {
  decision: 'allow' | 'deny';
  effect: string;
  tier: Tier;
  clearance: Tier;
  reason: string;
}

// Default-deny: unknown effects fail closed. Denials are structured
// observations the agent can replan around — never silent blocks.
export function policyCheck(effectName: string, clearance: Tier): PolicyDecision {
  const eff = EFFECT_CATALOG.find(e => e.name === effectName);
  if (!eff) {
    return { decision: 'deny', effect: effectName, tier: 'T3', clearance, reason: `default-deny: unknown effect "${effectName}"` };
  }
  if (TIER_RANK[eff.tier] <= TIER_RANK[clearance]) {
    return { decision: 'allow', effect: effectName, tier: eff.tier, clearance, reason: `${eff.tier} within clearance ${clearance}` };
  }
  return {
    decision: 'deny', effect: effectName, tier: eff.tier, clearance,
    reason: `denial-as-observation: ${effectName} needs ${eff.tier} > clearance ${clearance} — replan, or raise clearance in the TUI`
  };
}

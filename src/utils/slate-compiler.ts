// Mission Map → DispatchPlan compiler (Command Post v0.1 §3.6). The tldraw
// map owns visualization + authoring ergonomics ONLY; this module is the one
// bridge into the controller's typed CUE plans. The map never spawns work —
// every compiled plan still goes through plan_dispatch → approve → dispatch.
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import crypto from 'crypto';
import { LANE_RUNNERS } from '../agent/lanes.js';
import { validatePlanCue, type DispatchPlan } from './dispatch.js';

export type MissionNodeKind = 'capsule' | 'harness' | 'gate' | 'artifact' | 'result';
export type MissionEdgeKind = 'depends' | 'harness' | 'gate' | 'artifact' | 'result';

export interface MissionNode {
  id: string;
  kind: MissionNodeKind;
  /** capsule: plain-English objective */
  objective?: string;
  /** harness node: LANE_RUNNERS id */
  harness?: string;
  /** harness/capsule: requested workspace kind — controller enforces, map only asks */
  workspace?: 'docker' | 'host-ephemeral';
  copies?: number;
  wall_ms?: number;
  max_spend?: number;
  /** artifact node: repo-relative path handed to the dependent's manifest */
  path?: string;
  /** gate node: manual token vs delegated envelope (controller vocabulary) */
  approval?: 'manual' | 'delegated-envelope';
  acceptance?: string[];
}

export interface MissionEdge { from: string; to: string; kind: MissionEdgeKind }
export interface MissionMapDoc { nodes: MissionNode[]; edges: MissionEdge[] }

export interface CompiledPlan { node_id: string; plan: DispatchPlan }
export interface MissionCompileResult { ok: boolean; plans: CompiledPlan[]; errors: string[] }

const sha = (p: string): string => crypto.createHash('sha256').update(readFileSync(p)).digest('hex');

// topological order over depends edges; returns null on cycle
function topoOrder(ids: string[], deps: Map<string, string[]>): string[] | null {
  const seen = new Set<string>();
  const busy = new Set<string>();
  const out: string[] = [];
  const visit = (id: string): boolean => {
    if (seen.has(id)) return true;
    if (busy.has(id)) return false;
    busy.add(id);
    for (const d of deps.get(id) ?? []) {
      if (ids.includes(d) && !visit(d)) return false;
    }
    busy.delete(id);
    seen.add(id);
    out.push(id);
    return true;
  };
  for (const id of ids) if (!visit(id)) return null;
  return out;
}

export function compileMissionMap(doc: MissionMapDoc, opts: { repoRoot?: string } = {}): MissionCompileResult {
  const root = opts.repoRoot ?? process.cwd();
  const errors: string[] = [];
  const byId = new Map(doc.nodes.map(n => [n.id, n]));
  const edgesInto = (id: string, kind: MissionEdgeKind) =>
    doc.edges.filter(e => e.to === id && e.kind === kind);

  const capsules = doc.nodes.filter(n => n.kind === 'capsule');
  const deps = new Map<string, string[]>();
  for (const c of capsules) {
    deps.set(c.id, edgesInto(c.id, 'depends')
      .map(e => e.from)
      .filter(f => byId.get(f)?.kind === 'capsule'));
  }
  const order = topoOrder(capsules.map(c => c.id), deps);
  if (!order) errors.push('dependency cycle among capsules — map must be a DAG');

  const plans: CompiledPlan[] = [];
  for (const cap of capsules) {
    const harnessNodes = edgesInto(cap.id, 'harness').map(e => byId.get(e.from)).filter((n): n is MissionNode => n?.kind === 'harness');
    if (harnessNodes.length !== 1) {
      errors.push(`capsule ${cap.id}: needs exactly one harness slide, got ${harnessNodes.length}`);
      continue;
    }
    const harnessId = harnessNodes[0]!.harness ?? '';
    if (!LANE_RUNNERS[harnessId]) {
      errors.push(`capsule ${cap.id}: unknown harness '${harnessId}' (not in LANE_RUNNERS)`);
      continue;
    }
    const gates = edgesInto(cap.id, 'gate').map(e => byId.get(e.from)).filter((n): n is MissionNode => n?.kind === 'gate');
    const artifacts = edgesInto(cap.id, 'artifact').map(e => byId.get(e.from)).filter((n): n is MissionNode => n?.kind === 'artifact');

    const manifest: { path: string; sha256: string }[] = [];
    for (const a of artifacts) {
      const rel = a.path ?? '';
      if (!rel) { errors.push(`capsule ${cap.id}: artifact node ${a.id} has no path`); continue; }
      const abs = resolve(root, rel);
      if (!abs.startsWith(resolve(root) + '/')) { errors.push(`capsule ${cap.id}: artifact path escapes repo: ${rel}`); continue; }
      if (!existsSync(abs)) { errors.push(`capsule ${cap.id}: artifact missing (push it first): ${rel}`); continue; }
      manifest.push({ path: rel, sha256: sha(abs) });
    }

    const maxSpend = cap.max_spend ?? 0;
    const wallMs = cap.wall_ms ?? harnessNodes[0]!.wall_ms ?? 300000;
    const wsKind = cap.workspace ?? harnessNodes[0]!.workspace ?? 'docker';
    const acceptance = gates.flatMap(g => g.acceptance ?? []);
    const plan: DispatchPlan = {
      schema_version: 'dispatch/0.1',
      objective: cap.objective ?? `(no objective on capsule ${cap.id})`,
      deliverables: ['result'],
      acceptance_tests: acceptance.length ? acceptance : ['see collect'],
      harnesses: [harnessId],
      model_policy: { requested: LANE_RUNNERS[harnessId].model ?? 'auto', allow_paid: maxSpend > 0, max_spend_usd: maxSpend },
      copies: cap.copies ?? 1,
      cadence: { mode: (deps.get(cap.id) ?? []).length ? 'sequential' : 'parallel', depends_on: deps.get(cap.id) ?? [] },
      context_manifest: manifest,
      repo_ref: 'HEAD',
      workspace: { kind: wsKind },
      permissions: { filesystem: 'rw-ephemeral', network: maxSpend > 0, tools: [], secrets: [] },
      limits: { cost_usd: maxSpend, wall_ms: wallMs },
      retry_limit: 1,
      approval: { required: true, mode: gates[0]?.approval ?? 'manual' },
      expected_artifacts: [],
      telemetry: { redact: true, events: true }
    };
    const v = validatePlanCue(plan, root);
    if (!v.ok) { errors.push(`capsule ${cap.id}: CUE validation failed: ${v.note}`); continue; }
    plans.push({ node_id: cap.id, plan });
  }

  // emit in dependency order so a launcher can walk the array sequentially
  plans.sort((a, b) => (order?.indexOf(a.node_id) ?? 0) - (order?.indexOf(b.node_id) ?? 0));
  return { ok: errors.length === 0, plans, errors };
}

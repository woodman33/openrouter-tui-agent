import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import crypto from 'crypto';
import { listProjects, readProject } from './projects.js';
import { listTemplates, loadTemplate } from './templates.js';
import { loadHarness, HARNESS_KINDS } from './harness.js';
import { loadGenerations } from './generations.js';
import { detectFleet } from './fleet.js';
import { appendReceipt, readChain } from './receipts.js';

// TIMMY ICEBERG — the context funnel. Tiny on top (INDEX.md, always loaded,
// ≤~2k tokens), condensed mid layer (topics/), massive vault below (the raw
// ledgers/logs/photos we already keep). Retrieval descends like a Telltale
// branch: enter closest, follow ≤2 relevant branches, stop early when
// marginal relevance drops. Every retrieval path is receipted.

export interface IceBranch {
  id: string;
  tags: string[];
  topic: string; // topics/<file>.md
  summary: string;
}

export function contextDir(dir: string = process.cwd()): string {
  return join(dir, 'context');
}

const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').toLowerCase();

export function buildIndex(dir?: string): { branches: IceBranch[]; indexPath: string } {
  const base = contextDir(dir);
  mkdirSync(join(base, 'topics'), { recursive: true });
  const branches: IceBranch[] = [];

  for (const name of listProjects(dir)) {
    const p = readProject(name, dir);
    if (!p) continue;
    const tags = [
      p.kind || 'storyboard', 'slate', 'project',
      ...(p.cast || []).flatMap(c => [`cast:${c.id}`, c.name.toLowerCase(), ...(c.wardrobe ? ['wardrobe'] : []), ...(c.emotion ? ['emotion'] : []), ...(c.hair ? ['hair'] : [])]),
      ...(p.sheet?.continuity?.flags?.length ? ['continuity'] : []),
      ...(p.branches?.length ? ['branching'] : [])
    ];
    const topic = `slate-${slug(name)}.md`;
    const lines = [
      `# slate · ${name}`,
      `kind: ${p.kind || 'storyboard'} · beats: ${(p.beats || []).length} · refs: ${(p.refs || []).length} · gens: ${(p.gens || []).length}`,
      ...(p.cast || []).map(c => `- ${c.id} ${c.name}: hair=${c.hair || '?'} wardrobe=${c.wardrobe || '?'} emotion=${c.emotion || '?'} age=${c.age || '?'} props=${(c.props || []).join('/') || '?'}`),
      p.sheet?.continuity?.hours_rule ? `24h rule: ${p.sheet.continuity.hours_rule}` : '',
      ...(p.beats || []).slice(0, 6).map(b => `- ${b.at}s [${b.label}] ${b.text}`)
    ].filter(Boolean);
    writeFileSync(join(base, 'topics', topic), lines.join('\n') + '\n', 'utf8');
    branches.push({ id: `slate:${name}`, tags, topic, summary: lines[1] });
  }

  for (const t of listTemplates(dir)) {
    const tmpl = loadTemplate(t, '{brief}', dir);
    const topic = `template-${slug(t)}.md`;
    writeFileSync(join(base, 'topics', topic), `# template · ${t}\nkind: ${tmpl.source} · total: ${tmpl.total}s · beats: ${tmpl.beats.length}\n` + tmpl.beats.map(b => `- [${b.label}] ${b.text}`).join('\n') + '\n', 'utf8');
    branches.push({ id: `template:${t}`, tags: ['template', t], topic, summary: `${tmpl.beats.length} beats · ${tmpl.total}s` });
  }

  const harness = loadHarness(dir);
  for (const kind of HARNESS_KINDS) {
    const entries = Object.values(harness.entries[kind]);
    if (!entries.length) continue;
    const topic = `harness-${kind}.md`;
    writeFileSync(join(base, 'topics', topic), `# harness · ${kind}\n` + entries.map(e => `- v${e.version} ${e.title}: ${e.content.slice(0, 140)}`).join('\n') + '\n', 'utf8');
    branches.push({ id: `harness:${kind}`, tags: ['harness', kind, 'memory'], topic, summary: `${entries.length} entries` });
  }

  const gens = loadGenerations(dir);
  const byProvider = new Map<string, number>();
  for (const g of gens) byProvider.set(g.provider, (byProvider.get(g.provider) || 0) + 1);
  for (const [provider, count] of byProvider) {
    branches.push({ id: `gens:${provider}`, tags: ['generation', provider, 'cost'], topic: '(vault: .timmy/generations.json)', summary: `${count} gens` });
  }

  for (const f of detectFleet(dir)) {
    branches.push({ id: `fleet:${f.id}`, tags: ['connector', f.id, ...f.forms], topic: '(vault: .timmy/fleet.json)', summary: `#${f.rank} ${f.status}` });
  }

  const index = [
    '# TIMMY ICEBERG INDEX — load this first, descend only when relevant',
    `branches: ${branches.length} · built ${new Date().toISOString()}`,
    ...branches.map(b => `- ${b.id} [${b.tags.join(',')}] ${b.summary} → ${b.topic}`)
  ].join('\n');
  const indexPath = join(base, 'INDEX.md');
  writeFileSync(indexPath, index + '\n', 'utf8');
  return { branches, indexPath };
}

// Session-end condenser — the vault stays raw forever; topics/ gets the
// summary so the next session's INDEX points at something small and dense.
export function condenseSession(dir?: string): string {
  const gens = loadGenerations(dir);
  const harness = loadHarness(dir);
  const byProv = new Map<string, number>();
  for (const g of gens) byProv.set(g.provider, (byProv.get(g.provider) || 0) + 1);
  const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const lines = [
    `# session · ${ts}`,
    `gens: ${gens.length} (${[...byProv.entries()].map(([p, n]) => `${p}×${n}`).join(', ') || 'none'})`,
    `harness: ${HARNESS_KINDS.map(k => `${k}:${Object.keys(harness.entries[k]).length}`).join(' ')}`,
    `receipts: ${['gens', 'harness', 'runs', 'exports', 'context'].map(s => `${s}:${readChain(s, dir).length}`).join(' ')}`,
    '',
    'last prompts:',
    ...gens.slice(0, 8).map(g => `- [${g.provider}] ${String(g.prompt).slice(0, 100)}`)
  ];
  const p = join(contextDir(dir), 'topics', `session-${ts}.md`);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, lines.join('\n') + '\n', 'utf8');
  return p;
}

export interface RecallResult {
  query: string;
  entry: string[];
  descended: IceBranch[];
  vaultHits: string[];
  stoppedEarly: boolean;
  reason: string;
}

const score = (q: string[], b: IceBranch) => {
  let s = 0;
  const hay = (b.id + ' ' + b.tags.join(' ') + ' ' + b.summary).toLowerCase();
  for (const tok of q) if (hay.includes(tok)) s++;
  return s;
};

export function recall(query: string, dir?: string): RecallResult {
  const { branches } = buildIndex(dir);
  const q = query.toLowerCase().split(/[^a-z0-9:]+/).filter(t => t.length > 2);
  const ranked = branches.map(b => ({ b, s: score(q, b) })).filter(x => x.s > 0).sort((a, z) => z.s - a.s);
  const top = ranked.slice(0, 2);
  const stoppedEarly = ranked.length === 0 || (ranked[0]?.s ?? 0) < 2;
  const descended = stoppedEarly ? [] : top.map(x => x.b);
  const vaultHits: string[] = [];
  if (!stoppedEarly) {
    const gens = loadGenerations(dir);
    for (const b of descended) {
      const prov = b.id.startsWith('gens:') ? b.id.slice(5) : undefined;
      const hits = prov ? gens.filter(g => g.provider === prov) : gens.filter(g => (g.prompt || '').toLowerCase().includes(q[0] || ''));
      for (const h of hits.slice(0, 3)) vaultHits.push(`${h.id} ${h.provider} ${h.status} "${(h.prompt || '').slice(0, 60)}"`);
    }
  }
  const result: RecallResult = {
    query,
    entry: branches.slice(0, 5).map(b => b.id),
    descended,
    vaultHits,
    stoppedEarly,
    reason: stoppedEarly ? (ranked.length === 0 ? 'no relevant branch — stopped at index (saved the tokens)' : 'weak signal — stopped early') : `descended ${descended.map(d => d.id).join(', ')}`
  };
  appendReceipt('context', {
    kind: 'recall',
    subject: 'sha256_' + crypto.createHash('sha256').update(query).digest('hex').slice(0, 16),
    policy: 'auto'
  }, dir);
  appendFileSync(join(contextDir(dir), 'paths.jsonl'), JSON.stringify({ ts: new Date().toISOString(), ...result }) + '\n', 'utf8');
  return result;
}

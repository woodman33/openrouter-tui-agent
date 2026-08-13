import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, readdirSync } from 'fs';
import { join, basename, extname } from 'path';

// TIMMY Slate projects — the visual project folder. One schema (slate.json),
// many targets: HyperFrames comp, Remotion scaffold, Instatic/Paper site,
// tldraw canvas view. The folder is the source of truth; Slate renders it.

export interface ProjectRef {
  file: string;
  label: string;
}

export interface ProjectGen {
  id: string;
  provider: string;
  model?: string;
  prompt: string;
  label: string;
  artifact?: string; // path relative to the project dir
  cost_usd?: number;
  stamp: string;
  created_at: string;
}

export interface SlateProject {
  name: string;
  created_at: string;
  template?: string;
  beats?: { at: number; dur: number; label: string; text: string }[];
  refs: ProjectRef[];
  gens: ProjectGen[];
}

const now = () => new Date().toISOString();

export function projectsDir(dir: string = process.cwd()): string {
  return join(dir, 'studio');
}

export function projectDir(name: string, dir?: string): string {
  return join(projectsDir(dir), name);
}

export function listProjects(dir?: string): string[] {
  try {
    return readdirSync(projectsDir(dir)).filter(n => existsSync(join(projectsDir(dir), n, 'slate.json')));
  } catch {
    return [];
  }
}

export function initProject(name: string, opts: { template?: string } = {}, dir?: string): string {
  const p = projectDir(name, dir);
  for (const sub of ['refs', 'gens', 'frames', 'receipts', 'site']) mkdirSync(join(p, sub), { recursive: true });
  const slatePath = join(p, 'slate.json');
  if (!existsSync(slatePath)) {
    const proj: SlateProject = { name, created_at: now(), template: opts.template, refs: [], gens: [] };
    writeFileSync(slatePath, JSON.stringify(proj, null, 2), 'utf8');
  }
  return p;
}

export function readProject(name: string, dir?: string): SlateProject | null {
  try {
    const raw = JSON.parse(readFileSync(join(projectDir(name, dir), 'slate.json'), 'utf8'));
    if (!raw || typeof raw.name !== 'string') return null;
    return { refs: [], gens: [], ...raw };
  } catch {
    return null;
  }
}

export function saveProject(proj: SlateProject, dir?: string): void {
  writeFileSync(join(projectDir(proj.name, dir), 'slate.json'), JSON.stringify(proj, null, 2), 'utf8');
}

export function addGenToProject(
  name: string,
  gen: Omit<ProjectGen, 'created_at' | 'stamp'> & { stamp?: string },
  dir?: string
): ProjectGen | null {
  const proj = readProject(name, dir);
  if (!proj) return null;
  const full: ProjectGen = { ...gen, stamp: gen.stamp || '', created_at: now() };
  proj.gens.push(full);
  saveProject(proj, dir);
  return full;
}

export function addRefToProject(name: string, srcPath: string, label: string, dir?: string): string | null {
  const proj = readProject(name, dir);
  if (!proj || !existsSync(srcPath)) return null;
  const file = `${label.replace(/[^a-z0-9]+/gi, '_').toLowerCase() || 'ref'}_${proj.refs.length + 1}${extname(srcPath)}`;
  copyFileSync(srcPath, join(projectDir(name, dir), 'refs', file));
  proj.refs.push({ file, label });
  saveProject(proj, dir);
  return join('refs', file);
}

const IMG = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

// Instatic/Paper target: a self-describing site folder served by the dash
// server. CLI-driven, provable (receipt footer), visible.
export function renderProjectSite(name: string, dir?: string): string | null {
  const proj = readProject(name, dir);
  if (!proj) return null;
  const p = projectDir(name, dir);
  mkdirSync(join(p, 'site'), { recursive: true });

  const refCards = proj.refs.map(r =>
    `<figure><img src="../refs/${r.file}" alt="${r.label}"><figcaption>${r.label}</figcaption></figure>`).join('\n');
  const genCards = proj.gens.map(g => {
    const img = g.artifact && IMG.has(extname(g.artifact)) ? `<img src="../${g.artifact}" alt="${g.label}">` : '';
    return `<div class="gen">${img}<h3>${g.label}</h3>
<p class="meta">${g.provider}${g.model ? ` · ${g.model}` : ''}${g.cost_usd !== undefined ? ` · $${g.cost_usd.toFixed(3)}` : ''}</p>
<p>${g.prompt}</p>${g.artifact ? `<p class="meta">artifact: ${g.artifact}</p>` : ''}</div>`;
  }).join('\n');
  const beats = (proj.beats || []).map(b =>
    `<li><b>${b.at}s–${b.at + b.dur}s</b> [${b.label}] ${b.text}</li>`).join('');

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>TIMMY Slate — ${proj.name}</title>
<style>
body{margin:0;background:#090b10;color:#e6edf3;font:14px/1.6 ui-monospace,Menlo,monospace}
header{padding:20px 28px;border-bottom:1px solid #21262d}
h1{color:#d2a8ff;margin:0}
.tag{color:#3fb950}
main{padding:20px 28px;display:grid;gap:28px}
h2{font-size:12px;letter-spacing:.25em;color:#3fb950}
.refs{display:flex;gap:14px;flex-wrap:wrap}
.refs img{height:140px;border:1px solid #21262d}
figcaption{color:#8b949e;font-size:12px}
.gens{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.gen{border:1px solid #21262d;padding:10px}
.gen img{width:100%;border:1px solid #21262d}
.meta{color:#8b949e;font-size:12px}
footer{padding:16px 28px;color:#6e7681;border-top:1px solid #21262d}
</style></head>
<body>
<header><h1>⛁ TIMMY Slate — ${proj.name}</h1>
<span class="tag">visual project folder · generated ${now()}</span></header>
<main>
${beats ? `<section><h2>STORYBOARD</h2><ul>${beats}</ul></section>` : ''}
${refCards ? `<section><h2>REFERENCES</h2><div class="refs">${refCards}</div></section>` : ''}
${genCards ? `<section><h2>GENERATIONS</h2><div class="gens">${genCards}</div></section>` : ''}
</main>
<footer>sealed by TIMMY — receipts in receipts/ · prompt ledger in the archive · TIMMY: receipts for everything</footer>
</body></html>
`;
  writeFileSync(join(p, 'site', 'index.html'), html, 'utf8');
  return join(p, 'site', 'index.html');
}

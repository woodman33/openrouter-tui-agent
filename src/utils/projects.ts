import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, readdirSync } from 'fs';
import { join, basename, extname } from 'path';

// TIMMY Slate projects — the visual project folder. One schema (slate.json),
// many targets: HyperFrames comp, Remotion scaffold, Instatic/Paper site,
// tldraw canvas view. The folder is the source of truth; Slate renders it.

export interface ProjectRef {
  file: string;
  label: string;
}

// Call-sheet block — the character registry that kills drift.
// Mirrors real movie call sheets: cast / wardrobe / props per shoot day.
export interface CharacterCard {
  id: string; // C1, C2…
  name: string;
  hair?: string;
  wardrobe?: string;
  emotion?: string;
  age?: string;
  props?: string[];
}

export type TemplateKind = 'storyboard' | 'callsheet' | 'character' | 'moodboard' | 'branching' | 'blocking';

// Call-sheet v2 — mirrors the expanded 20-section film template, scoped to
// what generations need: light window, scenes, continuity flags, coverage.
export interface CallSheetBlock {
  day?: number;
  of?: number;
  sunrise?: string;
  sunset?: string;
  weather?: string;
  scenes?: { order: number; scene: string; description: string; cast: string[]; int_ext?: string; d_n?: string }[];
  continuity?: { flags?: string[]; hours_rule?: string };
  coverage?: { must_get?: string[] };
}

// Telltale/Supermassive-style branches: choices with consequences that feed
// simulation runs and re-generation.
export interface Branch {
  id: string;
  prompt: string;
  if_yes?: string;
  if_no?: string;
  consequence?: string;
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
  cast?: CharacterCard[];
  scene_props?: string[];
  kind?: TemplateKind;
  sheet?: CallSheetBlock;
  branches?: Branch[];
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

export function addCastToProject(name: string, card: CharacterCard, dir?: string): SlateProject | null {
  const proj = readProject(name, dir);
  if (!proj) return null;
  const normalized = { ...card, id: card.id.toUpperCase() };
  proj.cast = [...(proj.cast || []).filter(c => c.id !== normalized.id), normalized];
  saveProject(proj, dir);
  return proj;
}

// The accuracy win: typed call-sheet details injected into every generation
// prompt, so C1 looks like C1 in every frame and every provider.
export function castPromptBlock(proj: SlateProject): string {
  const cast = (proj.cast || []).map(c =>
    `${c.id} (${c.name})` +
    (c.hair ? ` hair: ${c.hair};` : '') +
    (c.wardrobe ? ` wardrobe: ${c.wardrobe};` : '') +
    (c.emotion ? ` emotion: ${c.emotion};` : '') +
    (c.age ? ` age: ${c.age};` : '') +
    (c.props?.length ? ` props: ${c.props.join(', ')};` : '')
  );
  const propsLine = proj.scene_props?.length ? `SCENE PROPS: ${proj.scene_props.join(', ')}` : '';
  const sheet = proj.sheet;
  const lightLine = sheet?.sunrise || sheet?.sunset ? `LIGHT WINDOW: sunrise ${sheet.sunrise || '?'} · sunset ${sheet.sunset || '?'}${sheet.weather ? ` · ${sheet.weather}` : ''}` : '';
  const contLine = sheet?.continuity?.flags?.length ? `CONTINUITY FLAGS: ${sheet.continuity.flags.join('; ')}` : '';
  const hoursLine = sheet?.continuity?.hours_rule ? `24H RULE: ${sheet.continuity.hours_rule}` : '';
  const covLine = sheet?.coverage?.must_get?.length ? `MUST GET: ${sheet.coverage.must_get.join('; ')}` : '';
  const branchLine = proj.branches?.length ? `BRANCHES: ${proj.branches.map(b => `${b.id}: ${b.prompt}${b.consequence ? ` → ${b.consequence}` : ''}`).join(' | ')}` : '';
  const lines = [cast.length ? `CALL SHEET — ${proj.name}:` : '', ...cast.map(c => `  ${c}`), propsLine, lightLine, contLine, hoursLine, covLine, branchLine].filter(Boolean);
  if (!lines.length) return '';
  return lines.join('\n');
}

// tldraw SDK canvas — the Slate visual layer. Polls slate.json every 2s and
// draws beats as columns + cast as sticky notes. CLI authors on the left;
// this renders live on the right in a carbonyl pane.
export function renderCanvasPage(name: string, dir?: string): string | null {
  const proj = readProject(name, dir);
  if (!proj) return null;
  const p = projectDir(name, dir);
  mkdirSync(join(p, 'site'), { recursive: true });
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>TIMMY Slate canvas — ${proj.name}</title>
<link rel="stylesheet" href="https://unpkg.com/tldraw@3.15.0/tldraw.css" />
<style>html,body,#root{height:100%;margin:0;background:#090b10}</style>
</head><body><div id="root"></div>
<script type="module">
import React from "https://esm.sh/react@18.3.1?bundle";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client?bundle";
import { Tldraw, createShapeId } from "https://esm.sh/tldraw@3.15.0?bundle&deps=react@18.3.1,react-dom@18.3.1";
let last = "";
function sync(editor, slate) {
  editor.selectAll(); editor.deleteShapes(editor.getSelectedShapeIds());
  let x = 80;
  (slate.beats || []).forEach((b, i) => {
    editor.createShape({ id: createShapeId(), type: "geo", x, y: 80, props: { w: Math.max(120, b.dur * 60), h: 140, fill: "semi", color: "#d2a8ff", text: b.at + "s [" + b.label + "]\\n" + (b.text || "") } });
    x += Math.max(120, b.dur * 60) + 40;
  });
  let y = 300;
  (slate.cast || []).forEach(c => {
    editor.createShape({ id: createShapeId(), type: "note", x: 80, y, props: { color: "#3fb950", text: c.id + " " + c.name + "\\n" + (c.wardrobe || "") + "\\n" + (c.emotion || "") } });
    y += 160;
  });
}
createRoot(document.getElementById("root")).render(React.createElement(Tldraw, {
  onMount: (editor) => {
    window.editor = editor;
    const load = () => fetch("../slate.json").then(r => r.ok ? r.json() : null).then(j => { if (!j) return; const s = JSON.stringify(j); if (s !== last) { last = s; sync(editor, j); } }).catch(() => {});
    load(); setInterval(load, 2000);
  }
}));
</script></body></html>
`;
  writeFileSync(join(p, 'site', 'canvas.html'), html, 'utf8');
  return join(p, 'site', 'canvas.html');
}

// Director's blocking diagram — usable as a scribble/pose conditioning input.
// Pixel-perfect poses: draw in tldraw and export PNG; this SVG carries the
// typed blocking (who, where, facing, feeling) per beat.
export function renderBlockingSvg(name: string, dir?: string): string | null {
  const proj = readProject(name, dir);
  if (!proj) return null;
  const beats = proj.beats || [];
  const cast = proj.cast || [];
  const W = 960;
  const beatH = 140;
  const H = Math.max(200, beats.length * beatH + 60);
  const figures = beats.map((b, bi) => {
    const y = 60 + bi * beatH;
    const marks = cast.map((c, ci) => {
      const x = 120 + ci * 220 + (bi % 2) * 40;
      return `
      <g stroke="#3fb950" stroke-width="3" fill="none">
        <circle cx="${x}" cy="${y + 30}" r="16"/>
        <line x1="${x}" y1="${y + 46}" x2="${x}" y2="${y + 86}"/>
        <line x1="${x}" y1="${y + 56}" x2="${x - 22}" y2="${y + 76}"/>
        <line x1="${x}" y1="${y + 56}" x2="${x + 22}" y2="${y + 76}"/>
        <line x1="${x}" y1="${y + 86}" x2="${x - 16}" y2="${y + 116}"/>
        <line x1="${x}" y1="${y + 86}" x2="${x + 16}" y2="${y + 116}"/>
      </g>
      <text x="${x}" y="${y + 8}" fill="#d2a8ff" font-family="monospace" font-size="16" text-anchor="middle">${c.id} ${c.emotion || ''}</text>
      <text x="${x}" y="${y + 132}" fill="#8b949e" font-family="monospace" font-size="12" text-anchor="middle">${(c.wardrobe || '').slice(0, 28)}</text>`;
    }).join('');
    return `
    <rect x="20" y="${y - 14}" width="${W - 40}" height="${beatH - 12}" fill="none" stroke="#21262d"/>
    <text x="30" y="${y + 4}" fill="#e6edf3" font-family="monospace" font-size="14">${b.at}s [${b.label}] ${b.text.slice(0, 60)}</text>
    ${marks}`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#090b10"/>
<text x="20" y="28" fill="#79c0ff" font-family="monospace" font-size="18">TIMMY Slate blocking — ${name} (conditioning input)</text>
${figures}
</svg>
`;
  const p = projectDir(name, dir);
  mkdirSync(p, { recursive: true });
  writeFileSync(join(p, 'conditioning.svg'), svg, 'utf8');
  return join(p, 'conditioning.svg');
}

// Neural-mesh ingestion (V-02 rung 2, v0.7.8): typed hero assets (.glb /
// .usd / .usda) are ingested local-first — existence-checked, content-
// hashed, CUE-validated — and referenced into the compiled OpenUSD stage
// under the scene root (/World/HeroMesh). USD-native formats get a real
// composition arc (prepend references); glb rides provenance attrs until a
// real converter exists (REAL TOOL OR NOTHING). Partner generation stays
// target-grade: default-deny, not_configured.
import { spawnSync } from 'child_process';
import { existsSync, readFileSync, statSync, writeFileSync, mkdirSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { compileUsda, type UsdScene } from './usd-compiler.js';

export interface MeshAsset {
  id: string;
  source: 'tripo' | 'neural' | 'scan';
  path: string;
  format: 'glb' | 'usd' | 'usda';
  sha256: string;
  size_bytes: number;
  prim_path: string;
}

export function validateMeshCue(asset: unknown): { ok: boolean; note?: string; error_class?: string } {
  const cueBin = spawnSync('cue', ['version'], { encoding: 'utf8' });
  if (cueBin.status !== 0) return { ok: false, error_class: 'not_configured', note: 'cue binary missing (brew install cue)' };
  const schema = fileURLToPath(new URL('../../schemas/mesh-asset.cue', import.meta.url));
  const tmp = join(mkdtempSync(join(tmpdir(), 'timmy-meshcue-')), 'asset.json');
  writeFileSync(tmp, JSON.stringify(asset));
  const r = spawnSync('cue', ['vet', '-d', '#Asset', schema, tmp], { encoding: 'utf8' });
  if (r.status !== 0) return { ok: false, error_class: 'schema', note: (r.stderr || r.stdout || 'cue vet failed').slice(0, 400) };
  return { ok: true };
}

const FORMATS: Record<string, MeshAsset['format']> = { '.glb': 'glb', '.usd': 'usd', '.usda': 'usda' };

export function ingestMeshAsset(o: { id: string; path: string; source?: MeshAsset['source']; prim_path?: string }): { ok: boolean; asset?: MeshAsset; state?: 'blocked'; error_class?: string; note?: string } {
  if (!existsSync(o.path)) return { ok: false, state: 'blocked', error_class: 'missing_source', note: `mesh asset missing: ${o.path}` };
  const format = FORMATS[extname(o.path).toLowerCase()];
  if (!format) return { ok: false, state: 'blocked', error_class: 'unsupported_format', note: `unsupported mesh format: ${extname(o.path)} (glb|usd|usda)` };
  const asset: MeshAsset = {
    id: o.id,
    source: o.source ?? 'neural',
    path: o.path,
    format,
    sha256: crypto.createHash('sha256').update(readFileSync(o.path)).digest('hex'),
    size_bytes: statSync(o.path).size,
    prim_path: o.prim_path ?? '/World/HeroMesh'
  };
  const v = validateMeshCue(asset);
  if (!v.ok) return { ok: false, state: 'blocked', error_class: v.error_class, note: v.note };
  return { ok: true, asset };
}

// Partner mesh generation is V-02's ROUTING rung (target): paid routes
// default-deny until the approval/spend law covers them. Ingest, don't mint.
export function tripoGenerate(): { ok: false; state: 'not_configured'; note: string } {
  return { ok: false, state: 'not_configured', note: 'tripo generation is target-grade (V-05 routing rung): paid routes default-deny — ingest a local asset instead' };
}

// Compose the final stage: compiled scene + hero reference prim under the
// scene root. USD-native assets get a composition arc; glb carries provenance
// until a real converter lands.
export function compileStageWithHero(scene: UsdScene, asset: MeshAsset): { ok: boolean; usda?: string; sha256?: string; note?: string } {
  const base = compileUsda(scene);
  const root = scene.root ?? 'World';
  const primName = asset.prim_path.split('/').filter(Boolean).pop() ?? 'HeroMesh';
  const i4 = '    ';
  const lines = [
    `${i4}def Xform "${primName}"`,
    `${i4}{`,
    `${i4}${i4}custom string timmy:prim_path = "${asset.prim_path.startsWith('/') ? asset.prim_path : `/${root}/${primName}`}"`,
    `${i4}${i4}custom string timmy:mesh_source = "${asset.source}"`,
    `${i4}${i4}custom string timmy:mesh_format = "${asset.format}"`,
    `${i4}${i4}custom string timmy:mesh_sha256 = "${asset.sha256}"`,
    `${i4}${i4}custom int64 timmy:mesh_size_bytes = ${asset.size_bytes}`
  ];
  if (asset.format !== 'glb') lines.push(`${i4}${i4}prepend references = @${asset.path}@`);
  else lines.push(`${i4}${i4}custom string timmy:needs_conversion = "glb→usd via real converter (REAL TOOL OR NOTHING)"`);
  lines.push(`${i4}}`);
  const block = lines.join('\n') + '\n';
  const idx = base.lastIndexOf('}');
  if (idx < 0) return { ok: false, note: 'stage text malformed' };
  const usda = base.slice(0, idx) + block + base.slice(idx);
  return { ok: true, usda, sha256: crypto.createHash('sha256').update(usda).digest('hex') };
}

export function writeHeroStage(scene: UsdScene, asset: MeshAsset, outDir: string): { ok: boolean; usda_path?: string; sha256?: string; note?: string } {
  const c = compileStageWithHero(scene, asset);
  if (!c.ok) return { ok: false, note: c.note };
  mkdirSync(outDir, { recursive: true });
  const p = join(outDir, `${scene.name}-hero.usda`);
  writeFileSync(p, c.usda!);
  return { ok: true, usda_path: p, sha256: c.sha256 };
}

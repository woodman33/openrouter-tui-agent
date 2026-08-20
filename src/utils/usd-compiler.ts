// USD geometry spine (V-02 rung 1, v0.7.7): typed parametric 3D → CUE-
// validated, deterministic, content-hashed .usda stage + OpenSCAD CSG
// adapter. Native UsdGeom prims for plain solids; boolean trees ride the
// stage as provenance-carrying Scopes whose geometry the OpenSCAD adapter
// renders when the binary is present (REAL TOOL OR NOTHING otherwise).
import { spawnSync } from 'child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

export interface UsdPrim {
  id: string;
  kind: 'cube' | 'sphere' | 'cylinder';
  size?: number[];
  radius?: number;
  height?: number;
  translate?: number[];
  rotate?: number[];
  color?: number[];
  op?: 'union' | 'difference' | 'intersection';
  children?: UsdPrim[];
}

export interface UsdScene {
  schema_version: 'usd/0.1';
  name: string;
  meters_per_unit: number;
  up_axis: 'Y' | 'Z';
  root?: string;
  prims: UsdPrim[];
}

export function validateUsdCue(scene: unknown, dir?: string): { ok: boolean; note?: string; error_class?: string } {
  const cueBin = spawnSync('cue', ['version'], { encoding: 'utf8' });
  if (cueBin.status !== 0) return { ok: false, error_class: 'not_configured', note: 'cue binary missing (brew install cue)' };
  const schema = fileURLToPath(new URL('../../schemas/usd.cue', import.meta.url));
  const tmp = join(mkdtempSync(join(tmpdir(), 'timmy-usdcue-')), 'scene.json');
  writeFileSync(tmp, JSON.stringify(scene));
  const r = spawnSync('cue', ['vet', '-d', '#Scene', schema, tmp], { encoding: 'utf8' });
  if (r.status !== 0) return { ok: false, error_class: 'schema', note: (r.stderr || r.stdout || 'cue vet failed').slice(0, 400) };
  return { ok: true };
}

const num = (n: number): string => String(n);
const vec = (v: number[]): string => `(${v.map(num).join(', ')})`;

function xformOps(p: UsdPrim, indent: string): string {
  const ops: string[] = [];
  if (p.translate) ops.push(`${indent}custom float3 xformOp:translate = ${vec(p.translate)}`);
  if (p.rotate) ops.push(`${indent}custom float3 xformOp:rotateXYZ = ${vec(p.rotate)}`);
  if (p.size && p.kind === 'cube') ops.push(`${indent}custom float3 xformOp:scale = ${vec(p.size)}`);
  if (!ops.length) return '';
  const order = ['translate', 'rotateXYZ', 'scale'].filter(k =>
    k === 'translate' ? p.translate : k === 'rotateXYZ' ? p.rotate : p.size && p.kind === 'cube');
  return ops.join('\n') + '\n' + `${indent}uniform token[] xformOpOrder = [${order.map(o => `"xformOp:${o}"`).join(', ')}]`;
}

function primUsda(p: UsdPrim, depth: number): string {
  const i = '    '.repeat(depth);
  const inner = '    '.repeat(depth + 1);
  if (p.op && p.children?.length) {
    // CSG tree: geometry belongs to the OpenSCAD adapter; the stage carries
    // the source as provenance plus the child prims for inspection
    const body = [
      `${inner}custom string timmy:openscad = """${openscadExpr(p)}"""`,
      ...p.children.map(c => primUsda(c, depth + 1))
    ].join('\n');
    return `${i}def Scope "${p.id}"\n${i}{\n${body}\n${i}}`;
  }
  const kind = p.kind === 'cube' ? 'Cube' : p.kind === 'sphere' ? 'Sphere' : 'Cylinder';
  const geom = p.kind === 'cube'
    ? `${inner}double size = 1`
    : p.kind === 'sphere'
      ? `${inner}double radius = ${num(p.radius ?? 1)}`
      : `${inner}double radius = ${num(p.radius ?? 1)}\n${inner}double height = ${num(p.height ?? 2)}`;
  const color = p.color ? `\n${inner}color3f[] primvars:displayColor = [${vec(p.color)}]` : '';
  const xf = xformOps(p, inner);
  return `${i}def ${kind} "${p.id}"\n${i}{\n${geom}${color}${xf ? '\n' + xf : ''}\n${i}}`;
}

export function compileUsda(scene: UsdScene): string {
  const root = scene.root ?? 'World';
  return [
    '#usda 1.0',
    '(',
    `    defaultPrim = "${root}"`,
    `    metersPerUnit = ${num(scene.meters_per_unit)}`,
    `    upAxis = "${scene.up_axis}"`,
    `    doc = "TIMMY usd-compiler · ${scene.name}"`,
    ')',
    '',
    `def Xform "${root}"`,
    '{',
    scene.prims.map(p => primUsda(p, 1)).join('\n'),
    '}',
    ''
  ].join('\n');
}

// --- OpenSCAD CSG adapter -------------------------------------------------

function openscadExpr(p: UsdPrim): string {
  const t = p.translate ? `translate(${JSON.stringify(p.translate)}) ` : '';
  const r = p.rotate ? `rotate(${JSON.stringify(p.rotate)}) ` : '';
  const solid = p.kind === 'cube'
    ? `cube(size=${JSON.stringify(p.size ?? [1, 1, 1])}, center=true)`
    : p.kind === 'sphere'
      ? `sphere(r=${num(p.radius ?? 1)})`
      : `cylinder(r=${num(p.radius ?? 1)}, h=${num(p.height ?? 2)}, center=true)`;
  if (p.op && p.children?.length) return `${t}${r}${p.op}() { ${p.children.map(c => openscadExpr(c)).join(' ')} }`;
  return `${t}${r}${solid}`;
}

export function openscadFromScene(scene: UsdScene): string {
  return [
    `// TIMMY openscad-csg adapter · scene ${scene.name}`,
    '$fn = 32;',
    ...scene.prims.map(p => openscadExpr(p) + ';'),
    ''
  ].join('\n');
}

// env override is the test/CI seam; otherwise PATH probe; nothing = closed
export function openscadBin(): string | null {
  const envBin = process.env.TIMMY_OPENSCAD_BIN;
  if (envBin) return existsSync(envBin) ? envBin : null;
  const probe = spawnSync('openscad', ['--version'], { encoding: 'utf8', timeout: 10000 });
  return probe.status === 0 ? 'openscad' : null;
}

export function renderCsg(scene: UsdScene, outPath: string): { ok: boolean; state?: 'not_configured' | 'blocked'; note?: string; sha256?: string } {
  const bin = openscadBin();
  if (!bin) return { ok: false, state: 'not_configured', note: 'openscad binary missing (TIMMY_OPENSCAD_BIN or PATH)' };
  const scad = join(mkdtempSync(join(tmpdir(), 'timmy-scad-')), `${scene.name}.scad`);
  writeFileSync(scad, openscadFromScene(scene));
  const r = spawnSync(bin, [scad, '-o', outPath], { encoding: 'utf8', timeout: 120000 });
  if (r.status !== 0 || !existsSync(outPath)) return { ok: false, state: 'blocked', note: (r.stderr || 'openscad render failed').slice(0, 300) };
  return { ok: true, sha256: crypto.createHash('sha256').update(readFileSync(outPath)).digest('hex') };
}

// --- stage emission -------------------------------------------------------

export function compileUsdStage(scene: UsdScene, outDir: string): { ok: boolean; validation?: unknown; usda_path?: string; scad_path?: string; sha256?: string; note?: string } {
  const validation = validateUsdCue(scene);
  if (!validation.ok) return { ok: false, validation, note: validation.note ?? validation.error_class };
  const usda = compileUsda(scene);
  const sha = crypto.createHash('sha256').update(usda).digest('hex');
  mkdirSync(outDir, { recursive: true });
  const usdaPath = join(outDir, `${scene.name}.usda`);
  const scadPath = join(outDir, `${scene.name}.scad`);
  writeFileSync(usdaPath, usda);
  writeFileSync(scadPath, openscadFromScene(scene));
  return { ok: true, validation, usda_path: usdaPath, scad_path: scadPath, sha256: sha };
}

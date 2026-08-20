import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import crypto from 'crypto';
import { ingestMeshAsset, compileStageWithHero, writeHeroStage, tripoGenerate } from '../src/utils/tripo-adapter.js';
import type { UsdScene } from '../src/utils/usd-compiler.js';

const sha = (b: Buffer | string): string => crypto.createHash('sha256').update(b).digest('hex');

const scene: UsdScene = {
  schema_version: 'usd/0.1', name: 'hero-stage', meters_per_unit: 0.01, up_axis: 'Z',
  prims: [{ id: 'pedestal', kind: 'cylinder', radius: 2, height: 0.5 }]
};

let dir = '';
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'timmy-tripo-')); });
afterAll(() => { rmSync(dir, { recursive: true, force: true }); });

describe('neural-mesh ingestion (V-02 rung 2)', () => {
  it('ingests a local .glb with content hash + CUE validation', () => {
    const bytes = Buffer.from('glb-fake-hero-bytes');
    const p = join(dir, 'hero.glb');
    writeFileSync(p, bytes);
    const r = ingestMeshAsset({ id: 'hero', path: p, source: 'tripo' });
    expect(r.ok).toBe(true);
    expect(r.asset!.sha256).toBe(sha(bytes));
    expect(r.asset!.format).toBe('glb');
    expect(r.asset!.prim_path).toBe('/World/HeroMesh');
  });

  it('fails closed on missing source and unsupported formats', () => {
    expect(ingestMeshAsset({ id: 'x', path: join(dir, 'nope.glb') }).error_class).toBe('missing_source');
    const txt = join(dir, 'notes.txt');
    writeFileSync(txt, 'not a mesh');
    expect(ingestMeshAsset({ id: 'x', path: txt }).error_class).toBe('unsupported_format');
  });

  it('references the hero into the stage under /World with provenance', () => {
    const bytes = Buffer.from('glb-fake-hero-bytes-2');
    const p = join(dir, 'hero2.glb');
    writeFileSync(p, bytes);
    const a = ingestMeshAsset({ id: 'hero', path: p })!;
    const s = compileStageWithHero(scene, a.asset!);
    expect(s.ok).toBe(true);
    expect(s.usda).toContain('defaultPrim = "World"');
    expect(s.usda).toContain('def Xform "HeroMesh"');
    expect(s.usda).toContain(`timmy:mesh_sha256 = "${a.asset!.sha256}"`);
    expect(s.usda).toContain('timmy:prim_path = "/World/HeroMesh"');
    expect(s.usda).toContain('needs_conversion');
    expect(compileStageWithHero(scene, a.asset!).sha256).toBe(s.sha256);
  });

  it('USD-native assets get a real composition arc', () => {
    const p = join(dir, 'hero.usda');
    writeFileSync(p, '#usda 1.0\n');
    const a = ingestMeshAsset({ id: 'hero', path: p });
    expect(a.ok).toBe(true);
    const s = compileStageWithHero(scene, a.asset!);
    expect(s.usda).toContain('prepend references = @');
    expect(s.usda).not.toContain('needs_conversion');
  });

  it('writeHeroStage emits a content-hashed stage file', () => {
    const p = join(dir, 'hero3.glb');
    writeFileSync(p, 'glb-3');
    const a = ingestMeshAsset({ id: 'hero', path: p });
    const w = writeHeroStage(scene, a.asset!, dir);
    expect(w.ok).toBe(true);
    expect(sha(readFileSync(w.usda_path!, 'utf8'))).toBe(w.sha256);
  });

  it('partner generation stays target-grade (default-deny)', () => {
    const g = tripoGenerate();
    expect(g.ok).toBe(false);
    expect(g.state).toBe('not_configured');
  });
});

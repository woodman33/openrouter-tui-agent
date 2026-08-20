import { describe, it, expect } from 'vitest';
import { composeUnifiedStage, stageHierarchy, validateUsdCue, type UsdScene, type HeroRef } from '../src/utils/usd-compiler.js';

const scene: UsdScene = {
  schema_version: 'usd/0.1', name: 'unified', meters_per_unit: 0.01, up_axis: 'Z',
  prims: [
    { id: 'base', kind: 'cube', size: [4, 4, 1], material: { diffuse: [0.2, 0.6, 0.9], roughness: 0.4 } },
    {
      id: 'cut', kind: 'cube', op: 'difference',
      children: [{ id: 'outer', kind: 'cube', size: [2, 2, 2] }, { id: 'tool', kind: 'sphere', radius: 1.2 }]
    }
  ]
};

const hero: HeroRef = { source: 'tripo', format: 'glb', path: '/tmp/hero.glb', sha256: 'a'.repeat(64), size_bytes: 1234, prim_path: '/World/HeroMesh' };

describe('unified USD stage composition (V-02 rung 3)', () => {
  it('CUE validates PBR materials and rejects out-of-range values', () => {
    expect(validateUsdCue(scene).ok).toBe(true);
    expect(validateUsdCue({ ...scene, prims: [{ id: 'x', kind: 'cube', material: { metallic: 2 } }] }).ok).toBe(false);
    expect(validateUsdCue({ ...scene, prims: [{ id: 'x', kind: 'cube', material: { roughness: -1 } }] }).ok).toBe(false);
  });

  it('binds CSG + UsdShade PBR + hero reference in one hashed stage', () => {
    const r = composeUnifiedStage(scene, { hero });
    expect(r.ok).toBe(true);
    expect(r.usda).toContain('def Material "mat_base"');
    expect(r.usda).toContain('UsdPreviewSurface');
    expect(r.usda).toContain('rel material:binding = </World/mat_base>');
    expect(r.usda).toContain('def Scope "cut"');
    expect(r.usda).toContain('timmy:openscad');
    expect(r.usda).toContain('def Xform "HeroMesh"');
    expect(r.usda).toContain(`timmy:mesh_sha256 = "${hero.sha256}"`);
    expect(composeUnifiedStage(scene, { hero }).sha256).toBe(r.sha256);
  });

  it('stageHierarchy lists root, CSG children, material flags and hero', () => {
    const h = stageHierarchy(scene, hero);
    expect(h[0]).toEqual({ path: '/World', kind: 'Xform' });
    expect(h.some(n => n.path === '/World/base' && n.material)).toBe(true);
    expect(h.some(n => n.path === '/World/cut' && n.csg && n.kind === 'CSG:difference')).toBe(true);
    expect(h.some(n => n.path === '/World/cut/outer')).toBe(true);
    expect(h.some(n => n.path === '/World/HeroMesh' && n.format === 'glb')).toBe(true);
  });
});

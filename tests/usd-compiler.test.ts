import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import crypto from 'crypto';
import {
  validateUsdCue, compileUsda, compileUsdStage, openscadFromScene, renderCsg, type UsdScene
} from '../src/utils/usd-compiler.js';

const sha = (s: string): string => crypto.createHash('sha256').update(s).digest('hex');

const scene: UsdScene = {
  schema_version: 'usd/0.1',
  name: 'bench-block',
  meters_per_unit: 0.01,
  up_axis: 'Z',
  prims: [
    { id: 'base', kind: 'cube', size: [4, 4, 1], translate: [0, 0, 0.5], color: [0.2, 0.6, 0.9] },
    { id: 'dome', kind: 'sphere', radius: 1.2, translate: [0, 0, 1.6] },
    { id: 'hole', kind: 'cylinder', radius: 0.4, height: 3, translate: [1, 1, 1] },
    {
      id: 'cut', kind: 'cube', op: 'difference',
      children: [
        { id: 'outer', kind: 'cube', size: [2, 2, 2] },
        { id: 'tool', kind: 'sphere', radius: 1.2 }
      ]
    }
  ]
};

let dir = '';
afterAll(() => { if (dir) rmSync(dir, { recursive: true, force: true }); });

describe('USD geometry spine (V-02 rung 1)', () => {
  it('CUE validates typed scenes and rejects bad params', () => {
    expect(validateUsdCue(scene).ok).toBe(true);
    expect(validateUsdCue({ ...scene, prims: [{ id: 'x', kind: 'cone' }] }).ok).toBe(false);
    expect(validateUsdCue({ ...scene, prims: [{ id: 'x', kind: 'sphere', radius: -1 }] }).ok).toBe(false);
    expect(validateUsdCue({ ...scene, meters_per_unit: 0 }).ok).toBe(false);
  });

  it('compileUsda is deterministic and carries native prims + CSG provenance', () => {
    const a = compileUsda(scene);
    expect(sha(a)).toBe(sha(compileUsda(scene)));
    expect(a).toContain('#usda 1.0');
    expect(a).toContain('metersPerUnit = 0.01');
    expect(a).toContain('def Cube "base"');
    expect(a).toContain('def Sphere "dome"');
    expect(a).toContain('def Cylinder "hole"');
    expect(a).toContain('def Scope "cut"');
    expect(a).toContain('timmy:openscad');
    expect(a).toContain('xformOp:scale');
  });

  it('OpenSCAD adapter emits deterministic CSG script', () => {
    const s = openscadFromScene(scene);
    expect(s).toContain('$fn = 32;');
    expect(s).toContain('cube(size=[4,4,1], center=true)');
    expect(s).toContain('difference() {');
    expect(sha(s)).toBe(sha(openscadFromScene(scene)));
  });

  it('compileUsdStage writes content-hashed .usda + .scad', () => {
    dir = mkdtempSync(join(tmpdir(), 'timmy-usd-'));
    const r = compileUsdStage(scene, dir);
    expect(r.ok).toBe(true);
    expect(r.sha256).toBe(sha(readFileSync(r.usda_path!, 'utf8')));
    expect(readFileSync(r.scad_path!, 'utf8')).toContain('difference() {');
    const r2 = compileUsdStage(scene, dir);
    expect(r2.sha256).toBe(r.sha256);
  });

  it('renderCsg fails closed not_configured without the binary', () => {
    process.env.TIMMY_OPENSCAD_BIN = '/nonexistent/openscad';
    const r = renderCsg(scene, join(dir || tmpdir(), 'out.off'));
    delete process.env.TIMMY_OPENSCAD_BIN;
    expect(r.ok).toBe(false);
    expect(r.state).toBe('not_configured');
  });
});

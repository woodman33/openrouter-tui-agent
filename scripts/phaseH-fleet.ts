// Phase H — fleet distribution proof: one mission fans out a ComfyUI video
// stem (local golden lane, real server) plus tri-modal USD stage renders in
// parallel; the parent receipt links the fan-out. Missing tooling seals an
// honest not_configured — the fleet never fakes a stem.
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import crypto from 'crypto';
import { runFleetMission } from '../src/utils/fleet-dispatch.js';
import { issueApproval } from '../src/utils/approvals.js';
import type { UsdScene, HeroRef } from '../src/utils/usd-compiler.js';

const dir = mkdtempSync(join(tmpdir(), 'timmy-fleet-'));
const heroBytes = Buffer.from('fleet-hero-glb');
const heroPath = join(dir, 'hero.glb');
writeFileSync(heroPath, heroBytes);
const hero: HeroRef = {
  source: 'neural', format: 'glb', path: heroPath,
  sha256: crypto.createHash('sha256').update(heroBytes).digest('hex'),
  size_bytes: heroBytes.length, prim_path: '/World/HeroMesh'
};
const scene: UsdScene = {
  schema_version: 'usd/0.1', name: 'fleet-stage', meters_per_unit: 0.01, up_axis: 'Z',
  prims: [
    { id: 'base', kind: 'cube', size: [4, 4, 1], material: { diffuse: [0.2, 0.6, 0.9], roughness: 0.4 } },
    { id: 'cut', kind: 'cube', op: 'difference', children: [{ id: 'outer', kind: 'cube', size: [2, 2, 2] }, { id: 'tool', kind: 'sphere', radius: 1.2 }] }
  ]
};

const r = await runFleetMission({
  scene, hero,
  workflow: join(process.cwd(), 'scripts', 'comfy-golden-5s.json'),
  comfy: true,
  armToken: (_id, hash) => issueApproval(hash).token
});
console.log(JSON.stringify(r, null, 2));
process.exit(r.ok ? 0 : 1);

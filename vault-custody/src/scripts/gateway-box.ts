// The sealed box, lit like an object on a desk: image-based lighting from a
// room environment, a warm key with a soft shadow, a phosphor rim, and a bloom
// pass that only the custody band and the seal chip are bright enough to
// trigger. The intro dollies in and ignites the band (reveal, then the claim);
// afterwards the box drifts and follows the pointer a little. Reduced motion
// gets the lit still frame.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const NAVY = 0x0a1628;
const NAVY2 = 0x101f38;
const PHOSPHOR = 0x33ff66;
const ORANGE = 0xff8c1a;

function panel(lines: string[], w = 1024, h = 640, accent = '#FF8C1A'): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0F1D34';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 3200; i++) {
    g.fillStyle = `rgba(230,237,247,${Math.random() * 0.045})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  g.strokeStyle = 'rgba(230,237,247,0.16)';
  g.lineWidth = 5;
  g.strokeRect(34, 34, w - 68, h - 68);
  g.textBaseline = 'top';
  lines.forEach((line, i) => {
    g.fillStyle = i === 0 ? '#E6EDF7' : i === 1 ? accent : '#9FB0C8';
    g.font = `${i === 0 ? 700 : 500} ${Math.round(h * (i === 0 ? 0.13 : 0.075))}px ${i === 2 ? '"JetBrains Mono", Menlo, monospace' : '"Space Grotesk", Arial, sans-serif'}`;
    g.fillText(line, 72, 90 + i * h * 0.19);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number): number => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export function mountGatewayBox(canvas: HTMLCanvasElement): () => void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const CAM_FINAL = new THREE.Vector3(0, 1.45, 6.2);
  const CAM_START = new THREE.Vector3(0.6, 2.6, 9.6);
  camera.position.copy(reduce ? CAM_FINAL : CAM_START);
  camera.lookAt(0, -0.1, 0);

  // Image-based lighting from a neutral room; the key and rim carry the mood.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffe0bf, 2.4);
  key.position.set(4, 6, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 20;
  key.shadow.camera.left = key.shadow.camera.bottom = -4;
  key.shadow.camera.right = key.shadow.camera.top = 4;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9cffb8, 0.35);
  rim.position.set(-4, 2.5, -4);
  scene.add(rim);

  // Box: 7.5 × 5 × 2.9 in → 1.5 : 1 : 0.58. Varnished card: a little clearcoat.
  const W = 2.4, H = 0.93, D = 1.6;
  const paper = { roughness: 0.62, metalness: 0.0, clearcoat: 0.18, clearcoatRoughness: 0.5 };
  const side = new THREE.MeshPhysicalMaterial({ color: NAVY2, ...paper });
  const front = new THREE.MeshPhysicalMaterial({ map: panel(['SERIES 001', '2026 HOBBY BOX', 'VC0007 · SEALED']), ...paper });
  const top = new THREE.MeshPhysicalMaterial({ map: panel(['EVERY BOX A 1/1', 'VAULT CUSTODY × TIMMY', 'trust the receipt, not the model'], 1024, 700, '#33FF66'), ...paper });
  const box = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [side, side, top, side, front, side]);
  box.castShadow = true;
  box.receiveShadow = true;
  const group = new THREE.Group();
  group.add(box);

  // Custody band around the girth. Dark green base, emissive driven by the intro.
  const bandMat = new THREE.MeshStandardMaterial({ color: 0x0f4d27, emissive: PHOSPHOR, emissiveIntensity: reduce ? 0.75 : 0, roughness: 0.35, metalness: 0.1 });
  const bandT = 0.02, bandW = 0.34;
  const band = new THREE.Group();
  const mk = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bandMat);
    m.position.set(x, y, z);
    m.castShadow = true;
    band.add(m);
  };
  mk(bandW, H + bandT * 2, bandT, 0, 0, D / 2 + bandT / 2);
  mk(bandW, H + bandT * 2, bandT, 0, 0, -D / 2 - bandT / 2);
  mk(bandW, bandT, D + bandT * 2, 0, H / 2 + bandT / 2, 0);
  mk(bandW, bandT, D + bandT * 2, 0, -H / 2 - bandT / 2, 0);
  group.add(band);

  // Seal chip window on the lid (the NTAG 424 DNA TT) and the reveal tag under the lid edge.
  const chipMat = new THREE.MeshStandardMaterial({ color: 0x0a1628, emissive: PHOSPHOR, emissiveIntensity: reduce ? 1.4 : 0, roughness: 0.3 });
  const chip = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 40), chipMat);
  chip.position.set(0, H / 2 + bandT + 0.011, 0.12);
  group.add(chip);
  const reveal = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 32), new THREE.MeshStandardMaterial({ color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.35, roughness: 0.4 }));
  reveal.position.set(-W / 2 + 0.25, H / 2 + 0.011, -D / 2 + 0.25);
  group.add(reveal);

  const REST_ROT = new THREE.Euler(0.3, -0.62, 0);
  group.rotation.copy(reduce ? REST_ROT : new THREE.Euler(0.42, -1.5, 0));
  scene.add(group);

  // Floor: catches the key light's shadow, plus a faint phosphor pool.
  const floorY = -H / 2 - 0.32;
  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.42 }));
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = floorY;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.4, 64), new THREE.MeshBasicMaterial({ color: PHOSPHOR, transparent: true, opacity: 0.02, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = floorY + 0.002;
  scene.add(pool);

  // Post: render → bloom (only the band and the chip clear the threshold) → output.
  const size = () => ({ w: canvas.clientWidth || 800, h: canvas.clientHeight || 480 });
  const target = new THREE.WebGLRenderTarget(size().w, size().h, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  // Tasteful: only the band and the chip clear the threshold, and the halo stays tight.
  const bloom = new UnrealBloomPass(new THREE.Vector2(size().w, size().h), 0.28, 0.35, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const resize = () => {
    const { w, h } = size();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  // Pointer parallax (subtle), lerped; off under reduced motion.
  const ptr = new THREE.Vector2(0, 0);
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onLeave = () => ptr.set(0, 0);
  if (!reduce) {
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
  }

  const INTRO = 1.7;
  let raf = 0;
  const t0 = performance.now();
  const tilt = new THREE.Vector2(0, 0);
  const frame = () => {
    const t = (performance.now() - t0) / 1000;
    if (!reduce) {
      const k = Math.min(1, t / INTRO);
      const e = easeOutCubic(k);
      camera.position.lerpVectors(CAM_START, CAM_FINAL, e);
      camera.lookAt(0, -0.1, 0);
      const ignite = Math.max(0, Math.min(1, (t - 0.9) / 0.7));
      bandMat.emissiveIntensity = 0.75 * easeInOut(ignite);
      chipMat.emissiveIntensity = 1.4 * easeInOut(ignite);
      const drift = Math.max(0, t - INTRO);
      tilt.lerp(ptr, 0.05);
      group.rotation.set(REST_ROT.x + tilt.y * 0.08, THREE.MathUtils.lerp(-1.5, REST_ROT.y, e) + drift * 0.12 + tilt.x * 0.14, 0);
      group.position.y = Math.sin(drift * 0.8) * 0.035;
      bandMat.emissiveIntensity += Math.sin(t * 2.1) * 0.08 * ignite;
    }
    composer.render();
    raf = requestAnimationFrame(frame);
  };
  frame();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerleave', onLeave);
    composer.dispose();
    target.dispose();
    renderer.dispose();
  };
}

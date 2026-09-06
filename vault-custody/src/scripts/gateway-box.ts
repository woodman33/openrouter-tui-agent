// The sealed box: a hobby box in product mode, rotating slowly, the custody
// band around its girth glowing phosphor with the chip window on the lid.
// Textures are drawn on canvases (no external assets); reduced motion = still.
import * as THREE from 'three';

const NAVY = 0x0a1628;
const NAVY2 = 0x101f38;
const PHOSPHOR = 0x33ff66;
const ORANGE = 0xff8c1a;

function panel(text: string[], w = 1024, h = 640, accent = '#FF8C1A'): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = '#101F38';
  g.fillRect(0, 0, w, h);
  // paper grain
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(230,237,247,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  g.strokeStyle = 'rgba(230,237,247,0.18)';
  g.lineWidth = 6;
  g.strokeRect(36, 36, w - 72, h - 72);
  g.fillStyle = accent;
  g.font = `700 ${Math.round(h * 0.11)}px "Space Grotesk", Arial, sans-serif`;
  g.textBaseline = 'top';
  text.forEach((line, i) => {
    g.fillStyle = i === 0 ? '#E6EDF7' : i === 1 ? accent : '#9FB0C8';
    g.font = `${i === 0 ? 700 : 500} ${Math.round(h * (i === 0 ? 0.13 : 0.075))}px ${i === 2 ? '"JetBrains Mono", Menlo, monospace' : '"Space Grotesk", Arial, sans-serif'}`;
    g.fillText(line, 72, 90 + i * h * 0.19);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function mountGatewayBox(canvas: HTMLCanvasElement): () => void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 1.4, 6.2);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xe6edf7, NAVY, 0.55));
  const key = new THREE.PointLight(ORANGE, 40, 30, 2);
  key.position.set(4, 4, 4);
  scene.add(key);
  const rim = new THREE.PointLight(PHOSPHOR, 18, 30, 2);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  // Box: 7.5 × 5 × 2.9 in → 1.5 : 1 : 0.58
  const W = 2.4, H = 0.93, D = 1.6;
  const side = new THREE.MeshStandardMaterial({ color: NAVY2, roughness: 0.85, metalness: 0.05 });
  const front = new THREE.MeshStandardMaterial({ map: panel(['SERIES 001', '2026 HOBBY BOX', 'VC0007 · SEALED']), roughness: 0.8 });
  const topTex = panel(['EVERY BOX A 1/1', 'VAULT CUSTODY × TIMMY', 'trust the receipt, not the model'], 1024, 700, '#33FF66');
  // BoxGeometry's +Y face already reads upright from the camera's side; leave the UVs alone.
  const top = new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.8 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [side, side, top, side, front, side]);
  const group = new THREE.Group();
  group.add(box);

  // Custody band around the girth (over the lid seam), glowing.
  // Dark green base + moderate emissive so the band's faces still shade against each other.
  const bandMat = new THREE.MeshStandardMaterial({ color: 0x145c2e, emissive: PHOSPHOR, emissiveIntensity: 0.38, roughness: 0.35, metalness: 0.15 });
  const bandT = 0.02, bandW = 0.34;
  const band = new THREE.Group();
  const mk = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bandMat);
    m.position.set(x, y, z);
    band.add(m);
  };
  mk(bandW, H + bandT * 2, bandT, 0, 0, D / 2 + bandT / 2);
  mk(bandW, H + bandT * 2, bandT, 0, 0, -D / 2 - bandT / 2);
  mk(bandW, bandT, D + bandT * 2, 0, H / 2 + bandT / 2, 0);
  mk(bandW, bandT, D + bandT * 2, 0, -H / 2 - bandT / 2, 0);
  group.add(band);

  // Seal chip window on the lid.
  const chip = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 40), new THREE.MeshStandardMaterial({ color: 0x0a1628, emissive: PHOSPHOR, emissiveIntensity: 1.6, roughness: 0.3 }));
  chip.position.set(0, H / 2 + bandT + 0.01, 0.12);
  group.add(chip);

  // Reveal tag under the lid edge (second 424 DNA), a small orange dot.
  const reveal = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 32), new THREE.MeshStandardMaterial({ color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.6 }));
  reveal.position.set(-W / 2 + 0.25, H / 2 + 0.011, -D / 2 + 0.25);
  group.add(reveal);

  group.rotation.set(0.32, -0.6, 0);
  scene.add(group);

  // Ground glow
  const glow = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.MeshBasicMaterial({ color: PHOSPHOR, transparent: true, opacity: 0.05 }));
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -H / 2 - 0.35;
  scene.add(glow);

  const resize = () => {
    const w = canvas.clientWidth || 800;
    const h = canvas.clientHeight || 480;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  let raf = 0;
  const t0 = performance.now();
  const frame = () => {
    const t = (performance.now() - t0) / 1000;
    if (!reduce) {
      group.rotation.y = -0.6 + t * 0.35;
      group.position.y = Math.sin(t * 0.8) * 0.04;
    }
    bandMat.emissiveIntensity = 0.38 + Math.sin(t * 2.2) * 0.18;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  frame();
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    renderer.dispose();
  };
}

// Product provenance: one event list, two views.
//   mountTimeline → Three.js: events along a time axis, marker shape = hat,
//                   colour = semantic (orange human, phosphor chain).
//   renderMap      → SVG: city-level points, arcs between transfers.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export type Shape = 'circle' | 'square' | 'diamond' | 'triangle' | 'hexagon' | 'ring';
export interface PEvent {
  seq: string;
  kind: string;
  ts: string;
  hat: string;
  shape: Shape;
  city: string;
  title: string;
  detail: string;
  prev: string;
  this: string;
  chain: boolean;
  tamper?: boolean;
  from?: string;
}

const ORANGE = 0xff8c1a;
const PHOSPHOR = 0x33ff66;
const NAVY = 0x0a1628;

function geometryFor(shape: Shape): THREE.BufferGeometry {
  switch (shape) {
    case 'circle': return new THREE.SphereGeometry(0.16, 24, 16);
    case 'square': return new THREE.BoxGeometry(0.26, 0.26, 0.26);
    case 'diamond': return new THREE.OctahedronGeometry(0.2);
    case 'triangle': return new THREE.ConeGeometry(0.17, 0.3, 4);
    case 'hexagon': return new THREE.CylinderGeometry(0.18, 0.18, 0.12, 6);
    case 'ring': return new THREE.TorusGeometry(0.15, 0.05, 12, 32);
  }
}

export function mountTimeline(host: HTMLElement, events: PEvent[], onSelect: (e: PEvent | null) => void): () => void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const w = host.clientWidth || 900;
  const hgt = host.clientHeight || 520;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, hgt);
  renderer.domElement.style.display = 'block';
  host.appendChild(renderer.domElement);
  const labels = new CSS2DRenderer();
  labels.setSize(w, hgt);
  labels.domElement.style.position = 'absolute';
  labels.domElement.style.inset = '0';
  labels.domElement.style.pointerEvents = 'none';
  host.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, w / hgt, 0.1, 100);
  camera.position.set(0, 3.2, 9.5);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = 0.6;
  controls.maxPolarAngle = Math.PI * 0.58;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xe6edf7, NAVY, 0.7));
  const key = new THREE.PointLight(0xffffff, 30, 60, 2);
  key.position.set(4, 6, 6);
  scene.add(key);

  // Time axis: x from -6 to 6 by timestamp order (evenly spaced, with the real
  // gaps hinted by the label), a gentle S in z so the path reads in 3D.
  const n = events.length;
  const pts: THREE.Vector3[] = [];
  const meshes: THREE.Mesh[] = [];
  const byMesh = new Map<THREE.Object3D, PEvent>();
  events.forEach((e, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = -7.5 + t * 15;
    const z = Math.sin(t * Math.PI * 2) * 1.2;
    const y = e.chain ? 0.9 : 0;
    const p = new THREE.Vector3(x, y, z);
    pts.push(p);
    const color = e.chain ? PHOSPHOR : ORANGE;
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: e.tamper ? 0.9 : 0.45, roughness: 0.45 });
    const m = new THREE.Mesh(geometryFor(e.shape), mat);
    m.position.copy(p);
    if (e.shape === 'triangle') m.rotation.y = Math.PI / 4;
    scene.add(m);
    meshes.push(m);
    byMesh.set(m, e);
    // drop line to the floor
    const drop = new THREE.Line(new THREE.BufferGeometry().setFromPoints([p, new THREE.Vector3(x, -1.2, z)]), new THREE.LineBasicMaterial({ color: 0x1b2e4d }));
    scene.add(drop);
    const div = document.createElement('div');
    div.className = 'tl-label' + (e.chain ? ' chain' : '');
    div.innerHTML = `<b>${e.seq}</b><span>${e.title.replace(/·.*$/, '').trim()}</span>`;
    // Alternate labels above / below the path so neighbours never collide.
    const lab = new CSS2DObject(div);
    lab.position.set(0, i % 2 === 0 ? 0.42 : -0.5, 0);
    m.add(lab);
  });
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.025, 8, false), new THREE.MeshStandardMaterial({ color: PHOSPHOR, emissive: PHOSPHOR, emissiveIntensity: 0.35, transparent: true, opacity: 0.85 }));
  scene.add(tube);
  const floor = new THREE.GridHelper(16, 16, 0x1b2e4d, 0x14243f);
  floor.position.y = -1.2;
  scene.add(floor);

  // Selection by raycast.
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let selected: THREE.Mesh | null = null;
  const pick = (ev: PointerEvent) => {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(meshes, false)[0];
    if (selected) selected.scale.setScalar(1);
    if (hit) {
      selected = hit.object as THREE.Mesh;
      selected.scale.setScalar(1.6);
      controls.autoRotate = false;
      onSelect(byMesh.get(selected) ?? null);
    } else {
      selected = null;
      onSelect(null);
    }
  };
  renderer.domElement.addEventListener('pointerdown', pick);

  const resize = () => {
    const W = host.clientWidth || 900;
    const H = host.clientHeight || 520;
    renderer.setSize(W, H);
    labels.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);

  let raf = 0;
  const t0 = performance.now();
  const loop = () => {
    const t = (performance.now() - t0) / 1000;
    meshes.forEach((m, i) => {
      const e = events[i];
      if (e.tamper) (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.7 + Math.sin(t * 3) * 0.4;
      if (!reduce && m !== selected) m.rotation.y += 0.004;
    });
    controls.update();
    renderer.render(scene, camera);
    labels.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  loop();

  /** Focus an event from outside (the list, the map). */
  (host as HTMLElement & { focusEvent?: (seq: string) => void }).focusEvent = (seq: string) => {
    const i = events.findIndex((e) => e.seq === seq);
    if (i < 0) return;
    if (selected) selected.scale.setScalar(1);
    selected = meshes[i];
    selected.scale.setScalar(1.6);
    controls.autoRotate = false;
    controls.target.copy(selected.position);
  };

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    renderer.domElement.removeEventListener('pointerdown', pick);
    controls.dispose();
    renderer.dispose();
    host.innerHTML = '';
  };
}

// ---------------------------------------------------------------- travel map

export interface City { lat: number; lon: number }

const SHAPE_PATH: Record<Shape, (x: number, y: number, r: number) => string> = {
  circle: (x, y, r) => `M${x - r},${y} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`,
  square: (x, y, r) => `M${x - r},${y - r} h${2 * r} v${2 * r} h${-2 * r} z`,
  diamond: (x, y, r) => `M${x},${y - r * 1.2} L${x + r * 1.2},${y} L${x},${y + r * 1.2} L${x - r * 1.2},${y} z`,
  triangle: (x, y, r) => `M${x},${y - r * 1.15} L${x + r * 1.1},${y + r * 0.9} L${x - r * 1.1},${y + r * 0.9} z`,
  hexagon: (x, y, r) => Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 6; return `${i ? 'L' : 'M'}${x + r * 1.1 * Math.cos(a)},${y + r * 1.1 * Math.sin(a)}`; }).join(' ') + ' z',
  ring: (x, y, r) => `M${x - r},${y} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0 M${x - r * 0.5},${y} a${r * 0.5},${r * 0.5} 0 1,1 ${r},0 a${r * 0.5},${r * 0.5} 0 1,1 ${-r},0`
};

export function renderMap(svg: SVGSVGElement, events: PEvent[], cities: Record<string, City>, onSelect: (e: PEvent | null) => void): void {
  const W = 960, H = 560, PAD = 90;
  const used = [...new Set(events.map((e) => e.city).concat(events.map((e) => e.from ?? '').filter(Boolean)))].filter((c) => cities[c]);
  const lats = used.map((c) => cities[c].lat), lons = used.map((c) => cities[c].lon);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const midLat = (minLat + maxLat) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const spanX = (maxLon - minLon) * kx || 1, spanY = maxLat - minLat || 1;
  const scale = Math.min((W - 2 * PAD) / spanX, (H - 2 * PAD) / spanY);
  const ox = (W - spanX * scale) / 2, oy = (H - spanY * scale) / 2;
  // Project once, then nudge cities that land on top of each other (Las Vegas
  // and Henderson are 15 km apart) so both stay legible.
  const pos = new Map<string, { x: number; y: number }>();
  for (const c of used) pos.set(c, { x: ox + (cities[c].lon - minLon) * kx * scale, y: oy + (maxLat - cities[c].lat) * scale });
  const placed: { x: number; y: number }[] = [];
  for (const c of used) {
    const p = pos.get(c)!;
    for (const q of placed) if (Math.hypot(p.x - q.x, p.y - q.y) < 44) { p.x += 46; p.y += 40; }
    placed.push(p);
  }
  const P = (c: string) => pos.get(c)!;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag: string, attrs: Record<string, string | number>, parent: Element = svg) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    parent.appendChild(e);
    return e;
  };
  svg.innerHTML = '';
  const defs = el('defs', {});
  const marker = el('marker', { id: 'arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
  el('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#FF8C1A' }, marker);
  // grid
  for (let i = 0; i <= 12; i++) el('line', { x1: (W / 12) * i, y1: 0, x2: (W / 12) * i, y2: H, stroke: '#14243F', 'stroke-width': 1 });
  for (let i = 0; i <= 7; i++) el('line', { x1: 0, y1: (H / 7) * i, x2: W, y2: (H / 7) * i, stroke: '#14243F', 'stroke-width': 1 });

  // arcs between consecutive events in different cities (and explicit from→city transfers)
  let prevCity: string | null = null;
  events.forEach((e) => {
    if (!cities[e.city]) return; // taps and other city-less events never draw arcs
    const from = e.from ?? prevCity;
    if (from && from !== e.city && cities[from]) {
      const a = P(from), b = P(e.city);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const cx = mx - (dy / len) * len * 0.18, cy = my + (dx / len) * len * 0.18;
      const path = el('path', { d: `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`, fill: 'none', stroke: e.chain ? '#33FF66' : '#FF8C1A', 'stroke-width': 2, 'stroke-dasharray': e.kind === 'custody.ship' ? '6 5' : '0', opacity: 0.85, 'marker-end': 'url(#arrow)', class: 'arc' });
      path.addEventListener('click', () => onSelect(e));
      // label on the curve itself (quadratic Bézier at t = 0.5), not at the control point
      const lx = 0.25 * a.x + 0.5 * cx + 0.25 * b.x, ly = 0.25 * a.y + 0.5 * cy + 0.25 * b.y;
      const lab = el('text', { x: lx, y: ly - 7, fill: '#9FB0C8', 'font-size': 11, 'font-family': 'JetBrains Mono, monospace', 'text-anchor': 'middle' });
      lab.textContent = `${e.seq} ${e.kind.replace('custody.', '')}`;
    }
    prevCity = e.city;
  });

  // city points: one per city, sized by event count, hat shapes stacked beside
  const counts = new Map<string, PEvent[]>();
  for (const e of events) counts.set(e.city, [...(counts.get(e.city) ?? []), e]);
  for (const [city, evs] of counts) {
    if (!cities[city]) continue;
    const { x, y } = P(city);
    const r = 6 + Math.min(evs.length, 8) * 2;
    const hasChain = evs.some((v) => v.chain);
    const dot = el('circle', { cx: x, cy: y, r, fill: hasChain ? '#33FF66' : '#FF8C1A', 'fill-opacity': 0.18, stroke: hasChain ? '#33FF66' : '#FF8C1A', 'stroke-width': 2, class: 'city' });
    dot.addEventListener('click', () => onSelect(evs[0]));
    const hats = [...new Set(evs.map((v) => v.shape))];
    hats.forEach((s, i) => el('path', { d: SHAPE_PATH[s](x + r + 12 + i * 18, y, 6), fill: '#FF8C1A', stroke: 'none' }));
    const t = el('text', { x, y: y + r + 16, fill: '#E6EDF7', 'font-size': 13, 'font-family': 'Space Grotesk, Arial, sans-serif', 'text-anchor': 'middle' });
    t.textContent = city;
    const c = el('text', { x, y: y + r + 31, fill: '#5A6C87', 'font-size': 11, 'font-family': 'JetBrains Mono, monospace', 'text-anchor': 'middle' });
    c.textContent = `${evs.length} event${evs.length === 1 ? '' : 's'}`;
  }
}

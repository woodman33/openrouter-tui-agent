// Slate 3D — a tldraw mission board as a scene. Frames are slabs, capsules are
// capsules, harness nodes are lane pods lit from the event bus. The viewer
// spawns nothing; it reads the board and the bus and draws.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { layoutBoard, layoutSheets, sheetsSpan, SLAB, SHEET } from './board.js';
import { connectBus, laneOf, classOf } from './bus.js';

const T = {
  navy: 0x0a1628, raised: 0x12233d, slab: 0x0f1e36, line: 0x1c3358, grid: 0x11223c,
  phosphor: 0x33ff66, orange: 0xff8c1a, red: 0xff3b3b, text: 0xe6edf3, muted: 0x6b7a90,
};
const CLASS_COLOR = { chain: T.phosphor, human: T.orange, refusal: T.red, other: T.phosphor, slate: T.phosphor };
const DECAY_MS = 20 * 60 * 1000;
const FLOOR_GLOW = 0.12;

const q = new URLSearchParams(location.search);
const BOARD = q.get('board') ?? 'ledger';
const STILL = q.get('still') === '1';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || STILL;

// ---------- renderer, scene, camera ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(T.navy);
scene.fog = new THREE.Fog(T.navy, 60, 160);

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 400);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = !reduced;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 8;
controls.maxDistance = 220;

const labels = new CSS2DRenderer({ element: document.getElementById('labels') });
labels.setSize(innerWidth, innerHeight);

const hemi = new THREE.HemisphereLight(0x2a4a7a, 0x05080f, 0.9);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xfff2e0, 1.6);
key.position.set(-30, 50, 35);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0004;
scene.add(key);
scene.add(new THREE.AmbientLight(0x0a1628, 1.2));

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.45, 1.05);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- materials ----------
const matSlab = new THREE.MeshStandardMaterial({ color: T.slab, roughness: 0.92, metalness: 0.0 });
const matFloor = new THREE.MeshStandardMaterial({ color: T.navy, roughness: 1.0, metalness: 0.0 });
const matCard = new THREE.MeshStandardMaterial({ color: T.raised, roughness: 0.8, metalness: 0.0 });
const matTrace = new THREE.LineBasicMaterial({ color: T.phosphor, transparent: true, opacity: 0.35 });
const matEdgeQuiet = new THREE.LineBasicMaterial({ color: T.line });
const mkEdge = (color) => new THREE.LineBasicMaterial({ color });

const label = (html, cls) => {
  const el = document.createElement('div');
  el.className = `lbl ${cls}`;
  el.innerHTML = html;
  return new CSS2DObject(el);
};

// ---------- state ----------
const podsByLane = new Map(); // lane id → [pod]
const allPods = [];
const boardPulse = { until: 0 };
const ticker = document.getElementById('ticker');
const busEl = document.getElementById('bus');
const busText = document.getElementById('bus-text');
let lanes = new Set();

function addPod(x, y, z, laneId, text, cls) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.62, 1.0, 6),
    new THREE.MeshStandardMaterial({ color: T.raised, roughness: 0.7, metalness: 0.1, emissive: T.phosphor, emissiveIntensity: FLOOR_GLOW })
  );
  core.position.y = 0.5;
  core.castShadow = true;
  g.add(core);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.045, 10, 48),
    new THREE.MeshStandardMaterial({ color: T.line, roughness: 0.6, emissive: T.phosphor, emissiveIntensity: 0.0 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.03;
  g.add(ring);
  const lbl = label(text, cls);
  lbl.position.set(0, 1.45, 0);
  g.add(lbl);
  scene.add(g);
  const pod = { lane: laneId, group: g, core, ring, lbl, lastTs: 0, cls: 'quiet', kind: '' };
  allPods.push(pod);
  if (!podsByLane.has(laneId)) podsByLane.set(laneId, []);
  podsByLane.get(laneId).push(pod);
  return pod;
}

function hit(pod, ev, cls) {
  const ts = Date.parse(ev.ts) || Date.now();
  if (ts < pod.lastTs) return;
  pod.lastTs = ts;
  pod.cls = cls;
  pod.kind = ev.kind === 'receipt.sealed' ? `${ev.kind} · ${ev.payload?.subject ?? ''}` : ev.kind;
  const color = cls === 'failed' ? T.line : (CLASS_COLOR[cls] ?? T.phosphor);
  pod.core.material.emissive.setHex(color);
  pod.ring.material.emissive.setHex(color);
}

function fmtAge(ms) {
  if (ms < 60e3) return `${Math.max(1, Math.round(ms / 1e3))}s ago`;
  if (ms < 3600e3) return `${Math.round(ms / 60e3)}m ago`;
  if (ms < 86400e3) return `${Math.round(ms / 3600e3)}h ago`;
  return `${Math.round(ms / 86400e3)}d ago`;
}

function tickPods(now) {
  for (const p of allPods) {
    if (!p.lastTs) continue;
    const age = now - p.lastTs;
    const lit = p.cls === 'failed' ? 0 : Math.exp(-age / DECAY_MS);
    p.core.material.emissiveIntensity = FLOOR_GLOW + lit * 2.6;
    p.ring.material.emissiveIntensity = lit * 1.8;
    const el = p.lbl.element;
    el.classList.toggle('lit', p.cls === 'chain' || p.cls === 'other');
    el.classList.toggle('human', p.cls === 'human');
    el.classList.toggle('refusal', p.cls === 'refusal');
    if (!el.dataset.base) el.dataset.base = el.innerHTML;
    el.innerHTML = `${el.dataset.base}<span class="age">${p.cls === 'failed' ? 'failed · ' : ''}${fmtAge(age)}</span>`;
  }
}

function pushTicker(ev, cls, lane) {
  const li = document.createElement('li');
  li.className = cls;
  const t = new Date(ev.ts || Date.now());
  const hh = t.toTimeString().slice(0, 8);
  const what = ev.kind === 'receipt.sealed' ? `${ev.kind} · ${ev.payload?.subject ?? ''}` : ev.kind;
  li.innerHTML = `<time>${hh}</time><span>${what}${lane ? ` · ${lane}` : ''}</span>`;
  ticker.appendChild(li);
  while (ticker.children.length > 7) ticker.removeChild(ticker.firstChild);
}

// ---------- build the scene from the board ----------
async function build() {
  const [board, laneList, receiptsRes] = await Promise.all([
    fetch(`./boards/${BOARD}.mission.json`).then((r) => r.json()),
    fetch('./lanes.json').then((r) => r.json()).catch(() => []),
    fetch('./receipts?limit=2000').then((r) => r.json()).catch(() => ({ receipts: [] })),
  ]);
  // blueprint boards the mission cites render as sheets beside the slabs
  const blueprints = (await Promise.all((board.blueprints ?? []).map((n) => fetch(`./boards/${n}.blueprint.json`).then((r) => r.json()).catch(() => null)))).filter(Boolean);

  // Capsule state from the receipt lifecycle, never from a typed status:
  // a frame lists the orders that deliver it; each order.execute receipt in
  // the root store carries the order id in its sources. All sealed = done,
  // one sealed as blocked = blocked, some sealed = active, none = next. A
  // frame may name an attestation receipt (the fork attestation) that stands
  // for orders whose receipts live in the frozen fork store.
  const receipts = receiptsRes.receipts ?? [];
  const byId = new Map(receipts.map((r) => [r.id, r]));
  const orderReceipt = (ordId) => receipts.find((r) => r.subject === 'order.execute' && Array.isArray(r.sources) && r.sources.some((s) => s && s.id === ordId));
  const statusOf = (f) => {
    if (!Array.isArray(f.orders) || !f.orders.length) return { status: f.status ?? 'next', sealed: 0, total: 0, why: f.status ? 'declared' : 'no orders listed' };
    const found = f.orders.map(orderReceipt);
    const sealed = found.filter(Boolean).length;
    const total = f.orders.length;
    if (found.some((r) => r && r.sources.some((s) => s && s.state === 'blocked'))) return { status: 'blocked', sealed, total, why: 'an order was sealed as blocked' };
    if (sealed === total) return { status: 'done', sealed, total, why: 'every order sealed' };
    if (f.attested && byId.has(f.attested)) return { status: 'done', sealed, total, attested: f.attested, why: `attested by ${f.attested}` };
    if (sealed > 0) return { status: 'active', sealed, total, why: 'some orders sealed' };
    return { status: 'next', sealed, total, why: 'no order sealed yet' };
  };
  for (const f of board.frames) { const st = statusOf(f); f.status = st.status; f.state = st; }

  // Capsule-level evidence: root receipts by subject (optionally matching a
  // sources field) and edge chains from the worker's public daily head. A
  // capsule is done when every rule holds, blocked when a blocked_by subject
  // exists while evidence is incomplete, active when some rules hold.
  const WORKER = q.get('worker') ?? 'https://timmy-ai-proxy-preview.wmeldman33.workers.dev';
  const head = await fetch(`${WORKER.replace(/\/$/, '')}/head`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
  const edge = new Map((head?.heads ?? []).map((h) => [h.subject, h]));
  const rootCount = (subject, sources) => receipts.filter((r) => r.subject === subject && (!sources || (Array.isArray(r.sources) && r.sources.some((s) => s && Object.entries(sources).every(([k, v]) => s[k] === v))))).length;
  const ruleHolds = (rule) => {
    if (rule.root) return rootCount(rule.root, rule.sources) >= (rule.min ?? 1);
    if (rule.edge) return (edge.get(rule.edge)?.count ?? 0) >= (rule.min ?? 1);
    return false;
  };
  const capsuleState = (n) => {
    const rules = (n.evidence ?? []).filter((r) => !r.blocked_by);
    const blockers = (n.evidence ?? []).filter((r) => r.blocked_by);
    if (!rules.length) return { status: 'next', held: 0, total: 0 };
    const held = rules.filter(ruleHolds).length;
    if (held === rules.length) return { status: 'done', held, total: rules.length };
    if (blockers.some((b) => rootCount(b.blocked_by) > 0)) return { status: 'blocked', held, total: rules.length };
    if (held > 0) return { status: 'active', held, total: rules.length };
    return { status: 'next', held, total: rules.length };
  };
  for (const n of board.nodes) if (n.kind === 'capsule') n.state = capsuleState(n);

  document.getElementById('board-name').textContent = `${board.name} · kind ${board.kind} · ${board.frames.length} frames · ${board.nodes.length} nodes · ${blueprints.length} blueprint${blueprints.length === 1 ? '' : 's'} · state from ${receipts.length} receipts`;
  document.title = `Slate 3D · ${board.name}`;
  lanes = new Set(laneList.map((l) => l.id));
  const L = layoutBoard(board, laneList);
  const sheets = layoutSheets(blueprints, L.totalW);
  const spanW = Math.max(L.totalW, sheetsSpan(sheets));

  // floor + grid
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), matFloor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(L.center.x, -0.01, L.center.z);
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new THREE.GridHelper(600, 75, T.grid, T.grid);
  grid.position.set(L.center.x, 0, L.center.z);
  scene.add(grid);

  // slabs
  const STATUS_COLOR = { done: T.phosphor, active: T.orange, blocked: T.line, next: T.line };
  const slabEdges = [];
  for (const f of L.frames) {
    const slab = new THREE.Mesh(new RoundedBoxGeometry(SLAB.w, SLAB.h, SLAB.d, 2, 0.12), matSlab);
    slab.position.set(f.cx, SLAB.h / 2, f.cz);
    slab.receiveShadow = true;
    slab.castShadow = true;
    scene.add(slab);
    const edgeColor = STATUS_COLOR[f.status] ?? T.line;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(SLAB.w, SLAB.h, SLAB.d)), f.status ? mkEdge(edgeColor) : matEdgeQuiet);
    edges.position.copy(slab.position);
    scene.add(edges);
    slabEdges.push({ edges, base: edgeColor });
    const st = f.state ?? { total: 0 };
    const orders = st.total ? `<span class="orders ${f.status}">${st.sealed}/${st.total} orders sealed${st.attested ? ' · attested' : ''}${f.status === 'blocked' ? ' · blocked' : ''}</span> · ` : '';
    const l = label(`${f.title}<small>${orders}${f.status ?? ''}${f.paths ? ` · ${f.paths.join(' ')}` : ''}</small>`, 'frame');
    l.element.title = st.why ?? '';
    l.position.set(f.cx, 0.1, f.cz + SLAB.d / 2 + 1.3);
    scene.add(l);
  }

  // nodes
  for (const n of L.nodes) {
    if (n.kind === 'capsule') {
      // the capsule's own state comes from its evidence rules, not the frame
      const cs = n.state ?? { status: 'next', held: 0, total: 0 };
      const done = cs.status === 'done';
      const active = cs.status === 'active';
      const m = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.42, 1.5, 6, 14),
        new THREE.MeshStandardMaterial({ color: done ? 0x163a2a : active ? 0x3a2a14 : T.raised, roughness: 0.55, metalness: 0.05, emissive: done ? T.phosphor : active ? T.orange : 0x000000, emissiveIntensity: done ? 0.55 : active ? 0.35 : 0 })
      );
      m.rotation.z = Math.PI / 2;
      m.position.set(n.x, n.y + 0.5, n.z);
      m.castShadow = true;
      scene.add(m);
      const ev = cs.total ? ` · <span class="orders ${cs.status}">evidence ${cs.held}/${cs.total}${cs.status === 'blocked' ? ' · blocked' : ''}</span>` : '';
      const l = label(`<b>${n.id}</b>${ev}<br>${(n.objective ?? '').slice(0, 42)}${(n.objective ?? '').length > 42 ? '…' : ''}`, 'node');
      l.element.title = `${n.objective ?? ''}\n${(n.evidence ?? []).map((r) => `${r.root ?? r.edge ?? r.blocked_by}: ${r.why ?? ''}`).join('\n')}`;
      l.position.set(n.x, n.y + 1.35, n.z);
      scene.add(l);
    } else if (n.kind === 'harness') {
      addPod(n.x, n.y, n.z, n.harness, `<b>${n.harness}</b>`, 'lane');
    } else if (n.kind === 'gate') {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.08, 12, 40),
        new THREE.MeshStandardMaterial({ color: 0x3a2a14, roughness: 0.5, emissive: T.orange, emissiveIntensity: 0.5 })
      );
      ring.position.set(n.x, n.y + 0.75, n.z);
      ring.castShadow = true;
      scene.add(ring);
      const l = label(`gate · ${n.approval ?? 'manual'}`, 'node');
      l.position.set(n.x, n.y + 1.6, n.z);
      scene.add(l);
    } else if (n.kind === 'artifact') {
      const card = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.08, 1.1, 2, 0.04), matCard);
      card.position.set(n.x, n.y + 0.42, n.z);
      card.rotation.z = -0.35;
      card.castShadow = true;
      scene.add(card);
      const l = label(`artifact · ${n.path ?? ''}`, 'node');
      l.position.set(n.x, n.y + 1.1, n.z);
      scene.add(l);
    } else {
      const chip = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.12, 0.6, 2, 0.05), matCard);
      chip.position.set(n.x, n.y + 0.1, n.z);
      scene.add(chip);
      const l = label(`${n.kind} · ${n.id}`, 'node');
      l.position.set(n.x, n.y + 0.6, n.z);
      scene.add(l);
    }
  }

  // traces on the slab + dependency arcs between capsules
  const tracePts = [];
  for (const e of L.edges) {
    if (e.kind === 'depends') {
      const a = new THREE.Vector3(e.a.x, e.a.y + 0.6, e.a.z);
      const b = new THREE.Vector3(e.b.x, e.b.y + 0.6, e.b.z);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.y += Math.min(9, a.distanceTo(b) * 0.35);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 40, 0.045, 8, false),
        new THREE.MeshStandardMaterial({ color: 0x163a2a, roughness: 0.6, emissive: T.phosphor, emissiveIntensity: 0.45 })
      );
      scene.add(tube);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 10), new THREE.MeshStandardMaterial({ color: T.phosphor, emissive: T.phosphor, emissiveIntensity: 0.8 }));
      tip.position.copy(b);
      const dir = curve.getTangent(1).normalize();
      tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      scene.add(tip);
    } else {
      tracePts.push(new THREE.Vector3(e.a.x, e.a.y + 0.02, e.a.z), new THREE.Vector3(e.b.x, e.b.y + 0.02, e.b.z));
    }
  }
  if (tracePts.length) scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tracePts), matTrace));

  // the lane rail: every known lane, so any bus event has a pod to light
  for (const l of L.rail) addPod(l.x, l.y, l.z, l.id, `<b>${l.id}</b>`, 'lane');
  const railLabel = label('lane rail · every LANE_RUNNERS id and fleet entry', 'node');
  railLabel.position.set(L.center.x, 0.2, L.rail[0]?.z - 2.4);
  scene.add(railLabel);

  // blueprint sheets: flat reference cards standing beside the slabs
  for (const s of sheets) {
    const card = new THREE.Mesh(new RoundedBoxGeometry(SHEET.w, SHEET.h, 0.08, 2, 0.06), new THREE.MeshStandardMaterial({ color: T.raised, roughness: 0.85, metalness: 0 }));
    card.position.set(s.x, s.y + 0.4, s.z);
    card.rotation.y = -0.3;
    card.castShadow = true;
    scene.add(card);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(SHEET.w, SHEET.h, 0.08)), mkEdge(T.phosphor));
    edges.position.copy(card.position);
    edges.rotation.copy(card.rotation);
    scene.add(edges);
    // the front row carries full sheets; rows behind show a compact head so
    // their screen labels do not bury the row in front
    const compact = s.row > 0;
    const rows = (s.rows ?? []).slice(0, compact ? 2 : 8).map((r) => `<dt>${r.label}</dt><dd>${/^#[0-9a-f]{6}$/i.test(String(r.value)) ? `<i style="background:${r.value}"></i>` : ''}${r.value}${!compact && r.note ? ` <span>· ${r.note}</span>` : ''}</dd>`).join('') + (compact && (s.rows ?? []).length > 2 ? `<dt></dt><dd><span>+${(s.rows ?? []).length - 2} more</span></dd>` : '');
    const l = label(`<h4>${s.title}<small>blueprint · ${s.board}${s.source ? ` · ${s.source}` : ''}</small></h4><dl>${rows}</dl>`, 'sheet');
    l.position.set(s.x, s.y + 0.4, s.z + 0.3);
    scene.add(l);
  }

  // frame the whole floor, sheets included
  const target = new THREE.Vector3(spanW / 2, 0.2, L.center.z + 0.5);
  const fit = (spanW / 2) / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect) * 1.08;
  const dir = new THREE.Vector3(0.3, 0.46, 0.84).normalize();
  camera.position.copy(target).add(dir.multiplyScalar(Math.max(fit, 30)));
  controls.target.copy(target);
  controls.update();

  // the bus
  const source = q.get('room') ? 'room' : q.get('sse') ? 'sse' : 'ws';
  document.getElementById('bus-source').textContent = source === 'ws' ? 'source · companion websocket' : source === 'sse' ? `source · ${q.get('sse')}` : `source · room ${q.get('room')}`;
  connectBus({ source, sse: q.get('sse'), room: q.get('room'), worker: q.get('worker') }, (ev, meta) => {
    const cls = classOf(ev);
    const lane = laneOf(ev, lanes);
    if (lane) for (const p of podsByLane.get(lane) ?? []) hit(p, ev, cls);
    if (cls === 'slate') boardPulse.until = Date.now() + 4000;
    if (!meta.tail || lane || cls === 'slate' || cls === 'human' || cls === 'refusal') pushTicker(ev, cls, lane);
  }, (s) => {
    busEl.classList.toggle('live', s.live);
    busText.textContent = s.text;
  });

  // idle drift only when motion is welcome
  let t0 = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (!reduced) {
      const t = (now - t0) / 1000;
      controls.autoRotate = false;
      camera.position.y += Math.sin(t * 0.25) * 0.002;
    }
    controls.update();
    tickPods(Date.now());
    const pulse = boardPulse.until > Date.now() ? 0.5 + 0.5 * Math.sin(now / 120) : 0;
    for (const s of slabEdges) s.edges.material.color.setHex(pulse > 0 ? T.phosphor : s.base);
    composer.render();
    labels.render(scene, camera);
  };
  requestAnimationFrame(loop);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  labels.setSize(innerWidth, innerHeight);
});

build().catch((e) => {
  document.getElementById('board-name').textContent = `board failed to load: ${e}`;
});

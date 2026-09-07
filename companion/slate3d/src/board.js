// Board → scene layout. Pure: takes the mission board JSON and the lane list,
// returns positions. Nothing here touches Three.js so it stays testable.
export const SLAB = { w: 10, d: 7, h: 0.4, gap: 2.4 };
export const RAIL = { z: -9.5, pitch: 2.9 };

// node slots relative to the slab centre (x right, z toward the camera)
const SLOT = {
  capsule: { x: -3.2, z: 0.0 },
  harness: { x: -0.4, z: -1.9 },
  gate: { x: -0.4, z: 1.9 },
  artifact: { x: 2.9, z: 0.0 },
  result: { x: 2.9, z: 2.2 },
};

// blueprint sheets stand to the right of the last slab
export const SHEET = { w: 6.4, h: 4.6, gap: 5.6, z: -1.0 };
export const SHEETS_PER_ROW = 4;

// one row per blueprint board, rows stepping back in z, so several boards
// stay readable and the camera span grows only with the widest row
export function layoutSheets(blueprints, totalW) {
  const sheets = [];
  // rows step back and half a card sideways so their screen labels interleave
  // instead of stacking on top of each other
  const x0 = totalW + SLAB.gap + SHEET.w / 2;
  let row = 0;
  // at most SHEETS_PER_ROW sheets per board on the floor (the latest first for
  // evidence boards); the rest stay in the board file and are counted
  for (const bp of blueprints) {
    let x = x0 + row * ((SHEET.w + SHEET.gap) / 2);
    const all = bp.sheets ?? [];
    const shown = bp.kind === 'observer' ? all.slice(-SHEETS_PER_ROW).reverse() : all.slice(0, SHEETS_PER_ROW);
    shown.forEach((s, i) => {
      const more = i === shown.length - 1 && all.length > shown.length ? all.length - shown.length : 0;
      sheets.push({ ...s, board: bp.name, kind: bp.kind, source: bp.source, row, x, y: SHEET.h / 2, z: SHEET.z - row * (SHEET.h + 6.5), more });
      x += SHEET.w + SHEET.gap;
    });
    row++;
  }
  return sheets;
}

export function sheetsSpan(sheets) {
  return sheets.length ? Math.max(...sheets.map((s) => s.x + SHEET.w / 2)) : 0;
}

export function layoutBoard(board, lanes) {
  const frames = board.frames.map((f, i) => ({
    ...f,
    index: i,
    cx: i * (SLAB.w + SLAB.gap) + SLAB.w / 2,
    cz: 0,
  }));
  const frameById = new Map(frames.map((f) => [f.id, f]));
  const nodes = board.nodes.map((n) => {
    const f = frameById.get(n.frame);
    const slot = SLOT[n.kind] ?? SLOT.result;
    return { ...n, x: (f?.cx ?? 0) + slot.x, y: SLAB.h, z: (f?.cz ?? 0) + slot.z, frameIndex: f?.index ?? 0 };
  });
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const edges = board.edges
    .filter((e) => nodeById.has(e.from) && nodeById.has(e.to))
    .map((e) => ({ ...e, a: nodeById.get(e.from), b: nodeById.get(e.to) }));
  const totalW = frames.length * SLAB.w + (frames.length - 1) * SLAB.gap;
  // the lane rail: one pod per known lane, centred behind the slabs
  const railW = (lanes.length - 1) * RAIL.pitch;
  const rail = lanes.map((l, i) => ({ ...l, x: totalW / 2 - railW / 2 + i * RAIL.pitch, y: 0, z: RAIL.z }));
  return { frames, nodes, edges, rail, totalW, center: { x: totalW / 2, z: -1.5 } };
}

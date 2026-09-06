#!/usr/bin/env node
// Headless .riv inspection on @rive-app/canvas-advanced 2.42.0 (the core the site
// ships): artboards with size, state machines, view models, and a functional drive
// of one view-model number through 0/1/2 recording the states entered. Exit 1 when
// a --contract check fails. Used by refresh-badge.mjs; usable alone:
//   node lanes/rive/inspect-riv.mjs <file.riv> [--artboard Badge] [--sm State] [--prop state] [--contract badge]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const ARTBOARD = opt('--artboard', 'Badge');
const SM = opt('--sm', 'State');
const PROP = opt('--prop', 'state');
const CONTRACT = opt('--contract', '');
if (!file) { console.error('usage: inspect-riv.mjs <file.riv> [--artboard] [--sm] [--prop] [--contract badge]'); process.exit(2); }

export async function inspectRiv(rivPath, { artboard = 'Badge', sm = 'State', prop = 'state' } = {}) {
  if (!globalThis.document) {
    const stub = { getContext: () => null, width: 0, height: 0, addEventListener() {}, removeEventListener() {} };
    globalThis.document = { createElement: () => ({ ...stub }), getElementById: () => null, body: { appendChild() {} }, addEventListener() {}, querySelector: () => null };
    globalThis.window = globalThis;
  }
  const mod = await import('@rive-app/canvas-advanced');
  const wasmBinary = fs.readFileSync(path.join(here, 'node_modules', '@rive-app', 'canvas-advanced', 'rive.wasm'));
  const logs = [];
  const quiet = async (f) => { const w = console.warn, l = console.log, e = console.error; console.warn = console.log = console.error = (...a) => logs.push(a.join(' ')); try { return await f(); } finally { console.warn = w; console.log = l; console.error = e; } };
  const rive = await quiet(() => mod.default({ wasmBinary, printErr: (m) => logs.push(m), print: (m) => logs.push(m) }));
  const bytes = fs.readFileSync(rivPath);
  const rf = await quiet(() => rive.load(new Uint8Array(bytes)));
  if (!rf) return { file: path.basename(rivPath), bytes: bytes.length, loaded: false, logs };
  const vmShape = (vm) => vm ? { name: vm.name, properties: (() => { try { return vm.getProperties(); } catch { return []; } })(), instances: (() => { try { return vm.getInstanceNames(); } catch { return []; } })() } : null;
  const artboards = [];
  for (let i = 0; i < rf.artboardCount(); i++) {
    const ab = rf.artboardByIndex(i);
    const b = ab.bounds;
    const sms = []; for (let j = 0; j < ab.stateMachineCount(); j++) sms.push(ab.stateMachineByIndex(j).name);
    const anims = []; for (let j = 0; j < ab.animationCount(); j++) anims.push(ab.animationByIndex(j).name);
    let linked = null; try { linked = rf.defaultArtboardViewModel(ab)?.name ?? null; } catch { linked = null; }
    artboards.push({ name: ab.name, width: b ? b.maxX - b.minX : null, height: b ? b.maxY - b.minY : null, stateMachines: sms, animations: anims, linkedViewModel: linked });
  }
  const viewModels = []; for (let i = 0; i < rf.viewModelCount(); i++) { try { viewModels.push(vmShape(rf.viewModelByIndex(i))); } catch { /* skip */ } }
  let drive = null;
  try {
    const ab = rf.artboardByName(artboard);
    const smi = new rive.StateMachineInstance(ab.stateMachineByName(sm), ab);
    const vm = rf.defaultArtboardViewModel(ab);
    const vmi = vm.defaultInstance ? vm.defaultInstance() : vm.instance();
    ab.bindViewModelInstance(vmi);
    smi.bindViewModelInstance(vmi);
    const p = vmi.number(prop);
    const steps = [];
    for (const v of [0, 1, 2]) {
      p.value = v;
      const entered = [];
      for (let f = 0; f < 45; f++) { smi.advance(1 / 60); ab.advance(1 / 60); const n = smi.stateChangedCount(); for (let k = 0; k < n; k++) entered.push(smi.stateChangedNameByIndex(k)); }
      steps.push({ set: v, entered });
    }
    drive = { viewModel: vm.name, property: prop, steps };
  } catch (e) { drive = { error: String(e).slice(0, 200) }; }
  return { file: path.basename(rivPath), bytes: bytes.length, loaded: true, runtime: '2.42.0', artboards, viewModels, drive, logs: logs.slice(0, 10) };
}

export function checkBadgeContract(report) {
  const errors = [];
  const ab = report.artboards?.find((a) => a.name === 'Badge');
  if (!report.loaded) errors.push('file did not load on runtime 2.42.0');
  if (!ab) errors.push('artboard Badge missing');
  else {
    if (ab.width !== 240 || ab.height !== 72) errors.push(`Badge is ${ab.width}x${ab.height}, expected 240x72`);
    if (!ab.stateMachines.includes('State')) errors.push('state machine State missing');
    if (ab.linkedViewModel !== 'BadgeVM') errors.push(`linked view model is ${ab.linkedViewModel}, expected BadgeVM`);
  }
  const vm = report.viewModels?.find((v) => v.name === 'BadgeVM');
  if (!vm || !vm.properties.some((p) => p.name === 'state' && p.type === 'number')) errors.push('BadgeVM {state:number} missing');
  const want = ['T_Sealed', 'T_Opened', 'T_Verified'];
  const got = report.drive?.steps?.map((s) => s.entered[s.entered.length - 1]) ?? [];
  if (want.some((w, i) => got[i] !== w)) errors.push(`transitions entered ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = await inspectRiv(path.resolve(file), { artboard: ARTBOARD, sm: SM, prop: PROP });
  console.log(JSON.stringify(report, null, 1));
  if (CONTRACT === 'badge') {
    const errors = checkBadgeContract(report);
    if (errors.length) { console.error('CONTRACT FAILED:\n - ' + errors.join('\n - ')); process.exit(1); }
    console.error('contract badge: passed');
  }
}

#!/usr/bin/env node
// Observer evidence lane (ORDER OF BUILD item 4): an independent observer
// (Roboflow hosted inference) reads every lane screenshot and its findings are
// sealed in the ROOT chain. Two observers per image: DocTR OCR (what text is
// on screen) and CLIP compare (which description the image is closest to).
// Blocked states are sealed too, so "no evidence" is itself receipted.
//   node lanes/observer/observe.mjs [--dir vault-custody/renders] [--limit N] [--no-seal] [--host https://serverless.roboflow.com]
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..', '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
// comma-separated roots; the pitch renders live under renders/, the lane renders under vault-custody/renders/
const DIRS = opt('--dir', 'renders,vault-custody/renders').split(',').map((d) => resolve(ROOT, d.trim())).filter((d) => existsSync(d));
const DIR = DIRS[0] ?? ROOT;
const LIMIT = Number(opt('--limit', 0));
const HOST = opt('--host', 'https://serverless.roboflow.com');
const NO_SEAL = args.includes('--no-seal');

// key from the environment, else the ignored .env beside the repo; never printed
function loadKey() {
  if (process.env.ROBOFLOW_API_KEY) return process.env.ROBOFLOW_API_KEY;
  for (const p of [join(ROOT, '.env'), join(process.env.TIMMY_REPO ?? '', '.env')]) {
    if (!p || !existsSync(p)) continue;
    for (const raw of readFileSync(p, 'utf8').split('\n')) {
      const line = raw.replace(/^export\s+/, '').trim();
      if (line.startsWith('ROBOFLOW_API_KEY=')) return line.slice('ROBOFLOW_API_KEY='.length).replace(/^["']|["']$/g, '');
    }
  }
  return '';
}
const KEY = loadKey();
const sha = (b) => createHash('sha256').update(b).digest('hex');
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.name.startsWith('.') ? [] : e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
const seal = (subject, meta) => {
  if (NO_SEAL) return;
  const a = [subject];
  for (const [k, v] of Object.entries(meta)) a.push('--meta', `${k}=${String(v).replace(/\n/g, ' ').slice(0, 400)}`);
  const r = spawnSync('node', [join(ROOT, 'lanes', 'anchor', 'seal-root.mjs'), ...a], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`seal failed for ${subject}`);
};

// what each lane's screenshot is expected to be, for the CLIP comparison
const PROMPTS = {
  companion: ['a phone app screen showing a custody receipt with a serial number and status text', 'a 3D isometric board with glowing pods', 'a web page with a photo of a sealed box', 'a blank dark screen'],
  slate3d: ['a 3D isometric board with glowing pods and labels on a dark navy ground', 'a phone app screen with status text', 'a web page with a photo of a sealed box', 'a blank dark screen'],
  walkthrough: ['a web page with a 3D rendered sealed box and headline text', 'a table of inventory rows', 'a 3D timeline with markers and a map', 'a blank dark screen'],
  'walkthrough-deck': ['a web page with a 3D rendered sealed box and headline text', 'a QR code on a dark card', 'a 3D timeline with markers and a map', 'a blank dark screen'],
  default: ['a screenshot of a software user interface', 'a photograph of a physical object', 'a blank screen', 'a diagram'],
};

async function call(path, body) {
  const r = await fetch(`${HOST}${path}?api_key=${encodeURIComponent(KEY)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* keep text */ }
  return { status: r.status, json, text };
}

const images = DIRS.flatMap((d) => walk(d)).filter((p) => /\.png$/i.test(p)).sort();
const batch = LIMIT > 0 ? images.slice(0, LIMIT) : images;
console.log(`observer: ${batch.length} screenshot(s) under ${DIRS.map((d) => relative(ROOT, d)).join(', ')} · host ${HOST} · key ${KEY ? 'present' : 'MISSING'}`);
if (!KEY) {
  seal('observer.blocked', { reason: 'not_configured', detail: 'ROBOFLOW_API_KEY missing', screenshots: batch.length, dir: relative(ROOT, DIR) });
  process.exit(2);
}

let blocked = null;
const results = [];
for (const img of batch) {
  const bytes = readFileSync(img);
  const rel = relative(ROOT, img);
  const lane = basename(dirname(img));
  const image_sha256 = sha(bytes);
  const b64 = bytes.toString('base64');
  const ocr = await call('/doctr/ocr', { image: { type: 'base64', value: b64 } });
  if (ocr.status === 402 || ocr.status === 401 || ocr.status === 403) {
    blocked = { status: ocr.status, reason: ocr.json?.message?.match(/reason': '([a-z_]+)'/)?.[1] ?? ocr.json?.message?.slice(0, 120) ?? ocr.text.slice(0, 120) };
    break;
  }
  const prompts = PROMPTS[lane] ?? PROMPTS.default;
  const clip = await call('/clip/compare', { subject: { type: 'base64', value: b64 }, subject_type: 'image', prompt: prompts, prompt_type: 'text' });
  const text = String(ocr.json?.result ?? '').trim();
  const sims = Array.isArray(clip.json?.similarity) ? clip.json.similarity : [];
  const best = sims.length ? sims.reduce((m, v, i) => (v > sims[m] ? i : m), 0) : -1;
  const out = { image: rel, lane, image_sha256, observed_at: new Date().toISOString(), host: HOST,
    ocr: { status: ocr.status, chars: text.length, sha256: sha(text), text },
    clip: { status: clip.status, prompts, similarity: sims, best: best >= 0 ? prompts[best] : null, best_score: best >= 0 ? sims[best] : null } };
  writeFileSync(img.replace(/\.png$/i, '.observer.json'), JSON.stringify(out, null, 1));
  results.push(out);
  seal('observer.evidence', { image: rel, lane, image_sha256, observer: 'roboflow', host: HOST, ocr_status: ocr.status, ocr_chars: text.length, ocr_sha256: out.ocr.sha256,
    ocr_head: text.slice(0, 120) || '(none)', clip_status: clip.status, clip_best: out.clip.best ?? '(none)', clip_score: out.clip.best_score ?? '', evidence_json: rel.replace(/\.png$/i, '.observer.json') });
  console.log(`${rel}: ocr ${text.length} chars · clip ${out.clip.best ?? 'n/a'} ${out.clip.best_score ?? ''}`);
}

if (blocked) {
  const shas = batch.map((p) => `${relative(ROOT, p)}:${sha(readFileSync(p)).slice(0, 12)}`).join(',');
  console.log(`observer blocked: HTTP ${blocked.status} ${blocked.reason}`);
  seal('observer.blocked', { reason: blocked.reason, http: blocked.status, host: HOST, observer: 'roboflow', screenshots: batch.length, dir: relative(ROOT, DIR), images: shas.slice(0, 380), observed: results.length });
  process.exit(3);
}
console.log(JSON.stringify({ observed: results.length }, null, 0));

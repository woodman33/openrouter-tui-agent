import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { homedir } from 'os';
import { join, relative, sep } from 'path';

// Hugging Face connector — fleet companion to roboflow: roboflow annotates,
// HF hosts the dataset + trained weights. The token is read from env or the
// hf CLI cache; TIMMY never writes or stores it. Repos are created PRIVATE.

export interface HfStatus { token?: string; source?: string; note?: string }

const HF = 'https://huggingface.co';
const MAX_FILE = 50 * 1024 * 1024; // plain upload path; bigger → git-lfs via hf CLI

export function detectHf(): HfStatus {
  const env = process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN || process.env.HUGGING_FACE_TOKEN;
  if (env) return { token: env, source: 'env (HF_TOKEN)' };
  const cache = join(homedir(), '.cache', 'huggingface', 'token');
  if (existsSync(cache)) {
    const t = readFileSync(cache, 'utf8').trim();
    if (t) return { token: t, source: 'hf cache (~/.cache/huggingface/token)' };
  }
  return { note: 'no token — `hf auth login` or export HF_TOKEN (write scope for uploads)' };
}

export async function hfWhoami(token: string): Promise<string | null> {
  try {
    const res = await fetch(`${HF}/api/whoami-v2`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const j = await res.json() as { name?: string };
    return j.name ?? null;
  } catch {
    return null;
  }
}

async function ensureRepo(token: string, type: 'dataset' | 'model', name: string): Promise<boolean> {
  try {
    const res = await fetch(`${HF}/api/repos/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name, private: true })
    });
    return res.ok || res.status === 409; // 409 = already exists
  } catch {
    return false;
  }
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

async function uploadFile(token: string, type: 'dataset' | 'model', repo: string, localPath: string, pathInRepo: string): Promise<boolean> {
  try {
    const body = readFileSync(localPath);
    const res = await fetch(`${HF}/api/${type}s/${repo}/upload/main/${pathInRepo}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
      body
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function hfPushTraining(project: string, dir: string = process.cwd()): Promise<{ ok: boolean; repo?: string; uploaded?: number; note?: string }> {
  const st = detectHf();
  if (!st.token) return { ok: false, note: st.note };
  const user = await hfWhoami(st.token);
  if (!user) return { ok: false, note: 'token rejected by huggingface.co — check scopes (write)' };
  const trainingDir = join(dir, 'studio', project, 'training');
  if (!existsSync(trainingDir)) return { ok: false, note: `no studio/${project}/training — export first ([e] in PROJECTS)` };
  const files = walk(trainingDir).filter(f => statSync(f).size <= MAX_FILE);
  if (files.length === 0) return { ok: false, note: 'training dir empty (or files >50MB — use git-lfs via hf CLI)' };
  const name = `timmy-${project}`;
  if (!(await ensureRepo(st.token, 'dataset', name))) return { ok: false, note: 'repo create failed — check token scopes' };
  let uploaded = 0;
  for (const f of files) {
    const p = relative(trainingDir, f).split(sep).join('/');
    if (await uploadFile(st.token, 'dataset', `${user}/${name}`, f, p)) uploaded++;
  }
  return { ok: uploaded > 0, repo: `${HF}/datasets/${user}/${name}`, uploaded };
}

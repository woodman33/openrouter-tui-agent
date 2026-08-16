import { existsSync, mkdirSync, readFileSync, writeFileSync, realpathSync, statSync } from 'fs';
import { execFileSync } from 'child_process';
import { join, dirname } from 'path';
import crypto from 'crypto';
import { homedir } from 'os';

// env_lock (specs/edl-v1.md §2): pin the environment for replay. Tool locks are
// BUILD HASHES — sha256 of the resolved executable — never version strings.
// Cached in .timmy/cache/envlock.json keyed by path|size|mtime.

export interface ToolLock { path: string; sha256: string; size: number; mtime: number }
export interface EnvLock {
  os: { platform: string; build: string; version?: string };
  arch: string;
  tools: Record<string, ToolLock>;
  models: Record<string, string>;
}

const cachePath = (dir: string): string => join(dir, '.timmy', 'cache', 'envlock.json');

const resolveBin = (bin: string): string | null => {
  try {
    return realpathSync(execFileSync('sh', ['-c', `command -v ${bin}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim());
  } catch {
    return null;
  }
};

export function captureEnvLock(bins: string[] = ['ffmpeg', 'ffprobe'], dir: string = process.cwd()): EnvLock {
  let cache: Record<string, ToolLock> = {};
  const cp = cachePath(dir);
  try { if (existsSync(cp)) cache = JSON.parse(readFileSync(cp, 'utf8')) as Record<string, ToolLock>; } catch { /* fresh */ }

  const tools: Record<string, ToolLock> = {};
  for (const bin of bins) {
    const path = resolveBin(bin);
    if (!path) continue;
    const st = statSync(path);
    const key = `${path}|${st.size}|${st.mtimeMs}`;
    const hit = cache[bin];
    if (hit && `${hit.path}|${hit.size}|${hit.mtime}` === key) { tools[bin] = hit; continue; }
    tools[bin] = {
      path,
      sha256: crypto.createHash('sha256').update(readFileSync(path)).digest('hex'),
      size: st.size,
      mtime: st.mtimeMs
    };
  }
  try {
    mkdirSync(dirname(cp), { recursive: true });
    writeFileSync(cp, JSON.stringify({ ...cache, ...tools }, null, 2));
  } catch { /* cache is best-effort */ }

  let build = '';
  let version: string | undefined;
  try {
    build = execFileSync('sw_vers', ['-buildVersion'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    version = execFileSync('sw_vers', ['-productVersion'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    try { build = execFileSync('uname', ['-r'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* unknown */ }
  }
  return {
    os: { platform: process.platform, build, ...(version ? { version } : {}) },
    arch: process.arch,
    tools,
    models: {}
  };
}

// T0 gap fix: absolute home paths in sources become ~-relative.
export const relHome = (p: string): string =>
  p.startsWith(homedir()) ? '~' + p.slice(homedir().length) : p;

import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { execSync, execFileSync } from 'child_process';

// TIMMY Framecap — review-grade capture for the critique loop.
// At 60fps, capturing every 30th frame = 2 review frames per second:
// enough to judge motion beats, cheap enough to feed an LLM.

export const FRAME_EVERY = 30;
export const ASSUMED_FPS = 60;

export function ffmpegAvailable(): boolean {
  try {
    execSync('command -v ffmpeg', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Pure + deterministic so tests can pin the filter graph.
export function framecapArgs(video: string, outDir: string, every: number = FRAME_EVERY): string[] {
  return [
    '-y', '-i', video,
    '-vf', `select=not(mod(n\\,${every}))`,
    '-vsync', 'vfr',
    join(outDir, 'frame_%04d.png')
  ];
}

export interface FramecapResult {
  ok: boolean;
  frames: number;
  outDir: string;
  reason?: string;
}

export function captureFrames(video: string, outDir: string, every: number = FRAME_EVERY): FramecapResult {
  if (!existsSync(video)) return { ok: false, frames: 0, outDir, reason: `video not found: ${video}` };
  if (!ffmpegAvailable()) return { ok: false, frames: 0, outDir, reason: 'ffmpeg not installed (brew install ffmpeg)' };
  mkdirSync(outDir, { recursive: true });
  try {
    execFileSync('ffmpeg', framecapArgs(video, outDir, every), { stdio: 'ignore' });
  } catch {
    return { ok: false, frames: 0, outDir, reason: 'ffmpeg failed on this file' };
  }
  const frames = readdirSync(outDir).filter(f => f.endsWith('.png')).length;
  return { ok: frames > 0, frames, outDir, reason: frames > 0 ? undefined : 'no frames extracted' };
}

export function defaultFramesDir(video: string, cwd: string = process.cwd()): string {
  const name = basename(video).replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '_').toLowerCase() || 'video';
  return join(cwd, 'studio', 'frames', name);
}

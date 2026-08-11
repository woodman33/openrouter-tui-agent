import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { listProviders, findProvider, providerOverview } from '../src/utils/providers.js';
import {
  recordGeneration,
  listGenerations,
  loadGenerations,
  deriveStatusFromLog,
  extractArtifactFromLog,
  generationsPath,
  generationsOverview
} from '../src/utils/generations.js';
import { framecapArgs, captureFrames, FRAME_EVERY } from '../src/utils/framecap.js';
import { buildGenAgentArgs } from '../src/utils/genbridge.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'timmy-gen-'));
});

describe('provider fleet registry', () => {
  it('resolves curated aliases from the proven generation-agent table', () => {
    expect(findProvider('nano banana 2')?.id).toBe('nano-banana-2');
    expect(findProvider('seedance')?.id).toBe('seedance-2-0');
    expect(findProvider('happy horse 1.1')?.id).toBe('happyhorse-1-1');
    expect(findProvider('venice')?.id).toBe('venice-uncensored');
    expect(findProvider('wan 2.7')?.id).toBe('wan-2-7');
    expect(findProvider('gpt image 2')?.id).toBe('gpt-image-2');
    expect(findProvider('nope-nope-nope')).toBeUndefined();
  });

  it('covers the full requested fleet', () => {
    const ids = listProviders().map(p => p.id);
    for (const want of [
      'seedance-2-5', 'kling-3-0', 'wan-2-7', 'happyhorse-1-1', 'ernie-image-turbo',
      'comfyui', 'comfydeploy', 'runcomfy', 'krea', 'wavespeed', 'venice-uncensored',
      'modelslab', 'replicate', 'fal', 'huggingface', 'gemini-api',
      'grok-imagine-image', 'nano-banana-pro', 'gpt-image-2', 'reve-2-1', 'decart'
    ]) {
      expect(ids).toContain(want);
    }
  });

  it('filters by kind and summarizes transports', () => {
    expect(listProviders('video').map(p => p.id)).toContain('kling-3-0');
    expect(listProviders('image').map(p => p.id)).toContain('ernie-image-turbo');
    expect(providerOverview()).toContain('fleet:');
    expect(providerOverview('video')).toContain('openrouter:');
  });
});

describe('generation ledger', () => {
  it('records, filters and sha256-stamps entries', () => {
    const a = recordGeneration({ prompt: 'foil card on velvet', provider: 'nano-banana-2', kind: 'image', transport: 'openrouter', status: 'queued' }, dir);
    const b = recordGeneration({ prompt: 'turntable reveal', provider: 'seedance-2-0', kind: 'video', transport: 'openrouter', status: 'running' }, dir);
    expect(a.id).not.toBe(b.id);
    expect(a.stamp).toMatch(/^sha256_[0-9a-f]{64}$/);
    expect(a.prompt_hash).toMatch(/^sha256_/);
    expect(listGenerations({ provider: 'seedance' }, dir)).toHaveLength(1);
    expect(listGenerations({}, dir)[0].id).toBe(b.id); // newest first
    expect(generationsOverview(dir)).toContain('generations:2');
  });

  it('tolerates a corrupt ledger file', () => {
    mkdirSync(join(dir, '.timmy'), { recursive: true });
    writeFileSync(generationsPath(dir), 'not json at all', 'utf8');
    expect(loadGenerations(dir)).toEqual([]);
  });

  it('derives live status and artifacts from detached run logs', () => {
    expect(deriveStatusFromLog('downloading…\nEXIT=0\n', 'running')).toBe('done');
    expect(deriveStatusFromLog('npm error\nEXIT=1', 'running')).toBe('failed');
    expect(deriveStatusFromLog('partial output, still going', 'queued')).toBe('running');
    expect(extractArtifactFromLog('Saved media to out/vid_123.mp4 done')).toBe('out/vid_123.mp4');
    expect(extractArtifactFromLog('no artifact here')).toBeUndefined();
  });
});

describe('framecap', () => {
  it('builds a deterministic every-30th-frame filter (2 captures/s @60fps)', () => {
    const args = framecapArgs('v.mp4', '/tmp/f');
    expect(args).toContain(`select=not(mod(n\\,${FRAME_EVERY}))`);
    expect(args).toContain('vfr');
    expect(args[args.length - 1]).toContain('frame_%04d.png');
  });

  it('fails gracefully on a missing video', () => {
    const res = captureFrames(join(dir, 'nope.mp4'), join(dir, 'frames'));
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('video not found');
  });
});

describe('gen-agent bridge', () => {
  it('maps providers onto the generation agent npm scripts', () => {
    const img = findProvider('nano banana pro')!;
    expect(buildGenAgentArgs(img, 'p')).toEqual(['run', 'image', '--', 'p', 'nano banana pro']);

    const vid = findProvider('seedance 2.0')!;
    expect(buildGenAgentArgs(vid, 'p')?.[1]).toBe('video');

    const ven = findProvider('venice')!;
    expect(buildGenAgentArgs(ven, 'p')).toEqual(['run', 'venice-image', '--', 'p', 'lustify-v8']);

    const wsv = findProvider('venice video')!;
    expect(buildGenAgentArgs(wsv, 'p')).toEqual(['run', 'venice-video', '--', 'p', 'wan-2-7-text-to-video', '5s', '720p', '16:9']);

    const ws = findProvider('wavespeed')!;
    expect(buildGenAgentArgs(ws, 'p')?.slice(0, 4)).toEqual(['run', 'wavespeed', '--', 'wavespeed-ai/flux-dev-lora-ultra-fast']);

    // local/cloud-api lanes have no runner in the gen agent yet → queued
    expect(buildGenAgentArgs(findProvider('comfyui')!, 'p')).toBeNull();
    expect(buildGenAgentArgs(findProvider('runcomfy')!, 'p')).toBeNull();
  });
});

import React from 'react';
import { Text } from 'ink';
import { theme } from '../theme.js';

// btop-style activity sparkline. Pure bucketing + block-char rendering,
// unit-tested separately from the component.

export function sparkBuckets(timestamps: string[], nowMs: number, width = 24, bucketMs = 60_000): number[] {
  const buckets: number[] = new Array(width).fill(0);
  for (const ts of timestamps) {
    const t = Date.parse(ts);
    if (!isFinite(t)) continue;
    const age = nowMs - t;
    if (age < 0 || age >= width * bucketMs) continue;
    const idx = width - 1 - Math.floor(age / bucketMs);
    if (idx >= 0 && idx < width) buckets[idx] += 1;
  }
  return buckets;
}

const LEVELS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

export function sparkString(buckets: number[]): string {
  const max = Math.max(1, ...buckets);
  return buckets
    .map(n => LEVELS[Math.min(LEVELS.length - 1, Math.round((n / max) * (LEVELS.length - 1)))])
    .join('');
}

export function Sparkline({ timestamps, nowMs, width, color }: { timestamps: string[]; nowMs: number; width?: number; color?: string }) {
  return <Text color={color || theme.accent}>{sparkString(sparkBuckets(timestamps, nowMs, width))}</Text>;
}

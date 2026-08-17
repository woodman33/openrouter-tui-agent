import { describe, it, expect } from 'vitest';
import { isLocalIp } from '../src/utils/logserver.js';

describe('companion back-event authorization', () => {
  it('accepts loopback callers only', () => {
    expect(isLocalIp('127.0.0.1')).toBe(true);
    expect(isLocalIp('::1')).toBe(true);
    expect(isLocalIp('::ffff:127.0.0.1')).toBe(true);
  });
  it('rejects everything else (no tmux/shell over the network)', () => {
    expect(isLocalIp('10.0.0.4')).toBe(false);
    expect(isLocalIp('192.168.1.20')).toBe(false);
    expect(isLocalIp('::ffff:10.0.0.4')).toBe(false);
    expect(isLocalIp('')).toBe(false);
  });
});

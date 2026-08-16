import { describe, it, expect } from 'vitest';
import { policyCheck, EFFECT_CATALOG, TIER_RANK } from '../src/utils/effects.js';

describe('typed-effect PDP', () => {
  it('catalog covers the 15 homelab effects with tiers', () => {
    expect(EFFECT_CATALOG).toHaveLength(15);
    expect(EFFECT_CATALOG.find(e => e.name === 'Purchase<Resource>')?.tier).toBe('T3');
    expect(EFFECT_CATALOG.find(e => e.name === 'Read<File>')?.tier).toBe('T0');
  });

  it('allows within clearance', () => {
    expect(policyCheck('Generate<Media>', 'T1').decision).toBe('allow');
    expect(policyCheck('Generate<Media>', 'T2').decision).toBe('allow');
    expect(policyCheck('Read<File>', 'T0').decision).toBe('allow');
  });

  it('denies above clearance with denial-as-observation', () => {
    const d = policyCheck('Execute<Cmd>', 'T1');
    expect(d.decision).toBe('deny');
    expect(d.reason).toContain('denial-as-observation');
    expect(d.reason).toContain('replan');
    const p = policyCheck('Purchase<Resource>', 'T2');
    expect(p.decision).toBe('deny');
  });

  it('default-denies unknown effects', () => {
    const d = policyCheck('Explode<Moon>', 'T3');
    expect(d.decision).toBe('deny');
    expect(d.reason).toContain('default-deny');
  });

  it('tier ranking is total', () => {
    expect(TIER_RANK.T0 < TIER_RANK.T1 && TIER_RANK.T1 < TIER_RANK.T2 && TIER_RANK.T2 < TIER_RANK.T3).toBe(true);
  });
});

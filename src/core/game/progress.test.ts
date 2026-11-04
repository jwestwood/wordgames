import { describe, expect, it } from 'vitest';
import { loadSeedState, progressFor, saveSeedState, seedKey } from './progress';

describe('progressFor', () => {
  it('awards stars at thresholds and perfect at 100%', () => {
    expect(progressFor(0, 50)).toMatchObject({ stars: 0, percent: 0, perfect: false });
    expect(progressFor(29, 50).stars).toBe(0);
    expect(progressFor(30, 50).stars).toBe(1);
    expect(progressFor(40, 50).stars).toBe(2);
    expect(progressFor(45, 50)).toMatchObject({ stars: 3, percent: 90, perfect: false });
    expect(progressFor(49, 50).percent).toBe(98);
    expect(progressFor(50, 50)).toMatchObject({ stars: 3, percent: 100, perfect: true });
    expect(progressFor(3, 5).stars).toBe(1); // exact 0.6 despite float error
    expect(progressFor(0, 0)).toMatchObject({ stars: 0, perfect: false });
    expect(progressFor(1, 2, [0.5]).maxStars).toBe(1);
  });
});

describe('seed state', () => {
  it('stores per game+seed', () => {
    const m = new Map<string, string>();
    const s = {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
    };
    saveSeedState('g', 'AAA', ['x'], s);
    expect(loadSeedState('g', 'AAA', [], s)).toEqual(['x']);
    expect(loadSeedState('g', 'BBB', [], s)).toEqual([]);
    expect(seedKey('g', 'AAA')).toBe('g:seed:AAA');
  });
});

import { describe, expect, it } from 'vitest';
import {
  createRng,
  cyrb128,
  dailySeed,
  gameHash,
  generateSeed,
  getSeedFromHash,
  int,
  normaliseSeed,
  parseHashQuery,
  pick,
  sample,
  shareLink,
  shuffle,
  weighted,
} from './index';

const take = (seed: string, n = 5) => {
  const r = createRng(seed);
  return Array.from({ length: n }, r);
};

describe('prng', () => {
  it('is deterministic per seed', () => {
    expect(take('abc')).toEqual(take('abc'));
    expect(take('abc')).not.toEqual(take('abd'));
    expect(createRng('x', 'g1')()).not.toBe(createRng('x', 'g2')());
  });
  it('known values are stable across versions (golden)', () => {
    expect(cyrb128('hello')).toEqual(cyrb128('hello'));
    const golden = take('K7Q2MX', 3).map((x) => x.toFixed(10));
    expect(golden).toMatchInlineSnapshot(`
      [
        "0.6920546165",
        "0.3825844806",
        "0.2454218792",
      ]
    `);
  });
  it('outputs in [0,1) and roughly uniform', () => {
    const r = createRng('u');
    let sum = 0;
    for (let i = 0; i < 10000; i++) {
      const x = r();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      sum += x;
    }
    expect(sum / 10000).toBeGreaterThan(0.48);
    expect(sum / 10000).toBeLessThan(0.52);
  });
  it('helpers are deterministic and correct', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f'];
    const run = () => {
      const r = createRng('s');
      return [
        int(r, 1, 6),
        pick(r, items),
        shuffle(r, items),
        sample(r, items, 3),
        weighted(r, items, [0, 0, 1, 0, 0, 0]),
      ];
    };
    expect(run()).toEqual(run());
    const [i, , sh, sa, w] = run() as [number, string, string[], string[], string];
    expect(i).toBeGreaterThanOrEqual(1);
    expect(i).toBeLessThanOrEqual(6);
    expect([...sh].sort()).toEqual(items);
    expect(new Set(sa).size).toBe(3);
    expect(w).toBe('c');
    expect(() => pick(createRng('x'), [])).toThrow();
    expect(() => sample(createRng('x'), items, 7)).toThrow();
  });
});

describe('seeds & urls', () => {
  it('generates readable seeds', () => {
    const s = generateSeed();
    expect(s).toMatch(/^[0-9A-HJKMNP-TV-Z]{6}$/);
    expect(normaliseSeed(' k7qo2l ')).toBe('K7Q021');
    expect(dailySeed(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('round-trips seeds via hash', () => {
    const h = gameHash('anagram', 'K7Q2MX');
    expect(h).toBe('#/games/anagram?seed=K7Q2MX');
    expect(parseHashQuery(h).path).toEqual(['games', 'anagram']);
    expect(getSeedFromHash(h)).toBe('K7Q2MX');
    expect(getSeedFromHash('#/games/anagram')).toBeNull();
    expect(shareLink('anagram', 'K7Q2MX', 'https://x.test/?a=1#/old')).toBe(
      'https://x.test/?a=1#/games/anagram?seed=K7Q2MX',
    );
  });
});

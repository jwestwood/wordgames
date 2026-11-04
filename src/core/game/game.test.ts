import { describe, expect, it } from 'vitest';
import { lengthScore, letterScore, loadJSON, saveJSON, timeBonus } from './index';
import { parseHash } from '../router';

describe('scoring', () => {
  it('letterScore uses scrabble values', () => expect(letterScore('Quiz')).toBe(22));
  it('lengthScore', () => {
    expect(lengthScore('ab')).toBe(0);
    expect(lengthScore('cat')).toBe(1);
    expect(lengthScore('example')).toBe(10);
  });
  it('timeBonus', () => {
    expect(timeBonus(10, 0, 1000)).toBe(10);
    expect(timeBonus(10, 1000, 1000)).toBe(20);
  });
});

describe('storage', () => {
  it('round-trips JSON with a fake storage', () => {
    const m = new Map<string, string>();
    const s = {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
    };
    expect(loadJSON('x', 1, s)).toBe(1);
    saveJSON('x', { a: 2 }, s);
    expect(loadJSON('x', null, s)).toEqual({ a: 2 });
    expect(m.has('wordgames:x')).toBe(true);
  });
});

describe('router', () => {
  it('parses hashes', () => {
    expect(parseHash('#/games/foo')).toEqual(['games', 'foo']);
    expect(parseHash('')).toEqual([]);
  });
});

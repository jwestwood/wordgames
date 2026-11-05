import { describe, expect, it } from 'vitest';
import {
  completedLetters,
  newlyCompletedLetters,
  noStarterLetters,
  starterLetters,
  wordsByStart,
} from './letters';

const pool = ['abide', 'aide', 'bait', 'date', 'diet', 'gain', 'tide', 'ting'];
// wheel debating → a,b,d,e,g,i,n,t — e, i, n start nothing in this toy pool
const wheel = 'debating';

describe('letter completion', () => {
  it('groups by start and finds starter vs no-starter letters', () => {
    expect([...wordsByStart(pool).get('a')!]).toEqual(['abide', 'aide']);
    expect(starterLetters(wheel, pool)).toEqual(new Set(['a', 'b', 'd', 'g', 't']));
    expect(noStarterLetters(wheel, pool)).toEqual(['e', 'i', 'n']);
  });

  it('completes starter letters when all their words are found; no-starters only at 100%', () => {
    const found = new Set(['abide', 'aide']);
    expect(completedLetters(wheel, pool, found)).toEqual(new Set(['a']));
    const almost = new Set(pool.slice(0, -1));
    expect(completedLetters(wheel, pool, almost).has('e')).toBe(false);
    expect(completedLetters(wheel, pool, almost).has('i')).toBe(false);
    expect(completedLetters(wheel, pool, almost).has('n')).toBe(false);
    const all = new Set(pool);
    expect(completedLetters(wheel, pool, all)).toEqual(new Set([...'abdegint']));
  });

  it('lists newly completed letters in alphabetical order', () => {
    const before = new Set(['a']);
    const after = new Set(['a', 'b', 'e']);
    expect(newlyCompletedLetters(wheel, pool, before, after)).toEqual(['b', 'e']);
  });
});

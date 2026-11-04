import { beforeAll, describe, expect, it } from 'vitest';
import { canSpellFrom, findAnagrams, loadWords } from '@core/words';
import {
  buildDictionaries,
  checkGuess,
  generatePuzzle,
  MIN_WORD,
  POOL_SIZE,
  type Dictionaries,
} from './puzzle';

let dict: Dictionaries;
let common: readonly string[];
beforeAll(async () => {
  common = await loadWords('common');
  dict = buildDictionaries(common, await loadWords('extended'));
});

describe('letter wheel puzzle', () => {
  it('is deterministic per seed and differs across seeds', () => {
    const a = generatePuzzle('K7Q2MX', dict);
    expect(generatePuzzle('K7Q2MX', dict)).toEqual(a);
    const others = ['AAAAAA', 'ZZZZZZ', '123456'].map((s) => generatePuzzle(s, dict).target);
    expect(new Set([a.target, ...others]).size).toBeGreaterThan(1);
  });

  it('golden seed (changes if word lists or algorithm change)', () => {
    const p = generatePuzzle('K7Q2MX', dict);
    expect({ target: p.target, required: p.required, size: p.pool.length }).toMatchInlineSnapshot(`
      {
        "required": "a",
        "size": 44,
        "target": "diagnostic",
      }
    `);
  });

  it.each(['K7Q2MX', 'S1', 'S2', 'HELLO1', '2026-11-04'])(
    'seed %s satisfies all criteria',
    (seed) => {
      const p = generatePuzzle(seed, dict);
      expect(p.passed).toBe(true);
      expect(p.target.length).toBeGreaterThanOrEqual(8);
      expect(p.target.length).toBeLessThanOrEqual(10);
      expect(common).toContain(p.target);
      expect(p.target).toContain(p.required);
      expect(findAnagrams(p.target, dict.all)).toEqual([]);
      expect(p.pool.length).toBeGreaterThanOrEqual(POOL_SIZE.min);
      expect(p.pool.length).toBeLessThanOrEqual(POOL_SIZE.max);
      expect([...p.outer, p.required].sort()).toEqual([...p.target].sort());
      // pool correctness against brute force
      const brute = common.filter(
        (w) => w.length >= MIN_WORD && w.includes(p.required) && canSpellFrom(w, p.target),
      );
      expect(p.pool).toEqual(brute);
      expect(p.pool).toEqual([...p.pool].sort());
      expect(p.pool).toContain(p.target);
    },
  );

  it('checkGuess reasons', () => {
    const p = generatePuzzle('K7Q2MX', dict);
    const w = p.pool[0];
    const noReq = 'xxxxx';
    expect(checkGuess('ab', p, [])).toEqual({ ok: false, reason: 'too-short' });
    expect(checkGuess(noReq, p, [])).toEqual({ ok: false, reason: 'missing-required' });
    expect(checkGuess(w.toUpperCase(), p, [])).toEqual({ ok: true, word: w });
    expect(checkGuess(w, p, [w])).toEqual({ ok: false, reason: 'already-found' });
    expect(checkGuess(p.required.repeat(5), p, []).ok).toBe(false);
  });
});

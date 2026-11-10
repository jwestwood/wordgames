import { describe, expect, it } from 'vitest';
import { canSpellFrom, findAnagrams } from '@core/words';
import { versionId } from '@core/versions';
import { ALL_VERSIONS, rulesFor, wordsFor } from './versions.node';
import { letterShortfall } from '../../versioned/letter-wheel/rules/beta';

describe.each(ALL_VERSIONS.map((v) => [versionId(v), v] as const))('rules %s', (_, version) => {
  const rules = rulesFor(version);
  const words = wordsFor(version);
  const dict = rules.prepare(words);

  it('is deterministic per seed and differs across seeds', () => {
    const a = rules.generate('K7Q2MX', dict);
    expect(rules.generate('K7Q2MX', dict)).toEqual(a);
    const others = ['AAAAAA', 'ZZZZZZ', '123456'].map((s) => rules.generate(s, dict).target);
    expect(new Set([a.target, ...others]).size).toBeGreaterThan(1);
  });

  it.each(['K7Q2MX', 'S1', 'S2', 'HELLO1', '2026-11-04'])('seed %s is well formed', (seed) => {
    const p = rules.generate(seed, dict);
    expect(p.passed).toBe(true);
    expect(words.common).toContain(p.target);
    expect(p.target).toContain(p.required);
    expect(findAnagrams(p.target, dict.all)).toEqual([]);
    expect([...p.outer, p.required].sort()).toEqual([...p.target].sort());
    const brute = words.common.filter(
      (w) => w.length >= rules.MIN_WORD && w.includes(p.required) && canSpellFrom(w, p.target),
    );
    expect(p.pool).toEqual(brute);
    expect(p.pool).toContain(p.target);
  });

  it('checkGuess reasons and stars', () => {
    const p = rules.generate('K7Q2MX', dict);
    const w = p.pool[0];
    expect(rules.checkGuess('ab', p, [])).toEqual({ ok: false, reason: 'too-short' });
    expect(rules.checkGuess('xxxxx', p, [])).toEqual({ ok: false, reason: 'missing-required' });
    expect(rules.checkGuess(w.toUpperCase(), p, [])).toEqual({ ok: true, word: w });
    expect(rules.checkGuess(w, p, [w])).toEqual({ ok: false, reason: 'already-found' });
    expect(rules.stars(0, 10)).toBe(0);
    expect(rules.stars(10, 10)).toBe(rules.STAR_THRESHOLDS.length);
  });
});

describe.each(ALL_VERSIONS.filter((v) => v === 'beta' || v >= 2))('rules %s word coverage', (v) => {
  it('everyday words like pant, veal, antler and leaper are answers', () => {
    const rules = rulesFor(v);
    const dict = rules.prepare(wordsFor(v));
    for (const w of ['pant', 'veal', 'antler', 'leaper']) expect(dict.common.words).toContain(w);
  });

  it.skipIf(v !== 2)(
    'v2 keeps the v1 wheel for GSP0MH (prevalent / a) and accepts the new words',
    () => {
      const rules = rulesFor(v);
      const p = rules.generate('GSP0MH', rules.prepare(wordsFor(v)));
      expect([p.target, p.required]).toEqual(['prevalent', 'a']);
      expect(p.pool).toEqual(expect.arrayContaining(['pant', 'veal', 'antler', 'leaper']));
    },
  );

  it.skipIf(v !== 3)('v3 GSP0MH is debating / i (20–40 pool + letter coverage)', () => {
    const rules = rulesFor(v);
    const p = rules.generate('GSP0MH', rules.prepare(wordsFor(v)));
    expect([p.target, p.required]).toEqual(['debating', 'i']);
    expect(p.pool.length).toBeGreaterThanOrEqual(20);
    expect(p.pool.length).toBeLessThanOrEqual(40);
  });
});

describe('beta rules', () => {
  it('answer pools are 20-40 words', () => {
    const rules = rulesFor('beta');
    const dict = rules.prepare(wordsFor('beta'));
    for (let i = 0; i < 40; i++) {
      const p = rules.generate(`B${i}`, dict);
      expect(p.passed).toBe(true);
      expect(p.pool.length).toBeGreaterThanOrEqual(20);
      expect(p.pool.length).toBeLessThanOrEqual(40);
      for (const l of new Set(p.target))
        expect(
          p.pool.filter((w) => w.includes(l)).length,
          `${p.target}: ${l}`,
        ).toBeGreaterThanOrEqual(3);
    }
  });

  it('letterShortfall counts missing usages per distinct letter', () => {
    expect(letterShortfall('exam', ['exam', 'maxe', 'amex', 'mame'])).toBe(0);
    expect(letterShortfall('exam', ['exam', 'mame', 'meam'])).toBe(2); // x appears once
    expect(letterShortfall('aab', ['aab', 'aa', 'ba'])).toBe(1); // b in 2 words
  });
});

describe('beta bonus words', () => {
  it('accepts bonus words without counting them as official answers', () => {
    const rules = rulesFor('beta');
    const dict = rules.prepare(wordsFor('beta'));
    const p = rules.generate('GSP0MH', dict);
    expect(p.passed).toBe(true);
    expect(p.bonusPool!.length).toBeGreaterThan(0);
    const w = p.bonusPool![0];
    expect(p.pool).not.toContain(w);
    expect(rules.checkGuess(w, p, [])).toEqual({ ok: true, word: w, bonus: true });
    expect(rules.checkGuess(w, p, [], [w])).toEqual({ ok: false, reason: 'already-found-bonus' });
    const official = p.pool[0];
    expect(rules.checkGuess(official, p, [])).toEqual({ ok: true, word: official });
  });

  it('keeps official pools in 20-40 and letter coverage, with a bonus pool', () => {
    const rules = rulesFor('beta');
    const dict = rules.prepare(wordsFor('beta'));
    for (const seed of ['GSP0MH', 'K7Q2MX', '000000', 'A1B2C3']) {
      const p = rules.generate(seed, dict);
      expect(p.passed).toBe(true);
      expect(p.pool.length).toBeGreaterThanOrEqual(20);
      expect(p.pool.length).toBeLessThanOrEqual(40);
      expect(p.bonusPool).toBeDefined();
      expect(p.bonusPool!.every((w) => !p.pool.includes(w))).toBe(true);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { canSpellFrom, findAnagrams } from '@core/words';
import { versionId } from '@core/versions';
import { ALL_VERSIONS, rulesFor, wordsFor } from './versions.node';

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
});

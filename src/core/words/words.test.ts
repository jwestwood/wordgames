import { createRng } from '@core/random';
import { describe, expect, it } from 'vitest';
import { isAnagram, shuffleLetters } from './index';

describe('isAnagram', () => {
  it('detects anagrams ignoring case and spaces', () => {
    expect(isAnagram('Listen', 'Silent')).toBe(true);
    expect(isAnagram('Dormitory', 'dirty room')).toBe(true);
  });
  it('rejects non-anagrams and empty input', () => {
    expect(isAnagram('apple', 'pale')).toBe(false);
    expect(isAnagram('', '')).toBe(false);
  });
});

describe('shuffleLetters', () => {
  it('keeps the same letters', () => {
    const word = 'scramble';
    const out = shuffleLetters(word, createRng('t'));
    expect(out).toHaveLength(word.length);
    expect([...out].sort()).toEqual([...word].sort());
  });
  it('is deterministic with an injected rng', () => {
    expect(shuffleLetters('abcd', () => 0)).toBe(shuffleLetters('abcd', () => 0));
  });
});

import {
  canSpell,
  isValidWord,
  letterCounts,
  normalise,
  parseWordList,
  pickRandom,
  scramble,
} from './index';

describe('normalise / letterCounts / canSpell', () => {
  it('normalises', () => expect(normalise("Don't Stop!")).toBe('dontstop'));
  it('counts letters', () => expect(letterCounts('Hello')).toEqual({ h: 1, e: 1, l: 2, o: 1 }));
  it('canSpell respects counts', () => {
    expect(canSpell('tea', 'eatery')).toBe(true);
    expect(canSpell('tee', 'eat')).toBe(false);
    expect(canSpell('', 'abc')).toBe(false);
  });
});

describe('scramble', () => {
  it('differs from input when possible', () => {
    expect(scramble('abc', () => 0.999)).not.toBe('abc');
    expect(scramble('aaa', () => 0)).toBe('aaa');
  });
});

describe('word lists', () => {
  it('parses, normalises, dedupes and filters by length', () => {
    const set = parseWordList('Cat\ncat\n dog \nab\nelephant', { minLength: 3, maxLength: 5 });
    expect([...set].sort()).toEqual(['cat', 'dog']);
    expect(isValidWord('CAT', set)).toBe(true);
    expect(isValidWord('cow', set)).toBe(false);
  });
  it('pickRandom', () => {
    expect(pickRandom(['a', 'b', 'c'], () => 0.5)).toBe('b');
    expect(() => pickRandom([], () => 0)).toThrow();
  });
});

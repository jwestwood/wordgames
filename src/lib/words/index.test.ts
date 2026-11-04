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
    const out = shuffleLetters(word);
    expect(out).toHaveLength(word.length);
    expect([...out].sort()).toEqual([...word].sort());
  });
  it('is deterministic with an injected rng', () => {
    expect(shuffleLetters('abcd', () => 0)).toBe(shuffleLetters('abcd', () => 0));
  });
});

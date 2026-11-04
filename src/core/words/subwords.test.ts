import { describe, expect, it } from 'vitest';
import {
  bagContains,
  canSpellFrom,
  createWordIndex,
  findAnagrams,
  findSubwords,
  letterBag,
  letterSignature,
} from './subwords';

const dict = createWordIndex([
  'ant',
  'tan',
  'tana',
  'banana',
  'nab',
  'ban',
  'bananas',
  'an',
  'cat',
]);

describe('multiset spelling', () => {
  it('respects letter counts', () => {
    expect(canSpellFrom('banana', 'banana')).toBe(true);
    expect(canSpellFrom('bananas', 'banana')).toBe(false);
    expect(canSpellFrom('nana', 'ban')).toBe(false);
    expect(canSpellFrom('', 'abc')).toBe(false);
    expect(bagContains(letterBag('aab'), letterBag('ab'))).toBe(true);
    expect(bagContains(letterBag('ab'), letterBag('aab'))).toBe(false);
  });
  it('signature', () => expect(letterSignature('Tan')).toBe('ant'));
});

describe('findAnagrams', () => {
  it('finds other words with identical letters', () => {
    expect(findAnagrams('ant', dict)).toEqual(['tan']);
    expect(findAnagrams('banana', dict)).toEqual([]);
    expect(findAnagrams('zzz', dict)).toEqual([]);
  });
});

describe('findSubwords', () => {
  it('filters by multiset, length and required letter, keeping order', () => {
    expect(findSubwords('banana', dict)).toEqual(['banana', 'nab', 'ban', 'an']);
    expect(findSubwords('banana', dict, { minLength: 3, required: 'b' })).toEqual([
      'banana',
      'nab',
      'ban',
    ]);
    expect(findSubwords('tana', dict, { required: 'z' })).toEqual([]);
    expect(findSubwords('tana', dict, { minLength: 3 })).toEqual(['ant', 'tan', 'tana']);
  });
});

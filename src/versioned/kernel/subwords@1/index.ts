/**
 * FROZEN kernel subwords@1. Never edit; behaviour change => subwords@2.
 */
/**
 * Multiset letter utilities: which words can be spelled from a set of letters (each letter used at
 * most as many times as it appears), anagram lookup and filtered word pools.
 */

/** 26-slot letter count vector for a-z (other characters ignored). */
export type LetterBag = Uint8Array;

export function letterBag(word: string): LetterBag {
  const bag = new Uint8Array(26);
  for (let i = 0; i < word.length; i++) {
    const c = word.charCodeAt(i) | 32;
    if (c >= 97 && c <= 122) bag[c - 97]++;
  }
  return bag;
}

/** True if every letter in `need` is available in `have` (multiset containment). */
export function bagContains(have: LetterBag, need: LetterBag): boolean {
  for (let i = 0; i < 26; i++) if (need[i] > have[i]) return false;
  return true;
}

/** Multiset canSpell: `word` uses each letter of `letters` at most as often as it appears there. */
export function canSpellFrom(word: string, letters: string): boolean {
  return word.length > 0 && bagContains(letterBag(letters), letterBag(word));
}

/** Sorted-letter signature: anagrams share a signature. */
export function letterSignature(word: string): string {
  return [...word.toLowerCase()].sort().join('');
}

/** A dictionary with precomputed letter bags + anagram signatures, for fast repeated queries. */
export interface WordIndex {
  readonly words: readonly string[];
  readonly bags: readonly LetterBag[];
  readonly bySignature: ReadonlyMap<string, readonly string[]>;
}

export function createWordIndex(words: readonly string[]): WordIndex {
  const bags = words.map(letterBag);
  const bySignature = new Map<string, string[]>();
  for (const w of words) {
    const s = letterSignature(w);
    const list = bySignature.get(s);
    if (list) list.push(w);
    else bySignature.set(s, [w]);
  }
  return { words, bags, bySignature };
}

/** All other dictionary words that use exactly the same letters as `word` (excludes `word` itself). */
export function findAnagrams(word: string, index: WordIndex): string[] {
  const w = word.toLowerCase();
  return (index.bySignature.get(letterSignature(w)) ?? []).filter((x) => x !== w);
}

export interface SubwordOptions {
  minLength?: number;
  maxLength?: number;
  /** Every result must contain this letter. */
  required?: string;
}

/**
 * Words in the index spellable from `letters` (multiset), filtered by length / required letter.
 * Results keep dictionary order (alphabetical for sorted lists).
 */
export function findSubwords(
  letters: string,
  index: WordIndex,
  opts: SubwordOptions = {},
): string[] {
  const { minLength = 1, maxLength = letters.length, required } = opts;
  const have = letterBag(letters);
  const req = required ? required.toLowerCase().charCodeAt(0) - 97 : -1;
  if (req >= 0 && have[req] === 0) return [];
  const out: string[] = [];
  const { words, bags } = index;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w.length < minLength || w.length > maxLength) continue;
    const b = bags[i];
    if (req >= 0 && b[req] === 0) continue;
    if (bagContains(have, b)) out.push(w);
  }
  return out;
}

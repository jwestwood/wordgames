/**
 * Letter Wheel rules v1 — FROZEN once released. Everything that maps seed -> puzzle and affects save
 * compatibility lives here. Imports only frozen kernels (src/versioned/kernel). Never edit a released
 * rule set: make changes in rules/beta and release a new version (ARCHITECTURE.md › Puzzle versions).
 */
import { createRng, shuffle, type Rng } from '../../../kernel/rng@1';
import { selectWithCriteria, type Criterion } from '../../../kernel/select@1';
import {
  createWordIndex,
  findAnagrams,
  findSubwords,
  type WordIndex,
} from '../../../kernel/subwords@1';

export const GAME_ID = 'letter-wheel';

export const MIN_WORD = 4;
export const TARGET_LENGTH = { min: 8, max: 10 } as const;
export const POOL_SIZE = { min: 40, max: 80 } as const;
export const MAX_ATTEMPTS = 2000;

export interface Dictionaries {
  /** common tier: answers and pool */
  common: WordIndex;
  /** common + extended: used for the unique-anagram check */
  all: WordIndex;
  /** candidate targets (common, 8-10 letters), alphabetical */
  targets: readonly string[];
}

export interface Candidate {
  target: string;
  required: string;
  pool: string[];
}

export interface Puzzle extends Candidate {
  seed: string;
  /** Wheel letters around the centre: target minus one copy of the required letter. */
  outer: string[];
  attempts: number;
  passed: boolean;
}

/** Word lists by name, each sorted alphabetically (as stored). */
export interface WordLists {
  common: readonly string[];
  extended: readonly string[];
}

export function prepare(words: WordLists): Dictionaries {
  const common = words.common;
  const all = [...words.common, ...words.extended].sort();
  return {
    common: createWordIndex(common),
    all: createWordIndex(all),
    targets: common.filter((w) => w.length >= TARGET_LENGTH.min && w.length <= TARGET_LENGTH.max),
  };
}

export function buildPool(target: string, required: string, dict: Dictionaries): string[] {
  return findSubwords(target, dict.common, { minLength: MIN_WORD, required });
}

/**
 * Candidate stream: draw a target, then try each of its distinct letters (seeded order) as the
 * required letter before drawing the next target.
 */
function candidateStream(dict: Dictionaries) {
  let queue: string[] = [];
  let target = '';
  return (rng: Rng): Candidate => {
    if (queue.length === 0) {
      target = dict.targets[Math.floor(rng() * dict.targets.length)];
      queue = shuffle(rng, [...new Set(target)].sort());
    }
    const required = queue.shift()!;
    return { target, required, pool: buildPool(target, required, dict) };
  };
}

export function criteria(dict: Dictionaries): Criterion<Candidate>[] {
  return [
    { name: 'uniqueAnagram', test: (c) => findAnagrams(c.target, dict.all).length === 0 },
    {
      name: 'poolSize',
      test: (c) => c.pool.length >= POOL_SIZE.min && c.pool.length <= POOL_SIZE.max,
    },
  ];
}

/** Deterministic fallback: unique-anagram candidates first, then pool size closest to range. */
function fallback(dict: Dictionaries) {
  const dist = (n: number) =>
    n < POOL_SIZE.min ? POOL_SIZE.min - n : Math.max(0, n - POOL_SIZE.max);
  return (cands: readonly Candidate[]) => {
    let best = cands[0];
    let bestScore = Infinity;
    for (const c of cands) {
      const s = (findAnagrams(c.target, dict.all).length ? 1000 : 0) + dist(c.pool.length);
      if (s < bestScore) [best, bestScore] = [c, s];
    }
    return best;
  };
}

export function generate(seed: string, dict: Dictionaries): Puzzle {
  const rng = createRng(seed, GAME_ID);
  const res = selectWithCriteria(rng, candidateStream(dict), criteria(dict), {
    maxAttempts: MAX_ATTEMPTS,
    fallback: fallback(dict),
  });
  const { target, required, pool } = res.value;
  const letters = [...target];
  letters.splice(letters.indexOf(required), 1);
  return {
    seed,
    target,
    required,
    pool,
    outer: shuffle(rng, letters),
    attempts: res.attempts,
    passed: res.passed,
  };
}

export type GuessResult =
  | { ok: true; word: string }
  | { ok: false; reason: 'too-short' | 'missing-required' | 'already-found' | 'not-in-pool' };

export function checkGuess(guess: string, puzzle: Puzzle, found: readonly string[]): GuessResult {
  const word = guess.toLowerCase();
  if (word.length < MIN_WORD) return { ok: false, reason: 'too-short' };
  if (!word.includes(puzzle.required)) return { ok: false, reason: 'missing-required' };
  if (found.includes(word)) return { ok: false, reason: 'already-found' };
  if (!puzzle.pool.includes(word)) return { ok: false, reason: 'not-in-pool' };
  return { ok: true, word };
}

/** Fraction thresholds for 1, 2, 3 stars. */
export const STAR_THRESHOLDS = [0.6, 0.8, 0.9] as const;

/** Stars earned for `found` of `total` words. */
export function stars(found: number, total: number): number {
  const f = total > 0 ? Math.min(1, found / total) : 0;
  return STAR_THRESHOLDS.filter((t) => f >= t - 1e-9).length;
}

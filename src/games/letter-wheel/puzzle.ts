import { createRng, selectWithCriteria, shuffle, type Criterion, type Rng } from '@core/random';
import {
  createWordIndex,
  findAnagrams,
  findSubwords,
  loadWords,
  type WordIndex,
} from '@core/words';

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

export function buildDictionaries(common: readonly string[], all: readonly string[]): Dictionaries {
  return {
    common: createWordIndex(common),
    all: createWordIndex(all),
    targets: common.filter((w) => w.length >= TARGET_LENGTH.min && w.length <= TARGET_LENGTH.max),
  };
}

let dictPromise: Promise<Dictionaries> | undefined;
export function loadDictionaries(): Promise<Dictionaries> {
  dictPromise ??= Promise.all([loadWords('common'), loadWords('extended')]).then(([c, a]) =>
    buildDictionaries(c, a),
  );
  return dictPromise;
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

export function generatePuzzle(seed: string, dict: Dictionaries): Puzzle {
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

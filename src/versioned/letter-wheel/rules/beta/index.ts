/**
 * Letter Wheel rules beta — WORKING COPY (mutable, opt-in via ?v=beta); frozen into vN on release. Everything that maps seed -> puzzle and affects save
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
/**
 * Answer-pool size (the total players must find, from the looser common list). Shorter games:
 * 20-40 words. The wheel word is still drawn from the stricter targets list.
 */
export const POOL_SIZE = { min: 20, max: 40 } as const;
export const MAX_ATTEMPTS = 2000;
/** Every distinct wheel letter must appear in at least this many answers (target included). */
export const MIN_WORDS_PER_LETTER = 3;

/** Total shortfall: for each distinct letter of the target, how many answers it lacks (0 = ok). */
export function letterShortfall(target: string, pool: readonly string[]): number {
  let short = 0;
  for (const l of new Set(target)) {
    let n = 0;
    for (const w of pool) if (w.includes(l) && ++n >= MIN_WORDS_PER_LETTER) break;
    short += Math.max(0, MIN_WORDS_PER_LETTER - n);
  }
  return short;
}

export interface Dictionaries {
  /** common tier: answers and pool */
  common: WordIndex;
  /** common + bonus/extended: used for the unique-anagram check */
  all: WordIndex;
  /** wider words accepted as bonus finds */
  bonus: WordIndex;
  /** candidate targets (targets list, 8-10 letters), alphabetical */
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
  /** Spellable bonus words (not in the official pool). */
  bonusPool: string[];
  attempts: number;
  passed: boolean;
}

/** Word lists by name, each sorted alphabetically (as stored). */
export interface WordLists {
  /** answers (pool) */
  common: readonly string[];
  /** only used for the unique-anagram check when bonus is absent */
  extended: readonly string[];
  /** stricter, familiar subset of common: full-wheel targets are drawn from here */
  targets: readonly string[];
  /** accepted bonus words; also used for the unique-anagram check */
  bonus?: readonly string[];
}

export function prepare(words: WordLists): Dictionaries {
  const common = words.common;
  const bonus = words.bonus ?? words.extended ?? [];
  const all = [...new Set([...common, ...bonus])].sort();
  return {
    common: createWordIndex(common),
    bonus: createWordIndex(bonus),
    all: createWordIndex(all),
    targets: words.targets.filter(
      (w) => w.length >= TARGET_LENGTH.min && w.length <= TARGET_LENGTH.max,
    ),
  };
}

export function buildPool(target: string, required: string, dict: Dictionaries): string[] {
  return findSubwords(target, dict.common, { minLength: MIN_WORD, required });
}

export function buildBonusPool(
  target: string,
  required: string,
  dict: Dictionaries,
  official: readonly string[],
): string[] {
  const skip = new Set(official);
  return findSubwords(target, dict.bonus, { minLength: MIN_WORD, required }).filter(
    (w) => !skip.has(w),
  );
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
    { name: 'letterCoverage', test: (c) => letterShortfall(c.target, c.pool) === 0 },
  ];
}

/**
 * Deterministic fallback: unique-anagram candidates first, then pool size closest to range plus
 * missing letter usages (each missing usage weighs like 2 words outside the size range).
 */
function fallback(dict: Dictionaries) {
  const dist = (n: number) =>
    n < POOL_SIZE.min ? POOL_SIZE.min - n : Math.max(0, n - POOL_SIZE.max);
  return (cands: readonly Candidate[]) => {
    let best = cands[0];
    let bestScore = Infinity;
    for (const c of cands) {
      const s =
        (findAnagrams(c.target, dict.all).length ? 1000 : 0) +
        dist(c.pool.length) +
        2 * letterShortfall(c.target, c.pool);
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
    bonusPool: buildBonusPool(target, required, dict, pool),
    outer: shuffle(rng, letters),
    attempts: res.attempts,
    passed: res.passed,
  };
}

export type GuessResult =
  | { ok: true; word: string; bonus?: boolean }
  | {
      ok: false;
      reason:
        'too-short' | 'missing-required' | 'already-found' | 'already-found-bonus' | 'not-in-pool';
    };

export function checkGuess(
  guess: string,
  puzzle: Puzzle,
  found: readonly string[],
  bonusFound: readonly string[] = [],
): GuessResult {
  const word = guess.toLowerCase();
  if (word.length < MIN_WORD) return { ok: false, reason: 'too-short' };
  if (!word.includes(puzzle.required)) return { ok: false, reason: 'missing-required' };
  if (found.includes(word)) return { ok: false, reason: 'already-found' };
  if (bonusFound.includes(word)) return { ok: false, reason: 'already-found-bonus' };
  if (puzzle.pool.includes(word)) return { ok: true, word };
  if (puzzle.bonusPool.includes(word)) return { ok: true, word, bonus: true };
  return { ok: false, reason: 'not-in-pool' };
}

/** Fraction thresholds for 1, 2, 3 stars. */
export const STAR_THRESHOLDS = [0.6, 0.8, 0.9] as const;

/** Stars earned for `found` of `total` words. */
export function stars(found: number, total: number): number {
  const f = total > 0 ? Math.min(1, found / total) : 0;
  return STAR_THRESHOLDS.filter((t) => f >= t - 1e-9).length;
}

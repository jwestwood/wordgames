/**
 * FROZEN kernel select@1 — seeded retry-until-criteria-pass. Never edit; behaviour change => select@2.
 */
import type { Rng } from '../rng@1';

export interface Criterion<T> {
  name: string;
  test: (candidate: T) => boolean;
}

export interface SelectionResult<T> {
  value: T;
  /** Number of candidates generated (1 = first candidate passed). */
  attempts: number;
  /** False if no candidate passed within maxAttempts and the fallback was used. */
  passed: boolean;
  /** How many times each criterion rejected a candidate (criteria short-circuit in order). */
  rejections: Record<string, number>;
}

export interface SelectOptions<T> {
  maxAttempts?: number;
  /**
   * Used when every attempt fails. Receives all rejected candidates (in generation order) and must
   * pick deterministically. Default: the candidate that passed the most criteria (earliest on ties).
   */
  fallback?: (candidates: readonly T[]) => T;
}

/**
 * Draw candidates from `generate(rng)` until one passes all criteria. Fully deterministic for a
 * given rng state, so a seed always lands on the same result. Put cheap criteria first.
 */
export function selectWithCriteria<T>(
  rng: Rng,
  generate: (rng: Rng, attempt: number) => T,
  criteria: readonly Criterion<T>[],
  { maxAttempts = 1000, fallback }: SelectOptions<T> = {},
): SelectionResult<T> {
  const rejections: Record<string, number> = Object.fromEntries(criteria.map((c) => [c.name, 0]));
  const rejected: T[] = [];
  const passedCount: number[] = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const candidate = generate(rng, attempt);
    const failIdx = criteria.findIndex((c) => !c.test(candidate));
    if (failIdx === -1) return { value: candidate, attempts: attempt, passed: true, rejections };
    rejections[criteria[failIdx].name]++;
    rejected.push(candidate);
    passedCount.push(failIdx);
  }
  if (rejected.length === 0) throw new Error('selectWithCriteria: maxAttempts must be >= 1');
  let value: T;
  if (fallback) value = fallback(rejected);
  else {
    let best = 0;
    for (let i = 1; i < passedCount.length; i++) if (passedCount[i] > passedCount[best]) best = i;
    value = rejected[best];
  }
  return { value, attempts: maxAttempts, passed: false, rejections };
}

export const SCRABBLE_VALUES: Record<string, number> = Object.fromEntries(
  Object.entries({
    1: 'aeilnorstu',
    2: 'dg',
    3: 'bcmp',
    4: 'fhvwy',
    5: 'k',
    8: 'jx',
    10: 'qz',
  }).flatMap(([v, letters]) => [...letters].map((c) => [c, Number(v)])),
);

/** Sum of letter values (default: Scrabble values). Non-letters score 0. */
export function letterScore(
  word: string,
  values: Record<string, number> = SCRABBLE_VALUES,
): number {
  return [...word.toLowerCase()].reduce((sum, c) => sum + (values[c] ?? 0), 0);
}

/** Simple length-based score: 1 point per letter beyond minLength-1, bonus for long words. */
export function lengthScore(word: string, minLength = 3, longBonusAt = 7, longBonus = 5): number {
  const n = word.length;
  if (n < minLength) return 0;
  return n - minLength + 1 + (n >= longBonusAt ? longBonus : 0);
}

/** Score scaled by remaining time fraction (0..1), min multiplier 1. */
export function timeBonus(
  base: number,
  remainingMs: number,
  totalMs: number,
  maxMultiplier = 2,
): number {
  if (totalMs <= 0) return base;
  const f = Math.min(1, Math.max(0, remainingMs / totalMs));
  return Math.round(base * (1 + (maxMultiplier - 1) * f));
}

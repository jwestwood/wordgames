/** A threshold tier: `value` applies when the measured amount is at least `min`. */
export interface Tier<T> {
  min: number;
  value: T;
}

/**
 * Pick the highest tier whose `min` the amount reaches (tiers may be in any order).
 * Returns `fallback` when no tier matches. Handy for escalating feedback sounds.
 */
export function pickTier<T>(amount: number, tiers: readonly Tier<T>[], fallback: T): T {
  let best: Tier<T> | undefined;
  for (const t of tiers) if (amount >= t.min && (!best || t.min > best.min)) best = t;
  return best ? best.value : fallback;
}

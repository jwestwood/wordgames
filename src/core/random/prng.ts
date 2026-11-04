/** Seeded randomness. Games MUST use this (never the global unseeded RNG) so puzzles are reproducible from a seed. */
// The deterministic core is the frozen kernel rng@1 (src/versioned/kernel); re-exported here.
import type { Rng } from '../../versioned/kernel/rng@1';
export { cyrb128, sfc32, createRng, shuffle, type Rng } from '../../versioned/kernel/rng@1';

/** Integer in [min, max] inclusive. */
export function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick: empty list');
  return items[Math.floor(rng() * items.length)];
}

/** `n` distinct elements (partial Fisher–Yates). */
export function sample<T>(rng: Rng, items: readonly T[], n: number): T[] {
  if (n > items.length) throw new Error('sample: n larger than list');
  const a = items.slice();
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/** Pick by weight. */
export function weighted<T>(rng: Rng, items: readonly T[], weights: readonly number[]): T {
  if (items.length === 0 || items.length !== weights.length) throw new Error('weighted: bad input');
  const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
  if (total <= 0) throw new Error('weighted: weights must sum > 0');
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= Math.max(0, weights[i]);
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

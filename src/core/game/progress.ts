import { loadJSON, saveJSON, type StorageLike } from './storage';

export const DEFAULT_STAR_THRESHOLDS = [0.6, 0.8, 0.9] as const;

export interface Progress {
  found: number;
  total: number;
  /** 0..1 */
  fraction: number;
  /** Rounded down whole percent, so 100 only when perfect. */
  percent: number;
  stars: number;
  maxStars: number;
  perfect: boolean;
}

/** Fraction found -> stars: one star per threshold reached; perfect when everything is found. */
export function progressFor(
  found: number,
  total: number,
  thresholds: readonly number[] = DEFAULT_STAR_THRESHOLDS,
): Progress {
  const fraction = total > 0 ? Math.min(1, Math.max(0, found / total)) : 0;
  const stars = thresholds.filter((t) => fraction >= t - 1e-9).length;
  return {
    found,
    total,
    fraction,
    percent: Math.floor(fraction * 100 + 1e-9),
    stars,
    maxStars: thresholds.length,
    perfect: total > 0 && found >= total,
  };
}

/** Storage key for per-seed state, e.g. `letter-wheel:seed:K7Q2MX`. */
export const seedKey = (gameId: string, seed: string) => `${gameId}:seed:${seed}`;

export function loadSeedState<T>(
  gameId: string,
  seed: string,
  fallback: T,
  storage?: StorageLike,
): T {
  return storage
    ? loadJSON(seedKey(gameId, seed), fallback, storage)
    : loadJSON(seedKey(gameId, seed), fallback);
}

export function saveSeedState<T>(gameId: string, seed: string, value: T, storage?: StorageLike) {
  if (storage) saveJSON(seedKey(gameId, seed), value, storage);
  else saveJSON(seedKey(gameId, seed), value);
}

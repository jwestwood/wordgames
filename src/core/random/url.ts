import { generateSeed, normaliseSeed } from './seed';

/** Seed-aware hash routes: `#/games/<id>?seed=XXXX`. */
export function parseHashQuery(hash: string): { path: string[]; params: URLSearchParams } {
  const h = hash.replace(/^#\/?/, '');
  const q = h.indexOf('?');
  const pathPart = q === -1 ? h : h.slice(0, q);
  return {
    path: pathPart.split('/').filter(Boolean),
    params: new URLSearchParams(q === -1 ? '' : h.slice(q + 1)),
  };
}

export function getSeedFromHash(hash: string): string | null {
  const s = parseHashQuery(hash).params.get('seed');
  return s ? normaliseSeed(s) : null;
}

export function gameHash(gameId: string, seed: string): string {
  return `#/games/${encodeURIComponent(gameId)}?seed=${encodeURIComponent(seed)}`;
}

/** Full shareable URL for a game+seed. */
export function shareLink(
  gameId: string,
  seed: string,
  base: string = window.location.href,
): string {
  const u = new URL(base);
  u.hash = gameHash(gameId, seed);
  return u.toString();
}

/** Start a new puzzle: navigates to a fresh seed and returns it. */
export function newPuzzle(gameId: string, seed = generateSeed()): string {
  window.location.hash = gameHash(gameId, seed);
  return seed;
}

/** Seed for the current URL, creating (and writing via replaceState) one if absent. */
export function ensureSeed(gameId: string): string {
  const existing = getSeedFromHash(window.location.hash);
  if (existing) return existing;
  const seed = generateSeed();
  history.replaceState(null, '', gameHash(gameId, seed));
  return seed;
}

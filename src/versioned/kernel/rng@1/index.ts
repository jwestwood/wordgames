/**
 * FROZEN kernel rng@1 — seeded hashing + PRNG used by versioned rule sets.
 * Never edit: puzzles for published versions depend on this exact behaviour. Behaviour change => rng@2.
 */
export type Rng = () => number;

/** cyrb128: hash a string into four 32-bit ints. */
export function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/** sfc32 PRNG: returns floats in [0, 1). */
export function sfc32(a: number, b: number, c: number, d: number): Rng {
  return () => {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0; // prettier-ignore
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

/** Create a deterministic RNG from a string seed. Use `namespace` (e.g. game id) to decorrelate games. */
export function createRng(seed: string, namespace = ''): Rng {
  const rng = sfc32(...cyrb128(namespace ? `${namespace}:${seed}` : seed));
  for (let i = 0; i < 12; i++) rng(); // warm up
  return rng;
}

/** Fisher–Yates; returns a new array. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

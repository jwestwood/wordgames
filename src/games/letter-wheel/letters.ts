/**
 * LETTERS strip completion: a wheel letter is complete when every answer starting with it is found.
 * Letters that start no answers stay incomplete until the puzzle is 100% done.
 */

/** Distinct a–z letters from `letters`, sorted. */
export function distinctLetters(letters: string | readonly string[]): string[] {
  const source = typeof letters === 'string' ? [...letters] : letters;
  return [...new Set(source.map((c) => c.toLowerCase()).filter((c) => /^[a-z]$/.test(c)))].sort();
}

/** Map starting letter → answer words (pool order preserved). */
export function wordsByStart(pool: readonly string[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const w of pool) {
    const L = w[0]?.toLowerCase();
    if (!L || !/^[a-z]$/.test(L)) continue;
    const list = m.get(L);
    if (list) list.push(w);
    else m.set(L, [w]);
  }
  return m;
}

/** Wheel letters that start at least one answer. */
export function starterLetters(wheel: string | readonly string[], pool: readonly string[]): Set<string> {
  const wheelSet = new Set(distinctLetters(wheel));
  const out = new Set<string>();
  for (const L of wordsByStart(pool).keys()) if (wheelSet.has(L)) out.add(L);
  return out;
}

/** Wheel letters that start no answers. */
export function noStarterLetters(wheel: string | readonly string[], pool: readonly string[]): string[] {
  const starters = starterLetters(wheel, pool);
  return distinctLetters(wheel).filter((L) => !starters.has(L));
}

/**
 * Letters that should be highlighted on the strip.
 * Starter letters: all their words found. No-starter letters: only when the puzzle is perfect.
 */
export function completedLetters(
  wheel: string | readonly string[],
  pool: readonly string[],
  found: ReadonlySet<string>,
): Set<string> {
  const byStart = wordsByStart(pool);
  const done = new Set<string>();
  for (const L of distinctLetters(wheel)) {
    const words = byStart.get(L);
    if (!words || words.length === 0) continue;
    if (words.every((w) => found.has(w))) done.add(L);
  }
  if (pool.length > 0 && found.size >= pool.length) {
    for (const L of distinctLetters(wheel)) done.add(L);
  }
  return done;
}

/** Newly completed letters (sorted), for queuing celebrations. */
export function newlyCompletedLetters(
  wheel: string | readonly string[],
  _pool: readonly string[],
  before: ReadonlySet<string>,
  after: ReadonlySet<string>,
): string[] {
  return distinctLetters(wheel).filter((L) => after.has(L) && !before.has(L));
}

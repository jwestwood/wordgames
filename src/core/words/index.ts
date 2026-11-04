/** Lowercase and strip everything except a-z. */
export function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '');
}

/** Map of letter -> count for the normalised word. */
export function letterCounts(word: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of normalise(word)) counts[c] = (counts[c] ?? 0) + 1;
  return counts;
}

/** True if `word` can be spelled using only the letters available in `pool`. */
export function canSpell(word: string, pool: string): boolean {
  const need = letterCounts(word);
  const have = letterCounts(pool);
  return (
    Object.keys(need).length > 0 && Object.entries(need).every(([c, n]) => (have[c] ?? 0) >= n)
  );
}

/** True if a and b use exactly the same letters (case/space/punctuation-insensitive). */
export function isAnagram(a: string, b: string): boolean {
  const x = normalise(a);
  const y = normalise(b);
  if (!x || x.length !== y.length) return false;
  return [...x].sort().join('') === [...y].sort().join('');
}

/** Returns a Fisher–Yates shuffle of the letters in word. Inject rng for deterministic tests. */
export function shuffleLetters(word: string, rng: () => number = Math.random): string {
  const chars = [...word];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/** Shuffle that is guaranteed to differ from the input when possible. */
export function scramble(word: string, rng: () => number = Math.random, maxTries = 20): string {
  if (new Set(word).size < 2) return word;
  let out = word;
  for (let i = 0; i < maxTries && out === word; i++) out = shuffleLetters(word, rng);
  return out === word ? word.slice(1) + word[0] : out;
}

/** Parse a newline/whitespace separated word list into a normalised, de-duplicated Set. */
export function parseWordList(
  text: string,
  opts: { minLength?: number; maxLength?: number } = {},
): Set<string> {
  const { minLength = 1, maxLength = Infinity } = opts;
  const set = new Set<string>();
  for (const raw of text.split(/\s+/)) {
    const w = normalise(raw);
    if (w.length >= minLength && w.length <= maxLength) set.add(w);
  }
  return set;
}

/** Fetch and parse a word list (e.g. from /public). */
export async function loadWordList(
  url: string,
  opts?: Parameters<typeof parseWordList>[1],
): Promise<Set<string>> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load word list: ${res.status}`);
  return parseWordList(await res.text(), opts);
}

/** True if the word (normalised) is in the dictionary. */
export function isValidWord(word: string, dictionary: Set<string>): boolean {
  const w = normalise(word);
  return w.length > 0 && dictionary.has(w);
}

/** Pick a random element. */
export function pickRandom<T>(items: readonly T[], rng: () => number = Math.random): T {
  if (items.length === 0) throw new Error('pickRandom: empty list');
  return items[Math.floor(rng() * items.length)];
}

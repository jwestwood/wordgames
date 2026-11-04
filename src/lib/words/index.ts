const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/** True if a and b use exactly the same letters (case/space/punctuation-insensitive). */
export function isAnagram(a: string, b: string): boolean {
  const x = normalize(a);
  const y = normalize(b);
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

import { describe, expect, it } from 'vitest';

/** Mirror of LetterStrip's distinct-sort so the rule is tested without a DOM. */
function distinctAlpha(letters: string | readonly string[]) {
  const source = typeof letters === 'string' ? [...letters] : letters;
  return [...new Set(source.map((c) => c.toLowerCase()).filter((c) => /^[a-z]$/.test(c)))].sort();
}

describe('LetterStrip ordering', () => {
  it('dedupes and sorts', () => {
    expect(distinctAlpha('bAaXc')).toEqual(['a', 'b', 'c', 'x']);
    expect(distinctAlpha(['z', 'a', 'z', '1'])).toEqual(['a', 'z']);
  });
});

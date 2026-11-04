import { describe, expect, it } from 'vitest';
import { byLength, loadWords } from './wordlist';

describe('bundled word lists', () => {
  it('loads common words, lowercase a-z, sorted, British spellings', async () => {
    const w = await loadWords('common');
    expect(w.length).toBeGreaterThan(10000);
    expect(w.every((x) => /^[a-z]{3,12}$/.test(x))).toBe(true);
    expect([...w].sort()).toEqual(w);
    expect(w).toContain('colour');
    expect(w).not.toContain('color');
  });
  it('extended is a superset and length filter works', async () => {
    const c = await loadWords('common');
    const e = await loadWords('extended', { minLength: 5, maxLength: 5 });
    expect(e.every((x) => x.length === 5)).toBe(true);
    expect(e.length).toBeGreaterThan(c.filter((x) => x.length === 5).length);
    expect(byLength(c).get(5)!.length).toBeGreaterThan(1000);
  });
});

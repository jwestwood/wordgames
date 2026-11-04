import { describe, expect, it } from 'vitest';
import { contrastPairs, contrastRatio, meetsAA } from '.';

describe('contrast', () => {
  it('computes known ratios', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#fff', '#fff')).toBeCloseTo(1, 5);
  });
  it.each(contrastPairs)('%s meets WCAG AA', (_n, fg, bg) => {
    expect(meetsAA(fg, bg)).toBe(true);
  });
});

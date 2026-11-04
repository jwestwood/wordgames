import { describe, expect, it } from 'vitest';
import { annularSectorPath, polar, rotate, wheelSegments } from './wheel';

describe('wheel geometry', () => {
  it('polar: 0 rad is 12 o’clock, clockwise', () => {
    expect(polar(0, 0, 10, 0).map((n) => Math.round(n) + 0)).toEqual([0, -10]);
    expect(polar(0, 0, 10, Math.PI / 2).map((n) => Math.round(n) + 0)).toEqual([10, 0]);
  });
  it('segments', () => {
    const s = wheelSegments(8);
    expect(s).toHaveLength(8);
    expect(s[0].x).toBe(100);
    expect(s[0].y).toBeLessThan(100);
    expect(s[2].x).toBeGreaterThan(100);
    expect(annularSectorPath(0, 0, 1, 2, 0, 1)).toMatch(/^M.*Z$/);
  });
  it('rotate', () => {
    expect(rotate([1, 2, 3], 1)).toEqual([2, 3, 1]);
    expect(rotate([1, 2, 3], -1)).toEqual([3, 1, 2]);
    expect(rotate([], 2)).toEqual([]);
  });
});

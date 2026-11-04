import { describe, expect, it } from 'vitest';
import { pickTier } from './tiers';

describe('pickTier', () => {
  const tiers = [
    { min: 6, value: 'big' },
    { min: 0, value: 'base' },
  ];
  it('picks the highest reached tier', () => {
    expect(pickTier(4, tiers, 'x')).toBe('base');
    expect(pickTier(6, tiers, 'x')).toBe('big');
    expect(pickTier(9, tiers, 'x')).toBe('big');
  });
  it('falls back when nothing matches', () => {
    expect(pickTier(-1, tiers, 'x')).toBe('x');
    expect(pickTier(3, [], 'x')).toBe('x');
  });
});

import { describe, expect, it } from 'vitest';
import { generateSeed, isValidSeed, normaliseSeedInput } from './seed';

describe('isValidSeed', () => {
  it('accepts canonical and generated seeds', () => {
    expect(isValidSeed('K7Q2MX')).toBe(true);
    for (let i = 0; i < 20; i++) expect(isValidSeed(generateSeed())).toBe(true);
  });
  it('accepts look-alikes and lowercase via normalisation', () => {
    expect(isValidSeed('k7q2mx')).toBe(true);
    expect(isValidSeed('OIL234')).toBe(true);
  });
  it('rejects wrong length, U, and symbols', () => {
    expect(isValidSeed('K7Q2M')).toBe(false);
    expect(isValidSeed('K7Q2MXX')).toBe(false);
    expect(isValidSeed('K7Q2MU')).toBe(false);
    expect(isValidSeed('K7-2MX')).toBe(false);
    expect(isValidSeed('')).toBe(false);
  });
});

describe('normaliseSeedInput', () => {
  it('uppercases, maps look-alikes, strips junk, caps length', () => {
    expect(normaliseSeedInput('ab o-il 12345')).toBe('AB0111');
    expect(normaliseSeedInput('k7')).toBe('K7');
  });
});

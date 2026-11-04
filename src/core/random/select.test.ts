import { describe, expect, it } from 'vitest';
import { createRng } from './prng';
import { selectWithCriteria } from './select';

describe('selectWithCriteria', () => {
  const gen = (r: () => number) => Math.floor(r() * 100);
  it('returns the first passing candidate deterministically', () => {
    const run = () =>
      selectWithCriteria(createRng('a'), gen, [
        { name: 'even', test: (n) => n % 2 === 0 },
        { name: 'big', test: (n) => n > 80 },
      ]);
    const a = run();
    expect(a).toEqual(run());
    expect(a.passed).toBe(true);
    expect(a.value % 2).toBe(0);
    expect(a.value).toBeGreaterThan(80);
    expect(a.rejections.even + a.rejections.big).toBe(a.attempts - 1);
  });
  it('passes the attempt number and stops at 1 when all pass', () => {
    const seen: number[] = [];
    const r = selectWithCriteria(createRng('b'), (_, i) => (seen.push(i), i), []);
    expect(r).toMatchObject({ value: 1, attempts: 1, passed: true });
  });
  it('falls back deterministically when exhausted', () => {
    const crit = [
      { name: 'odd', test: (n: number) => n % 2 === 1 },
      { name: 'never', test: () => false },
    ];
    const r = selectWithCriteria(createRng('c'), (_, i) => i, crit, { maxAttempts: 5 });
    expect(r).toMatchObject({ value: 1, attempts: 5, passed: false });
    expect(r.rejections).toEqual({ odd: 2, never: 3 });
    const f = selectWithCriteria(createRng('c'), (_, i) => i, crit, {
      maxAttempts: 4,
      fallback: (c) => c[c.length - 1],
    });
    expect(f.value).toBe(4);
  });
});

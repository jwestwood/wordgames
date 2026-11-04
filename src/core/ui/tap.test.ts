import { describe, expect, it } from 'vitest';
import { createPressGuard } from './tap';

describe('press guard', () => {
  it('fires on pointerdown and swallows the following click', () => {
    const g = createPressGuard(800);
    expect(g.down({ button: 0 }, 0)).toBe(true);
    expect(g.click(120)).toBe(false);
    expect(g.click(130)).toBe(true); // a second, separate click
  });
  it('lets keyboard/assistive clicks through and ignores secondary buttons', () => {
    const g = createPressGuard(800);
    expect(g.click(5000)).toBe(true);
    expect(g.down({ button: 2 }, 6000)).toBe(false);
    expect(g.down({ button: 0, isPrimary: false }, 6000)).toBe(false);
    expect(g.click(6010)).toBe(true);
  });
  it('a stale pointerdown does not swallow a much later click', () => {
    const g = createPressGuard(800);
    g.down({ button: 0 }, 0);
    expect(g.click(2000)).toBe(true);
  });
});

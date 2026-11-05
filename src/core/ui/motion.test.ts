import { describe, expect, it, vi } from 'vitest';
import { createAnimationQueue } from './queue';
import { createTransient, type Timers } from './transient';
import {
  centredRect,
  contentRect,
  easeFly,
  flyFrameStyle,
  invertTransform,
  isRectInView,
  readFlyTarget,
} from './motion';

describe('createAnimationQueue', () => {
  it('runs tasks sequentially in order', async () => {
    const q = createAnimationQueue();
    const log: string[] = [];
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    q.enqueue(async () => {
      log.push('a1');
      await wait(10);
      log.push('a2');
    });
    q.enqueue(() => void log.push('b'));
    expect(q.size).toBe(2);
    await q.idle();
    expect(log).toEqual(['a1', 'a2', 'b']);
    expect(q.size).toBe(0);
  });
  it('continues after a failing task', async () => {
    const q = createAnimationQueue();
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ran = vi.fn();
    q.enqueue(() => {
      throw new Error('x');
    });
    await q.enqueue(ran);
    expect(ran).toHaveBeenCalled();
    err.mockRestore();
  });
  it('clear drops pending tasks', async () => {
    const q = createAnimationQueue();
    const ran = vi.fn();
    q.enqueue(() => new Promise((r) => setTimeout(r, 5)));
    q.enqueue(ran);
    q.clear();
    await q.idle();
    expect(ran).not.toHaveBeenCalled();
  });
});

describe('createTransient', () => {
  function fakeTimers() {
    let next = 0;
    const pending = new Map<number, () => void>();
    const t: Timers & { fire(): void; count(): number } = {
      set: (fn) => (pending.set(++next, fn), next),
      clear: (id) => void pending.delete(id as number),
      fire: () => [...pending.entries()].forEach(([id, f]) => (pending.delete(id), f())),
      count: () => pending.size,
    };
    return t;
  }
  it('shows then auto-clears', () => {
    const timers = fakeTimers();
    const seen: (string | null)[] = [];
    const t = createTransient<string>((v) => seen.push(v), 1000, timers);
    t.show('hi');
    expect(seen).toEqual(['hi']);
    timers.fire();
    expect(seen).toEqual(['hi', null]);
  });
  it('restarts timer when shown again; dispose cancels', () => {
    const timers = fakeTimers();
    const seen: (string | null)[] = [];
    const t = createTransient<string>((v) => seen.push(v), 1000, timers);
    t.show('a');
    t.show('b');
    expect(timers.count()).toBe(1);
    t.dispose();
    expect(timers.count()).toBe(0);
    expect(seen).toEqual(['a', 'b']);
  });
});

describe('motion geometry', () => {
  it('inverts destination to source', () => {
    const r = invertTransform(
      { left: 0, top: 0, width: 200, height: 40 },
      { left: 100, top: 100, width: 100, height: 20 },
    );
    expect(r).toEqual({ dx: -50, dy: -90, s: 2 });
  });
  it('centres a rect', () => {
    expect(centredRect({ left: 0, top: 0, width: 100, height: 100 }, 20, 10)).toEqual({
      left: 40,
      top: 45,
      width: 20,
      height: 10,
    });
  });
});

describe('isRectInView', () => {
  it('detects fully visible vs clipped rects', () => {
    expect(isRectInView({ left: 0, top: 10, width: 50, height: 20 }, 100)).toBe(true);
    expect(isRectInView({ left: 0, top: 90, width: 50, height: 20 }, 100)).toBe(false);
    expect(isRectInView({ left: 0, top: -5, width: 50, height: 20 }, 100)).toBe(false);
    expect(isRectInView({ left: 80, top: 0, width: 50, height: 20 }, 100, 100)).toBe(false);
  });
});

describe('contentRect', () => {
  it('falls back to the element box without a DOM range', () => {
    const box = { left: 1, top: 2, width: 3, height: 4 };
    const el = { getBoundingClientRect: () => box } as unknown as Element;
    expect(contentRect(el)).toEqual(box);
  });
});

describe('flyFrameStyle / moving destination', () => {
  const from = { left: 0, top: 0, width: 100, height: 40 };
  const toA = { left: 200, top: 400, width: 50, height: 20 };
  const toB = { left: 200, top: 100, width: 50, height: 20 }; // scrolled up

  it('easeFly is 0 at start and 1 at end', () => {
    expect(easeFly(0)).toBe(0);
    expect(easeFly(1)).toBe(1);
    expect(easeFly(0.5)).toBeGreaterThan(0);
    expect(easeFly(0.5)).toBeLessThan(1);
  });

  it('ends at the live destination even if it moved mid-flight', () => {
    // Mid-flight toward toA…
    const mid = flyFrameStyle(from, toA, 0.7, { hold: 0.35 });
    expect(mid.left).toBe(toA.left);
    expect(mid.top).toBe(toA.top);
    // …destination scrolls; final frame must match the new rect (identity transform).
    const end = flyFrameStyle(from, toB, 1, { hold: 0.35 });
    expect(end).toMatchObject({
      left: toB.left,
      top: toB.top,
      width: toB.width,
      height: toB.height,
      opacity: 1,
      transform: 'translate(0px, 0px) scale(1)',
    });
  });

  it('hold phase keeps the flyer at the start (full invert)', () => {
    const hold = flyFrameStyle(from, toA, 0.2, { hold: 0.35 });
    const { dx, dy, s } = invertTransform(from, toA);
    expect(hold.transform).toBe(`translate(${dx}px, ${dy}px) scale(${s})`);
  });

  it('readFlyTarget accepts a getter (for live tracking)', () => {
    let top = 10;
    const get = () => ({ left: 1, top, width: 2, height: 3 });
    expect(readFlyTarget(get).top).toBe(10);
    top = 99;
    expect(readFlyTarget(get).top).toBe(99);
    expect(readFlyTarget({ left: 5, top: 6, width: 7, height: 8 })).toEqual({
      left: 5,
      top: 6,
      width: 7,
      height: 8,
    });
  });
});

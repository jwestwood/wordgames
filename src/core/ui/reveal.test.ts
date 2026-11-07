import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isRevealTargetVisible,
  revealWordInPlace,
  waitForRevealVisibility,
  wordRevealTiming,
} from './reveal';
import { WordSlots } from './WordSlots';

afterEach(() => vi.unstubAllGlobals());

describe('discovery reveal timing', () => {
  it.each([1, 4, 8, 10])('keeps a %i letter word within the short reveal budget', (length) => {
    const timing = wordRevealTiming(length);
    expect(timing.total).toBeGreaterThanOrEqual(400);
    expect(timing.total).toBeLessThanOrEqual(600);
    expect(timing.duration + timing.stagger * (length - 1)).toBe(timing.total);
  });
  it('animates ink transforms and a warm/green wash, not cell layout', async () => {
    const finished = Promise.resolve();
    const cancel = vi.fn();
    const animate = vi.fn<
      (
        frames: Keyframe[],
        options: KeyframeAnimationOptions,
      ) => { finished: Promise<void>; cancel: () => void }
    >(() => ({ finished, cancel }));
    const classList = { add: vi.fn() };
    const row = {
      animate,
      classList,
      querySelectorAll: () => [{ animate }, { animate }, { animate }, { animate }],
    };
    await revealWordInPlace(row as unknown as HTMLElement);
    expect(animate).toHaveBeenCalledTimes(5);
    expect(animate.mock.calls[0][0]).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0 })]),
    );
    const options = animate.mock.calls.map((args) => args[1]);
    expect(options.slice(0, 4).map((value) => value.delay)).toEqual([0, 25, 50, 75]);
    expect(JSON.stringify(animate.mock.calls)).not.toMatch(/width|height|padding|margin/);
    expect(classList.add).toHaveBeenCalledWith('word-slots__item--reveal-finished');
    expect(cancel).toHaveBeenCalledTimes(5);
  });
  it('cancels an active reveal on unmount without leaving a finished marker', async () => {
    let reject!: (reason: Error) => void;
    const finished = new Promise<void>((_resolve, fail) => {
      reject = fail;
    });
    const cancel = vi.fn(() => reject(new Error('cancelled')));
    const animate = vi.fn(() => ({ finished, cancel }));
    const classList = { add: vi.fn() };
    const controller = new AbortController();
    const result = revealWordInPlace(
      {
        animate,
        classList,
        querySelectorAll: () => [{ animate }],
      } as unknown as HTMLElement,
      controller.signal,
    );
    controller.abort();
    await result;
    expect(cancel).toHaveBeenCalled();
    expect(classList.add).not.toHaveBeenCalled();
  });
  it('fills immediately when the Web Animations API is unavailable', async () => {
    await expect(revealWordInPlace({} as HTMLElement)).resolves.toBeUndefined();
  });
  it('uses an immediate reveal under reduced motion', async () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    const animate = vi.fn();
    await revealWordInPlace({ animate } as unknown as HTMLElement);
    expect(animate).not.toHaveBeenCalled();
  });
});

describe('visibility/React commit gate', () => {
  function frames() {
    let next = 0;
    const pending = new Map<number, () => void>();
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
      pending.set(++next, cb);
      return next;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => pending.delete(id));
    return {
      tick() {
        const callbacks = [...pending.values()];
        pending.clear();
        callbacks.forEach((cb) => cb());
      },
      pending,
    };
  }
  it('does not start until after a frame and the mounted/open slot is visible', async () => {
    const clock = frames();
    let visible = false;
    const done = vi.fn();
    const result = waitForRevealVisibility(() => visible, new AbortController().signal).then(done);
    clock.tick();
    await Promise.resolve();
    expect(done).not.toHaveBeenCalled();
    visible = true;
    expect(done).not.toHaveBeenCalled();
    clock.tick();
    await result;
    expect(done).toHaveBeenCalledWith(true);
    expect(clock.pending.size).toBe(0);
  });
  it('aborts waiting on navigation/unmount without leaking a frame or hanging the queue', async () => {
    const clock = frames();
    const controller = new AbortController();
    const waiting = waitForRevealVisibility(() => false, controller.signal);
    controller.abort();
    expect(await waiting).toBe(false);
    expect(clock.pending.size).toBe(0);
  });
  it('accounts for the tray scroll clip, not just the viewport', () => {
    vi.stubGlobal('window', { innerWidth: 390, innerHeight: 844 });
    vi.stubGlobal('getComputedStyle', () => ({ overflowY: 'auto', overflowX: 'hidden' }));
    const parent = {
      parentElement: null,
      getBoundingClientRect: () => ({ top: 300, bottom: 800, left: 0, right: 390 }),
    };
    let top = 240;
    const el = {
      isConnected: true,
      getClientRects: () => [1],
      parentElement: parent,
      getBoundingClientRect: () => ({
        top,
        bottom: top + 20,
        left: 12,
        right: 160,
        width: 148,
        height: 20,
      }),
    };
    expect(isRevealTargetVisible(el as unknown as HTMLElement)).toBe(false);
    top = 350;
    expect(isRevealTargetVisible(el as unknown as HTMLElement)).toBe(true);
  });
});

describe('WordSlots transient reveal state', () => {
  const render = (hidden?: ReadonlySet<string>, revealing?: ReadonlySet<string>) =>
    renderToStaticMarkup(
      createElement(WordSlots, {
        words: ['abide'],
        revealed: new Set(['abide']),
        hidden,
        revealing,
      }),
    );
  it('keeps a discovered-but-waiting word blank (no complete word flash)', () => {
    const html = render(new Set(['abide']));
    expect(html).not.toContain('>A<');
    expect(html).not.toContain('item--shown');
  });
  it('commits ink under the reveal class before the helper can animate it', () => {
    const html = render(new Set(['abide']), new Set(['abide']));
    expect(html).toContain('word-slots__item--revealing');
    expect(html).toContain('word-slots__item--shown');
    expect(html).toContain('word-slots__ink">A<');
  });
  it('restored found words are shown without replaying a reveal', () => {
    const html = render();
    expect(html).toContain('item--shown');
    expect(html).not.toContain('item--revealing');
    expect(html).toContain('word-slots__ink">A<');
  });
});

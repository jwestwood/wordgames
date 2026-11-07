import { afterEach, describe, expect, it, vi } from 'vitest';
import { isSheetPresent, transitionSheet, SHEET_TRANSITION_MS } from './sheetMotion';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function nodes() {
  let complete!: () => void;
  const finished = new Promise<void>((resolve) => {
    complete = resolve;
  });
  const cancel = vi.fn();
  const animate = vi.fn<(frames: Keyframe[], options: KeyframeAnimationOptions) => unknown>(() => ({
    finished,
    cancel,
  }));
  const panel = { style: { transform: 'matrix(1, 0, 0, 1, 0, 400)' }, animate };
  const backdrop = { style: { opacity: '0' }, animate };
  vi.stubGlobal('getComputedStyle', (el: { style: unknown }) => el.style);
  return { panel, backdrop, animate, cancel, complete };
}

describe('sheet mounted-exit motion', () => {
  it('retains modal presence for an interrupted opening and the complete closing phase', () => {
    expect(isSheetPresent(true, 'closed')).toBe(true);
    expect(isSheetPresent(false, 'opening')).toBe(true);
    expect(isSheetPresent(false, 'open')).toBe(true);
    expect(isSheetPresent(false, 'closing')).toBe(true);
    expect(isSheetPresent(false, 'closed')).toBe(false);
  });
  it.each([true, false])(
    'slides %s from current transform and finishes only after motion',
    async (open) => {
      const { panel, backdrop, animate, cancel, complete } = nodes();
      const motion = transitionSheet(
        panel as unknown as HTMLElement,
        backdrop as unknown as HTMLElement,
        open,
      );
      const done = vi.fn();
      void motion.finished.then(done);
      expect(animate.mock.calls[0][0]).toEqual([
        { transform: 'matrix(1, 0, 0, 1, 0, 400)' },
        { transform: open ? 'translateY(0%)' : 'translateY(100%)' },
      ]);
      expect(animate.mock.calls[0][1].duration).toBe(SHEET_TRANSITION_MS);
      await Promise.resolve();
      expect(done).not.toHaveBeenCalled();
      complete();
      expect(await motion.finished).toBe(true);
      expect(panel.style.transform).toBe(open ? 'translateY(0%)' : 'translateY(100%)');
      expect(backdrop.style.opacity).toBe(open ? '1' : '0');
      expect(cancel).toHaveBeenCalledTimes(2);
    },
  );
  it('reversal snapshots the live position and invalidates the stale completion', async () => {
    const { panel, backdrop, complete } = nodes();
    const motion = transitionSheet(
      panel as unknown as HTMLElement,
      backdrop as unknown as HTMLElement,
      true,
    );
    panel.style.transform = 'matrix(1, 0, 0, 1, 0, 120)';
    motion.cancel();
    expect(await motion.finished).toBe(false);
    complete();
    await Promise.resolve();
    expect(panel.style.transform).toBe('matrix(1, 0, 0, 1, 0, 120)');
  });
  it('reduced motion finishes immediately without WAAPI', async () => {
    const { panel, backdrop, animate } = nodes();
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    const motion = transitionSheet(
      panel as unknown as HTMLElement,
      backdrop as unknown as HTMLElement,
      false,
    );
    expect(await motion.finished).toBe(true);
    expect(animate).not.toHaveBeenCalled();
    expect(panel.style.transform).toBe('translateY(100%)');
  });
  it('has a bounded fallback if WAAPI never finishes, so exit can release modal locks', async () => {
    vi.useFakeTimers();
    const { panel, backdrop } = nodes();
    const motion = transitionSheet(
      panel as unknown as HTMLElement,
      backdrop as unknown as HTMLElement,
      false,
    );
    await vi.advanceTimersByTimeAsync(SHEET_TRANSITION_MS + 80);
    expect(await motion.finished).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('works without WAAPI', async () => {
    const panel = { style: {} } as HTMLElement;
    const motion = transitionSheet(panel, null, true);
    expect(await motion.finished).toBe(true);
    expect(panel.style.transform).toBe('translateY(0%)');
  });
});

import { prefersReducedMotion } from './motion';

/** Constant-size cells: only their ink transforms; the row/cell layout never changes. */
export function wordRevealTiming(count: number) {
  const duration = 420;
  const stagger = count > 1 ? Math.min(25, 180 / (count - 1)) : 0;
  return { duration, stagger, total: duration + stagger * Math.max(0, count - 1) };
}

/** Full row visibility, including a sheet's clipping/scrolling ancestors. */
export function isRevealTargetVisible(el: HTMLElement): boolean {
  if (!el.isConnected || !el.getClientRects().length) return false;
  const r = el.getBoundingClientRect();
  let left = 0,
    top = 0,
    right = window.innerWidth,
    bottom = window.innerHeight;
  for (let parent = el.parentElement; parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent);
    const box = parent.getBoundingClientRect();
    if (/auto|scroll|hidden|clip/.test(style.overflowY)) {
      top = Math.max(top, box.top);
      bottom = Math.min(bottom, box.bottom);
    }
    if (/auto|scroll|hidden|clip/.test(style.overflowX)) {
      left = Math.max(left, box.left);
      right = Math.min(right, box.right);
    }
  }
  return (
    r.width > 0 &&
    r.height > 0 &&
    r.top >= top &&
    r.bottom <= bottom &&
    r.left >= left &&
    r.right <= right
  );
}

/** Yield at least one frame for React to commit/open a tray. Abort also stops queued waits. */
export function waitForRevealVisibility(
  visible: () => boolean,
  signal: AbortSignal,
): Promise<boolean> {
  if (signal.aborted) return Promise.resolve(false);
  return new Promise((resolve) => {
    let frame = 0;
    const finish = (ok: boolean) => {
      cancelAnimationFrame(frame);
      signal.removeEventListener('abort', abort);
      resolve(ok);
    };
    const abort = () => finish(false);
    const tick = () => {
      if (visible()) finish(true);
      else frame = requestAnimationFrame(tick);
    };
    signal.addEventListener('abort', abort, { once: true });
    frame = requestAnimationFrame(tick);
  });
}

/**
 * Caller commits WordSlots.revealing first (ink hidden in CSS), then invokes this helper.
 * 420–600ms staggered ink flips + warm/green wash, no moving word overlay.
 * Reduced motion / no WAAPI is immediate. Caller removes revealing when this resolves.
 */
export async function revealWordInPlace(el: HTMLElement, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted || prefersReducedMotion() || typeof el.animate !== 'function') return;
  const ink = Array.from(el.querySelectorAll<HTMLElement>('.word-slots__ink'));
  const timing = wordRevealTiming(ink.length);
  const animations = ink.map((letter, i) =>
    letter.animate(
      [
        { opacity: 0, transform: 'perspective(240px) rotateX(-80deg)', filter: 'blur(0.5px)' },
        {
          opacity: 1,
          transform: 'perspective(240px) rotateX(7deg)',
          filter: 'blur(0px)',
          offset: 0.75,
        },
        { opacity: 1, transform: 'perspective(240px) rotateX(0deg)', filter: 'blur(0px)' },
      ],
      { duration: timing.duration, delay: timing.stagger * i, fill: 'both', easing: 'ease-out' },
    ),
  );
  animations.push(
    el.animate(
      [
        { backgroundColor: 'rgba(227, 179, 59, 0.22)' },
        { backgroundColor: 'rgba(47, 93, 80, 0.15)', offset: 0.45 },
        { backgroundColor: 'rgba(47, 93, 80, 0)' },
      ],
      { duration: timing.total, easing: 'ease-out' },
    ),
  );
  const cancel = () => animations.forEach((a) => a.cancel());
  signal?.addEventListener('abort', cancel, { once: true });
  try {
    await Promise.all(animations.map((a) => a.finished.catch(() => undefined)));
    // Keep the final ink visible until React removes the revealing class in the next commit.
    // Removing these immediately would expose CSS opacity:0 for a frame.
    if (!signal?.aborted) el.classList.add('word-slots__item--reveal-finished');
  } finally {
    signal?.removeEventListener('abort', cancel);
    cancel();
  }
}

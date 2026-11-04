/** DOM motion helpers (Web Animations API). All honour prefers-reduced-motion. */
export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

/** Transform that maps `to` onto `from` (FLIP "invert" step), scaling by width. */
export function invertTransform(from: RectLike, to: RectLike, scale?: number) {
  const s = scale ?? (to.width > 0 ? from.width / to.width : 1);
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  return { dx, dy, s };
}

/** Rect of `w`×`h` centred in `r`. */
export function centredRect(r: RectLike, w: number, h: number): RectLike {
  return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
}

export interface FlyOptions {
  duration?: number;
  easing?: string;
  className?: string;
  /** Fraction of the duration spent appearing + holding at the start (0..0.6). */
  hold?: number;
  /** Override start scale (default from.width / to.width). */
  fromScale?: number;
}

/**
 * Fly `content` from `fromRect` to `toRect` in a fixed-position overlay (FLIP: the overlay is laid
 * out at the destination and animated from the inverted start transform). Resolves when finished
 * and the overlay removed. Under reduced motion resolves immediately.
 */
export function flyElement(
  fromRect: RectLike,
  toRect: RectLike,
  content: HTMLElement | string,
  opts: FlyOptions = {},
): Promise<void> {
  if (prefersReducedMotion() || typeof document === 'undefined') return Promise.resolve();
  const { duration = 900, easing = 'cubic-bezier(0.5, 0, 0.2, 1)', hold = 0.35 } = opts;
  const el = document.createElement('div');
  el.className = `fly-overlay ${opts.className ?? ''}`.trim();
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, {
    position: 'fixed',
    left: `${toRect.left}px`,
    top: `${toRect.top}px`,
    width: `${toRect.width}px`,
    height: `${toRect.height}px`,
    pointerEvents: 'none',
    zIndex: '300',
    transformOrigin: 'center',
  });
  if (typeof content === 'string') el.textContent = content;
  else el.appendChild(content);
  document.body.appendChild(el);
  const { dx, dy, s } = invertTransform(fromRect, toRect, opts.fromScale);
  const start = `translate(${dx}px, ${dy}px) scale(${s})`;
  const h = Math.min(0.6, Math.max(0, hold));
  const anim = el.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${s * 0.6})`, opacity: 0, offset: 0 },
      { transform: start, opacity: 1, offset: h * 0.45, easing: 'ease-out' },
      { transform: start, opacity: 1, offset: h, easing },
      { transform: 'none', opacity: 1, offset: 1 },
    ],
    { duration, fill: 'forwards' },
  );
  return anim.finished.then(
    () => el.remove(),
    () => el.remove(),
  );
}

/** Brief brightness pulse on an element. */
export function flashElement(el: Element | null, duration = 450): Promise<void> {
  if (!el || prefersReducedMotion() || !('animate' in el)) return Promise.resolve();
  return el
    .animate(
      [
        { filter: 'brightness(1)' },
        { filter: 'brightness(1.35) drop-shadow(0 0 12px rgba(250, 245, 234, 0.9))' },
        { filter: 'brightness(1)' },
      ],
      { duration, easing: 'ease-out' },
    )
    .finished.then(
      () => undefined,
      () => undefined,
    );
}

/** Scroll `el` into view if needed; waits a frame so measurements are fresh. */
export function ensureInView(el: Element): Promise<void> {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  if (r.top >= 0 && r.bottom <= vh) return Promise.resolve();
  el.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  return new Promise((res) => setTimeout(res, prefersReducedMotion() ? 0 : 350));
}

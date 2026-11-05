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

/**
 * Rect of an element's rendered *content* (text/children), not its box: e.g. a list item that
 * spans a whole column but whose letters only fill the left part. Use as a fly-to target so the
 * flying content lines up with the content it represents. Falls back to the element's own rect.
 */
export function contentRect(el: Element): RectLike {
  const box = el.getBoundingClientRect();
  if (typeof document === 'undefined' || !document.createRange) return box;
  const range = document.createRange();
  range.selectNodeContents(el);
  const r = range.getBoundingClientRect();
  return r.width > 0 && r.height > 0
    ? { left: r.left, top: r.top, width: r.width, height: r.height }
    : box;
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

export interface AttentionFlashOptions {
  /** Number of highlight pulses (default 3). */
  times?: number;
  /** Duration of one pulse cycle in ms (default 280). */
  duration?: number;
  /** CSS class toggled for the flash (default `is-flashing`). */
  className?: string;
}

/**
 * Draw attention to an element by flashing it a few times (CSS class + WAAPI fallback).
 * Resolves when the flashes finish (or immediately under reduced motion / no element).
 */
export function attentionFlash(
  el: Element | null,
  opts: AttentionFlashOptions = {},
): Promise<void> {
  if (!el) return Promise.resolve();
  const target = el;
  const { times = 3, duration = 280, className = 'is-flashing' } = opts;
  const clear = () => target.classList.remove(className);
  target.classList.add(className);
  if (prefersReducedMotion() || typeof (target as HTMLElement).animate !== 'function') {
    return new Promise((res) =>
      setTimeout(() => (clear(), res()), duration * (prefersReducedMotion() ? 1 : times)),
    );
  }
  const frames = Array.from({ length: times * 2 + 1 }, (_, i) => ({
    offset: i / (times * 2),
    filter: i % 2 === 0 ? 'brightness(1)' : 'brightness(1.25)',
  }));
  return (target as HTMLElement)
    .animate(frames, { duration: duration * times, easing: 'ease-in-out' })
    .finished.then(clear, clear);
}

/** Scroll `el` into view if needed; waits a frame so measurements are fresh. */
export function ensureInView(el: Element): Promise<void> {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  if (r.top >= 0 && r.bottom <= vh) return Promise.resolve();
  el.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  return waitForStableRect(el);
}

/** Resolves once `el` has stopped moving (e.g. smooth scrolling finished), or after `maxMs`. */
export function waitForStableRect(el: Element, maxMs = 1200, stableFrames = 3): Promise<void> {
  return new Promise((res) => {
    const t0 = performance.now();
    let last = el.getBoundingClientRect().top;
    let still = 0;
    const tick = () => {
      const top = el.getBoundingClientRect().top;
      still = Math.abs(top - last) < 0.5 ? still + 1 : 0;
      last = top;
      if (still >= stableFrames || performance.now() - t0 > maxMs) res();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** Is the rect fully inside a viewport of height `vh` (and width `vw`, if given)? */
export function isRectInView(r: RectLike, vh: number, vw = Infinity): boolean {
  return r.top >= 0 && r.left >= 0 && r.top + r.height <= vh && r.left + r.width <= vw;
}

/** Is `el` fully visible in the window right now? */
export function isInView(el: Element): boolean {
  return isRectInView(el.getBoundingClientRect(), window.innerHeight, window.innerWidth);
}

/**
 * Show `content` at `rect` in a fixed overlay: pop in, hold, then fade out in place (used when the
 * destination is off-screen and we must not scroll). Resolves immediately under reduced motion.
 */
export function popElement(
  rect: RectLike,
  content: HTMLElement,
  opts: { duration?: number; className?: string } = {},
): Promise<void> {
  if (prefersReducedMotion() || typeof document === 'undefined') return Promise.resolve();
  const el = document.createElement('div');
  el.className = `fly-overlay ${opts.className ?? ''}`.trim();
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    pointerEvents: 'none',
    zIndex: '300',
  });
  el.appendChild(content);
  document.body.appendChild(el);
  const anim = el.animate(
    [
      { transform: 'scale(0.6)', opacity: 0, offset: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.2, easing: 'ease-out' },
      { transform: 'scale(1)', opacity: 1, offset: 0.65 },
      { transform: 'scale(1.08) translateY(-8px)', opacity: 0, offset: 1 },
    ],
    { duration: opts.duration ?? 1000, fill: 'forwards' },
  );
  return anim.finished.then(
    () => el.remove(),
    () => el.remove(),
  );
}

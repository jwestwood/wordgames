/** DOM motion helpers. All honour prefers-reduced-motion. */

export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Destination for flyElement: a fixed rect, a live element (contentRect), or a getter. */
export type FlyTarget = RectLike | Element | (() => RectLike);

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

/** True when `v` looks like a rect (not a DOM node / function). */
function isRectLike(v: FlyTarget): v is RectLike {
  if (!v || typeof v === 'function') return false;
  if (typeof (v as Element).nodeType === 'number') return false;
  if (typeof (v as Element).getBoundingClientRect === 'function') return false;
  const r = v as RectLike;
  return typeof r.left === 'number' && typeof r.top === 'number';
}

/** Resolve a fly target to its current rect (elements use contentRect for letter-level align). */
export function readFlyTarget(to: FlyTarget): RectLike {
  if (typeof to === 'function') return to();
  if (isRectLike(to)) return to;
  return contentRect(to as Element);
}

/**
 * Cubic-bezier easing matching the previous WAAPI default `cubic-bezier(0.5, 0, 0.2, 1)`.
 * Solves for y given x in [0, 1].
 */
export function easeFly(t: number): number {
  const x1 = 0.5;
  const y1 = 0;
  const x2 = 0.2;
  const y2 = 1;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  // Newton-Raphson on x(u) = u, then evaluate y(u).
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = cubic(u, x1, x2) - t;
    const dx = cubicDeriv(u, x1, x2);
    if (Math.abs(dx) < 1e-6) break;
    u -= x / dx;
    u = Math.min(1, Math.max(0, u));
  }
  return cubic(u, y1, y2);
}

function cubic(u: number, a: number, b: number): number {
  // (1-u)^3*0 + 3(1-u)^2*u*a + 3(1-u)*u^2*b + u^3*1
  const u2 = u * u;
  const u3 = u2 * u;
  return 3 * (1 - u) * (1 - u) * u * a + 3 * (1 - u) * u2 * b + u3;
}

function cubicDeriv(u: number, a: number, b: number): number {
  return 3 * (1 - u) * (1 - u) * a + 6 * (1 - u) * u * (b - a) + 3 * u * u * (1 - b);
}

export interface FlyOptions {
  duration?: number;
  /** Kept for API compat; fly uses easeFly (former cubic-bezier(0.5,0,0.2,1)). */
  easing?: string;
  className?: string;
  /** Fraction of the duration spent appearing + holding at the start (0..0.6). */
  hold?: number;
  /** Override start scale (default from.width / to.width). */
  fromScale?: number;
}

/** One rAF frame of a fly: layout at live `to`, invert toward `from` by remaining progress. */
export function flyFrameStyle(
  from: RectLike,
  to: RectLike,
  t: number,
  opts: { hold?: number; fromScale?: number } = {},
): {
  left: number;
  top: number;
  width: number;
  height: number;
  transform: string;
  opacity: number;
} {
  const h = Math.min(0.6, Math.max(0, opts.hold ?? 0.35));
  const appearEnd = h * 0.45;
  const { dx, dy, s } = invertTransform(from, to, opts.fromScale);
  let flyU = 0;
  let opacity = 1;
  let pop = 1;
  if (t < appearEnd) {
    const a = appearEnd > 0 ? t / appearEnd : 1;
    opacity = a;
    pop = 0.6 + 0.4 * a;
  } else if (t >= h) {
    const raw = h < 1 ? (t - h) / (1 - h) : 1;
    flyU = easeFly(Math.min(1, Math.max(0, raw)));
  }
  const inv = 1 - flyU;
  const scale = (1 + (s - 1) * inv) * pop;
  return {
    left: to.left,
    top: to.top,
    width: to.width,
    height: to.height,
    opacity,
    transform: `translate(${dx * inv}px, ${dy * inv}px) scale(${scale})`,
  };
}

/**
 * Fly `content` from `fromRect` to a (possibly moving) destination. The overlay is laid out at the
 * live destination each animation frame (FLIP), so scroll/resize mid-flight still lands on target.
 * `to` may be a rect, an Element (measured with contentRect), or a getter. Resolves when finished
 * and the overlay is removed. Under reduced motion resolves immediately.
 */
export function flyElement(
  fromRect: RectLike,
  to: FlyTarget,
  content: HTMLElement | string,
  opts: FlyOptions = {},
): Promise<void> {
  if (prefersReducedMotion() || typeof document === 'undefined') return Promise.resolve();
  const { duration = 900, hold = 0.35 } = opts;
  const el = document.createElement('div');
  el.className = `fly-overlay ${opts.className ?? ''}`.trim();
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '300',
    transformOrigin: 'center',
    willChange: 'transform, opacity, left, top',
  });
  if (typeof content === 'string') el.textContent = content;
  else el.appendChild(content);
  document.body.appendChild(el);

  return new Promise((resolve) => {
    const t0 = performance.now();
    let raf = 0;
    const finish = () => {
      cancelAnimationFrame(raf);
      el.remove();
      resolve();
    };
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0) / duration));
      const dest = readFlyTarget(to);
      const frame = flyFrameStyle(fromRect, dest, t, {
        hold,
        fromScale: opts.fromScale,
      });
      el.style.left = `${frame.left}px`;
      el.style.top = `${frame.top}px`;
      el.style.width = `${frame.width}px`;
      el.style.height = `${frame.height}px`;
      el.style.opacity = String(frame.opacity);
      el.style.transform = frame.transform;
      if (t < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
  });
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

/** Measure the same styled content in body, then pop it over an anchor (no scroll/hidden targets). */
export function popOverElement(
  anchor: Element,
  content: HTMLElement,
  opts: { className?: string; duration?: number; scale?: number } = {},
): Promise<void> {
  if (prefersReducedMotion() || typeof document === 'undefined') return Promise.resolve();
  const measure = document.createElement('div');
  Object.assign(measure.style, { position: 'fixed', visibility: 'hidden', width: 'max-content' });
  measure.appendChild(content);
  document.body.appendChild(measure);
  const r = content.getBoundingClientRect();
  measure.remove();
  if (!r.width || !r.height) return Promise.resolve();
  const box = anchor.getBoundingClientRect();
  const scale = Math.min(opts.scale ?? 2.6, (box.width * 0.8) / r.width);
  content.style.transform = `scale(${scale})`;
  content.style.transformOrigin = 'center';
  return popElement(centredRect(box, r.width, r.height), content, opts);
}

/** Reveal only inside a sheet's scroller, never by scrolling ancestors/the document. */
export function ensureInScrollContainer(el: Element, scroller: HTMLElement): Promise<void> {
  const r = el.getBoundingClientRect();
  const box = scroller.getBoundingClientRect();
  if (r.top >= box.top && r.bottom <= box.bottom) return Promise.resolve();
  scroller.scrollBy({
    top: r.top - box.top - (box.height - r.height) / 2,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
  return waitForStableRect(el);
}

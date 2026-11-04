/**
 * Touch-friendly "press" handling: fire on pointerdown (so a tap can't be lost to a tiny drag,
 * a pointercancel or the browser deciding the gesture was a scroll), then swallow the click the
 * browser synthesises afterwards. Clicks with no preceding pointerdown (keyboard/assistive tech)
 * still fire. Pair with the `.no-touch-gestures` styles (touch-action: none etc.).
 */
export interface PressGuard {
  /** Call on pointerdown; returns true if the press should fire now. */
  down(e: { button: number; isPrimary?: boolean }, now: number): boolean;
  /** Call on click; returns true if the click should fire (not a duplicate of a press). */
  click(now: number): boolean;
}

/** `window` ms within which a click after a handled pointerdown is treated as its duplicate. */
export function createPressGuard(window = 800): PressGuard {
  let last = -Infinity;
  return {
    down(e, now) {
      if (e.button !== 0 || e.isPrimary === false) return false;
      last = now;
      return true;
    },
    click(now) {
      const dup = now - last < window;
      last = -Infinity;
      return !dup;
    },
  };
}

/** React props for an element that should act on press: `{...pressProps(guard, fn)}`. */
export function pressProps(guard: PressGuard, fn: () => void) {
  return {
    onPointerDown: (e: { button: number; isPrimary?: boolean; preventDefault(): void }) => {
      if (!guard.down(e, performance.now())) return;
      e.preventDefault(); // no focus-steal / text selection / emulated mouse events
      fn();
    },
    onClick: () => {
      if (guard.click(performance.now())) fn();
    },
  };
}

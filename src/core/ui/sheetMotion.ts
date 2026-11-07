import { prefersReducedMotion } from './motion';

export type SheetPhase = 'closed' | 'opening' | 'open' | 'closing';
export const SHEET_TRANSITION_MS = 280;

/** Closing is still a modal presence: do not hide/unlock/restore focus until it is closed. */
export function isSheetPresent(open: boolean, phase: SheetPhase): boolean {
  return open || phase !== 'closed';
}

/** Interruptible, fixed-position sheet motion; caller retains modal presence until finished. */
export function transitionSheet(panel: HTMLElement, backdrop: HTMLElement | null, open: boolean) {
  const transform = open ? 'translateY(0%)' : 'translateY(100%)';
  const opacity = open ? '1' : '0';
  const animations: Animation[] = [];
  let settled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let resolve!: (completed: boolean) => void;
  const finished = new Promise<boolean>((done) => {
    resolve = done;
  });
  const finish = (completed: boolean) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    // Snapshot before cancel so rapid open/close reversals start at the current position.
    panel.style.transform = completed ? transform : getComputedStyle(panel).transform;
    if (backdrop) backdrop.style.opacity = completed ? opacity : getComputedStyle(backdrop).opacity;
    animations.forEach((animation) => animation.cancel());
    resolve(completed);
  };
  if (prefersReducedMotion() || typeof panel.animate !== 'function') finish(true);
  else {
    const options: KeyframeAnimationOptions = {
      duration: SHEET_TRANSITION_MS,
      fill: 'both',
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    };
    animations.push(
      panel.animate([{ transform: getComputedStyle(panel).transform }, { transform }], options),
    );
    if (backdrop && typeof backdrop.animate === 'function') {
      animations.push(
        backdrop.animate([{ opacity: getComputedStyle(backdrop).opacity }, { opacity }], options),
      );
    }
    // A suspended/failed WAAPI promise must not strand focus or scroll lock through exit.
    timer = setTimeout(() => finish(true), SHEET_TRANSITION_MS + 80);
    void Promise.all(animations.map((animation) => animation.finished.catch(() => undefined))).then(
      () => finish(true),
    );
  }
  return { finished, cancel: () => finish(false) };
}

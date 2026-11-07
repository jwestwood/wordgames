/** Readable pause after the ink settles; retained even with reduced motion. */
export const DISCOVERY_HOLD_MS = 750;

/** Single-owner auto-dismiss lease. User interaction/new discovery invalidates stale holds. */
export function createAutoDismiss() {
  let generation = 0;
  let active: number | undefined;
  let release: (() => void) | undefined;
  const cancel = () => {
    active = undefined;
    generation++;
    release?.();
    release = undefined;
  };
  return {
    begin() {
      cancel();
      active = generation;
      return active;
    },
    cancel,
    isCurrent(token: number | undefined) {
      return token !== undefined && token === active;
    },
    hold(token: number, ms = DISCOVERY_HOLD_MS): Promise<boolean> {
      if (token !== active) return Promise.resolve(false);
      release?.();
      return new Promise((resolve) => {
        const finish = (elapsed: boolean) => {
          clearTimeout(timer);
          if (release === stop) release = undefined;
          resolve(elapsed && token === active);
        };
        const stop = () => finish(false);
        const timer = setTimeout(() => finish(true), ms);
        release = stop;
      });
    },
  };
}

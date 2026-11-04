import { useCallback, useEffect, useRef, useState } from 'react';

export interface Timers {
  set(fn: () => void, ms: number): unknown;
  clear(id: unknown): void;
}
const realTimers: Timers = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
};

/** Holds a message that clears itself after `ms`; showing again restarts the timer. */
export function createTransient<T>(
  onChange: (value: T | null) => void,
  ms: number,
  timers: Timers = realTimers,
) {
  let id: unknown = null;
  const stop = () => {
    if (id !== null) timers.clear(id);
    id = null;
  };
  return {
    show(value: T) {
      stop();
      onChange(value);
      id = timers.set(() => {
        id = null;
        onChange(null);
      }, ms);
    },
    clear() {
      stop();
      onChange(null);
    },
    dispose: stop,
  };
}

/** React wrapper: `[message, show, clear]`; message auto-hides after `ms` (default 2800). */
export function useTransientMessage<T>(ms = 2800) {
  const [msg, setMsg] = useState<T | null>(null);
  const ctl = useRef<ReturnType<typeof createTransient<T>>>();
  if (!ctl.current) ctl.current = createTransient<T>(setMsg, ms);
  useEffect(() => () => ctl.current?.dispose(), []);
  const show = useCallback((v: T) => ctl.current!.show(v), []);
  const clear = useCallback(() => ctl.current!.clear(), []);
  return [msg, show, clear] as const;
}

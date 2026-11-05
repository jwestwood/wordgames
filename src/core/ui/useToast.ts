import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createTransient } from './transient';
import type { ToastItem, ToastTone } from './Toast';

/** `[toast, show, clear]` — `show(text, tone?)` replaces any current toast; auto-hides after `ms`. */
export function useToast(ms = 2800) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const nextId = useRef(0);
  const ctl = useRef<ReturnType<typeof createTransient<ToastItem>>>();
  if (!ctl.current) {
    ctl.current = createTransient<ToastItem>((v) => setToast(v), ms);
  }
  useEffect(() => () => ctl.current?.dispose(), []);
  const show = useCallback((text: ReactNode, tone: ToastTone = 'info') => {
    ctl.current!.show({ id: ++nextId.current, text, tone });
  }, []);
  const clear = useCallback(() => ctl.current!.clear(), []);
  return [toast, show, clear] as const;
}

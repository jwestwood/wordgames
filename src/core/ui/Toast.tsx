import { useId, type ReactNode } from 'react';

export type ToastTone = 'good' | 'bad' | 'info';

export interface ToastItem {
  id: number;
  text: ReactNode;
  tone: ToastTone;
}

export interface ToastStackProps {
  /** Current toast (replace style: one at a time). Pass null to hide. */
  toast: ToastItem | null;
  className?: string;
}

/**
 * Paper toast overlay. Parent must be `position: relative` (e.g. a Panel). Slides in from the top
 * of that container. Prefer one toast at a time (new show() replaces the previous).
 */
export function ToastStack({ toast, className = '' }: ToastStackProps) {
  const labelId = useId();
  return (
    <div className={`toast-stack ${className}`.trim()} aria-live="polite" aria-relevant="additions">
      {toast && (
        <div key={toast.id} id={labelId} role="status" className={`toast toast--${toast.tone}`}>
          <span className="toast__mark" aria-hidden="true">
            {toast.tone === 'good' ? '✓' : toast.tone === 'bad' ? '✗' : '•'}
          </span>
          <span className="toast__text">{toast.text}</span>
        </div>
      )}
    </div>
  );
}

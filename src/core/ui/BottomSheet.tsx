import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { IconX } from './Icons';
import { trapFocusIndex } from './logic';
import { isolateDialog, lockBodyScroll } from './dialog';
import { isSheetPresent, transitionSheet, type SheetPhase } from './sheetMotion';

export interface BottomSheetProps {
  /** false = normal inline content (desktop), true = bottom-sheet dialog. */
  enabled?: boolean;
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Extra 40px controls in the sheet heading, immediately before Close. */
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
  /** Explicit focus return for auto-open sheets whose triggering button may become disabled. */
  returnFocusId?: string;
  onPhaseChange?: (phase: SheetPhase) => void;
  /** Explicit browsing cancels a game's auto-dismiss; programmatic focus/scroll does not. */
  onInteract?: () => void;
}
const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])';

/** One mounted content tree: internal scroll, clues and focus survive close/reopen. */
export function BottomSheet({
  enabled = true,
  open,
  onClose,
  title,
  actions,
  children,
  id,
  returnFocusId,
  onPhaseChange,
  onInteract,
}: BottomSheetProps) {
  const branch = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<SheetPhase>('closed');
  const phaseRef = useRef<SheetPhase>('closed');
  const notify = useRef(onPhaseChange);
  notify.current = onPhaseChange;
  useEffect(() => {
    const update = (next: SheetPhase) => {
      phaseRef.current = next;
      setPhase(next);
      notify.current?.(next);
    };
    const panel = dialog.current;
    if (!enabled || !panel) {
      if (panel) panel.style.transform = '';
      update('closed');
      return;
    }
    if (!open && phaseRef.current === 'closed') {
      update('closed');
      return;
    }
    update(open ? 'opening' : 'closing');
    const motion = transitionSheet(panel, backdrop.current, open);
    let alive = true;
    void motion.finished.then((completed) => {
      if (alive && completed) update(open ? 'open' : 'closed');
    });
    return () => {
      alive = false;
      motion.cancel();
    };
  }, [enabled, open]);
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  // Keep aria/inert/focus/scroll lock alive through the complete exit animation.
  const active = enabled && isSheetPresent(open, phase);
  // Stable callback ref: progress / clue renders must not restart the focus trap.
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!active || !branch.current || !dialog.current) return;
    const panel = dialog.current;
    const prev = document.activeElement as HTMLElement | null;
    const unlock = lockBodyScroll();
    const unisolate = isolateDialog(branch.current);
    const items = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.closest('[hidden]') && el.getClientRects().length > 0,
      );
    (items()[0] ?? panel).focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      // A later modal (e.g. Perfect) owns its own keyboard while it is open.
      if (Array.from(document.querySelectorAll('[aria-modal="true"]')).at(-1) !== panel) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close.current();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const list = items();
        const i = trapFocusIndex(
          list.indexOf(document.activeElement as HTMLElement),
          list.length,
          e.shiftKey,
        );
        (list[i] ?? panel).focus({ preventScroll: true });
      }
    };
    const focus = (e: FocusEvent) => {
      if (!panel.contains(e.target as Node) && !document.querySelector('.modal-backdrop')) {
        (items()[0] ?? panel).focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', key);
    document.addEventListener('focusin', focus);
    return () => {
      document.removeEventListener('keydown', key);
      document.removeEventListener('focusin', focus);
      unisolate();
      unlock();
      const target = (returnFocusId ? document.getElementById(returnFocusId) : null) ?? prev;
      if (target?.isConnected) target.focus({ preventScroll: true });
    };
  }, [active, returnFocusId]);
  return (
    <div
      ref={branch}
      className={enabled ? 'bottom-sheet' : 'bottom-sheet-inline'}
      hidden={enabled && !active}
      data-state={enabled ? phase : undefined}
      onPointerDownCapture={onInteract}
      onKeyDownCapture={onInteract}
      onWheelCapture={onInteract}
      onTouchMoveCapture={onInteract}
    >
      {enabled && (
        <div
          ref={backdrop}
          className="bottom-sheet__backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        ref={dialog}
        id={id}
        className={enabled ? 'bottom-sheet__panel' : undefined}
        role={active ? 'dialog' : undefined}
        aria-modal={active ? true : undefined}
        aria-labelledby={enabled ? titleId : undefined}
        tabIndex={enabled ? -1 : undefined}
      >
        {enabled && (
          <div className="bottom-sheet__head">
            <h2 id={titleId}>{title}</h2>
            <div className="bottom-sheet__actions">
              {actions}
              <Button
                variant="secondary"
                className="btn--icon"
                aria-label="Close words tray"
                onClick={onClose}
              >
                <IconX />
              </Button>
            </div>
          </div>
        )}
        <div className={enabled ? 'bottom-sheet__scroll' : undefined}>{children}</div>
      </div>
    </div>
  );
}

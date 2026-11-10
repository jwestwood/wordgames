import { Button } from './Button';

export interface BonusToggleProps {
  count: number;
  open: boolean;
  onClick: () => void;
  className?: string;
  listId?: string;
  disabled?: boolean;
}

/** 40px disclosure control for a found-bonus count. */
export function BonusToggle({
  count,
  open,
  onClick,
  className = '',
  listId,
  disabled = false,
}: BonusToggleProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={`bonus-counter__toggle ${className}`.trim()}
      aria-expanded={open}
      aria-controls={listId}
      disabled={disabled}
      onClick={onClick}
    >
      Bonus: <strong>{count}</strong>
      {count > 0 && (
        <span className="bonus-counter__chevron" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
      )}
    </Button>
  );
}

export interface BonusWordListProps {
  words: readonly string[];
  className?: string;
  id?: string;
}

/** Found bonus words, in discovery order. */
export function BonusWordList({ words, className = '', id }: BonusWordListProps) {
  if (!words.length) return null;
  return (
    <ul id={id} className={`bonus-counter__list ${className}`.trim()}>
      {words.map((w) => (
        <li key={w}>{w.toUpperCase()}</li>
      ))}
    </ul>
  );
}

export interface BonusCounterProps {
  count: number;
  /** Found bonus words, in discovery order. Shown when `showWords` is true. */
  words?: readonly string[];
  showWords?: boolean;
  className?: string;
}

/** A compact "Bonus: N" count, with an optional list of found bonus words. */
export function BonusCounter({
  count,
  words = [],
  showWords = false,
  className = '',
}: BonusCounterProps) {
  const shown = showWords ? words : [];
  return (
    <div className={`bonus-counter ${className}`.trim()}>
      <p className="bonus-counter__label" aria-live="polite">
        Bonus: <strong>{count}</strong>
      </p>
      <BonusWordList words={shown} />
    </div>
  );
}

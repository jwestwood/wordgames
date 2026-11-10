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
      {shown.length > 0 && (
        <ul className="bonus-counter__list">
          {shown.map((w) => (
            <li key={w}>{w.toUpperCase()}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

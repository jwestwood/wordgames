export interface BonusCounterProps {
  count: number;
  /** Found bonus words, in discovery order. Shown when `showWords` is true. */
  words?: readonly string[];
  showWords?: boolean;
  /**
   * When true and there are words to show, the list sits behind a compact
   * disclosure so it does not take a permanent block of space.
   */
  collapsible?: boolean;
  className?: string;
}

/** A compact "Bonus: N" count, with an optional list of found bonus words. */
export function BonusCounter({
  count,
  words = [],
  showWords = false,
  collapsible = false,
  className = '',
}: BonusCounterProps) {
  const shown = showWords ? words : [];
  const list =
    shown.length > 0 ? (
      <ul className="bonus-counter__list">
        {shown.map((w) => (
          <li key={w}>{w.toUpperCase()}</li>
        ))}
      </ul>
    ) : null;
  if (collapsible && list) {
    return (
      <details className={`bonus-counter bonus-counter--collapsible ${className}`.trim()}>
        <summary className="bonus-counter__label">
          Bonus: <strong>{count}</strong>
        </summary>
        {list}
      </details>
    );
  }
  return (
    <div className={`bonus-counter ${className}`.trim()}>
      <p className="bonus-counter__label" aria-live="polite">
        Bonus: <strong>{count}</strong>
      </p>
      {list}
    </div>
  );
}

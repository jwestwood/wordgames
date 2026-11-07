/**
 * Word list of blank letter slots. Optional per-word clue letters and a "picking" mode for
 * clue selection (tap a blank to request a clue). Games supply the clue letters; this component
 * stays display + pick UI only.
 */
export interface WordSlotsProps {
  /** All words, in display order. */
  words: readonly string[];
  revealed: ReadonlySet<string>;
  /** Most recently revealed word (highlighted). */
  latest?: string;
  /** Words kept blank while waiting for their reveal. */
  hidden?: ReadonlySet<string>;
  /** Transient discovery reveal only; saved games must not populate this. */
  revealing?: ReadonlySet<string>;
  /**
   * Optional known letters for unrevealed words (same length as the word; `null`/empty = blank).
   * Used for clues: e.g. `[null,null,null,'t']` then `[null,null,'n','t']`.
   */
  known?: ReadonlyMap<string, readonly (string | null)[]>;
  /** When true, eligible unrevealed words get layout-neutral outlines and expanded hit areas. */
  picking?: boolean;
  /** Words that can be picked while `picking` (defaults to every unrevealed word). */
  pickable?: ReadonlySet<string>;
  onPick?: (word: string) => void;
}

/** A list of words where unrevealed ones show as blank letter slots (length visible). */
export function WordSlots({
  words,
  revealed,
  latest,
  hidden,
  revealing,
  known,
  picking = false,
  pickable,
  onPick,
}: WordSlotsProps) {
  return (
    <ol className={`word-slots${picking ? ' word-slots--picking' : ''}`}>
      {words.map((w) => {
        const animating = revealing?.has(w) ?? false;
        const shown = revealed.has(w) && (!hidden?.has(w) || animating);
        const letters = known?.get(w);
        const canPick = picking && !shown && (pickable ? pickable.has(w) : true) && !!onPick;
        const knownCount = letters?.filter(Boolean).length ?? 0;
        const label = shown
          ? w
          : knownCount
            ? `${w.length} letter word, ${letters!
                .map((c, i) =>
                  c ? c.toUpperCase() : i === 0 || i === w.length - 1 ? 'blank' : '…',
                )
                .filter((x, i, a) => x !== '…' || a[i - 1] !== '…')
                .join(' ')}`
            : `${w.length} letter word, not found`;
        return (
          <li
            key={w}
            data-word={w}
            className={`word-slots__item${shown ? ' word-slots__item--shown' : ''}${
              w === latest ? ' word-slots__item--latest' : ''
            }${animating ? ' word-slots__item--revealing' : ''}${canPick ? ' word-slots__item--pickable' : ''}${
              knownCount && !shown ? ' word-slots__item--clued' : ''
            }`}
            role={canPick ? 'button' : undefined}
            tabIndex={canPick ? 0 : undefined}
            aria-label={canPick ? `Clue for ${label}` : label}
            onClick={canPick ? () => onPick!(w) : undefined}
            onKeyDown={
              canPick
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onPick!(w);
                    }
                  }
                : undefined
            }
          >
            {[...w].map((c, i) => {
              const k = letters?.[i];
              const ch = shown ? c.toUpperCase() : k ? k.toUpperCase() : '';
              return (
                <span
                  key={i}
                  className={`word-slots__cell${k && !shown ? ' word-slots__cell--clue' : ''}`}
                  aria-hidden="true"
                >
                  <span className="word-slots__ink">{ch}</span>
                </span>
              );
            })}
          </li>
        );
      })}
    </ol>
  );
}

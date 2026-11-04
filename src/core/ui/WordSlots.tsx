export interface WordSlotsProps {
  /** All words, in display order. */
  words: readonly string[];
  revealed: ReadonlySet<string>;
  /** Most recently revealed word (highlighted). */
  latest?: string;
}

/** A list of words where unrevealed ones show as blank letter slots (length visible). */
export function WordSlots({ words, revealed, latest }: WordSlotsProps) {
  return (
    <ol className="word-slots">
      {words.map((w) => {
        const shown = revealed.has(w);
        return (
          <li
            key={w}
            className={`word-slots__item${shown ? ' word-slots__item--shown' : ''}${
              w === latest ? ' word-slots__item--latest' : ''
            }`}
            aria-label={shown ? w : `${w.length} letter word, not found`}
          >
            {[...w].map((c, i) => (
              <span key={i} className="word-slots__cell" aria-hidden="true">
                {shown ? c.toUpperCase() : ''}
              </span>
            ))}
          </li>
        );
      })}
    </ol>
  );
}

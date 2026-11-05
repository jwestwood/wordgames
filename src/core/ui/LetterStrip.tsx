/** Quiet alphabetical strip of distinct letters (visual reference only). */
export interface LetterStripProps {
  /** Letters to show (duplicates ignored; non a–z dropped). */
  letters: string | readonly string[];
  className?: string;
  /** Visible caption before the tiles (default "LETTERS:"). */
  caption?: string;
  /** Accessible name; defaults from the caption. */
  label?: string;
  /** Letters whose tiles should show as complete (highlighted). */
  complete?: ReadonlySet<string>;
}

export function LetterStrip({
  letters,
  className = '',
  caption = 'LETTERS:',
  label,
  complete,
}: LetterStripProps) {
  const source = typeof letters === 'string' ? [...letters] : letters;
  const distinct = [
    ...new Set(source.map((c) => c.toLowerCase()).filter((c) => /^[a-z]$/.test(c))),
  ].sort();
  if (!distinct.length) return null;
  const a11y = label ?? `${caption.replace(/:$/, '')}: ${distinct.join(', ').toUpperCase()}`;
  return (
    <div className={`letter-strip ${className}`.trim()} role="group" aria-label={a11y}>
      <span className="letter-strip__caption" aria-hidden="true">
        {caption}
      </span>
      <ol className="letter-strip__tiles">
        {distinct.map((c) => {
          const done = complete?.has(c) ?? false;
          return (
            <li
              key={c}
              data-letter={c}
              className={`letter-strip__tile${done ? ' letter-strip__tile--complete' : ''}`}
              aria-hidden="true"
            >
              {c.toUpperCase()}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Quiet alphabetical strip of distinct letters (visual reference only). */
export interface LetterStripProps {
  /** Letters to show (duplicates ignored; non a–z dropped). */
  letters: string | readonly string[];
  className?: string;
  label?: string;
}

export function LetterStrip({
  letters,
  className = '',
  label = 'Letters in alphabetical order',
}: LetterStripProps) {
  const source = typeof letters === 'string' ? [...letters] : letters;
  const distinct = [
    ...new Set(source.map((c) => c.toLowerCase()).filter((c) => /^[a-z]$/.test(c))),
  ].sort();
  if (!distinct.length) return null;
  return (
    <ul
      className={`letter-strip ${className}`.trim()}
      aria-label={`${label}: ${distinct.join(', ').toUpperCase()}`}
    >
      {distinct.map((c) => (
        <li key={c} className="letter-strip__cell" aria-hidden="true">
          {c.toUpperCase()}
        </li>
      ))}
    </ul>
  );
}

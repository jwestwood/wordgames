import { useMemo } from 'react';
import { wheelSegments } from './wheel';
import { createPressGuard, pressProps } from './tap';

export interface LetterWheelProps {
  centre: string;
  letters: readonly string[];
  /** Indices of outer letters currently used in the guess (dimmed / disabled). */
  used?: ReadonlySet<number>;
  onCentre?: () => void;
  onLetter?: (index: number) => void;
  label?: string;
  /** Centre letter is in the current guess (shown in the bold selected style). */
  centreSelected?: boolean;
  /** Non-interactive picture (e.g. history thumbnails): no buttons, one image label. */
  static?: boolean;
}

/** Segmented circle of letter buttons with a highlighted centre letter. */
export function LetterWheel({
  centre,
  letters,
  used,
  onCentre,
  onLetter,
  label,
  centreSelected = false,
  static: isStatic = false,
}: LetterWheelProps) {
  const segs = useMemo(() => wheelSegments(letters.length), [letters.length]);
  const guard = useMemo(() => createPressGuard(), []);
  if (isStatic) {
    return (
      <svg
        className="wheel wheel--static"
        viewBox="0 0 200 200"
        role="img"
        aria-label={
          label ?? `Letter wheel: ${letters.join('').toUpperCase()}, centre ${centre.toUpperCase()}`
        }
      >
        {segs.map((s) => (
          <g key={s.index} className="wheel__seg">
            <path d={s.path} />
            <text x={s.x} y={s.y} dy="0.35em" textAnchor="middle">
              {letters[s.index].toUpperCase()}
            </text>
          </g>
        ))}
        <g className="wheel__seg wheel__centre">
          <circle cx="100" cy="100" r="36" />
          <text x="100" y="100" dy="0.35em" textAnchor="middle">
            {centre.toUpperCase()}
          </text>
        </g>
      </svg>
    );
  }
  return (
    <svg
      className="wheel no-touch-gestures"
      viewBox="0 0 200 200"
      role="group"
      aria-label={label ?? 'Letter wheel'}
    >
      {segs.map((s) => {
        const isUsed = used?.has(s.index) ?? false;
        const letter = letters[s.index];
        return (
          <g
            key={s.index}
            className={`wheel__seg${isUsed ? ' wheel__seg--used' : ''}`}
            role="button"
            tabIndex={isUsed ? -1 : 0}
            aria-label={`${letter.toUpperCase()}${isUsed ? ', used' : ''}`}
            aria-disabled={isUsed}
            {...pressProps(guard, () => !isUsed && onLetter?.(s.index))}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !isUsed) {
                e.preventDefault();
                e.stopPropagation();
                onLetter?.(s.index);
              }
            }}
          >
            <path d={s.path} />
            <text x={s.x} y={s.y} dy="0.35em" textAnchor="middle" aria-hidden="true">
              {letter.toUpperCase()}
            </text>
          </g>
        );
      })}
      <g
        className={`wheel__seg wheel__centre${centreSelected ? ' wheel__centre--selected' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`${centre.toUpperCase()}, required letter${centreSelected ? ', used' : ''}`}
        {...pressProps(guard, () => onCentre?.())}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onCentre?.();
          }
        }}
      >
        <circle cx="100" cy="100" r="36" />
        <text x="100" y="100" dy="0.35em" textAnchor="middle" aria-hidden="true">
          {centre.toUpperCase()}
        </text>
      </g>
    </svg>
  );
}

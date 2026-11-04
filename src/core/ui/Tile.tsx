import type { ButtonHTMLAttributes } from 'react';
import { tileLabel, type TileState } from './logic';

export interface TileProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  letter: string;
  state?: TileState;
  /** Optional point value shown in the corner, Scrabble-style. */
  value?: number;
  size?: 'sm' | 'md' | 'lg';
  /** Render as a static span instead of a button. */
  static?: boolean;
}

export function Tile({
  letter,
  state = 'default',
  value,
  size = 'md',
  static: isStatic,
  className = '',
  ...props
}: TileProps) {
  const cls = `tile tile--${state} tile--${size} ${className}`.trim();
  const content = (
    <>
      <span className="tile__letter" aria-hidden="true">
        {letter.toUpperCase()}
      </span>
      {value !== undefined && (
        <span className="tile__value" aria-hidden="true">
          {value}
        </span>
      )}
    </>
  );
  const label = tileLabel(letter, state) + (value !== undefined ? `, ${value} points` : '');
  if (isStatic) {
    return (
      <span className={cls} role="img" aria-label={label} data-state={state}>
        {content}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      aria-label={label}
      aria-pressed={state === 'selected'}
      data-state={state}
      {...props}
    >
      {content}
    </button>
  );
}

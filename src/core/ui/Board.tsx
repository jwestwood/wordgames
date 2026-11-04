import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { gridNavigate } from './logic';

export interface BoardProps {
  cols: number;
  children: ReactNode;
  label?: string;
  className?: string;
}

/** Wooden board laying out children in a grid with arrow-key navigation between buttons. */
export function Board({ cols, children, label = 'Game board', className = '' }: BoardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      ref.current?.querySelectorAll<HTMLElement>('button, [tabindex]') ?? [],
    );
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const next = gridNavigate(i, e.key, cols, items.length);
    if (next !== i) {
      e.preventDefault();
      items[next].focus();
    }
  };
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={`board ${className}`.trim()}
      style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}

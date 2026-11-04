import type { ReactNode } from 'react';
import { Button } from './Button';
import { IconClock } from './Icons';

export interface HeaderProps {
  title?: ReactNode;
  tagline?: ReactNode;
  nav?: Array<{ href: string; label: string }>;
  children?: ReactNode;
  /** When set, shows a clock button that opens the puzzle history. */
  onHistory?: () => void;
}

export function Header({
  title = 'Word Games',
  tagline,
  nav = [],
  children,
  onHistory,
}: HeaderProps) {
  return (
    <header className="site-header">
      <div>
        <a className="site-header__title" href="#/">
          {title}
        </a>
        {tagline && <p className="site-header__tagline">{tagline}</p>}
      </div>
      <div className="site-header__end">
        {nav.length > 0 && (
          <nav aria-label="Main">
            <ul className="site-header__nav">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href}>{n.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {onHistory && (
          <Button
            variant="secondary"
            size="sm"
            className="btn--icon site-header__history"
            onClick={onHistory}
            aria-label="Puzzle history"
            title="Your puzzles"
          >
            <IconClock />
          </Button>
        )}
      </div>
      {children}
    </header>
  );
}

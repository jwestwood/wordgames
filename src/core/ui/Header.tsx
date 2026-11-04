import type { ReactNode } from 'react';
import { Button } from './Button';
import { IconClock, IconSpeaker, IconSpeakerOff } from './Icons';
import { useMuted } from '../audio/hooks';

export interface HeaderProps {
  title?: ReactNode;
  tagline?: ReactNode;
  /** Nav links; with `icon` they render as icon-only buttons (label becomes aria-label/title). */
  nav?: Array<{ href: string; label: string; icon?: ReactNode }>;
  children?: ReactNode;
  /** When set, shows a clock button that opens the puzzle history. */
  onHistory?: () => void;
  /** Show the shared sound on/off toggle (default true). */
  soundToggle?: boolean;
}

export function Header({
  title = 'Word Games',
  tagline,
  nav = [],
  children,
  onHistory,
  soundToggle = true,
}: HeaderProps) {
  const [muted, toggleMuted] = useMuted();
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
                  {n.icon ? (
                    <a
                      className="btn btn--ghost btn--sm btn--icon"
                      href={n.href}
                      aria-label={n.label}
                      title={n.label}
                    >
                      {n.icon}
                    </a>
                  ) : (
                    <a href={n.href}>{n.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}
        {onHistory && (
          <Button
            variant="secondary"
            size="sm"
            className="site-header__history"
            onClick={onHistory}
            title="Your past games"
          >
            <IconClock />
            <span>Past Games</span>
          </Button>
        )}
        {soundToggle && (
          <Button
            variant="secondary"
            size="sm"
            className="btn--icon site-header__sound"
            onClick={toggleMuted}
            aria-pressed={!muted}
            aria-label="Sound"
            title={muted ? 'Sound off (click to unmute)' : 'Sound on (click to mute)'}
          >
            {muted ? <IconSpeakerOff /> : <IconSpeaker />}
          </Button>
        )}
      </div>
      {children}
    </header>
  );
}

import type { ReactNode } from 'react';

export interface HeaderProps {
  title?: ReactNode;
  tagline?: ReactNode;
  nav?: Array<{ href: string; label: string }>;
  children?: ReactNode;
}

export function Header({ title = 'Word Games', tagline, nav = [], children }: HeaderProps) {
  return (
    <header className="site-header">
      <div>
        <a className="site-header__title" href="#/">
          {title}
        </a>
        {tagline && <p className="site-header__tagline">{tagline}</p>}
      </div>
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
      {children}
    </header>
  );
}

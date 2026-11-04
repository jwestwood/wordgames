import type { ReactNode } from 'react';

export interface FooterProps {
  links?: Array<{ href: string; label: string }>;
  children?: ReactNode;
}

/** Small, unobtrusive paper footer shown on every page. */
export function Footer({ links = [], children }: FooterProps) {
  return (
    <footer className="site-footer">
      {children}
      {links.length > 0 && (
        <nav aria-label="Footer">
          <ul className="site-footer__links">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </footer>
  );
}

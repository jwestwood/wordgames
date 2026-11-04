import type { ComponentType } from 'react';
import { useEffect } from 'react';

/** Props every brand icon/logo component accepts. */
export interface BrandMarkProps {
  /** Rendered height in px (icons are square; logos ~4:1). */
  size?: number;
  /** Accessible label; omit (or '') for decorative use next to visible text. */
  title?: string;
  className?: string;
}

/** Per-game branding (see STYLE_GUIDE.md › Branding). */
export interface GameBrand {
  /** Square mark, must read at 32px. Inline SVG using theme CSS variables. */
  Icon: ComponentType<BrandMarkProps>;
  /** Wide (~4:1) logo: mark + wordmark. */
  Logo: ComponentType<BrandMarkProps>;
  /** One short, catchy line. */
  tagline: string;
  /** Optional single accent touch: a theme CSS variable, e.g. 'var(--color-red)'. */
  accent?: string;
  /** Optional standalone SVG URL (hex colours, no web fonts) used as favicon on the game page. */
  favicon?: string;
}

export const SITE_TITLE = 'Word Games';

/** Document title for a game page: "Letter Wheel — Spin it to win it · Word Games". */
export function documentTitle(title?: string, tagline?: string, site = SITE_TITLE): string {
  if (!title) return site;
  return `${title}${tagline ? ` — ${tagline}` : ''} · ${site}`;
}

/** Sets document title and (optionally) favicon while mounted; restores previous values. */
export function useDocumentBrand(title?: string, tagline?: string, favicon?: string) {
  useEffect(() => {
    if (typeof document === 'undefined' || !title) return;
    const prevTitle = document.title;
    document.title = documentTitle(title, tagline);
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const prevHref = link?.getAttribute('href') ?? null;
    if (favicon) {
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.type = 'image/svg+xml';
      link.href = favicon;
    }
    return () => {
      document.title = prevTitle;
      if (favicon && link) {
        if (prevHref) link.setAttribute('href', prevHref);
        else link.remove();
      }
    };
  }, [title, tagline, favicon]);
}

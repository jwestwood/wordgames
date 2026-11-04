import { useEffect, useState } from 'react';

/** Parse a location hash like "#/games/foo" into path segments. */
export function parseHash(hash: string): string[] {
  return hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
}

/** Minimal hash router (works on static hosting e.g. GitHub Pages). */
export function useHashRoute(): string[] {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

import { useLayoutEffect } from 'react';
import { useMediaQuery } from './useMediaQuery';

/** Route-owned CSS flag, independent of a sheet's inline overflow snapshot/restore. */
export function acquireFixedGameViewport(doc: Document): () => void {
  const root = doc.documentElement;
  const before = root.getAttribute('data-fixed-game');
  const meta = doc.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  const content = meta?.getAttribute('content') ?? null;
  root.setAttribute('data-fixed-game', '');
  // Firefox Android 132+ otherwise resizes only the visual viewport for the keyboard.
  // Let CSS viewport units resize with the keyboard; never restrict pinch zoom.
  if (meta) {
    const directives = (content ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !/^interactive-widget\s*=/i.test(s));
    meta.setAttribute('content', [...directives, 'interactive-widget=resizes-content'].join(', '));
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (before === null) root.removeAttribute('data-fixed-game');
    else root.setAttribute('data-fixed-game', before);
    if (meta) {
      if (content === null) meta.removeAttribute('content');
      else meta.setAttribute('content', content);
    }
  };
}

/** CSS owns all sizing; no visualViewport listeners or competing inline scroll locks. */
export function useFixedGameViewport(gameRoute: boolean) {
  const mobile = useMediaQuery('(max-width: 859px)');
  useLayoutEffect(() => {
    if (gameRoute && mobile) return acquireFixedGameViewport(document);
  }, [gameRoute, mobile]);
}

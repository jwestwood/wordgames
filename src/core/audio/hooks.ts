import { useCallback, useSyncExternalStore } from 'react';
import { createSoundManager, type AudioCtxLike, type PlayOptions } from './manager';
import { SOUNDS, type SoundName } from './sounds';

function browserManager() {
  const w = typeof window !== 'undefined' ? window : undefined;
  const AC =
    w &&
    ((w as unknown as { AudioContext?: new () => AudioCtxLike }).AudioContext ??
      (w as unknown as { webkitAudioContext?: new () => AudioCtxLike }).webkitAudioContext);
  const probe = typeof document !== 'undefined' ? document.createElement('audio') : null;
  const m = createSoundManager<SoundName>({
    sounds: SOUNDS,
    createContext: () => (AC ? new AC() : null),
    canPlay: (url) => {
      if (!probe?.canPlayType) return true;
      const type = url.endsWith('.ogg') ? 'audio/ogg; codecs="vorbis"' : 'audio/mpeg';
      return probe.canPlayType(type) !== '';
    },
    storage: (() => {
      try {
        return w?.localStorage ?? null;
      } catch {
        return null;
      }
    })(),
    isHidden: () => typeof document !== 'undefined' && document.visibilityState === 'hidden',
  });
  if (w && AC) {
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    const unlock = () => {
      events.forEach((e) => w.removeEventListener(e, unlock, true));
      void m.unlock();
    };
    events.forEach((e) => w.addEventListener(e, unlock, true));
    document.addEventListener('visibilitychange', () => m.onVisibility());
  }
  return m;
}

/** App-wide sound manager (shared by all games). */
export const sound = browserManager();

/** Returns a stable `play(name, opts?)`. */
export function useSound() {
  return useCallback((name: SoundName, o?: PlayOptions) => sound.play(name, o), []);
}

/** `[muted, toggle]`, persisted in localStorage. */
export function useMuted() {
  const muted = useSyncExternalStore(
    sound.subscribe,
    () => sound.muted,
    () => false,
  );
  const toggle = useCallback(() => {
    const m = sound.toggleMuted();
    if (!m) void sound.unlock().then(() => sound.play('button'));
  }, []);
  return [muted, toggle] as const;
}

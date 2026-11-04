import { useCallback, useSyncExternalStore } from 'react';
import { createSoundManager, type AudioCtxLike, type PlayOptions } from './manager';
import { type SoundName } from './sounds';
import {
  findSoundTheme,
  PREVIEW_SLOT,
  readSoundTheme,
  SOUND_THEME_KEY,
  SOUND_THEMES,
} from './themes';

function safeStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}
let themeId = readSoundTheme(safeStorage());
const themeListeners = new Set<() => void>();

function browserManager() {
  const w = typeof window !== 'undefined' ? window : undefined;
  const AC =
    w &&
    ((w as unknown as { AudioContext?: new () => AudioCtxLike }).AudioContext ??
      (w as unknown as { webkitAudioContext?: new () => AudioCtxLike }).webkitAudioContext);
  const probe = typeof document !== 'undefined' ? document.createElement('audio') : null;
  const m = createSoundManager<SoundName>({
    sounds: findSoundTheme(themeId).sounds,
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

/** Switch the global sound theme (persisted); plays a short preview unless muted. */
export function setSoundTheme(id: string, preview = true) {
  const theme = findSoundTheme(id);
  themeId = theme.id;
  try {
    safeStorage()?.setItem(SOUND_THEME_KEY, theme.id);
  } catch {
    /* storage blocked */
  }
  themeListeners.forEach((l) => l());
  void sound.unlock().then(async () => {
    await sound.setSounds(theme.sounds);
    if (preview) sound.play(PREVIEW_SLOT);
  });
}

/** `[themeId, setTheme, themes]` for the global sound theme. */
export function useSoundTheme() {
  const id = useSyncExternalStore(
    (l) => (themeListeners.add(l), () => void themeListeners.delete(l)),
    () => themeId,
    () => themeId,
  );
  return [id, setSoundTheme, SOUND_THEMES] as const;
}

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  defaultsFor,
  isValidValue,
  loadSettings,
  saveSettings,
  settingsKey,
  type SettingDefinition,
  type SettingsValues,
} from './schema';

const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, unknown>();

function emit(gameId: string) {
  cache.delete(gameId);
  listeners.get(gameId)?.forEach((l) => l());
}
if (typeof window !== 'undefined')
  window.addEventListener('storage', (e) => {
    const id = e.key?.startsWith('wordgames:settings:') ? e.key.slice(19) : null;
    if (id) emit(id);
  });

export interface GameSettings<Defs extends readonly SettingDefinition[]> {
  values: SettingsValues<Defs>;
  set: <K extends keyof SettingsValues<Defs>>(key: K, value: SettingsValues<Defs>[K]) => void;
  reset: () => void;
  definitions: Defs;
}

/** Typed, persisted (wordgames:settings:<gameId>) settings shared across components. */
export function useGameSettings<const Defs extends readonly SettingDefinition[]>(
  gameId: string,
  defs: Defs,
): GameSettings<Defs> {
  const subscribe = useCallback(
    (l: () => void) => {
      const set = listeners.get(gameId) ?? new Set();
      listeners.set(gameId, set);
      set.add(l);
      return () => void set.delete(l);
    },
    [gameId],
  );
  const get = () => {
    if (!cache.has(gameId)) cache.set(gameId, loadSettings(gameId, defs));
    return cache.get(gameId) as SettingsValues<Defs>;
  };
  const values = useSyncExternalStore(subscribe, get, () => defaultsFor(defs));
  const set = useCallback(
    <K extends keyof SettingsValues<Defs>>(key: K, value: SettingsValues<Defs>[K]) => {
      const d = defs.find((x) => x.key === key);
      if (!d || !isValidValue(d, value)) return;
      saveSettings(gameId, defs, { ...loadSettings(gameId, defs), [key]: value });
      emit(gameId);
    },
    [gameId, defs],
  );
  const reset = useCallback(() => {
    saveSettings(gameId, defs, {});
    emit(gameId);
  }, [gameId, defs]);
  return useMemo(() => ({ values, set, reset, definitions: defs }), [values, set, reset, defs]);
}

export { settingsKey };

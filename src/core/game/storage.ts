export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const PREFIX = 'wordgames:';

function defaultStorage(): StorageLike | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

export function loadJSON<T>(key: string, fallback: T, storage = defaultStorage()): T {
  try {
    const raw = storage?.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T, storage = defaultStorage()): void {
  try {
    storage?.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota / private mode: ignore */
  }
}

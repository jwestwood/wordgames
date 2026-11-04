import { readHistory, replaceHistory, type HistoryEntry } from '../history/store';
import { loadJSON, saveJSON, type StorageLike } from '../game/storage';

export interface MigrationTarget {
  /** New version id for the history entry, e.g. `1`. */
  version: string;
  /** Per-seed save keys (without the `wordgames:` prefix) to copy: [from, to]. */
  copyKeys?: ReadonlyArray<readonly [string, string]>;
}

function defaultStorage(): StorageLike | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

/**
 * One-off, idempotent migration of a game's history entries (and their saves) to new version
 * ids. `map` returns the target for entries that should move, or null to leave them alone.
 * Saves are copied (never overwriting an existing target), so the legacy key stays as a backup.
 * Returns how many entries were migrated.
 */
export function migrateHistoryVersions(
  gameId: string,
  map: (entry: HistoryEntry) => MigrationTarget | null,
  storage: StorageLike | undefined = defaultStorage(),
): number {
  if (!storage) return 0;
  const entries = readHistory(storage);
  let n = 0;
  const next = entries.map((e) => {
    if (e.gameId !== gameId) return e;
    const t = map(e);
    if (!t || t.version === e.version) return e;
    for (const [from, to] of t.copyKeys ?? []) {
      const MISSING = {};
      const value = loadJSON<unknown>(from, MISSING, storage);
      if (value !== MISSING && loadJSON<unknown>(to, MISSING, storage) === MISSING)
        saveJSON(to, value, storage);
    }
    n++;
    return { ...e, version: t.version };
  });
  // Two legacy entries can collapse onto one (game, seed, version); keep the most recent.
  if (n) replaceHistory(next, storage);
  return n;
}

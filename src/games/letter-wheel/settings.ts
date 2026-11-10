import type { StorageLike } from '@core/game';
import { defineSettings, settingsKey } from '@core/settings';

export const LETTER_WHEEL_SETTINGS = defineSettings([
  {
    key: 'keepWrongGuesses',
    label: 'Keep wrong guesses',
    type: 'toggle',
    default: false,
  },
] as const);

/** Retired keys left in older saves; they are ignored by the schema and dropped here. */
export const RETIRED_LETTER_WHEEL_SETTING_KEYS = ['autoScroll'] as const;

function defaultStorage(): StorageLike | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

/** Remove retired keys from stored Letter Wheel settings without touching remaining prefs. */
export function dropRetiredLetterWheelSettings(
  storage: StorageLike | undefined = defaultStorage(),
): void {
  if (!storage) return;
  const key = settingsKey('letter-wheel');
  try {
    const raw = storage.getItem(key);
    if (raw == null) return;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
    const rec = parsed as Record<string, unknown>;
    let changed = false;
    for (const retired of RETIRED_LETTER_WHEEL_SETTING_KEYS) {
      if (retired in rec) {
        delete rec[retired];
        changed = true;
      }
    }
    if (changed) storage.setItem(key, JSON.stringify(rec));
  } catch {
    /* quota / private mode / invalid JSON */
  }
}

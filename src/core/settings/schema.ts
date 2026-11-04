/** Declarative per-game settings: definitions, defaults, tolerant parsing and persistence. */
import type { StorageLike } from '../game/storage';

interface Base<K extends string> {
  key: K;
  label: string;
  description?: string;
}
export interface ToggleSetting<K extends string = string> extends Base<K> {
  type: 'toggle';
  default: boolean;
}
export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
}
export interface SelectSetting<
  K extends string = string,
  V extends string = string,
> extends Base<K> {
  type: 'select';
  options: readonly SelectOption<V>[];
  default: V;
}
export interface RangeSetting<K extends string = string> extends Base<K> {
  type: 'range';
  min: number;
  max: number;
  step?: number;
  default: number;
  /** Optional value formatter for display (e.g. `(v) => `${v}s``). */
  format?: (v: number) => string;
}
export type SettingDefinition<K extends string = string> =
  ToggleSetting<K> | SelectSetting<K> | RangeSetting<K>;

type ValueOf<D> = D extends ToggleSetting
  ? boolean
  : D extends SelectSetting<string, infer V>
    ? V
    : D extends RangeSetting
      ? number
      : never;

/** Typed values object for a definitions tuple: `{ [key]: boolean | option | number }`. */
export type SettingsValues<Defs extends readonly SettingDefinition[]> = {
  [D in Defs[number] as D['key']]: ValueOf<D>;
};
export type SettingValue = boolean | string | number;

/** Identity helper that keeps literal keys/option values for typed `useGameSettings`. */
export function defineSettings<const Defs extends readonly SettingDefinition[]>(defs: Defs): Defs {
  validateDefinitions(defs);
  return defs;
}

/** Throws on malformed definitions (duplicate keys, bad defaults, empty ranges). */
export function validateDefinitions(defs: readonly SettingDefinition[]): void {
  const seen = new Set<string>();
  for (const d of defs) {
    if (!d.key) throw new Error('Setting needs a key');
    if (seen.has(d.key)) throw new Error(`Duplicate setting key "${d.key}"`);
    seen.add(d.key);
    if (!isValidValue(d, d.default)) throw new Error(`Invalid default for setting "${d.key}"`);
    if (d.type === 'range' && !(d.min < d.max)) throw new Error(`Empty range for "${d.key}"`);
    if (d.type === 'select' && d.options.length === 0)
      throw new Error(`Select "${d.key}" needs options`);
  }
}

/** Does `v` fit definition `d`? (ranges: within min..max and on a step from min). */
export function isValidValue(d: SettingDefinition, v: unknown): boolean {
  switch (d.type) {
    case 'toggle':
      return typeof v === 'boolean';
    case 'select':
      return typeof v === 'string' && d.options.some((o) => o.value === v);
    case 'range': {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < d.min || v > d.max) return false;
      if (!d.step) return true;
      const n = (v - d.min) / d.step;
      return Math.abs(n - Math.round(n)) < 1e-9;
    }
  }
}

export function defaultsFor<const Defs extends readonly SettingDefinition[]>(
  defs: Defs,
): SettingsValues<Defs> {
  return Object.fromEntries(defs.map((d) => [d.key, d.default])) as SettingsValues<Defs>;
}

/** Tolerant parse: unknown keys dropped, missing/invalid values fall back to defaults. */
export function sanitizeSettings<const Defs extends readonly SettingDefinition[]>(
  defs: Defs,
  raw: unknown,
): SettingsValues<Defs> {
  const obj =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries(
    defs.map((d) => [d.key, isValidValue(d, obj[d.key]) ? obj[d.key] : d.default]),
  ) as SettingsValues<Defs>;
}

export const settingsKey = (gameId: string) => `wordgames:settings:${gameId}`;

function defaultStorage(): StorageLike | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

export function loadSettings<const Defs extends readonly SettingDefinition[]>(
  gameId: string,
  defs: Defs,
  storage: StorageLike | undefined = defaultStorage(),
): SettingsValues<Defs> {
  let raw: unknown;
  try {
    const s = storage?.getItem(settingsKey(gameId));
    raw = s == null ? undefined : JSON.parse(s);
  } catch {
    raw = undefined;
  }
  return sanitizeSettings(defs, raw);
}

/** Persists only values that differ from defaults (so changing a default reaches everyone). */
export function saveSettings(
  gameId: string,
  defs: readonly SettingDefinition[],
  values: Record<string, unknown>,
  storage: StorageLike | undefined = defaultStorage(),
): void {
  const out: Record<string, unknown> = {};
  for (const d of defs)
    if (isValidValue(d, values[d.key]) && values[d.key] !== d.default) out[d.key] = values[d.key];
  try {
    storage?.setItem(settingsKey(gameId), JSON.stringify(out));
  } catch {
    /* quota / private mode */
  }
}

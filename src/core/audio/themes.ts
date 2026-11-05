import type { SoundRegistry } from './manager';
import { SOUNDS, soundFile, type SoundName } from './sounds';

/** A sound theme maps every slot (SoundName) to an actual sound. See public/sounds/CREDITS.md. */
export interface SoundTheme {
  id: string;
  label: string;
  description: string;
  sounds: SoundRegistry<SoundName>;
}

export const SOUND_THEME_KEY = 'wordgames:soundTheme';
export const DEFAULT_SOUND_THEME = 'classic';
/** Slot played as a short preview when a theme is chosen. */
export const PREVIEW_SLOT: SoundName = 'success-big';

/** Slots that reuse another slot's filename (no extra theme assets). */
const FILE_ALIASES: Partial<Record<SoundName, string>> = {
  'letter-complete': 'star',
};

/** Same slot volumes/variation as Classic, scaled, with files from public/sounds/<dir>/. */
function themed(dir: string, scale = 1, overrides: Partial<Record<SoundName, number>> = {}) {
  const out = {} as SoundRegistry<SoundName>;
  for (const name of Object.keys(SOUNDS) as SoundName[]) {
    const base = SOUNDS[name];
    const file = FILE_ALIASES[name] ?? name;
    out[name] = soundFile(dir, file, (overrides[name] ?? base.volume ?? 1) * scale, base.vary ?? 0);
  }
  return out;
}

export const SOUND_THEMES: readonly SoundTheme[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Interface clicks, cards and jingles',
    sounds: SOUNDS,
  },
  {
    id: 'soft',
    label: 'Soft',
    description: 'Gentle sine clicks and chimes',
    sounds: themed('soft', 0.8),
  },
  {
    id: 'tabletop',
    label: 'Tabletop',
    description: 'Wooden knocks, cards, chips and bells',
    sounds: themed('tabletop', 1, { star: 0.5, perfect: 0.55 }),
  },
  {
    id: 'arcade',
    label: 'Arcade',
    description: 'Playful bleeps and 8-bit jingles',
    sounds: themed('arcade', 0.75),
  },
];

export function findSoundTheme(id: string | null | undefined): SoundTheme {
  return SOUND_THEMES.find((t) => t.id === id) ?? SOUND_THEMES[0];
}

export function readSoundTheme(storage: { getItem(k: string): string | null } | null | undefined) {
  try {
    return findSoundTheme(storage?.getItem(SOUND_THEME_KEY)).id;
  } catch {
    return DEFAULT_SOUND_THEME;
  }
}

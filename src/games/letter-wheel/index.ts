import { lazy } from 'react';
import type { GameDefinition } from '@core/registry';
import { LATEST, migrateLetterWheel } from './versions';
import { letterWheelBrand } from './brand';
import { LETTER_WHEEL_SETTINGS } from './settings';

export const letterWheel: GameDefinition = {
  id: 'letter-wheel',
  title: 'Letter Wheel',
  description: 'Spin words from a wheel of letters — every word must use the centre letter.',
  status: 'playable',
  brand: letterWheelBrand,
  latestVersion: String(LATEST),
  migrate: () => void migrateLetterWheel(),
  settings: LETTER_WHEEL_SETTINGS,
  HistoryPreview: lazy(() =>
    import('./HistoryPreview').then((m) => ({ default: m.LetterWheelHistoryPreview })),
  ),
  component: lazy(() => import('./LetterWheelGame').then((m) => ({ default: m.LetterWheelGame }))),
};

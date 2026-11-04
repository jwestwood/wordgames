import { lazy } from 'react';
import type { GameDefinition } from '@core/registry';
import { PUZZLE_VERSION } from './version';
import { letterWheelBrand } from './brand';

export const letterWheel: GameDefinition = {
  id: 'letter-wheel',
  title: 'Letter Wheel',
  description: 'Spin words from a wheel of letters — every word must use the centre letter.',
  status: 'playable',
  brand: letterWheelBrand,
  puzzleVersion: PUZZLE_VERSION,
  HistoryPreview: lazy(() =>
    import('./HistoryPreview').then((m) => ({ default: m.LetterWheelHistoryPreview })),
  ),
  component: lazy(() => import('./LetterWheelGame').then((m) => ({ default: m.LetterWheelGame }))),
};

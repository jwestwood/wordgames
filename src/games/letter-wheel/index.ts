import { lazy } from 'react';
import type { GameDefinition } from '@core/registry';
import { PUZZLE_VERSION } from './version';

export const letterWheel: GameDefinition = {
  id: 'letter-wheel',
  title: 'Letter Wheel',
  description: 'Spin words from a wheel of letters — every word must use the centre letter.',
  status: 'playable',
  puzzleVersion: PUZZLE_VERSION,
  component: lazy(() => import('./LetterWheelGame').then((m) => ({ default: m.LetterWheelGame }))),
};

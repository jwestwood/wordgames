import { lazy } from 'react';
import type { GameDefinition } from '@core/registry';

export const letterWheel: GameDefinition = {
  id: 'letter-wheel',
  title: 'Letter Wheel',
  description: 'Spin words from a wheel of letters — every word must use the centre letter.',
  status: 'playable',
  component: lazy(() => import('./LetterWheelGame').then((m) => ({ default: m.LetterWheelGame }))),
};

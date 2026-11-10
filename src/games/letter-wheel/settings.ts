import { defineSettings } from '@core/settings';

export const LETTER_WHEEL_SETTINGS = defineSettings([
  {
    key: 'autoScroll',
    label: 'Scroll to found words',
    type: 'toggle',
    default: true,
  },
  {
    key: 'keepWrongGuesses',
    label: 'Keep wrong guesses',
    type: 'toggle',
    default: false,
  },
] as const);

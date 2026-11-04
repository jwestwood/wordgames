import { defineSettings } from '@core/settings';

export const LETTER_WHEEL_SETTINGS = defineSettings([
  {
    key: 'autoScroll',
    label: 'Scroll to found words',
    type: 'toggle',
    default: true,
  },
] as const);

import { defineSettings } from '@core/settings';

export const LETTER_WHEEL_SETTINGS = defineSettings([
  {
    key: 'autoScroll',
    label: 'Scroll to word list when you find a word',
    description:
      'When off, the page stays put: words off-screen appear over the wheel and slip into the list.',
    type: 'toggle',
    default: true,
  },
] as const);

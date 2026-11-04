import type { GameBrand } from '@core/registry';
import { LetterWheelIcon } from './Icon';
import { LetterWheelLogo } from './Logo';
import favicon from './icon.svg?url';

/** Tagline options (pick one as default):
 *  1. Spin it. Spell it. Win it.
 *  2. Every word goes through the middle.
 *  3. Round and round the right word goes.
 *  4. Nine letters, one centre, countless words.
 *  5. Get your words in a spin.
 */
export const TAGLINES = [
  'Spin it. Spell it. Win it.',
  'Every word goes through the middle.',
  'Round and round the right word goes.',
  'Nine letters, one centre, countless words.',
  'Get your words in a spin.',
] as const;

export const letterWheelBrand: GameBrand = {
  Icon: LetterWheelIcon,
  Logo: LetterWheelLogo,
  tagline: TAGLINES[1],
  accent: 'var(--color-red)',
  favicon,
};

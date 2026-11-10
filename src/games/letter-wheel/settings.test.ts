import { describe, expect, it } from 'vitest';
import { LETTER_WHEEL_SETTINGS } from './settings';

describe('Letter Wheel settings', () => {
  it('includes Keep wrong guesses, off by default, with a short label only', () => {
    const keep = LETTER_WHEEL_SETTINGS.find((s) => s.key === 'keepWrongGuesses');
    expect(keep).toEqual({
      key: 'keepWrongGuesses',
      label: 'Keep wrong guesses',
      type: 'toggle',
      default: false,
    });
    expect(keep && 'description' in keep && keep.description).toBeFalsy();
  });
});

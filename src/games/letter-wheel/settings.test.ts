import { describe, expect, it } from 'vitest';
import {
  dropRetiredLetterWheelSettings,
  LETTER_WHEEL_SETTINGS,
  RETIRED_LETTER_WHEEL_SETTING_KEYS,
} from './settings';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    data,
  };
}

describe('Letter Wheel settings', () => {
  it('keeps only Keep wrong guesses, off by default, with a short label only', () => {
    expect(LETTER_WHEEL_SETTINGS.map((s) => s.key)).toEqual(['keepWrongGuesses']);
    expect(LETTER_WHEEL_SETTINGS[0]).toEqual({
      key: 'keepWrongGuesses',
      label: 'Keep wrong guesses',
      type: 'toggle',
      default: false,
    });
    expect(
      'description' in LETTER_WHEEL_SETTINGS[0] && LETTER_WHEEL_SETTINGS[0].description,
    ).toBeFalsy();
    expect(RETIRED_LETTER_WHEEL_SETTING_KEYS).toEqual(['autoScroll']);
  });

  it('drops a stored autoScroll key and leaves other Letter Wheel prefs alone', () => {
    const storage = memoryStorage({
      'wordgames:settings:letter-wheel': JSON.stringify({
        autoScroll: false,
        keepWrongGuesses: true,
      }),
    });
    dropRetiredLetterWheelSettings(storage);
    expect(JSON.parse(storage.data['wordgames:settings:letter-wheel']!)).toEqual({
      keepWrongGuesses: true,
    });
  });

  it('does not rewrite storage when the retired key is already gone', () => {
    const storage = memoryStorage({
      'wordgames:settings:letter-wheel': JSON.stringify({ keepWrongGuesses: true }),
    });
    const before = storage.data['wordgames:settings:letter-wheel'];
    dropRetiredLetterWheelSettings(storage);
    expect(storage.data['wordgames:settings:letter-wheel']).toBe(before);
  });
});

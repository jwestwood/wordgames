import { describe, expect, it } from 'vitest';
import { readWheelPreview, toWheelPreview } from './preview';

describe('letter wheel history preview', () => {
  it('alphabetises outer letters so the word is not revealed', () => {
    expect(toWheelPreview({ outer: ['t', 'r', 'a', 'e'], required: 's' })).toEqual({
      letters: 'aert',
      centre: 's',
    });
  });
  it('validates stored data', () => {
    expect(readWheelPreview({ letters: 'aert', centre: 's' })).toEqual({
      letters: 'aert',
      centre: 's',
    });
    expect(readWheelPreview(undefined)).toBeNull();
    expect(readWheelPreview({ letters: 5, centre: 's' })).toBeNull();
    expect(readWheelPreview({ letters: 'aert', centre: 'ss' })).toBeNull();
  });
});

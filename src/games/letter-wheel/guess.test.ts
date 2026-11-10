import { describe, expect, it } from 'vitest';
import {
  isBonusSuccess,
  isRepeatGuess,
  shouldAutoOpenWordTray,
  shouldFlashOfficialRow,
} from './guess';
import type { GuessResult } from './versions';

const official: GuessResult = { ok: true, word: 'able' };
const bonus: GuessResult = { ok: true, word: 'color', bonus: true };
const repeat: GuessResult = { ok: false, reason: 'already-found' };
const repeatBonus: GuessResult = { ok: false, reason: 'already-found-bonus' };
const miss: GuessResult = { ok: false, reason: 'not-in-pool' };

describe('bonus guess classification', () => {
  it('treats only official successes as tray-opening discoveries', () => {
    expect(isBonusSuccess(official)).toBe(false);
    expect(isBonusSuccess(bonus)).toBe(true);
    expect(shouldAutoOpenWordTray(official)).toBe(true);
    expect(shouldAutoOpenWordTray(bonus)).toBe(false);
    expect(shouldAutoOpenWordTray(repeat)).toBe(false);
    expect(shouldAutoOpenWordTray(repeatBonus)).toBe(false);
    expect(shouldAutoOpenWordTray(miss)).toBe(false);
  });

  it('flashes an official list row only for a repeat official word', () => {
    expect(isRepeatGuess(repeat)).toBe(true);
    expect(isRepeatGuess(repeatBonus)).toBe(true);
    expect(isRepeatGuess(miss)).toBe(false);
    expect(shouldFlashOfficialRow(repeat)).toBe(true);
    expect(shouldFlashOfficialRow(repeatBonus)).toBe(false);
    expect(shouldFlashOfficialRow(official)).toBe(false);
  });
});

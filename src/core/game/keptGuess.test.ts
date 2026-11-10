import { describe, expect, it } from 'vitest';
import { isGuessSubmitLocked, isIncorrectGuess, shouldKeepGuess } from './keptGuess';

describe('isIncorrectGuess', () => {
  it('treats short, missing-required and not-in-list guesses as incorrect', () => {
    expect(isIncorrectGuess({ ok: false, reason: 'too-short' })).toBe(true);
    expect(isIncorrectGuess({ ok: false, reason: 'missing-required' })).toBe(true);
    expect(isIncorrectGuess({ ok: false, reason: 'not-in-pool' })).toBe(true);
  });

  it('does not treat successes or already-found repeats as incorrect', () => {
    expect(isIncorrectGuess({ ok: true })).toBe(false);
    expect(isIncorrectGuess({ ok: true, reason: undefined })).toBe(false);
    expect(isIncorrectGuess({ ok: false, reason: 'already-found' })).toBe(false);
    expect(isIncorrectGuess({ ok: false, reason: 'already-found-bonus' })).toBe(false);
  });
});

describe('shouldKeepGuess', () => {
  it('keeps only incorrect guesses, and only when the setting is on', () => {
    const bad = { ok: false, reason: 'not-in-pool' as const };
    expect(shouldKeepGuess(true, bad)).toBe(true);
    expect(shouldKeepGuess(false, bad)).toBe(false);
    expect(shouldKeepGuess(true, { ok: false, reason: 'already-found' })).toBe(false);
    expect(shouldKeepGuess(true, { ok: true })).toBe(false);
  });
});

describe('isGuessSubmitLocked', () => {
  it('locks only while the current letters still match the rejected snapshot', () => {
    expect(isGuessSubmitLocked([0, 1, 2], [0, 1, 2])).toBe(true);
    expect(isGuessSubmitLocked([0, 1, 2], [0, 1])).toBe(false);
    expect(isGuessSubmitLocked([0, 1, 2], [0, 1, 2, 3])).toBe(false);
    expect(isGuessSubmitLocked([0, 1, 2], [0, 2, 1])).toBe(false);
    expect(isGuessSubmitLocked(null, [0, 1, 2])).toBe(false);
    expect(isGuessSubmitLocked([], [0])).toBe(false);
  });
});

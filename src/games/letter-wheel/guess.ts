import type { GuessResult } from './versions';

export function isBonusSuccess(res: GuessResult): res is { ok: true; word: string; bonus: true } {
  return res.ok === true && 'bonus' in res && res.bonus === true;
}

export function isRepeatGuess(
  res: GuessResult,
): res is { ok: false; reason: 'already-found' | 'already-found-bonus' } {
  return (
    res.ok === false && (res.reason === 'already-found' || res.reason === 'already-found-bonus')
  );
}

/** Official finds auto-open the mobile tray. Bonus finds, repeats and errors do not. */
export function shouldAutoOpenWordTray(res: GuessResult): boolean {
  return res.ok && !isBonusSuccess(res);
}

/** Only a repeat official word should pulse its row in the list. */
export function shouldFlashOfficialRow(res: GuessResult): boolean {
  return res.ok === false && res.reason === 'already-found';
}

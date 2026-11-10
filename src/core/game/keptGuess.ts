/** A guess outcome that may be kept in the input after a rejection. */
export interface GuessOutcome {
  ok: boolean;
  reason?: string;
}

const REPEAT_REASONS = new Set(['already-found', 'already-found-bonus']);

/**
 * A rejected attempt that is not a repeat of an already-found word (official or bonus).
 * Too short, missing the required letter, and not-in-list all count as incorrect.
 */
export function isIncorrectGuess(res: GuessOutcome): boolean {
  return !res.ok && !REPEAT_REASONS.has(res.reason ?? '');
}

/** Keep the current letters after this result when the setting is on. */
export function shouldKeepGuess(keepSetting: boolean, res: GuessOutcome): boolean {
  return keepSetting && isIncorrectGuess(res);
}

/** Submit stays locked while the current guess still matches the rejected snapshot. */
export function isGuessSubmitLocked(
  rejected: readonly number[] | null | undefined,
  current: readonly number[],
): boolean {
  if (rejected == null || rejected.length === 0) return false;
  if (rejected.length !== current.length) return false;
  return rejected.every((v, i) => v === current[i]);
}

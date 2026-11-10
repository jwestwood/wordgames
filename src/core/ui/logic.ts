/** Pure helpers behind the shared UI components (tested in ui.test.ts). */

export type TileState = 'default' | 'selected' | 'correct' | 'present' | 'absent' | 'error';

const STATE_LABEL: Record<TileState, string> = {
  default: '',
  selected: 'selected',
  correct: 'correct',
  present: 'in word, wrong place',
  absent: 'not in word',
  error: 'incorrect',
};

/** Accessible label for a tile, e.g. "A, correct". */
export function tileLabel(letter: string, state: TileState = 'default'): string {
  const l = letter.trim().toUpperCase() || 'blank';
  return STATE_LABEL[state] ? `${l}, ${STATE_LABEL[state]}` : l;
}

/**
 * Wordle-style evaluation of a guess against an answer, handling repeated letters:
 * exact matches first, then "present" only while unmatched copies remain.
 */
export function evaluateGuess(guess: string, answer: string): TileState[] {
  const g = guess.toLowerCase();
  const a = answer.toLowerCase();
  const result: TileState[] = [...g].map(() => 'absent');
  const remaining: Record<string, number> = {};
  [...g].forEach((c, i) => {
    if (a[i] === c) result[i] = 'correct';
    else remaining[a[i]] = (remaining[a[i]] ?? 0) + 1;
  });
  [...g].forEach((c, i) => {
    if (result[i] !== 'correct' && remaining[c]) {
      result[i] = 'present';
      remaining[c]--;
    }
  });
  return result;
}

/** Format a score with thousands separators and an optional sign for deltas. */
export function formatScore(n: number, signed = false): string {
  const s = Math.round(Math.abs(n)).toLocaleString('en-GB');
  if (n < 0) return `−${s}`;
  return signed && n > 0 ? `+${s}` : s;
}

/** Return the next index for roving focus in a rows×cols grid given an arrow key. */
export function gridNavigate(index: number, key: string, cols: number, total: number): number {
  const delta: Record<string, number> = {
    ArrowRight: 1,
    ArrowLeft: -1,
    ArrowDown: cols,
    ArrowUp: -cols,
  };
  if (key === 'Home') return 0;
  if (key === 'End') return total - 1;
  const next = index + (delta[key] ?? 0);
  return next < 0 || next >= total ? index : next;
}

/** Index of the next focusable element when Tab cycles inside a modal (focus trap). */
export function trapFocusIndex(current: number, count: number, shift: boolean): number {
  if (count === 0) return -1;
  return shift ? (current <= 0 ? count - 1 : current - 1) : current >= count - 1 ? 0 : current + 1;
}

/**
 * Letter Wheel clues: first clue reveals the last letter; second reveals the 2nd-to-last as well.
 * No limit on how many words you can clue; no scoring effect.
 */

export type ClueLevel = 0 | 1 | 2;

/** Per-word clue levels (1 or 2); missing keys = 0. */
export type ClueMap = Readonly<Record<string, ClueLevel>>;

export interface PuzzleProgress {
  found: string[];
  clues: ClueMap;
  /** Bonus words found on this seed (beta). Missing on older saves. */
  bonus: string[];
}

export const EMPTY_PROGRESS: PuzzleProgress = { found: [], clues: {}, bonus: [] };

/** Accept a legacy bare found-array or a progress object. */
export function parseProgress(raw: unknown): PuzzleProgress {
  if (Array.isArray(raw)) {
    return {
      found: raw.filter((w): w is string => typeof w === 'string'),
      clues: {},
      bonus: [],
    };
  }
  if (!raw || typeof raw !== 'object') return EMPTY_PROGRESS;
  const r = raw as Record<string, unknown>;
  const found = Array.isArray(r.found)
    ? r.found.filter((w): w is string => typeof w === 'string')
    : [];
  const bonus = Array.isArray(r.bonus)
    ? r.bonus.filter((w): w is string => typeof w === 'string')
    : [];
  const clues: Record<string, ClueLevel> = {};
  if (r.clues && typeof r.clues === 'object' && !Array.isArray(r.clues)) {
    for (const [w, n] of Object.entries(r.clues as Record<string, unknown>)) {
      if (n === 1 || n === 2) clues[w] = n;
    }
  }
  return { found, clues, bonus };
}

export function clueLevel(clues: ClueMap, word: string): ClueLevel {
  const n = clues[word];
  return n === 1 || n === 2 ? n : 0;
}

/** Apply one clue to `word`. No-op if already found or already at level 2. */
export function applyClue(clues: ClueMap, word: string, found: ReadonlySet<string>): ClueMap {
  if (found.has(word) || clueLevel(clues, word) >= 2) return clues;
  return { ...clues, [word]: (clueLevel(clues, word) + 1) as ClueLevel };
}

/**
 * Letters shown in a blank slot for a given clue level: `null` = still blank.
 * Level 1 → last letter; level 2 → 2nd-to-last + last.
 */
export function clueLetters(word: string, level: ClueLevel): (string | null)[] {
  const out: (string | null)[] = Array.from({ length: word.length }, () => null);
  if (level >= 1 && word.length > 0) out[word.length - 1] = word[word.length - 1];
  if (level >= 2 && word.length > 1) out[word.length - 2] = word[word.length - 2];
  return out;
}

/** Drop clue entries for words that have been found (keeps storage tidy). */
export function pruneClues(clues: ClueMap, found: ReadonlySet<string>): ClueMap {
  let changed = false;
  const next: Record<string, ClueLevel> = {};
  for (const [w, n] of Object.entries(clues)) {
    if (found.has(w)) {
      changed = true;
      continue;
    }
    next[w] = n as ClueLevel;
  }
  return changed ? next : clues;
}

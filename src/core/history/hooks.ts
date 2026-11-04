import { useEffect, useRef, useState } from 'react';
import {
  HISTORY_EVENT,
  HISTORY_KEY,
  listHistory,
  upsertHistory,
  type HistoryEntry,
  type HistoryFilter,
} from './store';

export interface HistoryReport {
  /** Spoiler-free summary, e.g. "9 letters · centre R". */
  summary: string;
  found: number;
  total: number;
  stars: number;
  maxStars: number;
  completed?: boolean;
  /** Puzzle/word-list version. */
  version: string;
  /**
   * Whether the player has meaningfully interacted yet. The entry is only created once this
   * is true (avoids clutter from merely opening/randomising puzzles); later reports update it.
   */
  started: boolean;
}

/**
 * Report a game's progress for (gameId, seed) to the shared history. Writes only when the
 * reported values change (and the puzzle has been started), bumping lastPlayed.
 */
export function useHistoryEntry(gameId: string, seed: string, report: HistoryReport | null) {
  const last = useRef('');
  const sig = report ? JSON.stringify({ gameId, seed, ...report }) : '';
  useEffect(() => {
    if (!report || !report.started || sig === last.current) return;
    last.current = sig;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { started, ...rest } = report;
    upsertHistory({ gameId, seed, ...rest });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
}

/** Live list of history entries (updates on local writes and other tabs). */
export function useHistoryList(filter: HistoryFilter = {}): HistoryEntry[] {
  const { gameId, status } = filter;
  const [entries, setEntries] = useState(() => listHistory({ gameId, status }));
  useEffect(() => {
    const refresh = () => setEntries(listHistory({ gameId, status }));
    refresh();
    const onStorage = (e: StorageEvent) => e.key === HISTORY_KEY && refresh();
    window.addEventListener(HISTORY_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(HISTORY_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [gameId, status]);
  return entries;
}

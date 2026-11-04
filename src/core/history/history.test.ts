import { describe, expect, it } from 'vitest';
import type { StorageLike } from '../game/storage';
import {
  clearHistory,
  enforceCap,
  getHistoryEntry,
  HISTORY_KEY,
  isStale,
  listHistory,
  parseHistory,
  readHistory,
  relativeTime,
  removeHistory,
  upsertHistory,
  type HistoryEntry,
} from './store';

function mem(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

const base = { summary: '9 letters', found: 1, total: 10, stars: 0, maxStars: 3, version: 'v1' };

describe('history store', () => {
  it('upserts one entry per game+seed, keeping createdAt', () => {
    const s = mem();
    upsertHistory({ gameId: 'g', seed: 'AAA', ...base }, { storage: s, now: 100 });
    const e = upsertHistory({ gameId: 'g', seed: 'AAA', found: 5 }, { storage: s, now: 200 });
    expect(readHistory(s)).toHaveLength(1);
    expect(e).toMatchObject({
      found: 5,
      total: 10,
      createdAt: 100,
      lastPlayed: 200,
      summary: '9 letters',
    });
    expect(e.completed).toBe(false);
    expect(
      upsertHistory({ gameId: 'g', seed: 'AAA', found: 10 }, { storage: s, now: 300 }).completed,
    ).toBe(true);
    upsertHistory({ gameId: 'h', seed: 'AAA', ...base }, { storage: s, now: 300 });
    expect(readHistory(s)).toHaveLength(2);
    expect(JSON.parse(s.data.get(HISTORY_KEY)!).schema).toBe(1);
  });

  it('lists by lastPlayed desc and filters by game and status', () => {
    const s = mem();
    upsertHistory({ gameId: 'a', seed: '1', ...base }, { storage: s, now: 1 });
    upsertHistory({ gameId: 'b', seed: '2', ...base, found: 10 }, { storage: s, now: 3 });
    upsertHistory({ gameId: 'a', seed: '3', ...base }, { storage: s, now: 2 });
    expect(listHistory({}, s).map((e) => e.seed)).toEqual(['2', '3', '1']);
    expect(listHistory({ gameId: 'a' }, s).map((e) => e.seed)).toEqual(['3', '1']);
    expect(listHistory({ status: 'completed' }, s).map((e) => e.seed)).toEqual(['2']);
    expect(listHistory({ gameId: 'a', status: 'in-progress' }, s)).toHaveLength(2);
    expect(listHistory({ gameId: 'b', status: 'in-progress' }, s)).toHaveLength(0);
  });

  it('removes and clears', () => {
    const s = mem();
    upsertHistory({ gameId: 'a', seed: '1', ...base }, { storage: s });
    upsertHistory({ gameId: 'a', seed: '2', ...base }, { storage: s });
    removeHistory('a', '1', s);
    expect(getHistoryEntry('a', '1', s)).toBeUndefined();
    expect(getHistoryEntry('a', '2', s)).toBeDefined();
    clearHistory(s);
    expect(readHistory(s)).toEqual([]);
  });

  it('caps entries, evicting oldest completed first, then oldest', () => {
    const mk = (seed: string, lastPlayed: number, completed: boolean): HistoryEntry => ({
      ...base,
      gameId: 'g',
      seed,
      lastPlayed,
      createdAt: lastPlayed,
      completed,
    });
    const list = [mk('old', 1, false), mk('c1', 2, true), mk('new', 5, false), mk('c2', 4, true)];
    expect(enforceCap(list, 3).map((e) => e.seed)).toEqual(['old', 'new', 'c2']);
    expect(enforceCap(list, 2).map((e) => e.seed)).toEqual(['old', 'new']);
    expect(enforceCap(list, 1).map((e) => e.seed)).toEqual(['new']);
    const s = mem();
    for (let i = 0; i < 5; i++)
      upsertHistory({ gameId: 'g', seed: `S${i}`, ...base }, { storage: s, now: i, cap: 3 });
    expect(listHistory({}, s).map((e) => e.seed)).toEqual(['S4', 'S3', 'S2']);
  });

  it('survives corrupted data', () => {
    expect(parseHistory('{not json')).toEqual([]);
    expect(parseHistory('null')).toEqual([]);
    expect(parseHistory('42')).toEqual([]);
    expect(parseHistory('{"schema":99,"entries":[{"gameId":"a","seed":"b"}]}')).toEqual([]);
    const mixed = JSON.stringify({
      schema: 1,
      entries: [
        null,
        'x',
        { gameId: 'a' },
        { gameId: 'a', seed: 'b', found: 'lots', total: 4, lastPlayed: 5 },
      ],
    });
    expect(parseHistory(mixed)).toEqual([
      expect.objectContaining({
        gameId: 'a',
        seed: 'b',
        found: 0,
        total: 4,
        completed: false,
        createdAt: 5,
      }),
    ]);
    // legacy bare-array (v0) migrates; duplicates collapse to the most recent
    const v0 = JSON.stringify([
      { gameId: 'a', seed: 'b', found: 4, total: 4, lastPlayed: 1 },
      { gameId: 'a', seed: 'b', found: 2, total: 4, lastPlayed: 9 },
    ]);
    expect(parseHistory(v0)).toEqual([expect.objectContaining({ found: 2, lastPlayed: 9 })]);
    const s = mem();
    s.setItem(HISTORY_KEY, '<<garbage>>');
    upsertHistory({ gameId: 'a', seed: '1', ...base }, { storage: s });
    expect(readHistory(s)).toHaveLength(1);
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('x');
      },
      setItem: () => {
        throw new Error('y');
      },
    };
    expect(readHistory(broken)).toEqual([]);
    expect(() => upsertHistory({ gameId: 'a', seed: '1' }, { storage: broken })).not.toThrow();
  });

  it('flags stale versions and formats relative times', () => {
    const e = { ...base, gameId: 'a', seed: 'b', completed: false, lastPlayed: 0, createdAt: 0 };
    expect(isStale(e, 'v1')).toBe(false);
    expect(isStale(e, 'v2')).toBe(true);
    expect(isStale(e, undefined)).toBe(false);
    const m = 60_000;
    expect(relativeTime(0, 30_000)).toBe('just now');
    expect(relativeTime(0, 5 * m)).toBe('5 min ago');
    expect(relativeTime(0, 180 * m)).toBe('3 h ago');
    expect(relativeTime(0, 25 * 60 * m)).toBe('yesterday');
    expect(relativeTime(0, 4 * 1440 * m)).toBe('4 days ago');
    expect(relativeTime(0, 60 * 1440 * m)).toBe('1970-01-01');
  });
});

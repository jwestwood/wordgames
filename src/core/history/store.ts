import type { StorageLike } from '../game/storage';

/**
 * Shared puzzle history: one entry per (gameId, seed), stored in localStorage under
 * `wordgames:history` with a versioned envelope. Pure functions take an optional StorageLike
 * so they are testable; all reads are defensive (corrupt data never throws).
 */
export const HISTORY_KEY = 'wordgames:history';
export const HISTORY_SCHEMA = 1;
export const HISTORY_CAP = 200;
export const HISTORY_EVENT = 'wordgames:history-change';

export interface HistoryEntry {
  gameId: string;
  seed: string;
  /** Short spoiler-free description, e.g. "9 letters · centre R". */
  summary: string;
  found: number;
  total: number;
  stars: number;
  maxStars: number;
  completed: boolean;
  /** epoch ms */
  lastPlayed: number;
  createdAt: number;
  /** Puzzle/word-list version the entry was created with (flags stale entries). */
  version: string;
}

export type HistoryStatus = 'all' | 'in-progress' | 'completed';

export interface HistoryFilter {
  gameId?: string;
  status?: HistoryStatus;
}

interface Envelope {
  schema: number;
  entries: HistoryEntry[];
}

function defaultStorage(): StorageLike | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);

/** Validate/normalise one raw entry; returns null if unusable. */
export function sanitiseEntry(raw: unknown): HistoryEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const gameId = str(r.gameId);
  const seed = str(r.seed);
  if (!gameId || !seed) return null;
  const total = Math.max(0, num(r.total));
  const found = Math.min(Math.max(0, num(r.found)), total || Infinity);
  const lastPlayed = num(r.lastPlayed);
  return {
    gameId,
    seed,
    summary: str(r.summary),
    found,
    total,
    stars: Math.max(0, num(r.stars)),
    maxStars: Math.max(0, num(r.maxStars, 3)),
    completed: typeof r.completed === 'boolean' ? r.completed : total > 0 && found >= total,
    lastPlayed,
    createdAt: num(r.createdAt, lastPlayed),
    version: str(r.version),
  };
}

/** Parse stored JSON of any known schema (bare array = legacy v0) into entries. */
export function parseHistory(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  let list: unknown;
  if (Array.isArray(data))
    list = data; // v0: bare array
  else if (data && typeof data === 'object' && Array.isArray((data as Envelope).entries)) {
    const schema = (data as Envelope).schema;
    if (typeof schema === 'number' && schema > HISTORY_SCHEMA) return []; // from the future: ignore
    list = (data as Envelope).entries;
  } else return [];
  const seen = new Map<string, HistoryEntry>();
  for (const item of list as unknown[]) {
    const e = sanitiseEntry(item);
    if (!e) continue;
    const k = entryKey(e.gameId, e.seed);
    const prev = seen.get(k);
    if (!prev || e.lastPlayed > prev.lastPlayed) seen.set(k, e);
  }
  return [...seen.values()];
}

export const entryKey = (gameId: string, seed: string) => `${gameId}\u0000${seed}`;

export function readHistory(storage = defaultStorage()): HistoryEntry[] {
  try {
    return parseHistory(storage?.getItem(HISTORY_KEY) ?? null);
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[], storage = defaultStorage()) {
  try {
    const env: Envelope = { schema: HISTORY_SCHEMA, entries };
    storage?.setItem(HISTORY_KEY, JSON.stringify(env));
  } catch {
    /* quota / private mode */
  }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event(HISTORY_EVENT));
  }
}

const byRecent = (a: HistoryEntry, b: HistoryEntry) =>
  b.lastPlayed - a.lastPlayed || a.gameId.localeCompare(b.gameId) || a.seed.localeCompare(b.seed);

/** Keep at most `cap` entries: evict oldest completed first, then oldest overall. */
export function enforceCap(entries: HistoryEntry[], cap = HISTORY_CAP): HistoryEntry[] {
  if (entries.length <= cap) return entries;
  const oldestFirst = [...entries].sort((a, b) => -byRecent(a, b));
  const drop = new Set<HistoryEntry>();
  let excess = entries.length - cap;
  for (const e of oldestFirst) {
    if (!excess) break;
    if (e.completed) {
      drop.add(e);
      excess--;
    }
  }
  for (const e of oldestFirst) {
    if (!excess) break;
    if (!drop.has(e)) {
      drop.add(e);
      excess--;
    }
  }
  return entries.filter((e) => !drop.has(e));
}

export type HistoryUpdate = Pick<HistoryEntry, 'gameId' | 'seed'> &
  Partial<Omit<HistoryEntry, 'gameId' | 'seed' | 'createdAt'>>;

/** Insert or update the entry for (gameId, seed). `now` is injectable for tests. */
export function upsertHistory(
  update: HistoryUpdate,
  opts: { now?: number; storage?: StorageLike; cap?: number } = {},
): HistoryEntry {
  const storage = opts.storage ?? defaultStorage();
  const now = opts.now ?? Date.now();
  const entries = readHistory(storage);
  const k = entryKey(update.gameId, update.seed);
  const i = entries.findIndex((e) => entryKey(e.gameId, e.seed) === k);
  const prev = i >= 0 ? entries[i] : undefined;
  const merged = sanitiseEntry({
    summary: '',
    found: 0,
    total: 0,
    stars: 0,
    maxStars: 3,
    version: '',
    ...prev,
    ...update,
    lastPlayed: update.lastPlayed ?? now,
    createdAt: prev?.createdAt ?? now,
  })!;
  if (update.completed === undefined) {
    merged.completed = merged.total > 0 && merged.found >= merged.total;
  }
  if (i >= 0) entries[i] = merged;
  else entries.push(merged);
  write(enforceCap(entries, opts.cap), storage);
  return merged;
}

/** Entries sorted by lastPlayed desc, optionally filtered by game and status. */
export function listHistory(filter: HistoryFilter = {}, storage = defaultStorage()) {
  return filterHistory(readHistory(storage), filter);
}

export function filterHistory(entries: HistoryEntry[], { gameId, status = 'all' }: HistoryFilter) {
  return entries
    .filter((e) => !gameId || e.gameId === gameId)
    .filter((e) => status === 'all' || (status === 'completed') === e.completed)
    .sort(byRecent);
}

export function getHistoryEntry(gameId: string, seed: string, storage = defaultStorage()) {
  return readHistory(storage).find((e) => e.gameId === gameId && e.seed === seed);
}

export function removeHistory(gameId: string, seed: string, storage = defaultStorage()) {
  const entries = readHistory(storage);
  const next = entries.filter((e) => !(e.gameId === gameId && e.seed === seed));
  if (next.length !== entries.length) write(next, storage);
}

export function clearHistory(storage = defaultStorage()) {
  write([], storage);
}

/** True when the entry was recorded against a different puzzle/word-list version. */
export const isStale = (e: HistoryEntry, currentVersion?: string) =>
  !!currentVersion && e.version !== currentVersion;

/** "just now", "5 min ago", "3 h ago", "yesterday", "4 days ago", or a date. */
export function relativeTime(then: number, now: number): string {
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)} wk ago`;
  return new Date(then).toISOString().slice(0, 10);
}

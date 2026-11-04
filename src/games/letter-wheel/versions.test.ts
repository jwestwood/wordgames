import { describe, expect, it } from 'vitest';
import type { StorageLike } from '@core/game';
import { readHistory, upsertHistory } from '@core/history';
import { LEGACY_V1, migrateLetterWheel } from './versions';

function mem(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

describe('letter wheel legacy migration', () => {
  it('moves lw1-<today hash> entries and saves to v1, leaves other hashes stale', () => {
    const s = mem();
    const base = { gameId: 'letter-wheel', found: 2, total: 50, stars: 0, maxStars: 3 };
    upsertHistory({ ...base, seed: 'GSPOMH', version: LEGACY_V1 }, { storage: s });
    upsertHistory({ ...base, seed: 'K7Q2MX', version: 'lw1-deadbeef' }, { storage: s });
    s.setItem('wordgames:letter-wheel:seed:GSPOMH', '["able","bake"]');
    expect(migrateLetterWheel(s)).toBe(1);
    const byseed = Object.fromEntries(readHistory(s).map((e) => [e.seed, e.version]));
    expect(byseed).toEqual({ GSPOMH: '1', K7Q2MX: 'lw1-deadbeef' });
    expect(s.getItem('wordgames:letter-wheel:v1:seed:GSPOMH')).toBe('["able","bake"]');
  });
});

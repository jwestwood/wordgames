import { describe, expect, it } from 'vitest';
import type { StorageLike } from '../game/storage';
import { readHistory, upsertHistory } from '../history/store';
import {
  createVersionedLoader,
  latestVersion,
  migrateHistoryVersions,
  parseVersionParam,
  resolveVersion,
  versionedGameKey,
  versionParam,
  versionTag,
  type VersionManifest,
} from '.';

const m: VersionManifest = {
  game: 'g',
  beta: { rules: 'beta', words: { a: 'x.txt' } },
  versions: [
    { v: 1, rules: 'v1', words: { a: 'h1' } },
    { v: 2, rules: 'v2', words: { a: 'h1' } },
  ],
};

function mem(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

describe('versions', () => {
  it('parses and resolves the v param (missing/unknown -> latest)', () => {
    expect(parseVersionParam('2')).toBe(2);
    expect(parseVersionParam('v2')).toBe(2);
    expect(parseVersionParam('BETA')).toBe('beta');
    expect(parseVersionParam('0')).toBeNull();
    expect(parseVersionParam('x')).toBeNull();
    expect(parseVersionParam(null)).toBeNull();
    expect(latestVersion(m)).toBe(2);
    expect(resolveVersion(m, null)).toBe(2);
    expect(resolveVersion(m, '1')).toBe(1);
    expect(resolveVersion(m, '9')).toBe(2);
    expect(resolveVersion(m, 'beta')).toBe('beta');
  });

  it('labels and URL params', () => {
    expect(versionTag('2', '2')).toBeNull();
    expect(versionTag('1', '2')?.label).toBe('v1');
    expect(versionTag('beta', '2')?.kind).toBe('beta');
    expect(versionTag('lw1-abc', '2')?.kind).toBe('stale');
    expect(versionTag('1', undefined)).toBeNull();
    expect(versionParam('1')).toBe('1');
    expect(versionParam('beta')).toBe('beta');
    expect(versionParam('lw1-abc')).toBeUndefined();
    expect(versionedGameKey('g', 1)).toBe('g:v1');
    expect(versionedGameKey('g', 'beta')).toBe('g:beta');
  });

  it('loads only the requested version, sharing content-addressed lists', async () => {
    const calls: string[] = [];
    const rec = (name: string, value: unknown) => () => (calls.push(name), Promise.resolve(value));
    const loader = createVersionedLoader<{ id: string }>({
      manifest: m,
      rules: {
        '/r/v1/index.ts': rec('v1', { id: 'v1' }),
        '/r/v2/index.ts': rec('v2', { id: 'v2' }),
        '/r/beta/index.ts': rec('beta', { id: 'beta' }),
      },
      words: { '/w/h1.txt': rec('h1', 'b\nc\n') },
      betaWords: { a: rec('betaA', ['z']) as () => Promise<string[]> },
    });
    const v1 = await loader.load(1);
    expect(v1.rules.id).toBe('v1');
    expect(v1.words.a).toEqual(['b', 'c']);
    await loader.load(2);
    await loader.load(1);
    expect(calls).toEqual(['v1', 'h1', 'v2']);
    expect((await loader.load('beta')).words.a).toEqual(['z']);
    await expect(loader.load(7)).rejects.toThrow(/unknown version/);
  });

  it('migrates legacy history versions and copies saves', () => {
    const s = mem();
    const base = { found: 1, total: 10, stars: 0, maxStars: 3 };
    upsertHistory({ gameId: 'g', seed: 'A', version: 'old-ok', ...base }, { storage: s });
    upsertHistory({ gameId: 'g', seed: 'B', version: 'old-bad', ...base }, { storage: s });
    s.setItem('wordgames:g:seed:A', JSON.stringify(['x']));
    s.setItem('wordgames:g:v1:seed:A', JSON.stringify(['keep']));
    s.setItem('wordgames:g:seed:C', JSON.stringify(['y']));
    const map = (e: { seed: string; version: string }) =>
      e.version === 'old-ok'
        ? { version: '1', copyKeys: [[`g:seed:${e.seed}`, `g:v1:seed:${e.seed}`]] as const }
        : null;
    expect(migrateHistoryVersions('g', map, s)).toBe(1);
    expect(migrateHistoryVersions('g', map, s)).toBe(0); // idempotent
    const v = Object.fromEntries(readHistory(s).map((e) => [e.seed, e.version]));
    expect(v).toEqual({ A: '1', B: 'old-bad' });
    expect(s.getItem('wordgames:g:v1:seed:A')).toBe('["keep"]'); // never overwrites
  });
});

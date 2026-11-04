/**
 * Puzzle versions (ARCHITECTURE.md › Puzzle versions). A game's frozen rule sets and
 * content-addressed word lists live in `src/versioned/<game>/`; this module holds the generic,
 * unversioned glue: manifest types, URL/version parsing, labels, a lazy loader and save migration.
 */

/** Numbered (immutable) version or the mutable opt-in `beta`. */
export type PuzzleVersion = number | 'beta';
export const BETA = 'beta' as const;

export interface VersionEntry {
  v: number;
  /** Rules folder under `src/versioned/<game>/rules/`, e.g. `v1`. */
  rules: string;
  /** List name -> content hash (file `src/versioned/words/<hash>.txt`). */
  words: Record<string, string>;
}

export interface VersionManifest {
  game: string;
  /** Working copy: rules folder + list name -> repo path of the editable list. */
  beta: { rules: string; words: Record<string, string> };
  versions: VersionEntry[];
}

export function latestVersion(m: Pick<VersionManifest, 'versions'>): number {
  if (!m.versions.length) throw new Error('manifest has no numbered versions');
  return Math.max(...m.versions.map((e) => e.v));
}

/** Parse a `?v=` value: `beta`, a positive integer, or null (missing/garbage). */
export function parseVersionParam(raw: string | null | undefined): PuzzleVersion | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (s === BETA) return BETA;
  return /^v?\d+$/.test(s) && Number(s.replace('v', '')) > 0 ? Number(s.replace('v', '')) : null;
}

/** Missing or unknown numbered versions resolve to the latest numbered version. */
export function resolveVersion(m: VersionManifest, raw: string | null | undefined): PuzzleVersion {
  const v = parseVersionParam(raw);
  if (v === BETA) return BETA;
  if (v !== null && m.versions.some((e) => e.v === v)) return v;
  return latestVersion(m);
}

/** Stable id used in storage keys, history entries and URLs: `1`, `2`, `beta`. */
export const versionId = (v: PuzzleVersion): string => String(v);

/** Version for a URL from a stored id; undefined for legacy/unknown ids (=> latest). */
export function versionParam(id: string | undefined): string | undefined {
  return id && (id === BETA || /^\d+$/.test(id)) ? id : undefined;
}

export interface VersionTag {
  label: string;
  title: string;
  kind: 'older' | 'beta' | 'stale';
}

/**
 * Small label for a history entry: nothing for the latest version, `v1` for an older numbered
 * version (it still loads exactly as played), `Beta`, or "Older word list" for legacy ids.
 */
export function versionTag(id: string, latest: string | undefined): VersionTag | null {
  if (!latest || id === latest) return null;
  if (id === BETA)
    return { label: 'Beta', kind: 'beta', title: 'Played on the beta rules; may have changed.' };
  if (/^\d+$/.test(id))
    return {
      label: `v${id}`,
      kind: 'older',
      title: `Puzzle version ${id}: loads exactly as played.`,
    };
  return {
    label: 'Older word list',
    kind: 'stale',
    title: 'The word list has changed since you played this seed; the puzzle may differ.',
  };
}

/** Storage namespace for per-seed saves, e.g. `letter-wheel:v2` -> `letter-wheel:v2:seed:XXXX`. */
export const versionedGameKey = (gameId: string, v: PuzzleVersion) =>
  `${gameId}:${v === BETA ? BETA : `v${v}`}`;

/** Split a stored word list (one word per line) into words, keeping file order. */
export const parseList = (text: string): string[] => text.split('\n').filter(Boolean);

export interface VersionedLoaderOptions<R> {
  manifest: VersionManifest;
  /** `import.meta.glob('…/rules/*\/index.ts')` – keyed by path; folder name = rules id. */
  rules: Record<string, () => Promise<unknown>>;
  /** `import.meta.glob('…/versioned/words/*.txt', { query: '?raw', import: 'default' })`. */
  words: Record<string, () => Promise<unknown>>;
  /** Working-copy list loaders for beta (list name -> words). */
  betaWords: Record<string, () => Promise<readonly string[]>>;
  /** Called once per version to turn rules + lists into something ready to generate puzzles. */
  prepare?: (rules: R, words: Record<string, readonly string[]>) => unknown;
}

export interface LoadedVersion<R> {
  version: PuzzleVersion;
  rules: R;
  words: Record<string, readonly string[]>;
}

const folderOf = (path: string) => path.split('/').slice(-2, -1)[0];
const hashOf = (path: string) =>
  path
    .split('/')
    .pop()!
    .replace(/\.txt$/, '');

/** Lazy, cached loader: only the requested version's rules and lists are fetched. */
export function createVersionedLoader<R>(opts: VersionedLoaderOptions<R>) {
  const rulesBy = new Map(Object.entries(opts.rules).map(([p, f]) => [folderOf(p), f]));
  const wordsBy = new Map(Object.entries(opts.words).map(([p, f]) => [hashOf(p), f]));
  const listCache = new Map<string, Promise<readonly string[]>>();
  const cache = new Map<string, Promise<LoadedVersion<R>>>();

  const loadHash = (hash: string) => {
    let p = listCache.get(hash);
    if (!p) {
      const f = wordsBy.get(hash);
      if (!f) return Promise.reject(new Error(`word list ${hash} is not stored`));
      p = f().then((t) => parseList(t as string));
      listCache.set(hash, p);
    }
    return p;
  };

  async function build(version: PuzzleVersion): Promise<LoadedVersion<R>> {
    const entry =
      version === BETA ? undefined : opts.manifest.versions.find((e) => e.v === version);
    if (version !== BETA && !entry) throw new Error(`unknown version ${version}`);
    const rulesId = entry ? entry.rules : opts.manifest.beta.rules;
    const loadRules = rulesBy.get(rulesId);
    if (!loadRules) throw new Error(`rules ${rulesId} not found`);
    const names = Object.keys(entry ? entry.words : opts.manifest.beta.words);
    const [rules, ...lists] = await Promise.all([
      loadRules() as Promise<R>,
      ...names.map((n) => (entry ? loadHash(entry.words[n]) : opts.betaWords[n]())),
    ]);
    return { version, rules, words: Object.fromEntries(names.map((n, i) => [n, lists[i]])) };
  }

  return {
    load(version: PuzzleVersion): Promise<LoadedVersion<R>> {
      const k = versionId(version);
      let p = cache.get(k);
      if (!p) {
        p = build(version);
        p.catch(() => cache.delete(k));
        cache.set(k, p);
      }
      return p;
    },
  };
}

export { migrateHistoryVersions, type MigrationTarget } from './migrate';

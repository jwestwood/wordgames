import {
  BETA,
  createVersionedLoader,
  latestVersion,
  migrateHistoryVersions,
  versionedGameKey,
  type PuzzleVersion,
  type VersionManifest,
} from '@core/versions';
import { loadTier } from '@core/words';
import manifestJson from '../../versioned/letter-wheel/manifest.json';
import type * as RulesV1 from '../../versioned/letter-wheel/rules/v1';

/**
 * The interface the Letter Wheel UI uses to talk to a rule set (every `rules/<id>/index.ts`
 * must satisfy it). Everything seed -> puzzle and save-relevant lives behind it.
 */
export interface LetterWheelRules {
  /** Build indexes from the version's named word lists (names come from the manifest). */
  prepare(words: WordLists): Dictionaries;
  generate(seed: string, dict: Dictionaries): Puzzle;
  checkGuess(guess: string, puzzle: Puzzle, found: readonly string[]): GuessResult;
  stars(found: number, total: number): number;
  STAR_THRESHOLDS: readonly number[];
  MIN_WORD: number;
}
export type WordLists = Readonly<Record<string, readonly string[]>>;
export type Puzzle = RulesV1.Puzzle;
export type GuessResult = RulesV1.GuessResult;
export type Dictionaries = RulesV1.Dictionaries;

export const manifest = manifestJson as VersionManifest;
export const LATEST = latestVersion(manifest);

const loader = createVersionedLoader<LetterWheelRules>({
  manifest,
  rules: import.meta.glob('../../versioned/letter-wheel/rules/*/index.ts'),
  words: import.meta.glob('../../versioned/words/*.txt', { query: '?raw', import: 'default' }),
  betaWords: {
    common: () => loadTier('common'),
    extended: () => loadTier('extended'),
    targets: () => loadTier('targets'),
  },
});

export interface LoadedRules {
  version: PuzzleVersion;
  rules: LetterWheelRules;
  dict: Dictionaries;
}

const prepared = new Map<PuzzleVersion, Promise<LoadedRules>>();
/** Rules + prepared dictionaries for one version (lazy, cached). */
export function loadVersion(version: PuzzleVersion): Promise<LoadedRules> {
  let p = prepared.get(version);
  if (!p) {
    p = loader.load(version).then(({ rules, words }) => ({
      version,
      rules,
      dict: rules.prepare(words),
    }));
    prepared.set(version, p);
  }
  return p;
}

/** Per-seed save namespace, e.g. `letter-wheel:v2` (beta: `letter-wheel:beta`). */
export const saveNamespace = (gameId: string, v: PuzzleVersion) => versionedGameKey(gameId, v);

/**
 * Before numbered versions, entries were stamped `lw1-<WORDLIST_VERSION>` and saves lived at
 * `letter-wheel:seed:<seed>`. Those made with the v1 lists (hash below) become version 1.
 */
export const LEGACY_V1 = 'lw1-92d0b432';

export function migrateLetterWheel(storage?: Parameters<typeof migrateHistoryVersions>[2]) {
  return migrateHistoryVersions(
    'letter-wheel',
    (e) =>
      e.version === LEGACY_V1
        ? {
            version: '1',
            copyKeys: [
              [`letter-wheel:seed:${e.seed}`, `${saveNamespace('letter-wheel', 1)}:seed:${e.seed}`],
            ],
          }
        : null,
    storage,
  );
}

export { BETA };

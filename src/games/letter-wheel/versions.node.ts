// Node-only helpers for tests and scripts: read a version's rules + lists straight from disk.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BETA, parseList, type PuzzleVersion } from '@core/versions';
import { manifest, type LetterWheelRules, type WordLists } from './versions';

const ROOT = join(import.meta.dirname ?? __dirname, '../../..');
const RULES = import.meta.glob<LetterWheelRules>('../../versioned/letter-wheel/rules/*/index.ts', {
  eager: true,
});

export function rulesFor(version: PuzzleVersion): LetterWheelRules {
  const id =
    version === BETA ? manifest.beta.rules : manifest.versions.find((e) => e.v === version)!.rules;
  return RULES[`../../versioned/letter-wheel/rules/${id}/index.ts`];
}

export function wordsFor(version: PuzzleVersion): WordLists & { common: readonly string[] } {
  const read = (p: string) => parseList(readFileSync(join(ROOT, p), 'utf8'));
  const entry = version === BETA ? undefined : manifest.versions.find((e) => e.v === version)!;
  const names = entry ? entry.words : manifest.beta.words;
  const out = Object.fromEntries(
    Object.entries(names).map(([n, ref]) => [
      n,
      read(entry ? `src/versioned/words/${ref}.txt` : ref),
    ]),
  );
  return out as unknown as WordLists & { common: readonly string[] };
}

/** All versions to test: every numbered one plus beta. */
export const ALL_VERSIONS: PuzzleVersion[] = [...manifest.versions.map((e) => e.v), BETA];

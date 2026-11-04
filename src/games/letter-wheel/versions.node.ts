// Node-only helpers for tests and scripts: read a version's rules + lists straight from disk.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BETA, parseList, type PuzzleVersion } from '@core/versions';
import { manifest, type LetterWheelRules } from './versions';
import type { WordLists } from '../../versioned/letter-wheel/rules/v1';

const ROOT = join(import.meta.dirname ?? __dirname, '../../..');
const RULES = import.meta.glob<LetterWheelRules>('../../versioned/letter-wheel/rules/*/index.ts', {
  eager: true,
});

export function rulesFor(version: PuzzleVersion): LetterWheelRules {
  const id =
    version === BETA ? manifest.beta.rules : manifest.versions.find((e) => e.v === version)!.rules;
  return RULES[`../../versioned/letter-wheel/rules/${id}/index.ts`];
}

export function wordsFor(version: PuzzleVersion): WordLists {
  const read = (p: string) => parseList(readFileSync(join(ROOT, p), 'utf8'));
  if (version === BETA) {
    const w = manifest.beta.words;
    return { common: read(w.common), extended: read(w.extended) };
  }
  const w = manifest.versions.find((e) => e.v === version)!.words;
  return {
    common: read(`src/versioned/words/${w.common}.txt`),
    extended: read(`src/versioned/words/${w.extended}.txt`),
  };
}

/** All versions to test: every numbered one plus beta. */
export const ALL_VERSIONS: PuzzleVersion[] = [...manifest.versions.map((e) => e.v), BETA];

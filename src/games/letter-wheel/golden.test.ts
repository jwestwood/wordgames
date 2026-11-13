/**
 * Golden fixtures: every numbered version pins several seeds to their exact puzzle. Fixtures are
 * written once by `npm run release:version -- letter-wheel` (GOLDEN_WRITE=1) and never edited.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { manifest } from './versions';
import { rulesFor, wordsFor } from './versions.node';

// Seeds as the app uses them (normalised: the typed code GSPOMH becomes GSP0MH).
const SEEDS = ['GSP0MH', 'K7Q2MX', '000000', 'ZZZZZZ', 'A1B2C3', 'M4N5P6', 'HX3T9W', '2026-11-04'];
const DIR = join(import.meta.dirname, '../../versioned/letter-wheel/golden');

function snapshot(v: number) {
  const rules = rulesFor(v);
  const dict = rules.prepare(wordsFor(v));
  return SEEDS.map((seed) => {
    const p = rules.generate(seed, dict);
    return {
      seed,
      target: p.target,
      required: p.required,
      outer: p.outer,
      pool: p.pool,
      ...('bonusPool' in p && p.bonusPool ? { bonusPool: p.bonusPool } : {}),
    };
  });
}

describe.each(manifest.versions.map((e) => e.v))('letter-wheel v%i golden', (v) => {
  const file = join(DIR, `v${v}.json`);
  it('matches its golden fixture exactly', () => {
    const actual = snapshot(v);
    if (!existsSync(file)) {
      if (!process.env.GOLDEN_WRITE) throw new Error(`missing golden fixture ${file}`);
      writeFileSync(file, JSON.stringify(actual, null, 1) + '\n');
    }
    expect(actual).toEqual(JSON.parse(readFileSync(file, 'utf8')));
  });
});

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadTier, loadWords } from './wordlist';

const ROOT = join(import.meta.dirname, '../../..');
const DATA = join(ROOT, 'src/core/words/data');
const HASHED = join(ROOT, 'src/versioned/words');

const BETA_LISTS = {
  common: '445313bad56f7031',
  targets: '6faf465c0cb33f12',
  bonus: '650a6a6e6122301b',
  extended: '650a6a6e6122301b',
} as const;

function sha16(buf: Buffer) {
  return createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

describe('beta word-list build', () => {
  it('working copies are sorted, disjoint, and match their content-addressed copies', () => {
    for (const [name, hash] of Object.entries(BETA_LISTS)) {
      const raw = readFileSync(join(DATA, `${name}.txt`));
      const words = raw.toString('utf8').trim().split('\n');
      expect(words).toEqual([...words].sort());
      expect(sha16(raw), name).toBe(hash);
      const stored = join(HASHED, `${hash}.txt`);
      expect(existsSync(stored), stored).toBe(true);
      expect(sha16(readFileSync(stored))).toBe(hash);
    }
    const common = readFileSync(join(DATA, 'common.txt'), 'utf8').trim().split('\n');
    const bonus = readFileSync(join(DATA, 'bonus.txt'), 'utf8').trim().split('\n');
    const targets = readFileSync(join(DATA, 'targets.txt'), 'utf8').trim().split('\n');
    const extended = readFileSync(join(DATA, 'extended.txt'), 'utf8').trim().split('\n');
    expect(extended).toEqual(bonus);
    const commonSet = new Set(common);
    const bonusSet = new Set(bonus);
    expect([...commonSet].some((w) => bonusSet.has(w))).toBe(false);
    expect(targets.every((w) => commonSet.has(w))).toBe(true);
  });

  it('keeps British official spellings and sends American-only forms to bonus', async () => {
    const common = await loadTier('common');
    const bonus = await loadTier('bonus');
    expect(common).toContain('colour');
    expect(common).toContain('organise');
    expect(common).toContain('centre');
    expect(common).toContain('leaper');
    expect(common).not.toContain('color');
    expect(common).not.toContain('organize');
    expect(common).not.toContain('center');
    expect(bonus).toContain('color');
    expect(bonus).toContain('organize');
    expect(bonus).toContain('center');
    const wider = await loadWords('bonus');
    expect(wider).toContain('colour');
    expect(wider).toContain('color');
    expect(wider.length).toBe(common.length + bonus.length);
  });
});

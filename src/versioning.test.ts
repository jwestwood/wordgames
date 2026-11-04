/**
 * Build-time integrity checks for src/versioned (run by `npm run check:versions`, part of `build`):
 * - isolation: versioned code imports only versioned code; rule sets and kernels import only kernel
 *   folders or their own folder (never src/core, games or npm packages);
 * - every manifest word-list hash has a stored list whose content matches the hash;
 * - every manifest rules folder exists, and every numbered version has a golden fixture.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { VersionManifest } from '@core/versions';

const VERSIONED = join(import.meta.dirname, 'versioned');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const IMPORT_RE =
  /(?:^|[\s;])(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|^\s*import\s*['"]([^'"]+)['"]/gm;

export function importsOf(src: string): string[] {
  return [...src.matchAll(IMPORT_RE)].map((m) => m[1] ?? m[2] ?? m[3]);
}

/** Folder that owns a file for isolation purposes: kernel/<k>, <game>/rules/<id>, or null. */
function unitOf(rel: string): string | null {
  const parts = rel.split(sep);
  if (parts[0] === 'kernel' && parts.length > 2) return parts.slice(0, 2).join('/');
  if (parts[1] === 'rules' && parts.length > 3) return parts.slice(0, 3).join('/');
  return null;
}

export function isolationErrors(root = VERSIONED): string[] {
  const errors: string[] = [];
  for (const file of walk(root).filter((f) => /\.(ts|tsx|js|mjs)$/.test(f))) {
    const rel = relative(root, file);
    const unit = unitOf(rel);
    for (const spec of importsOf(readFileSync(file, 'utf8'))) {
      if (!spec.startsWith('.')) {
        errors.push(`${rel}: imports '${spec}' (only relative imports inside src/versioned)`);
        continue;
      }
      const target = relative(root, resolve(dirname(file), spec));
      if (target.startsWith('..')) {
        errors.push(`${rel}: imports '${spec}' outside src/versioned`);
        continue;
      }
      if (unit) {
        const tu = unitOf(target + sep + 'x') ?? unitOf(target);
        const ok = tu === unit || (tu?.startsWith('kernel/') ?? false);
        if (!ok) errors.push(`${rel}: '${spec}' (rules/kernels import only kernels or own folder)`);
      }
    }
  }
  return errors;
}

const manifests = readdirSync(VERSIONED)
  .map((d) => join(VERSIONED, d, 'manifest.json'))
  .filter(existsSync)
  .map((p) => JSON.parse(readFileSync(p, 'utf8')) as VersionManifest);

describe('versioned code isolation', () => {
  it('has no imports from outside the allowed folders', () => {
    expect(isolationErrors()).toEqual([]);
  });

  it('the checker catches violations', () => {
    expect(
      importsOf(`import { x } from '@core/words';\nimport('../../x');\nimport './y.css';`),
    ).toEqual(['@core/words', '../../x', './y.css']);
  });
});

describe.each(manifests.map((m) => [m.game, m] as const))('%s manifest', (game, m) => {
  it('numbered versions are 1..N in order and point at existing rules', () => {
    expect(m.versions.map((e) => e.v)).toEqual(m.versions.map((_, i) => i + 1));
    for (const e of [...m.versions, m.beta])
      expect(existsSync(join(VERSIONED, game, 'rules', e.rules, 'index.ts'))).toBe(true);
  });

  it('every word-list hash has a stored, matching list', () => {
    for (const e of m.versions)
      for (const [name, hash] of Object.entries(e.words)) {
        const file = join(VERSIONED, 'words', `${hash}.txt`);
        expect(existsSync(file), `v${e.v} ${name} -> ${hash}`).toBe(true);
        const actual = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16);
        expect(actual, `content of ${hash}.txt`).toBe(hash);
      }
  });

  it('every numbered version has a golden fixture', () => {
    for (const e of m.versions)
      expect(existsSync(join(VERSIONED, game, 'golden', `v${e.v}.json`)), `v${e.v}`).toBe(true);
  });
});

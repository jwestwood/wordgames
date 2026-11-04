#!/usr/bin/env node
/**
 * Freeze a game's beta into the next numbered puzzle version.
 *
 *   npm run release:version -- <game-id> [--dry-run]
 *
 * 1. copies src/versioned/<game>/rules/<beta.rules> -> rules/vN (rewrites the header comment;
 *    imports are relative at the same depth, so they keep working);
 * 2. hashes each beta working-copy word list (sha256, 16 hex) and stores it as
 *    src/versioned/words/<hash>.txt (reusing an existing file when the content is unchanged);
 * 3. appends { v: N, rules: 'vN', words: { name: hash } } to the manifest;
 * 4. writes golden fixtures (GOLDEN_WRITE=1 vitest run src/games/<game>/golden.test.ts) and runs
 *    the versioning integrity checks.
 * Refuses to release when neither the rules nor any list changed since the latest version.
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const game = args.find((a) => !a.startsWith('--'));
const dry = args.includes('--dry-run');
if (!game) {
  console.error('usage: npm run release:version -- <game-id> [--dry-run]');
  process.exit(1);
}
const gameDir = join(ROOT, 'src/versioned', game);
const manifestPath = join(gameDir, 'manifest.json');
if (!existsSync(manifestPath)) {
  console.error(`no manifest at ${manifestPath}`);
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const prev = manifest.versions.at(-1);
const n = (prev?.v ?? 0) + 1;
const rulesId = `v${n}`;
const betaRules = join(gameDir, 'rules', manifest.beta.rules);
const newRules = join(gameDir, 'rules', rulesId);
if (existsSync(newRules)) {
  console.error(`${newRules} already exists`);
  process.exit(1);
}

const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const words = {};
for (const [name, path] of Object.entries(manifest.beta.words)) {
  words[name] = hash(readFileSync(join(ROOT, path)));
}

/** Rule-set content with the header normalised, for "did anything change?" comparison. */
const rulesFingerprint = (dir) =>
  readdirSync(dir, { recursive: true })
    .filter((f) => !f.endsWith('.test.ts'))
    .sort()
    .map((f) => {
      const p = join(dir, f);
      try {
        return `${f}\n${normalise(readFileSync(p, 'utf8'))}`;
      } catch {
        return f; // directory
      }
    })
    .join('\n');
const HEADER = /^\/\*\*[\s\S]*?\*\/\n/;
const normalise = (src) => src.replace(HEADER, '');

if (prev) {
  const sameWords = JSON.stringify(prev.words) === JSON.stringify(words);
  const sameRules =
    rulesFingerprint(join(gameDir, 'rules', prev.rules)) === rulesFingerprint(betaRules);
  if (sameWords && sameRules) {
    console.error(`beta is identical to v${prev.v}; nothing to release`);
    process.exit(1);
  }
}

console.log(`${game}: releasing beta as v${n}`);
console.log(`  rules  ${manifest.beta.rules} -> ${rulesId}`);
for (const [name, h] of Object.entries(words)) {
  const reused = existsSync(join(ROOT, 'src/versioned/words', `${h}.txt`));
  console.log(`  words  ${name} -> ${h}${reused ? ' (already stored)' : ' (new)'}`);
}
if (dry) process.exit(0);

// 1. rules
cpSync(betaRules, newRules, { recursive: true, filter: (src) => !src.endsWith('.test.ts') });
for (const f of readdirSync(newRules, { recursive: true }).filter((f) => /\.tsx?$/.test(f))) {
  const p = join(newRules, f);
  const src = readFileSync(p, 'utf8').replace(
    HEADER,
    `/**\n * ${game} rules ${rulesId} — FROZEN (released from beta). Never edit: change rules/beta and\n * release a new version instead (ARCHITECTURE.md › Puzzle versions). Imports only frozen kernels.\n */\n`,
  );
  writeFileSync(p, src);
}
// 2. word lists (content-addressed, immutable)
for (const [name, path] of Object.entries(manifest.beta.words)) {
  const dest = join(ROOT, 'src/versioned/words', `${words[name]}.txt`);
  if (!existsSync(dest)) cpSync(join(ROOT, path), dest);
}
// 3. manifest
manifest.versions.push({ v: n, rules: rulesId, words });
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
// 4. golden fixtures + integrity checks
const run = (cmd, env = {}) =>
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...env } });
run(
  'npx prettier --log-level warn --write ' +
    JSON.stringify(newRules) +
    ' ' +
    JSON.stringify(manifestPath),
);
const goldenTest = `src/games/${game}/golden.test.ts`;
if (existsSync(join(ROOT, goldenTest))) run(`npx vitest run ${goldenTest}`, { GOLDEN_WRITE: '1' });
else console.warn(`  (no ${goldenTest}; add one to pin seeds for v${n})`);
const golden = join(gameDir, 'golden', `v${n}.json`);
if (existsSync(golden)) run('npx prettier --log-level warn --write ' + JSON.stringify(golden));
run('npx vitest run src/versioning.test.ts');
console.log(`\nDone: ${game} v${n} is now the public default. Review and commit:`);
console.log(`  git add src/versioned && git commit -m "${game}: release puzzle version ${n}"`);

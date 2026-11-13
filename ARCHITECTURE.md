# Architecture

How the codebase is put together. How Letter Wheel _plays_ — each mechanic and the strategy (or comfort) it adds — is in [GAME_MECHANICS.md](./GAME_MECHANICS.md).
A short abstract of the v4 design, for comparison with other games, is in [docs/MECHANICS_ABSTRACT.md](./docs/MECHANICS_ABSTRACT.md).
Word-list sources, licences, and why v4 (and beta) use 12dicts `3of6game` plus a bonus tier are in [docs/DICTIONARY_OPTIONS.md](./docs/DICTIONARY_OPTIONS.md).

```
src/
  core/            shared, game-agnostic code (import via `@core/...`)
    words/         normalise, letterCounts, canSpell, isAnagram, shuffleLetters, scramble,
                   parseWordList / loadWordList / isValidWord, pickRandom,
                   multiset subwords: letterBag, canSpellFrom, createWordIndex, findSubwords, findAnagrams
    random/        seeded PRNG (createRng, int, pick, shuffle, sample, weighted),
                   seed codes (generateSeed, dailySeed), URL helpers (gameHash, shareLink, newPuzzle, ensureSeed),
                   selectWithCriteria (seeded retry-until-criteria-pass with deterministic fallback)
    game/          scoring helpers, progressFor (stars/perfect), localStorage persistence,
                   per-seed state, hooks (useGameState, useCountdown, usePersistentState, useSeedState)
    history/       shared puzzle history: versioned localStorage store (upsert/list/remove/clear,
                   one entry per game+seed+puzzle version, 200-entry cap), useHistoryEntry hook
    versions/      puzzle-version glue: manifest types, ?v= parsing/resolution, history labels,
                   lazy versioned loader (rules + content-addressed lists), save/history migration
    settings/      per-game settings schema (toggle/select/range), tolerant load/save, useGameSettings
    brand/         GameBrand type (Icon, Logo, tagline, accent, favicon), documentTitle, useDocumentBrand
    audio/         Web Audio sound manager (lazy unlock on first gesture, preload/decode, deterministic
                   pitch variation, persisted mute, pauses when hidden), shared SOUNDS registry, useSound/useMuted
    ui/            shared components (GameCard, Button, LetterTiles, LetterWheel, WordSlots, Confetti, ...)
    registry.ts    GameDefinition type
    router.ts      tiny hash router (#/games/<id>) – works on any static host
  versioned/       FROZEN puzzle logic + data (see "Puzzle versions"); must not import anything else
    kernel/<name>@<n>/   frozen deterministic helpers (rng@1, select@1, subwords@1)
    words/<hash>.txt     content-addressed, immutable word lists
    <game-id>/     manifest.json, rules/v1..vN (frozen) + rules/beta (working copy), golden/vN.json
  games/
    index.ts       games registry – add new games here
    <game-id>/     one thin module per game
  App.tsx          shell: home grid + routes to a game's component
```

## The rule

**If functionality can be generalised, it goes in `src/core` as a tested utility. Games stay thin.**

- A game module mostly wires core utilities, hooks and UI together, plus its own rules/content.
- Every new core utility ships with Vitest tests (`*.test.ts`).
- Core must never import from `src/games`.
- Pure logic first (easy to test); React hooks/components wrap it.

## Static site & seeds

The app is a **static site with no backend**. All game data (e.g. word lists in `src/core/words/data/`,
lazy-loaded via `loadWords()` as separate chunks) is bundled.

**The seed rule:** every puzzle's configuration is derived from a shareable seed using the core RNG
(`createRng(seed, gameId)` from `@core/random`). Games must **never** call `Math.random` (or `Date`,
etc.) to build a puzzle. The seed lives in the URL: `#/games/<id>?seed=K7Q2MX`. Use `ensureSeed(id)` on
load, `newPuzzle(id)` for "play again", and `shareLink(id, seed)` to share. The same seed + same app version
must always yield the same puzzle, so keep word lists sorted and avoid iterating unordered collections when
drawing from the RNG. Games with puzzle versions (below) guarantee this forever: a seed + numbered version
is immutable, and word-list or rule changes only ever ship as a new version.

## Adding a game

1. Create `src/games/<id>/index.ts(x)` exporting a `GameDefinition` (set `component` and `status: 'playable'` when ready).
2. Add it to the array in `src/games/index.ts`.
3. It is reachable at `#/games/<id>`.
4. Give it a `brand` (see below).

## Branding

`GameDefinition.brand` (`GameBrand` in `src/core/brand`) holds a game's identity:

- `Icon` — square inline-SVG React component (`{ size, title, className }`), readable at 32px.
- `Logo` — wide (~4:1) inline-SVG component: mini mark + wordmark; `size` is the height.
- `tagline` — one short line; `accent` — optional single theme variable (e.g. `var(--color-red)`).
- `favicon` — optional standalone `.svg` URL (hex colours, no web fonts) swapped in on the game page.

Core uses it everywhere: `GameCard` (icon + tagline), `HistoryPanel` (small icon by the name), the
style guide's Branding panel, and `App` calls `useDocumentBrand` to set the document title/favicon.
Brand assets live in `src/games/<id>/brand/` (Letter Wheel: `WheelMark`, `Icon`, `Logo`, `icon.svg`).

## Puzzle versions

A puzzle is identified by **(seed, version)**. Numbered versions (`1`, `2`, …) are immutable; `beta` is a
mutable, opt-in working copy for development.

**Layout** (`src/versioned/`):

- `words/<hash>.txt` — word lists stored by content hash (sha256, 16 hex). Immutable once a manifest
  references them; lazy-loaded (`import.meta.glob`), so old lists cost nothing until a save needs them.
- `kernel/<name>@<n>/` — frozen copies of the deterministic helpers rules need (`rng@1`: cyrb128 + sfc32
  `createRng`, `shuffle`; `select@1`: `selectWithCriteria`; `subwords@1`: word index, `findSubwords`,
  `findAnagrams`). **Never edit**: a behaviour change is a new `@2`. Several rule sets share a kernel.
  `src/core/random` and `src/core/words` re-export the latest kernels, so there is one implementation.
- `<game>/rules/<id>/` — everything that maps seed → puzzle or affects save compatibility (target
  selection, criteria, pool limits, min length, answer tiers, star thresholds, guess validation, scoring).
  `rules/vN` are frozen; `rules/beta` is the working copy. UI, animation, sounds and settings live in
  `src/games/<game>` and can change freely.
- `<game>/manifest.json` — `{ beta: { rules: 'beta', words: { common: '<path of working list>' } },
versions: [{ v: 1, rules: 'v1', words: { common: '<hash>', extended: '<hash>' } }] }`. A rules-only
  release reuses the previous list hashes.
- `<game>/golden/vN.json` — exact puzzles (target, centre, wheel order, pool) for pinned seeds.

**Isolation:** files under `src/versioned` import only relative paths inside `src/versioned`; rule sets
and kernels import only kernel folders or their own folder (no `@core`, games or npm packages).
Enforced by `src/versioning.test.ts` (also checks every manifest hash has a stored list whose content
matches, every rules folder exists and every version has a golden fixture) and an ESLint rule.
`npm run build` runs these checks first (`npm run check:versions`).

**Game side:** the game declares the rules interface it uses (Letter Wheel: `LetterWheelRules` in
`src/games/letter-wheel/versions.ts`: `prepare(words)`, `generate(seed, dict)`, `checkGuess`, `stars`,
`STAR_THRESHOLDS`, `MIN_WORD`) and loads a version with `createVersionedLoader` (`@core/versions`).
Beta lists are the working copies in `src/core/words/data/` (regenerated by `scripts/build-wordlist.py`,
including `bonus.txt`). Content-addressed copies of the current beta lists also live under
`src/versioned/words/`; numbered versions keep their own frozen hashes.

**URLs & saves:** `#/games/<id>?seed=GSPOMH&v=2`. A missing or unknown `v` means the latest numbered
version, and the game pins it into the URL on load. Share links always carry `v`; the dice/new-seed
stay on beta when you are on beta, otherwise go to the latest version. Per-seed saves live at
`wordgames:<game>:v<N>:seed:<seed>` (`…:beta:seed:…` for beta) and history entries store the version
id (`'1'`, `'2'`, `'beta'`), so old saves always reopen with exactly the rules and lists they were
made with. History shows a small `v1` / `Beta` stamp for non-latest entries; the game shows a note with
a "Play vN" link when you are not on the latest version.

**Beta:** opt in with `?v=beta` (e.g. `#/games/letter-wheel?v=beta`). Beta can change in any way and
may break its saves; its history entries are stamped "Beta" and never mix with numbered ones.

**Release** (`npm run release:version -- <game> [--dry-run]`, `scripts/release-version.mjs`):
copies `rules/beta` → `rules/vN` (stamping the frozen header), hashes the beta word lists and stores
any new ones under `words/<hash>.txt` (unchanged lists reuse their hash), appends the manifest entry,
writes `golden/vN.json` (`GOLDEN_WRITE=1` run of `src/games/<game>/golden.test.ts`) and runs the
integrity checks. It refuses if beta is identical to the latest version. Review, then commit
`src/versioned`; on deploy vN becomes the public default.

**Letter Wheel versions:** v1 — original generator and lists (answers = common: SCOWL ≤ 35, Zipf ≥ 3.3).
v2 — looser common answers (Zipf ≥ 2.6 + allowlist: _pant, veal, antler, leaper_, …); wheel drawn/sized
from strict `targets` (= v1 common), answer pool capped at 100.
v3 — same lists as v2; answer pool must be 20–40 words; every distinct wheel letter in ≥ 3 answers
(target included); wheel still from `targets`.
v4 — official answers and targets rebuilt from 12dicts `3of6game` (British forms in the official
pool; Zipf ≥ 2.2). American-only spellings and rarer `3of6game` words are accepted as bonus finds.
Same 20–40 pool and letter-coverage rules as v3. Public default. Stats:
`npx vite-node scripts/letter-wheel-stats.ts 300 <1|2|3|4|beta>`.

Beta (opt-in working copy of v4): `?v=beta`. Edit freely until the next release. See
[docs/DICTIONARY_OPTIONS.md](./docs/DICTIONARY_OPTIONS.md).

**Touch input:** interactive wheels act on press via `pressProps`/`createPressGuard` (`src/core/ui/tap.ts`):
fire on pointerdown, swallow the follow-up click, keyboard clicks still work. Pair with the
`.no-touch-gestures` class (`touch-action: none`, no tap highlight / callout / selection) so iOS taps
are never lost to scroll detection. Hover styles are behind `@media (hover: hover)`.

**Migration:** `GameDefinition.migrate` runs once at startup. Letter Wheel moves legacy history
entries stamped `lw1-92d0b432` (the v1 lists) to version `1` and copies their saves from
`letter-wheel:seed:<seed>` to `letter-wheel:v1:seed:<seed>`; other legacy stamps keep an "Older word
list" label and open on the latest version.

## Puzzle history

Games report progress with `useHistoryEntry(gameId, seed, { summary, found, total, stars, maxStars,
completed, version, started })`. One entry per (gameId, seed) lives in `wordgames:history`
(`{ schema: 1, entries }`; unknown/corrupt data is dropped, a legacy bare array is migrated). The summary
must never spoil the answer (e.g. "9 letters · centre R"). Entries are only created once `started` is true;
Letter Wheel sets it on the **first submitted guess** (right or wrong) or when the seed already has saved
words, so opening/randomising puzzles does not clutter history. Cap: 200 entries, evicting the oldest
completed first, then the oldest. Entries are keyed by (gameId, seed, version); set `latestVersion` on the
`GameDefinition` and entries from other versions get a small `v1` / `Beta` stamp (see Puzzle versions).

## Settings

A game declares player settings with `defineSettings([...] as const)` (`src/core/settings`) and sets
`GameDefinition.settings` to that array. Each definition is `{ key, label, description?, type:
'toggle' | 'select' | 'range', default }` plus `options` (select) or `min`/`max`/`step`/`format` (range).
Values live in `localStorage` at `wordgames:settings:<gameId>`; storage is versionless but tolerant —
unknown keys are ignored, invalid/missing values fall back to the default, and only non-default values
are written. In the game:

```tsx
const { values } = useGameSettings(GAME_ID, MY_SETTINGS); // typed: values.keepWrongGuesses is boolean
<GameSettingsButton gameId={GAME_ID} definitions={MY_SETTINGS} />; // cog next to the seed field
```

`GameSettingsButton` renders nothing when there are no settings and opens the core `SettingsPanel`
(Modal, auto-rendered from the schema, Reset to defaults). Mute is **not** a setting: it stays the
global header button. Letter Wheel: `keepWrongGuesses` (default off) keeps an incorrect guess in
the input, turns its tiles red, and disables Guess until a letter is added or removed. A retired
`autoScroll` key in older saves is ignored and dropped; desktop always scrolls to a new official
find, and mobile keeps the fixed one-screen table.

## Deployment

Render static site (`render.yaml`): build `npm ci && npm run build`, publish `dist/`, all paths rewritten to `/index.html`. Vite `base` is `/`. Node is pinned to 22 LTS (`.nvmrc`, `engines`, `NODE_VERSION` in render.yaml).

## Sound

Sound names are **slots**; a global **sound theme** (`src/core/audio/themes.ts`: Classic, Soft,
Tabletop, Arcade) maps every slot to a file. The header has a theme dropdown next to the mute button
(choosing one plays a short `success-big` preview); the choice persists in `wordgames:soundTheme`
(`useSoundTheme` / `setSoundTheme`, which calls `sound.setSounds`). Games only ever call
`play('<slot>')`. Mute stays a separate global button. Theme files: `public/sounds/<theme>/`, built
by `scripts/sounds/build-theme.sh` (credits in `public/sounds/CREDITS.md`).

Shared sound names (`tap`, `button`, `error`, `success`, `star`, `perfect`, `shuffle`, `delete`, `clear`,
`word-land`, `already-found`, `bonus-word`, `copy`, `dice`, `open`, `close`) live in `src/core/audio/sounds.ts`; files are
in `public/sounds/` (ogg + mp3, CC0, see `CREDITS.md`). Games call `const play = useSound(); play('tap')`.
Mute is a header toggle persisted in `localStorage` (`wordgames:muted`). Playback is a silent no-op when
muted, the tab is hidden, Web Audio is unavailable, or the file has not decoded yet. Never use `Math.random`
for variation (the manager uses a deterministic counter). `Modal` plays open/close unless `silent`.

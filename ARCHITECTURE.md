# Architecture

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
                   200-entry cap), WORDLIST_VERSION (build-time hash of word lists), useHistoryEntry hook
    brand/         GameBrand type (Icon, Logo, tagline, accent, favicon), documentTitle, useDocumentBrand
    audio/         Web Audio sound manager (lazy unlock on first gesture, preload/decode, deterministic
                   pitch variation, persisted mute, pauses when hidden), shared SOUNDS registry, useSound/useMuted
    ui/            shared components (GameCard, Button, LetterTiles, LetterWheel, WordSlots, Confetti, ...)
    registry.ts    GameDefinition type
    router.ts      tiny hash router (#/games/<id>) – works on any static host
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
drawing from the RNG. Changing a word list changes puzzles for existing seeds; accept that knowingly.

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

## Puzzle history

Games report progress with `useHistoryEntry(gameId, seed, { summary, found, total, stars, maxStars,
completed, version, started })`. One entry per (gameId, seed) lives in `wordgames:history`
(`{ schema: 1, entries }`; unknown/corrupt data is dropped, a legacy bare array is migrated). The summary
must never spoil the answer (e.g. "9 letters · centre R"). Entries are only created once `started` is true;
Letter Wheel sets it on the **first submitted guess** (right or wrong) or when the seed already has saved
words, so opening/randomising puzzles does not clutter history. Cap: 200 entries, evicting the oldest
completed first, then the oldest. Set `puzzleVersion` on the `GameDefinition` (e.g. `lw1-${WORDLIST_VERSION}`);
entries recorded with another version are stamped "Older word list" in the panel.

## Deployment

Render static site (`render.yaml`): build `npm ci && npm run build`, publish `dist/`, all paths rewritten to `/index.html`. Vite `base` is `/`. Node is pinned to 22 LTS (`.nvmrc`, `engines`, `NODE_VERSION` in render.yaml).

## Sound

Shared sound names (`tap`, `button`, `error`, `success`, `star`, `perfect`, `shuffle`, `delete`, `clear`,
`word-land`, `already-found`, `copy`, `dice`, `open`, `close`) live in `src/core/audio/sounds.ts`; files are
in `public/sounds/` (ogg + mp3, CC0, see `CREDITS.md`). Games call `const play = useSound(); play('tap')`.
Mute is a header toggle persisted in `localStorage` (`wordgames:muted`). Playback is a silent no-op when
muted, the tab is hidden, Web Audio is unavailable, or the file has not decoded yet. Never use `Math.random`
for variation (the manager uses a deterministic counter). `Modal` plays open/close unless `silent`.

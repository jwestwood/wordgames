# Architecture

```
src/
  core/            shared, game-agnostic code (import via `@core/...`)
    words/         normalise, letterCounts, canSpell, isAnagram, shuffleLetters, scramble,
                   parseWordList / loadWordList / isValidWord, pickRandom
    random/        seeded PRNG (createRng, int, pick, shuffle, sample, weighted),
                   seed codes (generateSeed, dailySeed), URL helpers (gameHash, shareLink, newPuzzle, ensureSeed)
    game/          scoring helpers, localStorage persistence, hooks
                   (useGameState, useCountdown, usePersistentState)
    ui/            shared components (GameCard, Button, LetterTiles)
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

## Deployment

Render static site (`render.yaml`): build `npm ci && npm run build`, publish `dist/`, all paths rewritten to `/index.html`. Vite `base` is `/`. Node is pinned to 22 LTS (`.nvmrc`, `engines`, `NODE_VERSION` in render.yaml).

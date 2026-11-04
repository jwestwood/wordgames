# Word Games

A web app for building and playing word games, built with React + Vite + TypeScript.

## Structure

```
src/
  components/   Reusable UI (e.g. GameCard)
  games/        Game registry and individual games
  lib/words/    Word utilities (isAnagram, shuffleLetters) + tests
  App.tsx       Home page listing available games
```

## Scripts

| Script                            | Description                         |
| --------------------------------- | ----------------------------------- |
| `npm run dev`                     | Start the Vite dev server           |
| `npm run build`                   | Type-check and build for production |
| `npm run preview`                 | Preview the production build        |
| `npm test`                        | Run Vitest once                     |
| `npm run test:watch`              | Run Vitest in watch mode            |
| `npm run lint`                    | Run ESLint                          |
| `npm run format` / `format:check` | Format / check with Prettier        |

Requires Node 18+.

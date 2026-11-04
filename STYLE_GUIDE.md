# Style Guide — Paper & Tabletop

Live showcase: run `npm run dev` and open `#/style-guide`.

## Principles

1. **Tactile, not skeuomorphic kitsch** — warm paper, wooden tiles, soft real-world shadows; subtle textures only (inline SVG noise / CSS gradients, no image files).
2. **Ink on paper** — high-contrast dark ink text; colour is an accent, never the only signal.
3. **Tokens only** — components use CSS variables from `src/core/ui/theme/tokens.css`. No raw hex values in games.
4. **Core first, games thin** — anything reusable lives in `src/core/ui`; a game composes components.
5. **Calm motion** — short, springy feedback; all motion disabled under `prefers-reduced-motion`.

## Tokens

### Colour

| Token                                  | Value                 | Use                                     |
| -------------------------------------- | --------------------- | --------------------------------------- |
| `--color-paper`                        | `#F4EBD9`             | page background                         |
| `--color-paper-light`                  | `#FAF5EA`             | surfaces (panels, modals), inverse text |
| `--color-paper-dark`                   | `#E9DCC2`             | hover on ghost elements                 |
| `--color-tile`                         | `#E8D3A9`             | tile face, secondary button             |
| `--color-tile-edge`                    | `#D4B984`             | tile/wood borders                       |
| `--color-wood`                         | `#C89B5E`             | board, selected tile                    |
| `--color-wood-dark`                    | `#8A6236`             | board frame                             |
| `--color-ink`                          | `#2B2B2B`             | text                                    |
| `--color-ink-muted`                    | `#5A5145`             | secondary text                          |
| `--color-red` / `--color-red-dark`     | `#B23A2E` / `#8E2C22` | accent, links, danger, "present"        |
| `--color-green` / `--color-green-dark` | `#2F5D50` / `#22463C` | primary action, success, "correct"      |
| `--color-absent`                       | `#6B6255`             | "absent" tile                           |

Semantic aliases: `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-text-inverse`, `--color-accent`, `--color-success`, `--color-border`, `--color-focus`, `--color-overlay`, and per-state `--tile-{state}-bg/fg`.

### Type

| Token                                | Value                                  |
| ------------------------------------ | -------------------------------------- |
| `--font-heading`                     | Fraunces                               |
| `--font-ui`                          | Work Sans                              |
| `--font-accent`                      | Special Elite                          |
| `--text-xs … --text-3xl`             | 0.75, 0.875, 1, 1.25, 1.5, 2, 2.75 rem |
| `--leading-tight / -normal`          | 1.15 / 1.5                             |
| `--weight-regular / -medium / -bold` | 400 / 500 / 700                        |

### Spacing, radius, shadow, motion

| Token                                     | Value                                      |
| ----------------------------------------- | ------------------------------------------ |
| `--space-1 … --space-8`                   | 4, 8, 12, 16, 24, 32, 48, 64 px            |
| `--radius-sm / md / lg / pill`            | 4 / 8 / 14 / 999 px                        |
| `--shadow-paper`                          | resting card                               |
| `--shadow-raised`                         | hover card, modal, board                   |
| `--shadow-tile` / `--shadow-tile-pressed` | bevelled tile / pressed                    |
| `--shadow-focus`                          | focus ring (paper gap + red ring)          |
| `--duration-fast / base / slow`           | 120 / 200 / 400 ms (0 when reduced motion) |
| `--ease-out`, `--ease-bounce`             | easing curves                              |
| `--texture-paper`, `--texture-wood`       | background textures                        |

A JS mirror of the colours is in `theme/tokens.ts` (keep in sync).

## Typography

- Headings: Fraunces 700, `--leading-tight`. Body/UI: Work Sans 400/500. Accents (stamps, labels, taglines): Special Elite — sparingly, never for long text.
- Fonts load via the Google Fonts `<link>` in `index.html` with system fallbacks.

## Components (`import { … } from '@core/ui'`)

| Component      | Props / states                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Button`       | `variant`: primary · secondary · danger · ghost; `size`: sm · md · lg; disabled                                               |
| `Tile`         | `letter`, `state`: default · selected · correct · present · absent; `value` (points), `size`, `static` (non-interactive span) |
| `LetterTiles`  | rack of static tiles; optional `states[]`                                                                                     |
| `Board`        | wooden grid, `cols`; arrow keys / Home / End move focus between tiles                                                         |
| `Panel`        | paper card, `title`, `variant`: paper · wood                                                                                  |
| `GameCard`     | game listing card; "Play" button or "Coming soon" stamp                                                                       |
| `Header`       | site title, tagline, nav links                                                                                                |
| `Modal`        | `open`, `onClose`, `title`, `footer`; focus trap, Esc/backdrop close, focus restore                                           |
| `LetterWheel`  | segmented SVG circle: `centre`, `letters`, `used` indices, `onCentre`, `onLetter` (geometry in `wheel.ts`)                    |
| `WordSlots`    | word list; unrevealed words as blank letter slots, `latest` highlighted                                                       |
| `Confetti`     | seeded CSS paper-confetti burst; hidden under reduced motion                                                                  |
| `ScoreDisplay` | `score`, `delta` (+/−), `best`; live region                                                                                   |

Pure helpers (tested in `ui.test.ts`): `evaluateGuess`, `tileLabel`, `formatScore`, `gridNavigate`, `trapFocusIndex`; `contrastRatio`/`meetsAA` in `theme/contrast.ts`.

Tile states: correct = green + filled dot, present = red + hollow ring, absent = muted brown, selected = wood + lifted. Shapes give a non-colour cue.

## Do / Don't

- **Do** use tokens (`var(--space-4)`), shared components, and semantic aliases.
- **Do** pair state colour with a shape or label.
- **Don't** hard-code hex values, fonts or shadows in games.
- **Don't** add image textures; use the token textures.
- **Don't** use Special Elite for body copy or the red accent for large fills beyond tiles/buttons.

## Accessibility

- All token pairs are verified ≥ 4.5:1 by `theme.test.ts` (WCAG AA); add new pairs to `contrastPairs`.
- Visible focus ring on every interactive element (`:focus-visible`).
- Tiles expose labels like "A, in word, wrong place"; selected tiles use `aria-pressed`.
- Modal: `role="dialog"`, `aria-modal`, labelled title, focus trap, Esc closes.
- Score uses `aria-live="polite"`; motion honours `prefers-reduced-motion`.

## Using it in a new game

```tsx
import { Board, Tile, Panel, ScoreDisplay, Button, evaluateGuess } from '@core/ui';

export function MyGame() {
  const states = evaluateGuess(guess, answer);
  return (
    <Panel title="My Game">
      <ScoreDisplay score={score} />
      <Board cols={5}>
        {[...guess].map((c, i) => (
          <Tile key={i} letter={c} state={states[i]} />
        ))}
      </Board>
      <Button onClick={submit}>Submit</Button>
    </Panel>
  );
}
```

Register it in `src/games`; global styles load automatically via `@core/ui`. If you need something new and reusable, add it to `src/core/ui` with tokens, a style-guide entry, and tests for any logic.

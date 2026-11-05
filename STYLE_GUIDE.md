# Style Guide — Paper & Tabletop

Live showcase: run `npm run dev` and open `#/style-guide` (linked from the site footer).

## Principles

1. **Tactile, not skeuomorphic kitsch** — warm paper, wooden tiles, soft real-world shadows; subtle textures only (inline SVG noise / CSS gradients, no image files).
2. **Ink on paper** — high-contrast dark ink text; colour is an accent, never the only signal.
3. **Tokens only** — components use CSS variables from `src/core/ui/theme/tokens.css`. No raw hex values in games.
4. **Core first, games thin** — anything reusable lives in `src/core/ui`; a game composes components.
5. **Calm motion** — short, springy feedback; all motion disabled under `prefers-reduced-motion`.

## Tokens

### Colour

| Token                                    | Value                 | Use                                     |
| ---------------------------------------- | --------------------- | --------------------------------------- |
| `--color-paper`                          | `#F4EBD9`             | page background                         |
| `--color-paper-light`                    | `#FAF5EA`             | surfaces (panels, modals), inverse text |
| `--color-paper-dark`                     | `#E9DCC2`             | hover on ghost elements                 |
| `--color-tile`                           | `#E8D3A9`             | tile face, secondary button             |
| `--color-tile-edge`                      | `#D4B984`             | tile/wood borders                       |
| `--color-wood`                           | `#C89B5E`             | board, selected tile                    |
| `--color-wood-dark`                      | `#8A6236`             | board frame                             |
| `--color-ink`                            | `#2B2B2B`             | text                                    |
| `--color-ink-muted`                      | `#5A5145`             | secondary text                          |
| `--color-red` / `--color-red-dark`       | `#B23A2E` / `#8E2C22` | accent, links, danger, "present"        |
| `--color-green` / `--color-green-dark`   | `#2F5D50` / `#22463C` | primary action, success, "correct"      |
| `--color-yellow` / `--color-yellow-dark` | `#E3B33B` / `#C99A22` | warning button (ink text), earned stars |
| `--color-absent`                         | `#6B6255`             | "absent" tile                           |

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

| Component                 | Props / states                                                                                                                                                                                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                  | **One height** (`--control-height` / 2.5rem) for every button. `variant`: primary · secondary · danger · warning · ghost; `.btn--icon` for icon-only (same height, min-width 2.75rem); `size` only changes padding/type; icon+label OK                                                                      |
| `Tile`                    | `letter`, `state`: default · selected · correct · present · absent; `value` (points), `size`, `static` (non-interactive span)                                                                                                                                                                               |
| `LetterTiles`             | rack of static tiles; optional `states[]`                                                                                                                                                                                                                                                                   |
| `Board`                   | wooden grid, `cols`; arrow keys / Home / End move focus between tiles                                                                                                                                                                                                                                       |
| `Panel`                   | paper card, `title`, `variant`: paper · wood                                                                                                                                                                                                                                                                |
| `GameCard`                | game listing card; "Play" button or "Coming soon" stamp; `MoreGamesCard` placeholder                                                                                                                                                                                                                        |
| `Header`                  | site title, tagline, nav links (icon-only when `icon` set), `onHistory` (clock + "Past Games"), sound toggle                                                                                                                                                                                                |
| `HistoryPanel`            | `open`, `onClose`, `games` (registry); game filter, In progress/Completed tabs, items link to `#/games/<id>?seed=`                                                                                                                                                                                          |
| `Modal`                   | `open`, `onClose`, `title`, `footer`, `className`; focus trap, Esc/backdrop close, focus restore                                                                                                                                                                                                            |
| `LetterWheel`             | segmented SVG circle: `centre`, `letters`, `used` indices, `onCentre`, `onLetter` (geometry in `wheel.ts`)                                                                                                                                                                                                  |
| `ToastStack` / `useToast` | paper toast overlay (slide from top of a `position: relative` parent); new toast replaces the previous                                                                                                                                                                                                      |
| `LetterStrip`             | `LETTERS:` + mini wood letter tiles (distinct, A–Z); `complete` set highlights tiles; equal padding around the divider                                                                                                                                                                                      |
| `WordSlots`               | word list (column-major); blank slots, optional `known` clue letters + `picking`/`onPick`; `latest` highlighted                                                                                                                                                                                             |
| `Confetti`                | seeded CSS paper-confetti burst; hidden under reduced motion                                                                                                                                                                                                                                                |
| `ScoreCard`               | wooden plaque: `found`, `total`, `percent`, `stars`, `maxStars`, `thresholds`; star slots carry `data-star-slot`                                                                                                                                                                                            |
| `SeedDisplay`             | editable seed field (Special Elite, typed input normalised via `normaliseSeedInput`; Enter/blur/Go applies if `isValidSeed`, else inline error + `aria-invalid`; Esc reverts) ; `.btn--icon` buttons on the left: copy link, randomise (`newPuzzle`; asks via `ConfirmDialog` when `started`); label "Seed" |
| `ConfirmDialog`           | paper `Modal` with Cancel (ghost) + confirm (`tone`: primary · danger · warning); use instead of `window.confirm`                                                                                                                                                                                           |
| `SettingsPanel`           | `open`, `onClose`, `title`, `definitions`, `values`, `onChange`, `onReset`; rows auto-rendered (toggle = `role="switch"` wooden slider with On/Off text, native `select`, `range` + output); `GameSettingsButton` (cog, `gameId`, `definitions`) wires it to persisted settings                             |
| Icons                     | `IconX`, `IconBackspace`, `IconShuffle`, `IconCopy`, `IconLink`, `IconDice`, `IconStar`, `IconClock`, `IconTrash`, `IconSpeaker`, `IconSpeakerOff`, `IconPalette`, `IconPawn`, `IconCog` (inline SVG, currentColor)                                                                                         |
| `ScoreDisplay`            | `score`, `delta` (+/−), `best`; live region                                                                                                                                                                                                                                                                 |

Motion (`motion.ts`, `queue.ts`, `transient.ts`): `flyElement(fromRect, to, content, opts)` (FLIP fixed overlay; `to` may be a rect, Element, or getter — rAF re-reads the live destination each frame so scroll/resize mid-flight still lands), `flashElement`, `attentionFlash` (pulse a few times), `ensureInView`, `createAnimationQueue()` (sequential tasks), `useTransientMessage(ms)` / `createTransient`. All motion helpers resolve instantly under reduced motion.

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

**Button height:** every `.btn` (including `.btn--sm` / `.btn--icon` / header / seed / Clue) is `--control-height` (2.5rem / ~40px). Never ship a shorter control — reuse `.btn` / `.btn--icon`. Header buttons also use `.site-header__btn` (secondary paper). The sound-theme dropdown matches via `.sound-theme__select`. Icon-only: `.btn--icon` (min-width 2.75rem). Buttons never move on hover or press — feedback is colour and shadow only.

Text selection (`::selection`, incl. inputs) uses `--color-selection-bg` (red-dark) / `--color-selection-fg` (paper-light); pairs are in the contrast tests.

## Branding

Every game gets a square **icon**, a wide **logo** (~4:1) and a **tagline** (`GameDefinition.brand`, see
ARCHITECTURE.md). Live examples: style guide › Branding (icons at 32/64/192px and the logo).

- **Shared palette and fonts only.** Fill SVGs with theme variables (`var(--color-wood)`), never new
  colours. Wordmarks use Fraunces (`font-family="Fraunces, Georgia, serif"` with `textLength` so fallbacks
  keep the width); taglines are set in Special Elite.
- **One accent touch per game** (e.g. Letter Wheel's red hub). Everything else is paper, tile, wood, ink.
- **Icon readable at 32px:** bold silhouette, ≤ 6–8 shapes, strokes ≥ 2 units in a 64 viewBox, no text
  smaller than the centre glyph. Check it in the style guide at 32px before shipping.
- **Logo:** mark on the left, wordmark on the right, ~4:1 viewBox (e.g. 320×80); scales by height.
- **Tagline:** ≤ 6 words, playful, says how the game feels; no spoilers or instructions.
- **Favicon:** a standalone `icon.svg` with hex values (no CSS variables or web fonts — browsers render
  favicons in isolation); draw letters as paths.
- Icons next to visible text are decorative (`aria-hidden`); give `title` when standalone.

## Settings

Games add settings by declaring a schema (see ARCHITECTURE.md › Settings) — never hand-build a settings
form. Put the cog (`GameSettingsButton`) beside the seed field in the game header. Labels are short
sentences in plain language; use `description` for the consequence of turning it off. Toggles show On/Off
text as well as colour. Mute stays in the site header, not in settings. Live demo: style guide ›
SettingsPanel.

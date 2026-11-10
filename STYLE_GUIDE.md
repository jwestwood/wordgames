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
| `Tile`                    | `letter`, `state`: default · selected · correct · present · absent · error; `value` (points), `size`, `static` (non-interactive span)                                                                                                                                                                       |
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
| `BonusCounter`            | `Bonus: N` count plus an optional compact list of found bonus words (`showWords`); Special Elite numerals and word stamps                                                                                                                                                                                   |
| `WordSlots`               | word list (column-major, ~8rem cols); letter cells sized to fit 10-letter words; blank slots, optional `known` clue letters + `picking`/`onPick`; `latest` highlighted                                                                                                                                      |
| `Confetti`                | seeded CSS paper-confetti burst; hidden under reduced motion                                                                                                                                                                                                                                                |
| `ScoreCard`               | wooden plaque: `found`, `total`, `percent`, `stars`, `maxStars`, `thresholds`; star slots carry `data-star-slot`                                                                                                                                                                                            |
| `SeedDisplay`             | editable seed field (Special Elite, typed input normalised via `normaliseSeedInput`; Enter/blur/Go applies if `isValidSeed`, else inline error + `aria-invalid`; Esc reverts) ; `.btn--icon` buttons on the left: copy link, randomise (`newPuzzle`; asks via `ConfirmDialog` when `started`); label "Seed" |
| `ConfirmDialog`           | paper `Modal` with Cancel (ghost) + confirm (`tone`: primary · danger · warning); use instead of `window.confirm`                                                                                                                                                                                           |
| `SettingsPanel`           | `open`, `onClose`, `title`, `definitions`, `values`, `onChange`, `onReset`; rows auto-rendered (toggle = `role="switch"` wooden slider with On/Off text, native `select`, `range` + output); `GameSettingsButton` (cog, `gameId`, `definitions`) wires it to persisted settings                             |
| Icons                     | `IconX`, `IconBackspace`, `IconShuffle`, `IconCopy`, `IconLink`, `IconDice`, `IconStar`, `IconClock`, `IconTrash`, `IconSpeaker`, `IconSpeakerOff`, `IconPalette`, `IconPawn`, `IconCog` (inline SVG, currentColor)                                                                                         |
| `ScoreDisplay`            | `score`, `delta` (+/−), `best`; live region                                                                                                                                                                                                                                                                 |

Motion (`motion.ts`, `queue.ts`, `transient.ts`): `flyElement(fromRect, to, content, opts)` (FLIP fixed overlay; `to` may be a rect, Element, or getter — rAF re-reads the live destination each frame so scroll/resize mid-flight still lands), `flashElement`, `attentionFlash` (pulse a few times), `ensureInView`, `createAnimationQueue()` (sequential tasks), `useTransientMessage(ms)` / `createTransient`. All motion helpers resolve instantly under reduced motion.

Pure helpers (tested in `ui.test.ts`): `evaluateGuess`, `tileLabel`, `formatScore`, `gridNavigate`, `trapFocusIndex`; `contrastRatio`/`meetsAA` in `theme/contrast.ts`.

Tile states: correct = green + filled dot, present = red + hollow ring, absent = muted brown, selected = wood + lifted, error = red with no ring (a kept incorrect guess). Shapes give a non-colour cue.

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

**Disabled buttons:** `.btn:disabled` keeps that same 40px height. It uses opacity 0.55 and `cursor: not-allowed`, and does not change colour, shadow or position on hover or press. Letter Wheel's Guess button is disabled when the input is empty, and after a kept incorrect guess until a letter is added or removed.

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

## Mobile game table and bottom sheet

Letter Wheel below **860px** uses a fixed `100dvh` game table with `viewport-fit=cover` and
safe-area padding. One compact header keeps history, sound theme and mute available; seed/settings,
progress/stars, wheel, guess and controls remain on the base screen. Buttons keep the shared 40px
height. The wheel gets the remaining grid space (container-query sizing), rather than shrinking all
text or allowing document scroll. At 860px and above the existing side-by-side view is unchanged.

`BottomSheet` is shared core UI (`enabled={false}` renders the **same** children inline).
It keeps one content tree mounted while closed, preserving scroll and clue state. Shared
`transitionSheet` moves the fixed paper panel from `translateY(100%)` to `0%` (280ms) while fading
the backdrop; closing reverses this. `BottomSheet` retains mounted **presence** through `closing`,
not merely the requested `open` value: labelled dialog/aria-modal, inert background, focus trap and
reference-counted body lock survive until exit completes. Then it hides the root and returns focus
without scrolling. Escape/backdrop/clear close remain available through exit. Interruptions snapshot
the live transform; stale animation completions cannot hide a reopened sheet. Reduced motion/no
WAAPI completes immediately; a 360ms fallback prevents a stranded exit. Inline desktop clears the
sheet transform. Header/close remain outside the scroll surface. On mobile Letter Wheel the
sheet body is a column: a compact toolbar, a list scroller (`.lw__words-scroller`), and a
fixed LETTERS footer. `.bottom-sheet__scroll` no longer scrolls that column as a whole;
the list scroller owns overflowing words and overscroll containment. The Style Guide includes
manual sliding-sheet and ink-reveal demos.

Letter Wheel's solid green, inverse-text **primary** `Words · found/total` opener remains 40px, with
normal focus/hover feedback and no movement. On beta the same 40px button also shows `· Bonus N`.
The tray stacks a compact toolbar (found/total, last word, Clue, and on beta a collapsible
`BonusCounter`), the official word list in two columns, and a compact LETTERS strip pinned to the
bottom of the sheet — no duplicate IDs or competing hidden targets. Bonus words stay behind the
disclosure so they do not push the list down. Clue stays 40px and clue mode does not change
element sizes. Mobile never page-auto-scrolls. Desktop keeps the side-by-side list, with the
bonus list expanded and LETTERS following the words.

**Automatic discovery sequence:** slide open completely → internally scroll blank into view →
ink reveal (495–600ms for 4–10 letters) + one rich themed word-found sound at the start → 750ms
readable hold → slide closed completely → queued stars/letters/perfect. Reduced motion uses
immediate sheet/ink changes, retains the readable hold and respects global mute/theme. Sound tiers
are existing `success` / `success-big` (6+) / `success-epic` (target length); no submission success
or additional `word-land` sound. Skipped invisible reveals are silent. Official finds only: a bonus
word plays the `bonus-word` slot, toasts, and updates the counter, and does not open the tray.

`createAutoDismiss` gives each automatic discovery a generation/lease. Only its current owner can
hold/close; close, explicit browsing, another discovery, resize to desktop and unmount invalidate
old work and release pending holds immediately. Manual opens have no lease and stay open. Any
pointer/keyboard/wheel/touch-scroll interaction within an automatic tray promotes it to manual
browsing, including clue use; programmatic focus/scroll does **not**. A discovery while manually
browsing preserves that intent. Queued work never opens the tray; only a new official guess or explicit
opener does. Repeated, invalid and bonus guesses never auto-open.

`WordSlots.revealing` commits real ink under an opacity mask before shared `revealWordInPlace`
animates it. Only ink transforms (perspective flip), opacity/filter and row background change:
420ms per letter plus up to 180ms total stagger, a warm/green paper wash, no layout shifts. The
visibility gate waits for the sheet's `open` phase before scrolling/revealing, then checks viewport
**and** scroll clipping. Phase gates are bounded to 600ms; row visibility has a 250ms grace period.
Closed/offscreen targets complete found state without motion or stale replay, so they cannot hold
the shared celebration queue. Desktop always scrolls the page to a new official row; mobile
scrolls only the tray list. Saved found
words always load normally, without auto-opening/revealing. Abort on unmount cancels waits/ink
animations; the AutoDismiss lease cancels its readable hold. The ALERT demo resets/replays only
when explicitly requested.

Only discovered-word fly-ins were replaced. Letter-complete square tiles and star fly-ins remain;
closed-tray letter-complete feedback uses `popOverElement`. Live fly getters track internal scroll
and fall back to the wheel if a tray closes mid-flight. Clue rendering and already-found flashes
remain separate. The explicit focus-return target is the Words opener (also for automatic opens);
Enter with a typed guess there submits and suppresses the opener's native click.

### Mobile viewport ownership (Firefox/toolbar/keyboard)

`useFixedGameViewport` is enabled by App only for the Letter Wheel route below 860px. It marks
`html[data-fixed-game]`; no `:has()` support is needed. Shared `viewport.css` bounds html → fixed
body → positioned `#root` → absolute app to one border-box viewport. This replaces the previous
normal-flow document beneath a separately fixed game panel, with no bounded `#root` and a root
minimum override dependent on `:has()`. The global site's `body { min-height:100vh }` cannot leak
into the route, and there is no oversized fixed panel contributing another viewport's scroll range.

Height progressively uses **100vh → 100svh → 100dvh**, so dynamic toolbar expansion/collapse resizes
one shared containing block. The app consumes `height:100%`, not a second independently sized fixed
viewport. Root/app margins and root padding are zero; the game's safe-area padding remains **inside**
its border-box. Footer stays out of the mobile game layout. Grid tracks use `minmax(0,1fr)` and
min-size resets so intrinsic flex/grid content cannot grow the shell. Desktop is unchanged.

While the flag is active, the existing viewport meta policy temporarily uses
`interactive-widget=resizes-content` (Firefox Android 132+/Chromium), letting CSS viewport units
shrink above the keyboard rather than leaving an obscured layout viewport. It preserves zoom and
all other directives, restoring the exact prior policy on route/desktop cleanup. There is no
visualViewport listener, hard-coded toolbar offset, touch prevention or new inline overflow write.
The BottomSheet's independent reference-counted overflow snapshot can therefore release before or
after route cleanup without restoring a stale route lock. Home/style guide remain document-scrollable;
history and trays retain their own scrolling surfaces, including over the game.

Short windows save gaps, not text/button size. Landscape 600–859px wide / ≤500px high places the
wheel beside the three control rows. Its size-contained wheel stretches with `height:auto` and a
160px minimum instead of percentage height across flexible spanning tracks; three ≥50px tracks
plus gaps supply a nonzero block axis for `cqh` and the square SVG. The play panel has a 180px
floor (tracks + padding/border); if chrome/safe areas leave less space, the layout scrolls internally
instead of reducing its viewport to zero or clipping the controls. At ≤599px wide / ≤500px high (e.g. a software keyboard), play
becomes an **internal** scroller with a 160px minimum wheel and 40px controls; the seed field remains
above it. This is an intentional extreme-height accessibility fallback, not clipping unreachable
controls and not reintroducing document scroll. Normal mobile sizes keep the one-screen layout.

Responsive regression contracts live in `mobile-layout.test.ts` and `fixedViewport.test.ts`;
they check CSS sizing/fallback order, conservative space budgets, keyboard metadata cleanup and
route/sheet lock release order, **not rendered layout or actual Firefox APZ behaviour**. Browser QA
must cover Firefox Android with chrome expanded/collapsed, rotation, keyboard open/closed, tray
internal scroll, nested history, then route exit to home/style guide and back. Also check 375×667,
390×844, 360×740, short landscape and desktop. No browser-specific success is inferred from the
unit contracts.

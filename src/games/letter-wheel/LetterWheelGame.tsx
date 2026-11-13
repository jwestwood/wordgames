import { flushSync } from 'react-dom';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  createRng,
  ensureSeed,
  gameHash,
  getSeedFromHash,
  getVersionFromHash,
  newPuzzle,
  shuffle,
} from '@core/random';
import { BETA, resolveVersion, versionId, type PuzzleVersion } from '@core/versions';
import {
  isGuessSubmitLocked,
  progressFor as coreProgressFor,
  shouldKeepGuess,
  useSeedState,
} from '@core/game';
import { useHistoryEntry } from '@core/history';
import { pickTier, useSound } from '@core/audio';
import { useGameSettings } from '@core/settings';
import { dropRetiredLetterWheelSettings, LETTER_WHEEL_SETTINGS } from './settings';
import { submitGuessOnEnter } from './keyboard';
import { toWheelPreview } from './preview';
import {
  BonusCounter,
  BonusToggle,
  BonusWordList,
  BottomSheet,
  Button,
  centredRect,
  Confetti,
  createAnimationQueue,
  createAutoDismiss,
  type SheetPhase,
  ensureInView,
  ensureInScrollContainer,
  attentionFlash,
  flashElement,
  flyElement,
  GameSettingsButton,
  isInView,
  popOverElement,
  revealWordInPlace,
  waitForRevealVisibility,
  isRevealTargetVisible,
  useMediaQuery,
  IconBackspace,
  IconHint,
  IconShuffle,
  IconX,
  LetterStrip,
  LetterWheel,
  Modal,
  Panel,
  ScoreCard,
  SeedDisplay,
  Tile,
  ToastStack,
  useToast,
  WordSlots,
} from '@core/ui';
import {
  hasBonusPool,
  LATEST,
  loadVersion,
  manifest,
  saveNamespace,
  type GuessResult,
  type LoadedRules,
} from './versions';
import { letterWheelBrand } from './brand';
import {
  applyClue,
  clueLetters,
  clueLevel,
  EMPTY_PROGRESS,
  parseProgress,
  pruneClues,
  type PuzzleProgress,
} from './clues';
import { completedLetters, newlyCompletedLetters } from './letters';
import {
  isBonusSuccess,
  isRepeatGuess,
  shouldAutoOpenWordTray,
  shouldFlashOfficialRow,
} from './guess';
import { LetterWheelLogo } from './brand/Logo';
import './letter-wheel.css';

const CENTRE = -1;
const GAME_ID = 'letter-wheel';

function trayScroller(el: Element): HTMLElement | null {
  return (
    el.closest<HTMLElement>('.lw__words-scroller') ??
    el.closest<HTMLElement>('.bottom-sheet__scroll')
  );
}

if (typeof window !== 'undefined') dropRetiredLetterWheelSettings();

const messages = (
  minWord: number,
): Record<Exclude<GuessResult, { ok: true }>['reason'], string> => ({
  'too-short': `Words need at least ${minWord} letters.`,
  'missing-required': 'Every word must use the centre letter.',
  'already-found': 'Already found!',
  'already-found-bonus': 'Already found!',
  'not-in-pool': 'Not in the word list.',
});

interface PuzzleRef {
  seed: string;
  version: PuzzleVersion;
}

/** Seed + puzzle version from the URL; pins a missing/unknown `v` to the latest numbered one. */
function readRef(): PuzzleRef {
  const seed = ensureSeed(GAME_ID);
  const raw = getVersionFromHash(window.location.hash);
  const version = resolveVersion(manifest, raw);
  if (raw !== versionId(version))
    history.replaceState(null, '', gameHash(GAME_ID, seed, versionId(version)));
  return { seed, version };
}

function usePuzzleRef(): PuzzleRef {
  const [ref, setRef] = useState(readRef);
  useEffect(() => {
    const on = () => {
      if (!getSeedFromHash(window.location.hash)) return;
      const next = readRef();
      setRef((r) => (r.seed === next.seed && r.version === next.version ? r : next));
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return ref;
}

export function LetterWheelGame() {
  const { seed, version } = usePuzzleRef();
  const [loaded, setLoaded] = useState<LoadedRules | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    loadVersion(version).then(
      (l) => live && setLoaded(l),
      () => live && setError(true),
    );
    return () => {
      live = false;
    };
  }, [version]);
  if (error) return <p className="lw-loading">Couldn&rsquo;t load this puzzle version.</p>;
  if (!loaded || loaded.version !== version)
    return <p className="lw-loading">Laying out the letters…</p>;
  return <Game key={`${versionId(version)}:${seed}`} seed={seed} loaded={loaded} />;
}

function Game({ seed, loaded }: { seed: string; loaded: LoadedRules }) {
  const { rules, dict, version } = loaded;
  const vid = versionId(version);
  const thresholds = rules.STAR_THRESHOLDS;
  const STAR_LABELS = thresholds.map((t) => `${Math.round(t * 100)}%`);
  const MESSAGES = useMemo(() => messages(rules.MIN_WORD), [rules]);
  const progressFor = useCallback(
    (f: number, t: number) => coreProgressFor(f, t, thresholds),
    [thresholds],
  );
  const puzzle = useMemo(() => rules.generate(seed, dict), [seed, rules, dict]);
  const [progressState, setProgressState] = useSeedState<PuzzleProgress>(
    saveNamespace(GAME_ID, version),
    seed,
    EMPTY_PROGRESS,
  );
  // One-shot migration of legacy bare found arrays stored before clues existed.
  const progress = useMemo(() => parseProgress(progressState), [progressState]);
  const found = progress.found;
  const clues = progress.clues;
  const bonusFound = progress.bonus;
  const setFound = useCallback(
    (next: string[] | ((prev: string[]) => string[])) =>
      setProgressState((p) => {
        const cur = parseProgress(p);
        const found = typeof next === 'function' ? next(cur.found) : next;
        return { found, clues: pruneClues(cur.clues, new Set(found)), bonus: cur.bonus };
      }),
    [setProgressState],
  );
  const setBonusFound = useCallback(
    (next: string[] | ((prev: string[]) => string[])) =>
      setProgressState((p) => {
        const cur = parseProgress(p);
        const bonus = typeof next === 'function' ? next(cur.bonus) : next;
        return { found: cur.found, clues: cur.clues, bonus };
      }),
    [setProgressState],
  );
  const mobile = useMediaQuery('(max-width: 859px)');
  const [wordsOpen, setWordsOpen] = useState(false);
  const trayId = useId();
  // Read live values inside queued tasks (not values captured by the guess).
  const view = useRef({ mobile, wordsOpen });
  view.current = { mobile, wordsOpen };
  const sheetPhase = useRef<SheetPhase>('closed');
  const autoDismiss = useRef(createAutoDismiss());
  const browsingWords = useRef(false);
  const closeWords = useCallback(() => {
    autoDismiss.current.cancel();
    browsingWords.current = false;
    view.current.wordsOpen = false;
    setWordsOpen(false);
  }, []);
  const browseWords = useCallback(() => {
    autoDismiss.current.cancel();
    browsingWords.current = true;
    view.current.wordsOpen = true;
    setWordsOpen(true);
  }, []);
  const interactWords = useCallback(() => {
    if (view.current.mobile && view.current.wordsOpen) {
      autoDismiss.current.cancel();
      browsingWords.current = true;
    }
  }, []);
  const onSheetPhase = useCallback((phase: SheetPhase) => {
    sheetPhase.current = phase;
  }, []);
  useEffect(() => {
    if (!mobile) closeWords();
  }, [mobile, closeWords]);
  const [clueMode, setClueMode] = useState(false);
  const [bonusOpen, setBonusOpen] = useState(false);
  const bonusListId = useId();
  const [guess, setGuess] = useState<number[]>([]);
  const [rejectedGuess, setRejectedGuess] = useState<number[] | null>(null);
  const [order, setOrder] = useState(() => puzzle.outer.map((_, i) => i));
  const shuffles = useRef(0);
  const [toast, showToast] = useToast(2800);
  const [latest, setLatest] = useState<string>();
  const [celebrate, setCelebrate] = useState(false);
  // Only newly discovered words enter transient pending/reveal state; saved words never do.
  const [revealingWords, setRevealingWords] = useState<ReadonlySet<string>>(() => new Set());
  const revealAbort = useRef(new AbortController());
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const [shownStars, setShownStars] = useState(
    () => progressFor(found.length, puzzle.pool.length).stars,
  );
  const play = useSound();
  const { values: settings } = useGameSettings(GAME_ID, LETTER_WHEEL_SETTINGS);
  const submitLocked = settings.keepWrongGuesses && isGuessSubmitLocked(rejectedGuess, guess);
  const clueButton = (
    <Button
      variant="secondary"
      size="sm"
      className={`lw__clue${clueMode ? ' lw__clue--on' : ''}`}
      aria-pressed={clueMode}
      title={
        clueMode
          ? 'Cancel clue'
          : 'Reveal a letter: last first, then 2nd-to-last. Click a blank word.'
      }
      onClick={() => setClueMode((on) => !on)}
    >
      <IconHint />
      Clue
    </Button>
  );
  const queue = useRef(createAnimationQueue());
  const wheelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const q = queue.current;
    const dismiss = autoDismiss.current;
    const controller = new AbortController();
    revealAbort.current = controller;
    return () => {
      controller.abort();
      dismiss.cancel();
      q.clear();
    };
  }, []);

  const letterAt = useCallback(
    (i: number) => (i === CENTRE ? puzzle.required : puzzle.outer[i]),
    [puzzle],
  );
  const word = guess.map(letterAt).join('');
  const score = progressFor(found.length, puzzle.pool.length);
  // History: created on the first submitted guess (right or wrong), or immediately for a seed
  // that already has saved words; merely opening/randomising a puzzle does not add clutter.
  const [guessed, setGuessed] = useState(false);
  useHistoryEntry(GAME_ID, seed, {
    preview: { ...toWheelPreview(puzzle) },
    found: score.found,
    total: score.total,
    stars: score.stars,
    maxStars: score.maxStars,
    completed: score.perfect,
    version: vid,
    started: guessed || found.length > 0 || bonusFound.length > 0 || Object.keys(clues).length > 0,
  });
  const revealed = useMemo(() => new Set(found), [found]);
  const completeSet = useMemo(
    () => completedLetters(puzzle.target, puzzle.pool, revealed),
    [puzzle.target, puzzle.pool, revealed],
  );
  const known = useMemo(() => {
    const m = new Map<string, readonly (string | null)[]>();
    for (const [w, n] of Object.entries(clues)) m.set(w, clueLetters(w, n));
    return m;
  }, [clues]);
  const pickable = useMemo(() => {
    const next = new Set<string>();
    for (const w of puzzle.pool) if (!revealed.has(w) && clueLevel(clues, w) < 2) next.add(w);
    return next;
  }, [puzzle.pool, revealed, clues]);
  const used = useMemo(
    () => new Set(order.flatMap((orig, pos) => (guess.includes(orig) ? [pos] : []))),
    [order, guess],
  );

  const add = useCallback(
    (i: number) => {
      if (guess.includes(i)) return;
      play('tap');
      setRejectedGuess(null);
      setGuess([...guess, i]);
    },
    [guess, play],
  );
  const typeLetter = useCallback(
    (c: string) => {
      if (c === puzzle.required && !guess.includes(CENTRE)) return add(CENTRE);
      const i = puzzle.outer.findIndex((l, idx) => l === c && !guess.includes(idx));
      if (i !== -1) add(i);
    },
    [puzzle, guess, add],
  );
  const backspace = useCallback(() => {
    if (!guess.length) return;
    play('delete');
    setRejectedGuess(null);
    setGuess(guess.slice(0, -1));
  }, [guess, play]);
  const clear = useCallback(() => {
    if (!guess.length) return;
    play('clear');
    setRejectedGuess(null);
    setGuess([]);
  }, [guess, play]);
  const doShuffle = useCallback(() => {
    play('shuffle');
    shuffles.current++;
    const rng = createRng(`${seed}:shuffle:${shuffles.current}`, GAME_ID);
    setOrder((o) => shuffle(rng, o));
  }, [seed, play]);

  const animateWord = useCallback(
    async (w: string, autoToken?: number) => {
      const signal = revealAbort.current.signal;
      // Yield for the auto-open commit, but a deliberate close wins. Never reopen here.
      const trayClosed = () => view.current.mobile && !view.current.wordsOpen;
      const ready = await waitForRevealVisibility(
        () => !view.current.mobile || (view.current.wordsOpen && sheetPhase.current === 'open'),
        signal,
        { maxWaitMs: 600, shouldStop: trayClosed },
      );
      if (signal.aborted) return;
      const slot = listRef.current?.querySelector<HTMLElement>(`[data-word="${w}"]`);
      let visible = false;
      if (ready && slot) {
        if (view.current.mobile) {
          const scroller = trayScroller(slot);
          if (scroller) await ensureInScrollContainer(slot, scroller);
        } else {
          await ensureInView(slot);
        }
        // A closed tray completes silently. Other clipping/visibility races get a short
        // bounded grace period, not an endless wait.
        visible = await waitForRevealVisibility(() => isRevealTargetVisible(slot), signal, {
          shouldStop: () => trayClosed(),
        });
      }
      if (signal.aborted) return;
      if (visible && slot) {
        slot.classList.remove('word-slots__item--reveal-finished');
        flushSync(() => setRevealingWords((words) => new Set(words).add(w)));
        // One rich themed word-found sound, tied to the ink appearing, never submission.
        play(
          w.length >= puzzle.target.length
            ? 'success-epic'
            : pickTier(w.length, [{ min: 6, value: 'success-big' as const }], 'success' as const),
        );
        await revealWordInPlace(slot, signal);
      }
      if (signal.aborted) return;
      // Always expose the accepted word, even when its reveal was skipped. Stars, completed
      // letters and perfect must continue; hidden words must never hold the shared queue.
      flushSync(() => {
        setRevealingWords((words) => {
          const next = new Set(words);
          next.delete(w);
          return next;
        });
        setHidden((words) => {
          const next = new Set(words);
          next.delete(w);
          return next;
        });
        setLatest(w);
      });
      slot?.classList.remove('word-slots__item--reveal-finished');
      if (autoToken !== undefined && autoDismiss.current.isCurrent(autoToken)) {
        // Manual browsing, another discovery, close or unmount releases this hold immediately.
        const elapsed = await autoDismiss.current.hold(autoToken, visible ? undefined : 0);
        if (elapsed && !signal.aborted && autoDismiss.current.isCurrent(autoToken)) closeWords();
      }
      // Subsequent stars/letters land on the base screen only after an auto/manual exit.
      // Both phase gates are bounded; hidden rows can never strand the celebration queue.
      if (!signal.aborted && trayClosed()) {
        await waitForRevealVisibility(() => sheetPhase.current === 'closed', signal, {
          maxWaitMs: 600,
        });
      }
    },
    [play, puzzle.target.length, closeWords],
  );

  const animateStar = useCallback(
    async (i: number) => {
      const wheel = wheelRef.current;
      const slot = cardRef.current?.querySelector<HTMLElement>(`[data-star-slot="${i}"]`);
      if (wheel && slot && (!view.current.mobile || isInView(slot))) {
        if (!view.current.mobile) await ensureInView(slot);
        const wr = wheel.getBoundingClientRect();
        const from = centredRect(wr, wr.width * 0.4, wr.width * 0.4);
        const holder = document.createElement('div');
        holder.style.width = holder.style.height = '100%';
        const svg = slot.querySelector('svg')?.cloneNode(true) as SVGElement | undefined;
        svg?.querySelector('path')?.setAttribute('fill', 'currentColor');
        if (svg) holder.appendChild(svg);
        await flyElement(from, slot, holder, { className: 'fly-star', duration: 1000 });
      }
      play('star'); // timed to the star landing in its slot
      setShownStars((s) => Math.max(s, i + 1));
    },
    [play],
  );

  const animateLetter = useCallback(
    async (L: string) => {
      const wheel = wheelRef.current;
      const tile = stripRef.current?.querySelector<HTMLElement>(`[data-letter="${L}"]`);
      showToast(`All ${L.toUpperCase()} words found!`, 'good');
      if (wheel && tile && view.current.mobile && !view.current.wordsOpen) {
        const content = document.createElement('div');
        content.className = 'letter-strip__tile letter-strip__tile--complete';
        content.textContent = L.toUpperCase();
        await popOverElement(wheel, content, {
          className: 'fly-letter-wrap',
          duration: 1000,
          scale: 3,
        });
      } else if (
        wheel &&
        tile &&
        (!view.current.mobile || view.current.wordsOpen || isInView(tile))
      ) {
        // Cache the visible size before an awaited scroll: closing the tray may hide the tile.
        const landingSize = tile.getBoundingClientRect().width;
        if (!view.current.mobile) await ensureInView(tile);
        const scroller = trayScroller(tile);
        if (view.current.mobile && view.current.wordsOpen && scroller) {
          await ensureInScrollContainer(tile, scroller);
        }
        const tileBox = () => {
          const r =
            view.current.mobile && !view.current.wordsOpen
              ? centredRect(wheel.getBoundingClientRect(), landingSize, landingSize)
              : tile.getBoundingClientRect();
          const side = Math.max(r.width, r.height);
          return centredRect(r, side, side);
        };
        const to0 = tileBox();
        const wr = wheel.getBoundingClientRect();
        const size = Math.max(to0.width * 2.4, wr.width * 0.22);
        const from = centredRect(wr, size, size);
        const content = document.createElement('div');
        content.className = 'fly-letter';
        content.textContent = L.toUpperCase();
        // Track the square tile box (not the glyph contentRect) so the flyer stays square.
        await flyElement(from, tileBox, content, { className: 'fly-letter-wrap', duration: 1000 });
      }
      play('letter-complete');
      // Nudge the strip tile once it lands (highlight already derived from found).
      if (tile && (!view.current.mobile || view.current.wordsOpen)) void flashElement(tile);
    },
    [play, showToast],
  );

  const submit = useCallback(() => {
    if (!word || submitLocked) return;
    setGuessed(true);
    const res = rules.checkGuess(word, puzzle, found, bonusFound);
    if (isBonusSuccess(res)) {
      setClueMode(false);
      setBonusFound([...bonusFound, res.word]);
      play('bonus-word');
      showToast(`${res.word.toUpperCase()} — bonus word!`, 'good');
    } else if (res.ok) {
      setClueMode(false);
      const next = [...found, res.word];
      const before = progressFor(found.length, puzzle.pool.length).stars;
      const after = progressFor(next.length, puzzle.pool.length).stars;
      const beforeComplete = completedLetters(puzzle.target, puzzle.pool, new Set(found));
      const afterComplete = completedLetters(puzzle.target, puzzle.pool, new Set(next));
      const newLetters = newlyCompletedLetters(
        puzzle.target,
        puzzle.pool,
        beforeComplete,
        afterComplete,
      );
      let autoToken: number | undefined;
      if (shouldAutoOpenWordTray(res) && view.current.mobile && !browsingWords.current) {
        autoToken = autoDismiss.current.begin();
        view.current.wordsOpen = true;
        setWordsOpen(true);
      }
      setFound(next);
      setHidden((h) => new Set(h).add(res.word));
      showToast(`${res.word.toUpperCase()} — nice!`, 'good');
      const q = queue.current;
      q.enqueue(() => animateWord(res.word, autoToken));
      for (let i = before; i < after; i++) q.enqueue(() => animateStar(i));
      // Celebrate newly completed LETTERS (incl. no-starters when puzzle hits 100%).
      for (const L of newLetters) q.enqueue(() => animateLetter(L));
      if (next.length === puzzle.pool.length)
        q.enqueue(() => {
          play('perfect');
          setCelebrate(true);
        });
    } else {
      play(isRepeatGuess(res) ? 'already-found' : 'error');
      if (isRepeatGuess(res)) {
        showToast(`${word.toUpperCase()} already found!`, 'info');
        if (shouldFlashOfficialRow(res)) {
          const el = listRef.current?.querySelector<HTMLElement>(`[data-word="${word}"]`);
          if (el && (!view.current.mobile || view.current.wordsOpen)) {
            void (async () => {
              if (!view.current.mobile) await ensureInView(el);
              const scroller = trayScroller(el);
              if (view.current.mobile && view.current.wordsOpen && scroller) {
                await ensureInScrollContainer(el, scroller);
              }
              await attentionFlash(el, { times: 3 });
            })();
          }
        }
      } else {
        showToast(MESSAGES[res.reason], 'bad');
      }
    }
    if (shouldKeepGuess(settings.keepWrongGuesses, res)) {
      setRejectedGuess(guess);
    } else {
      setRejectedGuess(null);
      setGuess([]);
    }
  }, [
    word,
    puzzle,
    found,
    bonusFound,
    rules,
    MESSAGES,
    progressFor,
    setFound,
    setBonusFound,
    showToast,
    animateWord,
    animateStar,
    animateLetter,
    play,
    guess,
    settings.keepWrongGuesses,
    submitLocked,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('[role="dialog"]')) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea')) return;
      if (/^[a-z]$/i.test(e.key)) {
        typeLetter(e.key.toLowerCase());
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
      } else if (e.key === 'Enter') {
        submitGuessOnEnter(e, Boolean(word), `${trayId}-opener`, submit, !submitLocked);
      } else if (e.key === 'Escape') {
        if (clueMode) setClueMode(false);
        else clear();
      } else return;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [typeLetter, backspace, submit, clear, clueMode, word, trayId, submitLocked]);

  return (
    <div className="lw">
      <div className="lw__head">
        <div>
          <h2 className="lw__title">
            <LetterWheelLogo size={52} className="lw__logo" />
          </h2>
          <p className="lw__tagline">{letterWheelBrand.tagline}</p>
          {version !== LATEST && (
            <p className={`lw__version${version === BETA ? ' lw__version--beta' : ''}`}>
              {version === BETA
                ? 'Beta rules: puzzles and saves may change.'
                : `Puzzle version ${vid} (as you played it).`}{' '}
              <a href={gameHash(GAME_ID, seed, String(LATEST))}>Play v{LATEST}</a>
            </p>
          )}
          <p className="lw__mobile-hint">
            {rules.MIN_WORD}+ letters · use the centre · each tile once
          </p>
          <p className="lw__hint">
            Make words of {rules.MIN_WORD}+ letters. Every word must use the centre letter; each
            letter once.
          </p>
        </div>
        <div className="lw__tools">
          <SeedDisplay
            gameId={GAME_ID}
            seed={seed}
            version={vid}
            started={guessed || found.length > 0 || bonusFound.length > 0}
            after={
              <GameSettingsButton
                gameId={GAME_ID}
                definitions={LETTER_WHEEL_SETTINGS}
                title="Letter Wheel settings"
              />
            }
          />
        </div>
      </div>

      <div className="lw__layout">
        <Panel variant="wood" className="lw__play">
          {(!mobile || !wordsOpen) && <ToastStack toast={toast} />}
          <div ref={wheelRef} className="lw__wheel">
            <LetterWheel
              centre={puzzle.required}
              letters={order.map((i) => puzzle.outer[i])}
              used={used}
              centreSelected={guess.includes(CENTRE)}
              onCentre={() => add(CENTRE)}
              onLetter={(pos) => add(order[pos])}
              label="Letters: tap to add to your guess"
            />
          </div>
          <div className="lw__controls">
            <Button
              variant="danger"
              size="sm"
              className="btn--icon"
              onClick={clear}
              disabled={!guess.length}
              aria-label="Clear guess"
              title="Clear"
            >
              <IconX />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="btn--icon"
              onClick={backspace}
              disabled={!guess.length}
              aria-label="Delete last letter"
              title="Delete"
            >
              <IconBackspace />
            </Button>
            <Button
              variant="warning"
              size="sm"
              className="btn--icon"
              onClick={doShuffle}
              aria-label="Shuffle letters"
              title="Shuffle"
            >
              <IconShuffle />
            </Button>
            <Button onClick={submit} disabled={!guess.length || submitLocked}>
              Guess
            </Button>
          </div>
          <div
            className="lw__guess"
            aria-live="polite"
            aria-label={`Guess: ${word || 'empty'}${submitLocked ? ', incorrect' : ''}`}
          >
            {guess.length === 0 ? (
              <span className="lw__placeholder">Tap or type letters</span>
            ) : (
              guess.map((i, k) => (
                <Tile
                  key={k}
                  static
                  size="sm"
                  letter={letterAt(i)}
                  state={submitLocked ? 'error' : i === CENTRE ? 'correct' : 'default'}
                />
              ))
            )}
          </div>
          <Button
            id={`${trayId}-opener`}
            className="lw__words-button"
            variant="primary"
            aria-haspopup="dialog"
            aria-expanded={mobile && wordsOpen}
            aria-controls={trayId}
            onClick={() => {
              play('button');
              browseWords();
            }}
          >
            {hasBonusPool(puzzle)
              ? `Words · ${found.length}/${puzzle.pool.length} · Bonus ${bonusFound.length}`
              : `Words · ${found.length}/${puzzle.pool.length}`}
          </Button>
        </Panel>

        <div className="lw__side">
          <div ref={cardRef} className="lw__score">
            <ScoreCard
              found={score.found}
              total={score.total}
              percent={score.percent}
              stars={Math.min(shownStars, score.stars)}
              maxStars={score.maxStars}
              thresholds={STAR_LABELS}
            />
          </div>
          <BottomSheet
            enabled={mobile}
            open={wordsOpen}
            onClose={closeWords}
            title={`Words · ${found.length}/${puzzle.pool.length}`}
            actions={mobile ? clueButton : undefined}
            id={trayId}
            returnFocusId={`${trayId}-opener`}
            onPhaseChange={onSheetPhase}
            onInteract={interactWords}
          >
            <Panel className="lw__words">
              <div className="lw__words-chrome">
                <div className="lw__words-toolbar">
                  <span className="lw__last-word" aria-live="polite">
                    Last word:{' '}
                    <strong>
                      {/* found is discovery order, so the last entry survives reload */}
                      {(latest ?? found.at(-1))?.toUpperCase() ?? '—'}
                    </strong>
                  </span>
                  {mobile && hasBonusPool(puzzle) && (
                    <BonusToggle
                      count={bonusFound.length}
                      open={bonusOpen}
                      listId={bonusListId}
                      disabled={bonusFound.length === 0}
                      onClick={() => {
                        play('button');
                        setBonusOpen((on) => !on);
                      }}
                    />
                  )}
                  {clueMode && (
                    <span className="lw__clue-hint" role="status">
                      Tap a blank for a clue
                    </span>
                  )}
                  {!mobile && clueButton}
                </div>
                {mobile && bonusOpen && (
                  <BonusWordList
                    id={bonusListId}
                    className="lw__bonus-list bonus-counter__list--tray"
                    words={bonusFound}
                  />
                )}
                {!mobile && hasBonusPool(puzzle) && (
                  <BonusCounter
                    className="lw__bonus"
                    count={bonusFound.length}
                    words={bonusFound}
                    showWords
                  />
                )}
              </div>
              <div className="lw__words-list-wrap">
                {mobile && wordsOpen && <ToastStack toast={toast} />}
                <div ref={listRef} className="lw__words-scroller">
                  <WordSlots
                    words={puzzle.pool}
                    revealed={revealed}
                    latest={latest}
                    hidden={hidden}
                    revealing={revealingWords}
                    known={known}
                    picking={clueMode}
                    pickable={pickable}
                    onPick={(w) => {
                      setProgressState((p) => {
                        const cur = parseProgress(p);
                        return {
                          found: cur.found,
                          clues: applyClue(cur.clues, w, new Set(cur.found)),
                          bonus: cur.bonus,
                        };
                      });
                      play('copy');
                      setClueMode(false);
                      setGuessed(true);
                    }}
                  />
                </div>
              </div>
              <div ref={stripRef} className="lw__letters">
                <LetterStrip letters={puzzle.target} complete={completeSet} />
              </div>
            </Panel>
          </BottomSheet>
        </div>
      </div>

      {celebrate && <Confetti seed={seed} />}
      <Modal
        open={celebrate}
        onClose={() => setCelebrate(false)}
        silent
        title="Perfect!"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                play('button');
                setCelebrate(false);
              }}
            >
              Admire it
            </Button>
            <Button
              onClick={() => {
                play('dice');
                newPuzzle(GAME_ID, undefined, version === BETA ? BETA : undefined);
              }}
            >
              New puzzle
            </Button>
          </>
        }
      >
        <p>
          You found all {puzzle.pool.length} words, including the full wheel:{' '}
          <strong>{puzzle.target.toUpperCase()}</strong>.
        </p>
      </Modal>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { progressFor as coreProgressFor, useSeedState } from '@core/game';
import { useHistoryEntry } from '@core/history';
import { pickTier, useSound } from '@core/audio';
import { useGameSettings } from '@core/settings';
import { LETTER_WHEEL_SETTINGS } from './settings';
import { toWheelPreview } from './preview';
import {
  Button,
  centredRect,
  Confetti,
  createAnimationQueue,
  ensureInView,
  flashElement,
  flyElement,
  GameSettingsButton,
  isInView,
  popElement,
  IconBackspace,
  IconShuffle,
  IconX,
  LetterWheel,
  Modal,
  Panel,
  ScoreCard,
  SeedDisplay,
  Tile,
  useTransientMessage,
  WordSlots,
} from '@core/ui';
import {
  LATEST,
  loadVersion,
  manifest,
  saveNamespace,
  type GuessResult,
  type LoadedRules,
} from './versions';
import { letterWheelBrand } from './brand';
import { LetterWheelLogo } from './brand/Logo';
import './letter-wheel.css';

const CENTRE = -1;
const GAME_ID = 'letter-wheel';
type Feedback = { tone: 'good' | 'bad' | 'info'; text: string } | null;

const messages = (
  minWord: number,
): Record<Exclude<GuessResult, { ok: true }>['reason'], string> => ({
  'too-short': `Words need at least ${minWord} letters.`,
  'missing-required': 'Every word must use the centre letter.',
  'already-found': 'Already found!',
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
  const [found, setFound] = useSeedState<string[]>(saveNamespace(GAME_ID, version), seed, []);
  const [guess, setGuess] = useState<number[]>([]);
  const [order, setOrder] = useState(() => puzzle.outer.map((_, i) => i));
  const shuffles = useRef(0);
  const [feedback, showFeedback] = useTransientMessage<NonNullable<Feedback>>(2800);
  const [latest, setLatest] = useState<string>();
  const [celebrate, setCelebrate] = useState(false);
  // Words/stars already counted but still mid-animation (not yet shown).
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const [shownStars, setShownStars] = useState(
    () => progressFor(found.length, puzzle.pool.length).stars,
  );
  const play = useSound();
  const { values: settings } = useGameSettings(GAME_ID, LETTER_WHEEL_SETTINGS);
  const autoScroll = useRef(settings.autoScroll);
  autoScroll.current = settings.autoScroll;
  const queue = useRef(createAnimationQueue());
  const wheelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const q = queue.current;
    return () => q.clear();
  }, []);

  const letterAt = useCallback(
    (i: number) => (i === CENTRE ? puzzle.required : puzzle.outer[i]),
    [puzzle],
  );
  const word = guess.map(letterAt).join('');
  const progress = progressFor(found.length, puzzle.pool.length);
  // History: created on the first submitted guess (right or wrong), or immediately for a seed
  // that already has saved words; merely opening/randomising a puzzle does not add clutter.
  const [guessed, setGuessed] = useState(false);
  useHistoryEntry(GAME_ID, seed, {
    preview: { ...toWheelPreview(puzzle) },
    found: progress.found,
    total: progress.total,
    stars: progress.stars,
    maxStars: progress.maxStars,
    completed: progress.perfect,
    version: vid,
    started: guessed || found.length > 0,
  });
  const revealed = useMemo(() => new Set(found), [found]);
  const used = useMemo(
    () => new Set(order.flatMap((orig, pos) => (guess.includes(orig) ? [pos] : []))),
    [order, guess],
  );

  const add = useCallback(
    (i: number) => {
      if (guess.includes(i)) return;
      play('tap');
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
    setGuess(guess.slice(0, -1));
  }, [guess, play]);
  const clear = useCallback(() => {
    if (!guess.length) return;
    play('clear');
    setGuess([]);
  }, [guess, play]);
  const doShuffle = useCallback(() => {
    play('shuffle');
    shuffles.current++;
    const rng = createRng(`${seed}:shuffle:${shuffles.current}`, GAME_ID);
    setOrder((o) => shuffle(rng, o));
  }, [seed, play]);

  const animateWord = useCallback(
    async (w: string) => {
      const wheel = wheelRef.current;
      const slot = listRef.current?.querySelector<HTMLElement>(`[data-word="${w}"]`);
      if (wheel && slot) {
        void flashElement(wheel);
        const scroll = autoScroll.current;
        if (scroll) await ensureInView(slot);
        const to = slot.getBoundingClientRect();
        const wr = wheel.getBoundingClientRect();
        const width = Math.min(wr.width * 0.75, to.width * 2.6);
        const from = centredRect(wr, width, (width / to.width) * to.height);
        const content = document.createElement('div');
        content.className = 'word-slots__item word-slots__item--shown';
        for (const c of w) {
          const cell = document.createElement('span');
          cell.className = 'word-slots__cell';
          cell.textContent = c.toUpperCase();
          content.appendChild(cell);
        }
        if (scroll || isInView(slot))
          await flyElement(from, to, content, { className: 'fly-word', duration: 1100 });
        else {
          // Target off-screen and scrolling is off: show the word over the wheel, fade it there.
          content.style.transform = `scale(${from.width / to.width})`;
          content.style.transformOrigin = 'center';
          await popElement(centredRect(wr, to.width, to.height), content, {
            className: 'fly-word',
            duration: 1100,
          });
        }
        play('word-land');
      }
      setHidden((h) => {
        const n = new Set(h);
        n.delete(w);
        return n;
      });
      setLatest(w);
    },
    [play],
  );

  const animateStar = useCallback(
    async (i: number) => {
      const wheel = wheelRef.current;
      const slot = cardRef.current?.querySelector<HTMLElement>(`[data-star-slot="${i}"]`);
      if (wheel && slot && (autoScroll.current || isInView(slot))) {
        if (autoScroll.current) await ensureInView(slot);
        const to = slot.getBoundingClientRect();
        const wr = wheel.getBoundingClientRect();
        const from = centredRect(wr, wr.width * 0.4, wr.width * 0.4);
        const holder = document.createElement('div');
        holder.style.width = holder.style.height = '100%';
        const svg = slot.querySelector('svg')?.cloneNode(true) as SVGElement | undefined;
        svg?.querySelector('path')?.setAttribute('fill', 'currentColor');
        if (svg) holder.appendChild(svg);
        await flyElement(from, to, holder, { className: 'fly-star', duration: 1000 });
      }
      play('star'); // timed to the star landing in its slot
      setShownStars((s) => Math.max(s, i + 1));
    },
    [play],
  );

  const submit = useCallback(() => {
    if (!word) return;
    setGuessed(true);
    const res = rules.checkGuess(word, puzzle, found);
    if (res.ok) {
      const next = [...found, res.word];
      const before = progressFor(found.length, puzzle.pool.length).stars;
      const after = progressFor(next.length, puzzle.pool.length).stars;
      setFound(next);
      setHidden((h) => new Set(h).add(res.word));
      play(
        res.word.length >= puzzle.target.length
          ? 'success-epic'
          : pickTier(
              res.word.length,
              [{ min: 6, value: 'success-big' as const }],
              'success' as const,
            ),
      );
      showFeedback({ tone: 'good', text: `${res.word.toUpperCase()} — nice!` });
      const q = queue.current;
      q.enqueue(() => animateWord(res.word));
      for (let i = before; i < after; i++) q.enqueue(() => animateStar(i));
      if (next.length === puzzle.pool.length)
        q.enqueue(() => {
          play('perfect');
          setCelebrate(true);
        });
    } else {
      play(res.reason === 'already-found' ? 'already-found' : 'error');
      showFeedback({
        tone: res.reason === 'already-found' ? 'info' : 'bad',
        text: MESSAGES[res.reason],
      });
    }
    setGuess([]);
  }, [
    word,
    puzzle,
    found,
    rules,
    MESSAGES,
    progressFor,
    setFound,
    showFeedback,
    animateWord,
    animateStar,
    play,
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
      } else if (e.key === 'Enter' && !t.closest('button, [role="button"], a')) {
        e.preventDefault(); // otherwise Enter "clicks" the modal button focused mid-event
        submit();
      } else if (e.key === 'Escape') {
        clear();
      } else return;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [typeLetter, backspace, submit, clear]);

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
            started={guessed || found.length > 0}
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
            <Button onClick={submit} disabled={!guess.length}>
              Guess
            </Button>
          </div>
          <div className="lw__guess" aria-live="polite" aria-label={`Guess: ${word || 'empty'}`}>
            {guess.length === 0 ? (
              <span className="lw__placeholder">Tap or type letters</span>
            ) : (
              guess.map((i, k) => (
                <Tile
                  key={k}
                  static
                  size="sm"
                  letter={letterAt(i)}
                  state={i === CENTRE ? 'correct' : 'default'}
                />
              ))
            )}
          </div>
          <p
            className={`lw__feedback lw__feedback--${feedback?.tone ?? 'info'}${feedback ? '' : ' lw__feedback--hidden'}`}
            role="status"
          >
            {feedback
              ? `${feedback.tone === 'good' ? '✓' : feedback.tone === 'bad' ? '✗' : '•'} ${feedback.text}`
              : '\u00a0'}
          </p>
        </Panel>

        <div className="lw__side">
          <div ref={cardRef}>
            <ScoreCard
              found={progress.found - hidden.size}
              total={progress.total}
              percent={progressFor(progress.found - hidden.size, progress.total).percent}
              stars={Math.min(shownStars, progress.stars)}
              maxStars={progress.maxStars}
              thresholds={STAR_LABELS}
            />
          </div>
          <Panel className="lw__words">
            <div ref={listRef}>
              <WordSlots words={puzzle.pool} revealed={revealed} latest={latest} hidden={hidden} />
            </div>
          </Panel>
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

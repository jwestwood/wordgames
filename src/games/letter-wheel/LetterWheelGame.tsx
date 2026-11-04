import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRng, ensureSeed, getSeedFromHash, newPuzzle, shuffle } from '@core/random';
import { progressFor, useSeedState } from '@core/game';
import {
  Button,
  centredRect,
  Confetti,
  createAnimationQueue,
  ensureInView,
  flashElement,
  flyElement,
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
import { DEFAULT_STAR_THRESHOLDS } from '@core/game';
import {
  checkGuess,
  GAME_ID,
  generatePuzzle,
  loadDictionaries,
  MIN_WORD,
  type Dictionaries,
  type GuessResult,
} from './puzzle';
import './letter-wheel.css';

const CENTRE = -1;
const STAR_LABELS = DEFAULT_STAR_THRESHOLDS.map((t) => `${Math.round(t * 100)}%`);
type Feedback = { tone: 'good' | 'bad' | 'info'; text: string } | null;

const MESSAGES: Record<Exclude<GuessResult, { ok: true }>['reason'], string> = {
  'too-short': `Words need at least ${MIN_WORD} letters.`,
  'missing-required': 'Every word must use the centre letter.',
  'already-found': 'Already found!',
  'not-in-pool': 'Not in the word list.',
};

function useSeed() {
  const [seed, setSeed] = useState(() => ensureSeed(GAME_ID));
  useEffect(() => {
    const on = () => {
      const s = getSeedFromHash(window.location.hash);
      if (s) setSeed(s);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return seed;
}

export function LetterWheelGame() {
  const seed = useSeed();
  const [dict, setDict] = useState<Dictionaries | null>(null);
  useEffect(() => {
    let live = true;
    loadDictionaries().then((d) => live && setDict(d));
    return () => {
      live = false;
    };
  }, []);
  if (!dict) return <p className="lw-loading">Laying out the letters…</p>;
  return <Game key={seed} seed={seed} dict={dict} />;
}

function Game({ seed, dict }: { seed: string; dict: Dictionaries }) {
  const puzzle = useMemo(() => generatePuzzle(seed, dict), [seed, dict]);
  const [found, setFound] = useSeedState<string[]>(GAME_ID, seed, []);
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
  const revealed = useMemo(() => new Set(found), [found]);
  const used = useMemo(
    () => new Set(order.flatMap((orig, pos) => (guess.includes(orig) ? [pos] : []))),
    [order, guess],
  );

  const add = useCallback((i: number) => setGuess((g) => (g.includes(i) ? g : [...g, i])), []);
  const typeLetter = useCallback(
    (c: string) =>
      setGuess((g) => {
        if (c === puzzle.required && !g.includes(CENTRE)) return [...g, CENTRE];
        const i = puzzle.outer.findIndex((l, idx) => l === c && !g.includes(idx));
        return i === -1 ? g : [...g, i];
      }),
    [puzzle],
  );
  const backspace = useCallback(() => setGuess((g) => g.slice(0, -1)), []);
  const clear = useCallback(() => setGuess([]), []);
  const doShuffle = useCallback(() => {
    shuffles.current++;
    const rng = createRng(`${seed}:shuffle:${shuffles.current}`, GAME_ID);
    setOrder((o) => shuffle(rng, o));
  }, [seed]);

  const animateWord = useCallback(async (w: string) => {
    const wheel = wheelRef.current;
    const slot = listRef.current?.querySelector<HTMLElement>(`[data-word="${w}"]`);
    if (wheel && slot) {
      void flashElement(wheel);
      await ensureInView(slot);
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
      await flyElement(from, to, content, { className: 'fly-word', duration: 1100 });
    }
    setHidden((h) => {
      const n = new Set(h);
      n.delete(w);
      return n;
    });
    setLatest(w);
  }, []);

  const animateStar = useCallback(async (i: number) => {
    const wheel = wheelRef.current;
    const slot = cardRef.current?.querySelector<HTMLElement>(`[data-star-slot="${i}"]`);
    if (wheel && slot) {
      await ensureInView(slot);
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
    setShownStars((s) => Math.max(s, i + 1));
  }, []);

  const submit = useCallback(() => {
    if (!word) return;
    const res = checkGuess(word, puzzle, found);
    if (res.ok) {
      const next = [...found, res.word];
      const before = progressFor(found.length, puzzle.pool.length).stars;
      const after = progressFor(next.length, puzzle.pool.length).stars;
      setFound(next);
      setHidden((h) => new Set(h).add(res.word));
      showFeedback({ tone: 'good', text: `${res.word.toUpperCase()} — nice!` });
      const q = queue.current;
      q.enqueue(() => animateWord(res.word));
      for (let i = before; i < after; i++) q.enqueue(() => animateStar(i));
      if (next.length === puzzle.pool.length) q.enqueue(() => setCelebrate(true));
    } else {
      showFeedback({
        tone: res.reason === 'already-found' ? 'info' : 'bad',
        text: MESSAGES[res.reason],
      });
    }
    setGuess([]);
  }, [word, puzzle, found, setFound, showFeedback, animateWord, animateStar]);

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
          <h2 className="lw__title">Letter Wheel</h2>
          <p className="lw__hint">
            Make words of {MIN_WORD}+ letters. Every word must use the centre letter; each letter
            once.
          </p>
        </div>
        <SeedDisplay gameId={GAME_ID} seed={seed} />
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
          <p
            className={`lw__feedback lw__feedback--${feedback?.tone ?? 'info'}${feedback ? '' : ' lw__feedback--hidden'}`}
            role="status"
          >
            {feedback
              ? `${feedback.tone === 'good' ? '✓' : feedback.tone === 'bad' ? '✗' : '•'} ${feedback.text}`
              : '\u00a0'}
          </p>
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
        title="Perfect!"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCelebrate(false)}>
              Admire it
            </Button>
            <Button onClick={() => newPuzzle(GAME_ID)}>New puzzle</Button>
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

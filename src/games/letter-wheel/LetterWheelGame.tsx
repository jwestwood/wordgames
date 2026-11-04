import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createRng,
  ensureSeed,
  getSeedFromHash,
  newPuzzle,
  shareLink,
  shuffle,
} from '@core/random';
import { progressFor, useSeedState } from '@core/game';
import {
  Button,
  Confetti,
  LetterWheel,
  Modal,
  Panel,
  ScoreDisplay,
  Tile,
  WordSlots,
} from '@core/ui';
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
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [latest, setLatest] = useState<string>();
  const [celebrate, setCelebrate] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const submit = useCallback(() => {
    if (!word) return;
    const res = checkGuess(word, puzzle, found);
    if (res.ok) {
      const next = [...found, res.word];
      setFound(next);
      setLatest(res.word);
      setFeedback({ tone: 'good', text: `${res.word.toUpperCase()} — nice!` });
      if (next.length === puzzle.pool.length) setCelebrate(true);
    } else {
      setFeedback({
        tone: res.reason === 'already-found' ? 'info' : 'bad',
        text: MESSAGES[res.reason],
      });
    }
    setGuess([]);
  }, [word, puzzle, found, setFound]);

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

  const share = async () => {
    const url = shareLink(GAME_ID, seed);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', url);
    }
  };

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
        <div className="lw__actions">
          <Button variant="secondary" size="sm" onClick={share}>
            {copied ? 'Link copied!' : 'Share link'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => newPuzzle(GAME_ID)}>
            New puzzle
          </Button>
        </div>
      </div>

      <div className="lw__layout">
        <Panel variant="wood" className="lw__play">
          <LetterWheel
            centre={puzzle.required}
            letters={order.map((i) => puzzle.outer[i])}
            used={used}
            onCentre={() => add(CENTRE)}
            onLetter={(pos) => add(order[pos])}
            label="Letters: tap to add to your guess"
          />
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
          <p className={`lw__feedback lw__feedback--${feedback?.tone ?? 'info'}`} role="status">
            {feedback
              ? `${feedback.tone === 'good' ? '✓' : feedback.tone === 'bad' ? '✗' : '•'} ${feedback.text}`
              : '\u00a0'}
          </p>
          <div className="lw__controls">
            <Button variant="secondary" size="sm" onClick={backspace} disabled={!guess.length}>
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={clear} disabled={!guess.length}>
              Clear
            </Button>
            <Button variant="secondary" size="sm" onClick={doShuffle}>
              Shuffle
            </Button>
            <Button onClick={submit} disabled={!guess.length}>
              Guess
            </Button>
          </div>
        </Panel>

        <Panel
          className="lw__words"
          title={
            <span className="lw__progress">
              <ScoreDisplay label="Found" score={progress.found} />
              <span className="lw__of">
                of {progress.total} · {progress.percent}%
              </span>
              <span
                className="lw__stars"
                role="img"
                aria-label={`${progress.stars} of ${progress.maxStars} stars${progress.perfect ? ', perfect' : ''}`}
              >
                {Array.from({ length: progress.maxStars }, (_, i) => (
                  <span key={i} className={i < progress.stars ? 'lw__star--on' : 'lw__star--off'}>
                    {i < progress.stars ? '★' : '☆'}
                  </span>
                ))}
                {progress.perfect && <span className="stamp lw__perfect">Perfect</span>}
              </span>
            </span>
          }
        >
          <p className="lw__thresholds">★ 60% · ★★ 80% · ★★★ 90% · Perfect 100%</p>
          <WordSlots words={puzzle.pool} revealed={revealed} latest={latest} />
        </Panel>
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

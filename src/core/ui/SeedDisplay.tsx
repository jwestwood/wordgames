import { useEffect, useId, useState, type ReactNode } from 'react';
import {
  isValidSeed,
  newPuzzle,
  normaliseSeed,
  normaliseSeedInput,
  SEED_LENGTH,
  shareLink,
} from '@core/random';
import { BETA } from '../versions';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { IconDice, IconLink } from './Icons';
import { useTransientMessage } from './transient';
import { sound } from '../audio/hooks';

export interface SeedDisplayProps {
  gameId: string;
  seed: string;
  /**
   * Puzzle version id (`2`, `beta`). Included in share links; randomising/typing a seed stays on
   * beta, otherwise goes to the latest numbered version.
   */
  version?: string;
  /** Rendered inline right after the seed field (e.g. the game's settings cog). */
  after?: ReactNode;
  /** Puzzle has progress: randomising asks for confirmation first. */
  started?: boolean;
  /** Override "new seed" behaviour (defaults to core newPuzzle navigation). */
  onRandomise?: () => void;
  /** Override applying a typed seed (defaults to core newPuzzle(gameId, seed)). */
  onSeedChange?: (seed: string) => void;
  className?: string;
}

/** Editable seed field with copy-seed, copy-link and randomise controls. */
export function SeedDisplay({
  gameId,
  seed,
  version,
  started = false,
  after,
  onRandomise,
  onSeedChange,
  className = '',
}: SeedDisplayProps) {
  const [msg, show] = useTransientMessage<string>(1800);
  const [spin, setSpin] = useState(0);
  const [draft, setDraft] = useState(seed);
  const [invalid, setInvalid] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const id = useId();
  // New seeds stay on beta; numbered versions move on to the latest (missing v = latest).
  const stay = version === BETA ? BETA : undefined;
  const errId = `${id}-err`;

  // Sync when the seed changes externally (dice, history, URL).
  useEffect(() => {
    setDraft(seed);
    setInvalid(false);
  }, [seed]);

  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      sound.play('copy');
      show(done);
    } catch {
      window.prompt('Copy this:', text);
    }
  };
  const revert = () => {
    setDraft(seed);
    setInvalid(false);
  };
  /** Apply the draft if valid; returns false (and flags error) otherwise. */
  const apply = (): boolean => {
    if (!isValidSeed(draft)) {
      setInvalid(true);
      sound.play('error');
      return false;
    }
    const next = normaliseSeed(draft);
    setInvalid(false);
    if (next === seed) return true;
    sound.play('button');
    if (onSeedChange) onSeedChange(next);
    else newPuzzle(gameId, next, stay);
    show('Puzzle loaded');
    return true;
  };

  const randomise = () => {
    setConfirming(false);
    setSpin((s) => s + 1);
    sound.play('dice');
    if (onRandomise) onRandomise();
    else newPuzzle(gameId, undefined, stay);
  };

  return (
    <div className={`seed ${className}`.trim()}>
      <span className="seed__buttons">
        <Button
          variant="secondary"
          size="sm"
          className="btn--icon"
          aria-label="Copy share link"
          title="Copy share link"
          onClick={() =>
            copy(shareLink(gameId, seed, window.location.href, version), 'Link copied')
          }
        >
          <IconLink />
        </Button>
        <Button
          variant="warning"
          size="sm"
          aria-label="New random puzzle"
          title="New random puzzle"
          className={`btn--icon${spin ? ' seed__dice--spin' : ''}`}
          key={spin}
          onClick={() => (started ? setConfirming(true) : randomise())}
        >
          <IconDice />
        </Button>
      </span>
      <label className="seed__label" htmlFor={id}>
        Seed
      </label>
      <span className={`seed__field${invalid ? ' seed__field--invalid' : ''}`}>
        <input
          id={id}
          className="seed__input"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={SEED_LENGTH}
          size={SEED_LENGTH}
          value={draft}
          aria-invalid={invalid}
          aria-describedby={invalid ? errId : undefined}
          title="Type a puzzle code and press Enter"
          onChange={(e) => {
            setDraft(normaliseSeedInput(e.target.value));
            setInvalid(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              apply();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              revert();
            }
          }}
          onBlur={() => {
            if (draft === seed) return;
            if (!isValidSeed(draft)) revert();
            else apply();
          }}
        />
        {draft !== seed && (
          <Button
            variant="primary"
            size="sm"
            className="seed__go"
            aria-label="Load this puzzle"
            title="Load this puzzle"
            onMouseDown={(e) => e.preventDefault()}
            onClick={apply}
          >
            Go
          </Button>
        )}
      </span>
      {after}
      {invalid ? (
        <span id={errId} className="seed__msg seed__msg--error" role="alert">
          Codes are {SEED_LENGTH} letters/digits (no I, L, O, U)
        </span>
      ) : (
        <span className="seed__msg" role="status">
          {msg ?? ''}
        </span>
      )}
      <ConfirmDialog
        open={confirming}
        title="Start a new puzzle?"
        confirmLabel="New puzzle"
        tone="warning"
        onConfirm={randomise}
        onCancel={() => setConfirming(false)}
      >
        <p>
          You&rsquo;ve started this one. Your progress is saved and you can come back to it from
          Past Games.
        </p>
      </ConfirmDialog>
    </div>
  );
}

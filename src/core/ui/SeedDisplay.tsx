import { useEffect, useId, useState } from 'react';
import {
  isValidSeed,
  newPuzzle,
  normaliseSeed,
  normaliseSeedInput,
  SEED_LENGTH,
  shareLink,
} from '@core/random';
import { Button } from './Button';
import { IconCopy, IconDice, IconLink } from './Icons';
import { useTransientMessage } from './transient';
import { sound } from '../audio/hooks';

export interface SeedDisplayProps {
  gameId: string;
  seed: string;
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
  onRandomise,
  onSeedChange,
  className = '',
}: SeedDisplayProps) {
  const [msg, show] = useTransientMessage<string>(1800);
  const [spin, setSpin] = useState(0);
  const [draft, setDraft] = useState(seed);
  const [invalid, setInvalid] = useState(false);
  const id = useId();
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
    else newPuzzle(gameId, next);
    show('Puzzle loaded');
    return true;
  };

  return (
    <div className={`seed ${className}`.trim()}>
      <label className="seed__label" htmlFor={id}>
        Puzzle
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
      <span className="seed__buttons">
        <Button
          variant="secondary"
          size="sm"
          aria-label="Copy seed"
          title="Copy seed"
          onClick={() => copy(seed, 'Seed copied')}
        >
          <IconCopy />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          aria-label="Copy share link"
          title="Copy share link"
          onClick={() => copy(shareLink(gameId, seed), 'Link copied')}
        >
          <IconLink />
        </Button>
        <Button
          variant="warning"
          size="sm"
          aria-label="New random puzzle"
          title="New random puzzle"
          className={spin ? 'seed__dice--spin' : ''}
          key={spin}
          onClick={() => {
            setSpin((s) => s + 1);
            sound.play('dice');
            if (onRandomise) onRandomise();
            else newPuzzle(gameId);
          }}
        >
          <IconDice />
        </Button>
      </span>
      {invalid ? (
        <span id={errId} className="seed__msg seed__msg--error" role="alert">
          Codes are {SEED_LENGTH} letters/digits (no I, L, O, U)
        </span>
      ) : (
        <span className="seed__msg" role="status">
          {msg ?? ''}
        </span>
      )}
    </div>
  );
}

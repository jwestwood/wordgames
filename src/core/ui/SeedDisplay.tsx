import { useState } from 'react';
import { newPuzzle, shareLink } from '@core/random';
import { Button } from './Button';
import { IconCopy, IconDice, IconLink } from './Icons';
import { useTransientMessage } from './transient';
import { sound } from '../audio/hooks';

export interface SeedDisplayProps {
  gameId: string;
  seed: string;
  /** Override "new seed" behaviour (defaults to core newPuzzle navigation). */
  onRandomise?: () => void;
  className?: string;
}

/** Prominent seed plaque with copy-seed, copy-link and randomise controls. */
export function SeedDisplay({ gameId, seed, onRandomise, className = '' }: SeedDisplayProps) {
  const [msg, show] = useTransientMessage<string>(1800);
  const [spin, setSpin] = useState(0);
  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      sound.play('copy');
      show(done);
    } catch {
      window.prompt('Copy this:', text);
    }
  };
  return (
    <div className={`seed ${className}`.trim()}>
      <span className="seed__label">Puzzle</span>
      <span className="seed__code" aria-label={`Seed ${seed.split('').join(' ')}`}>
        {[...seed].map((c, i) => (
          <span key={i} className="seed__char" aria-hidden="true">
            {c}
          </span>
        ))}
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
      <span className="seed__msg" role="status">
        {msg ?? ''}
      </span>
    </div>
  );
}

import { formatScore } from './logic';

export interface ScoreDisplayProps {
  label?: string;
  score: number;
  /** Last change, shown as +n / −n. */
  delta?: number;
  best?: number;
}

export function ScoreDisplay({ label = 'Score', score, delta, best }: ScoreDisplayProps) {
  return (
    <div className="score">
      <span className="score__label">{label}</span>
      <span className="score__value" aria-live="polite">
        {formatScore(score)}
      </span>
      {delta !== undefined && delta !== 0 && (
        <span className={`score__delta ${delta > 0 ? 'score__delta--up' : 'score__delta--down'}`}>
          {formatScore(delta, true)}
        </span>
      )}
      {best !== undefined && <span className="score__best">Best {formatScore(best)}</span>}
    </div>
  );
}

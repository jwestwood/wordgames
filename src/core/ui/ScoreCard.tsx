import { IconStar } from './Icons';

export interface ScoreCardProps {
  found: number;
  total: number;
  percent: number;
  /** Stars currently shown filled. */
  stars: number;
  maxStars: number;
  /** Optional threshold labels per star, e.g. ['60%', '80%', '90%']. */
  thresholds?: readonly string[];
  label?: string;
  className?: string;
}

/** Wooden score plaque: found count, percent and star slots (`data-star-slot={i}` for fly-to targets). */
export function ScoreCard({
  found,
  total,
  percent,
  stars,
  maxStars,
  thresholds,
  label = 'Found',
  className = '',
}: ScoreCardProps) {
  return (
    <section className={`score-card ${className}`.trim()} aria-label="Score">
      <div className="score-card__count">
        <span className="score-card__label">{label}</span>
        <span className="score-card__value" aria-live="polite">
          {found}
          <span className="score-card__total"> / {total}</span>
        </span>
      </div>
      <div className="score-card__percent" aria-label={`${percent} percent`}>
        {percent}
        <span className="score-card__pc">%</span>
      </div>
      <ol className="score-card__stars" aria-label={`${stars} of ${maxStars} stars`}>
        {Array.from({ length: maxStars }, (_, i) => (
          <li
            key={i}
            data-star-slot={i}
            className={`score-card__star${i < stars ? ' score-card__star--on' : ''}`}
            title={thresholds?.[i]}
          >
            <IconStar filled={i < stars} size="100%" />
            {thresholds?.[i] && <span className="score-card__thr">{thresholds[i]}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

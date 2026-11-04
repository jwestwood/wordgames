import type { GameDefinition } from '../registry';

export function GameCard({ game }: { game: GameDefinition }) {
  const playable = game.status === 'playable';
  return (
    <article className="game-card">
      <div className="game-card__head">
        {game.brand && <game.brand.Icon size={56} className="game-card__icon" />}
        <div>
          <h3 className="game-card__title">{game.title}</h3>
          {game.brand && <p className="game-card__tagline">{game.brand.tagline}</p>}
        </div>
      </div>
      <p className="game-card__desc">{game.description}</p>
      {playable ? (
        <a className="btn btn--primary btn--sm" href={`#/games/${game.id}`}>
          Play
        </a>
      ) : (
        <span className="stamp">Coming soon</span>
      )}
    </article>
  );
}

/** Placeholder card promising more games (not a registered game). */
export function MoreGamesCard({
  title = 'More games coming soon',
  description = 'New word games are on the way. Check back soon!',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <article className="game-card game-card--placeholder">
      <h3 className="game-card__title">{title}</h3>
      <p className="game-card__desc">{description}</p>
      <span className="stamp">Coming soon</span>
    </article>
  );
}

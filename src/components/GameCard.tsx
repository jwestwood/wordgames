import type { GameInfo } from '../games';

export function GameCard({ game }: { game: GameInfo }) {
  return (
    <article className="game-card">
      <h3>{game.title}</h3>
      <p>{game.description}</p>
      <span className="badge">{game.status === 'playable' ? 'Play' : 'Coming soon'}</span>
    </article>
  );
}

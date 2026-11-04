import type { GameDefinition } from '../registry';

export function GameCard({ game }: { game: GameDefinition }) {
  const playable = game.status === 'playable';
  return (
    <article className="game-card">
      <h3>{game.title}</h3>
      <p>{game.description}</p>
      {playable ? (
        <a className="badge" href={`#/games/${game.id}`}>
          Play
        </a>
      ) : (
        <span className="badge">Coming soon</span>
      )}
    </article>
  );
}

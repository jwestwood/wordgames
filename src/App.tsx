import { GameCard } from '@core/ui';
import { useHashRoute } from '@core/router';
import { findGame, games } from './games';

export default function App() {
  const [section, id] = useHashRoute();
  const game = section === 'games' && id ? findGame(id) : undefined;
  const Game = game?.component;

  return (
    <main className="app">
      <h1>
        <a href="#/">Word Games</a>
      </h1>
      {Game ? (
        <Game />
      ) : (
        <>
          <h2>Games</h2>
          <section className="game-grid">
            {games.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </section>
        </>
      )}
    </main>
  );
}

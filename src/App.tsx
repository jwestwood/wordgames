import { GameCard, Header } from '@core/ui';
import { StyleGuide } from '@core/ui/StyleGuide';
import { useHashRoute } from '@core/router';
import { findGame, games } from './games';

export default function App() {
  const [section, id] = useHashRoute();
  const game = section === 'games' && id ? findGame(id) : undefined;
  const Game = game?.component;

  return (
    <main className="app">
      <Header
        title="Word Games"
        tagline="Pull up a chair."
        nav={[
          { href: '#/', label: 'Games' },
          { href: '#/style-guide', label: 'Style guide' },
        ]}
      />
      {section === 'style-guide' ? (
        <StyleGuide />
      ) : Game ? (
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

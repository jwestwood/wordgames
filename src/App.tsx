import { Suspense, useState } from 'react';
import { GameCard, Header, HistoryPanel, IconPalette, IconPawn, MoreGamesCard } from '@core/ui';
import { StyleGuide } from '@core/ui/StyleGuide';
import { useHashRoute } from '@core/router';
import { useDocumentBrand } from '@core/brand';
import { findGame, games } from './games';

export default function App() {
  const [section, id] = useHashRoute();
  const game = section === 'games' && id ? findGame(id) : undefined;
  const Game = game?.component;
  const [historyOpen, setHistoryOpen] = useState(false);
  useDocumentBrand(game?.title, game?.brand?.tagline, game?.brand?.favicon);

  return (
    <main className="app">
      <Header
        title="Word Games"
        tagline="Words to the wise"
        nav={[
          { href: '#/', label: 'Games', icon: <IconPawn /> },
          { href: '#/style-guide', label: 'Style guide', icon: <IconPalette /> },
        ]}
        onHistory={() => setHistoryOpen(true)}
      />
      <HistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        games={games.filter((g) => g.status === 'playable')}
      />
      {section === 'style-guide' ? (
        <StyleGuide games={games} />
      ) : Game ? (
        <Suspense fallback={<p>Loading…</p>}>
          <Game />
        </Suspense>
      ) : (
        <>
          <h2>Games</h2>
          <section className="game-grid">
            {games.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
            <MoreGamesCard />
          </section>
        </>
      )}
    </main>
  );
}

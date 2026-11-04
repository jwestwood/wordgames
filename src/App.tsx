import { GameCard } from './components/GameCard';
import { games } from './games';

export default function App() {
  return (
    <main className="app">
      <h1>Word Games</h1>
      <h2>Games</h2>
      <section className="game-grid">
        {games.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </section>
    </main>
  );
}

import { useState } from 'react';
import { Board } from './Board';
import { Button } from './Button';
import { IconBackspace, IconShuffle, IconX } from './Icons';
import { ScoreCard } from './ScoreCard';
import { SeedDisplay } from './SeedDisplay';
import { LetterTiles } from './LetterTiles';
import { Modal } from './Modal';
import { HistoryPanel } from './HistoryPanel';
import { IconClock } from './Icons';
import { Panel } from './Panel';
import { ScoreDisplay } from './ScoreDisplay';
import { Tile } from './Tile';
import { GameCard } from './GameCard';
import type { GameDefinition } from '../registry';
import { evaluateGuess, type TileState } from './logic';
import { colors, contrastPairs } from './theme/tokens';
import { contrastRatio } from './theme/contrast';

const STATES: TileState[] = ['default', 'selected', 'correct', 'present', 'absent'];

/** Living showcase of the shared design system (route: #/style-guide). */
export function StyleGuide({ games = [] }: { games?: readonly GameDefinition[] }) {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [score, setScore] = useState(120);
  const letters = 'TABLETOPS';
  const toggle = (i: number) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  return (
    <div className="stack">
      <h1>Style guide</h1>
      <p className="accent">Paper &amp; tabletop — the shared look for every game.</p>

      <Panel title="Colour">
        <div className="swatch-grid">
          {Object.entries(colors).map(([name, hex]) => (
            <div key={name}>
              <div className="swatch" style={{ background: hex }} />
              <strong>{name}</strong>
              <div>
                <code>{hex}</code>
              </div>
            </div>
          ))}
        </div>
        <h4>Contrast (WCAG AA ≥ 4.5)</h4>
        <ul>
          {contrastPairs.map(([n, fg, bg]) => (
            <li key={n}>
              <span style={{ background: bg, color: fg, padding: '0 6px', borderRadius: 4 }}>
                {n}
              </span>{' '}
              {contrastRatio(fg, bg).toFixed(2)}:1
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Typography">
        <h1>Fraunces heading 1</h1>
        <h2>Fraunces heading 2</h2>
        <h3>Fraunces heading 3</h3>
        <p>Work Sans body text for UI and reading. The quick brown fox jumps over the lazy dog.</p>
        <p className="accent">Special Elite — accents, stamps, labels.</p>
      </Panel>

      <Panel title="Buttons">
        <div className="row">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="danger" className="btn--icon" aria-label="Clear">
            <IconX />
          </Button>
          <Button variant="secondary" className="btn--icon" aria-label="Delete">
            <IconBackspace />
          </Button>
          <Button variant="warning" className="btn--icon" aria-label="Shuffle">
            <IconShuffle />
          </Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </Panel>

      <Panel title="SeedDisplay &amp; ScoreCard">
        <SeedDisplay
          gameId="style-guide"
          seed="K7Q2MX"
          onRandomise={() => {}}
          onSeedChange={() => {}}
        />
        <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
          Editable: type a 6-character code and press Enter (or Go). Invalid codes show an inline
          error; Esc reverts.
        </p>
        <div style={{ marginTop: 'var(--space-4)', maxWidth: '28rem' }}>
          <ScoreCard
            found={17}
            total={21}
            percent={80}
            stars={2}
            maxStars={3}
            thresholds={['60%', '80%', '90%']}
          />
        </div>
      </Panel>

      <Panel title="Tiles &amp; states">
        <div className="row">
          {STATES.map((s) => (
            <div key={s} className="stack" style={{ alignItems: 'center', gap: 4 }}>
              <Tile letter="W" state={s} value={4} />
              <small>{s}</small>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <Tile letter="s" size="sm" static />
          <Tile letter="m" size="md" static />
          <Tile letter="l" size="lg" static />
        </div>
        <h4>LetterTiles (evaluated guess “CRANE” vs “REACT”)</h4>
        <LetterTiles letters="crane" states={evaluateGuess('crane', 'react')} />
      </Panel>

      <Panel title="Board (arrow keys move focus)" variant="wood">
        <Board cols={3} label="Demo board">
          {[...letters].map((c, i) => (
            <Tile
              key={i}
              letter={c}
              state={selected.includes(i) ? 'selected' : 'default'}
              onClick={() => toggle(i)}
            />
          ))}
        </Board>
      </Panel>

      <Panel title="Score display">
        <div className="row">
          <ScoreDisplay score={score} delta={12} best={340} />
          <ScoreDisplay label="Penalty" score={score} delta={-3} />
          <Button variant="secondary" onClick={() => setScore((s) => s + 10)}>
            +10
          </Button>
        </div>
      </Panel>

      <Panel title="Branding">
        <p className="accent">
          Each game has a square icon (readable at 32px), a ~4:1 logo and a tagline, drawn from the
          shared palette and fonts with one accent touch.
        </p>
        {games
          .filter((g) => g.brand)
          .map((g) => {
            const { Icon, Logo, tagline } = g.brand!;
            return (
              <div key={g.id} className="brand-demo">
                <h3>{g.title}</h3>
                <div className="brand-demo__icons">
                  {[32, 64, 192].map((s) => (
                    <figure key={s}>
                      <Icon size={s} title={`${g.title} icon ${s}px`} />
                      <figcaption>{s}px</figcaption>
                    </figure>
                  ))}
                </div>
                <div className="brand-demo__logo">
                  <Logo size={64} />
                </div>
                <p className="brand-demo__tagline">“{tagline}”</p>
              </div>
            );
          })}
      </Panel>

      <Panel title="Cards">
        <div className="game-grid">
          <GameCard
            game={{
              id: 'demo',
              title: 'Playable game',
              description: 'A card with a Play button.',
              status: 'playable',
            }}
          />
          <GameCard
            game={{
              id: 'soon',
              title: 'Coming soon',
              description: 'Stamped as not yet ready.',
              status: 'coming-soon',
            }}
          />
        </div>
      </Panel>

      <Panel title="HistoryPanel">
        <p>
          Shared puzzle history (opened from the clock in the header). Game filter, In progress /
          Completed tabs, mini puzzle preview (e.g. a static wheel), small seed, optional summary,
          progress bar, stars, relative time, remove-with-confirm and an &ldquo;Older word
          list&rdquo; stamp for stale entries. Shows your real history.
        </p>
        <Button variant="secondary" onClick={() => setHistoryOpen(true)}>
          <IconClock /> Open history
        </Button>
        <HistoryPanel
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          games={[{ id: 'letter-wheel', title: 'Letter Wheel' }]}
        />
      </Panel>

      <Panel title="Modal">
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Round complete!"
          footer={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button onClick={() => setOpen(false)}>Play again</Button>
            </>
          }
        >
          <p>You scored 120 points. Escape or click outside to close.</p>
        </Modal>
      </Panel>
    </div>
  );
}

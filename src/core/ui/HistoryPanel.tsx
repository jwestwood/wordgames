import { Suspense, useState, type ComponentType } from 'react';
import {
  relativeTime,
  removeHistory,
  useHistoryList,
  type HistoryEntry,
  type HistoryStatus,
} from '@core/history';
import { gameHash } from '@core/random';
import { versionParam, versionTag } from '@core/versions';
import { Button } from './Button';
import { IconStar, IconTrash } from './Icons';
import { Modal } from './Modal';

export interface HistoryGame {
  id: string;
  title: string;
  /** Latest numbered puzzle version id; entries from other versions get a small label. */
  latestVersion?: string;
  /** Optional branding; the icon is shown next to the game name. */
  brand?: { Icon: ComponentType<{ size?: number; className?: string }> };
  /** Optional mini, non-interactive puzzle preview shown prominently on each card. */
  HistoryPreview?: ComponentType<{ entry: HistoryEntry }>;
}

export interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  /** Games from the registry (for the filter and display names). */
  games: readonly HistoryGame[];
  /** Override "now" (tests / style guide). */
  now?: number;
}

const TABS: Array<{ id: Exclude<HistoryStatus, 'all'>; label: string }> = [
  { id: 'in-progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
];

/** Shared puzzle history dialog: game filter, status tabs, resumable entries. */
export function HistoryPanel({ open, onClose, games, now }: HistoryPanelProps) {
  const [gameId, setGameId] = useState('');
  const [status, setStatus] = useState<Exclude<HistoryStatus, 'all'>>('in-progress');
  const entries = useHistoryList({ gameId: gameId || undefined, status });
  const byId = new Map(games.map((g) => [g.id, g]));
  const t = now ?? (open ? Date.now() : 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your puzzles"
      className="history"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="history__filters">
        <label className="history__game">
          <span className="history__label">Game</span>
          <select value={gameId} onChange={(e) => setGameId(e.target.value)}>
            <option value="">All games</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </label>
        <div className="history__tabs" role="tablist" aria-label="Status">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={status === tab.id}
              className={`history__tab${status === tab.id ? ' history__tab--on' : ''}`}
              onClick={() => setStatus(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="history__empty">
          {status === 'completed'
            ? 'No finished puzzles yet. Complete one and it will be filed here.'
            : 'Nothing on the go. Start a puzzle and it will appear here after your first guess.'}
        </p>
      ) : (
        <ul className="history__list">
          {entries.map((e) => (
            <HistoryItem
              key={`${e.gameId}:${e.seed}:${e.version}`}
              entry={e}
              game={byId.get(e.gameId)}
              now={t}
              onOpen={onClose}
            />
          ))}
        </ul>
      )}
    </Modal>
  );
}

function HistoryItem({
  entry: e,
  game,
  now,
  onOpen,
}: {
  entry: HistoryEntry;
  game?: HistoryGame;
  now: number;
  onOpen: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const tag = versionTag(e.version, game?.latestVersion);
  const Preview = game?.HistoryPreview;
  const pct = e.total > 0 ? Math.floor((e.found / e.total) * 100) : 0;
  return (
    <li className={`history__item${e.completed ? ' history__item--done' : ''}`}>
      <a
        className="history__open"
        href={gameHash(e.gameId, e.seed, versionParam(e.version))}
        onClick={onOpen}
      >
        {Preview && (
          <span className="history__preview">
            <Suspense fallback={<span className="history__preview-blank" aria-hidden="true" />}>
              <Preview entry={e} />
            </Suspense>
          </span>
        )}
        <span className="history__body">
          <span className="history__row">
            <strong className="history__name">
              {game?.brand && <game.brand.Icon size={20} className="history__icon" />}
              {game?.title ?? e.gameId}
            </strong>
            <span className="history__when">{relativeTime(e.lastPlayed, now)}</span>
          </span>
          <span className="history__row">
            <span className="history__seed" aria-label={`Seed ${e.seed.split('').join(' ')}`}>
              <span aria-hidden="true">Seed {e.seed}</span>
            </span>
            <span className="history__stars" aria-label={`${e.stars} of ${e.maxStars} stars`}>
              {Array.from({ length: e.maxStars }, (_, i) => (
                <IconStar
                  key={i}
                  filled={i < e.stars}
                  className={i < e.stars ? 'history__star history__star--on' : 'history__star'}
                />
              ))}
            </span>
          </span>
          {((e.summary && !Preview) || tag) && (
            <span className="history__summary">
              {!Preview && e.summary}
              {tag && (
                <span className={`history__stale history__version--${tag.kind}`} title={tag.title}>
                  {tag.label}
                </span>
              )}
            </span>
          )}
          <span className="history__progress">
            <span
              className="history__bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={e.total}
              aria-valuenow={e.found}
              aria-label="Words found"
            >
              <span className="history__fill" style={{ width: `${pct}%` }} />
            </span>
            <span className="history__count">
              {e.found}/{e.total}
            </span>
          </span>
        </span>
      </a>
      <div className="history__actions">
        {confirm ? (
          <>
            <span className="history__confirm">Remove?</span>
            <Button
              size="sm"
              variant="danger"
              onClick={() => removeHistory(e.gameId, e.seed, e.version)}
            >
              Remove
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
              Keep
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="btn--icon"
            aria-label={`Remove ${game?.title ?? e.gameId} ${e.seed} from history`}
            title="Remove from history"
            onClick={() => setConfirm(true)}
          >
            <IconTrash />
          </Button>
        )}
      </div>
    </li>
  );
}

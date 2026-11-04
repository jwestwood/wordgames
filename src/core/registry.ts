import type { ComponentType } from 'react';
import type { HistoryEntry } from './history';

export interface HistoryPreviewProps {
  entry: HistoryEntry;
}

export interface GameDefinition {
  id: string;
  title: string;
  description: string;
  status: 'coming-soon' | 'playable';
  /**
   * Current puzzle version (algorithm + word list) for history entries; entries recorded with a
   * different version are flagged as stale (the same seed may now give a different puzzle).
   */
  puzzleVersion?: string;
  /** Lazy component for the game screen. */
  component?: ComponentType;
  /**
   * Optional small, non-interactive preview of the puzzle shown prominently on history cards
   * (may be lazy). Should read `entry.preview`, deriving from the seed for older entries.
   */
  HistoryPreview?: ComponentType<HistoryPreviewProps>;
}

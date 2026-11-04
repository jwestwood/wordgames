import type { ComponentType } from 'react';

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
}

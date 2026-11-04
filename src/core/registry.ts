import type { ComponentType } from 'react';

export interface GameDefinition {
  id: string;
  title: string;
  description: string;
  status: 'coming-soon' | 'playable';
  /** Lazy component for the game screen. */
  component?: ComponentType;
}

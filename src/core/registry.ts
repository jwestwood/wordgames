import type { ComponentType } from 'react';
import type { HistoryEntry } from './history';
import type { GameBrand } from './brand';
import type { SettingDefinition } from './settings/schema';

export type { GameBrand, BrandMarkProps } from './brand';

export interface HistoryPreviewProps {
  entry: HistoryEntry;
}

export interface GameDefinition {
  id: string;
  title: string;
  description: string;
  status: 'coming-soon' | 'playable';
  /** Per-game branding: icon, wide logo, tagline, optional accent (STYLE_GUIDE.md › Branding). */
  brand?: GameBrand;
  /**
   * Current puzzle version (algorithm + word list) for history entries; entries recorded with a
   * different version are flagged as stale (the same seed may now give a different puzzle).
   */
  puzzleVersion?: string;
  /**
   * Optional player settings (src/core/settings). Values persist in `wordgames:settings:<id>`;
   * the game reads them with `useGameSettings(id, settings)` and shows `GameSettingsButton`.
   */
  settings?: readonly SettingDefinition[];
  /** Lazy component for the game screen. */
  component?: ComponentType;
  /**
   * Optional small, non-interactive preview of the puzzle shown prominently on history cards
   * (may be lazy). Should read `entry.preview`, deriving from the seed for older entries.
   */
  HistoryPreview?: ComponentType<HistoryPreviewProps>;
}

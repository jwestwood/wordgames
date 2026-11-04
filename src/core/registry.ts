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
   * Latest numbered puzzle version id (e.g. `'2'`, see src/core/versions). History entries from
   * older versions or beta get a small label; they still open with their own version.
   */
  latestVersion?: string;
  /** Optional one-off migration of old saves/history, run once at app start. */
  migrate?: () => void;
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

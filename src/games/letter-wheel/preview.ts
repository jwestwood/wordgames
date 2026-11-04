import type { HistoryPreviewData } from '@core/history';

/** Spoiler-free wheel data for history cards: outer letters alphabetised (hides the word). */
export interface WheelPreview {
  letters: string;
  centre: string;
}

export function toWheelPreview(p: { outer: readonly string[]; required: string }): WheelPreview {
  return { letters: [...p.outer].sort().join(''), centre: p.required };
}

export function readWheelPreview(data: HistoryPreviewData | undefined): WheelPreview | null {
  if (!data) return null;
  const { letters, centre } = data;
  if (typeof letters !== 'string' || typeof centre !== 'string') return null;
  if (!/^[a-z]{3,12}$/.test(letters) || !/^[a-z]$/.test(centre)) return null;
  return { letters, centre };
}

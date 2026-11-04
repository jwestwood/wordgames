import { useEffect, useState } from 'react';
import type { HistoryPreviewProps } from '@core/registry';
import { LetterWheel } from '@core/ui';
import { generatePuzzle, loadDictionaries } from './puzzle';
import { readWheelPreview, toWheelPreview, type WheelPreview } from './preview';

const derived = new Map<string, WheelPreview>();

/** Mini static wheel; older entries without preview data regenerate it from the seed. */
export function LetterWheelHistoryPreview({ entry }: HistoryPreviewProps) {
  const stored = readWheelPreview(entry.preview);
  const [wheel, setWheel] = useState(() => stored ?? derived.get(entry.seed) ?? null);
  useEffect(() => {
    if (wheel) return;
    let live = true;
    loadDictionaries()
      .then((d) => {
        const w = toWheelPreview(generatePuzzle(entry.seed, d));
        derived.set(entry.seed, w);
        if (live) setWheel(w);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [wheel, entry.seed]);
  if (!wheel) return <span className="history__preview-blank" aria-hidden="true" />;
  return <LetterWheel static centre={wheel.centre} letters={[...wheel.letters]} />;
}

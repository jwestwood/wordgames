import { useEffect, useState } from 'react';
import type { HistoryPreviewProps } from '@core/registry';
import { LetterWheel } from '@core/ui';
import { parseVersionParam } from '@core/versions';
import { LATEST, loadVersion } from './versions';
import { readWheelPreview, toWheelPreview, type WheelPreview } from './preview';

const derived = new Map<string, WheelPreview>();
const keyOf = (e: { seed: string; version: string }) => `${e.version}:${e.seed}`;

/** Mini static wheel; older entries without preview data regenerate it from the seed. */
export function LetterWheelHistoryPreview({ entry }: HistoryPreviewProps) {
  const stored = readWheelPreview(entry.preview);
  const [wheel, setWheel] = useState(() => stored ?? derived.get(keyOf(entry)) ?? null);
  useEffect(() => {
    if (wheel) return;
    let live = true;
    loadVersion(parseVersionParam(entry.version) ?? LATEST)
      .then(({ rules, dict }) => {
        const w = toWheelPreview(rules.generate(entry.seed, dict));
        derived.set(keyOf(entry), w);
        if (live) setWheel(w);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wheel, entry.seed, entry.version]);
  if (!wheel) return <span className="history__preview-blank" aria-hidden="true" />;
  return <LetterWheel static centre={wheel.centre} letters={[...wheel.letters]} />;
}

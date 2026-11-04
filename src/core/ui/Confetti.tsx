import type React from 'react';
import { useMemo } from 'react';
import { createRng } from '@core/random';

/** Decorative paper-confetti burst (pure CSS animation; hidden under prefers-reduced-motion). */
export function Confetti({ seed = 'confetti', count = 40 }: { seed?: string; count?: number }) {
  const pieces = useMemo(() => {
    const rng = createRng(seed, 'confetti');
    return Array.from({ length: count }, (_, i) => ({
      left: `${(rng() * 100).toFixed(1)}%`,
      delay: `${(rng() * 0.8).toFixed(2)}s`,
      dur: `${(1.8 + rng() * 1.6).toFixed(2)}s`,
      rot: `${Math.floor(rng() * 720 - 360)}deg`,
      tone: i % 4,
    }));
  }, [seed, count]);
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`confetti__piece confetti__piece--${p.tone}`}
          style={
            {
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.dur,
              '--confetti-rot': p.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

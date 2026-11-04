/** Pure geometry for segmented-circle (wheel) layouts. Angles in radians, 0 = 12 o'clock, clockwise. */
export function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.sin(angle), cy - r * Math.cos(angle)];
}

const f = (n: number) => Number(n.toFixed(3));

/** SVG path for a ring segment between radii r0<r1 and angles a0<a1. */
export function annularSectorPath(
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number,
): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = polar(cx, cy, r1, a0);
  const [x1, y1] = polar(cx, cy, r1, a1);
  const [x2, y2] = polar(cx, cy, r0, a1);
  const [x3, y3] = polar(cx, cy, r0, a0);
  return (
    `M${f(x0)} ${f(y0)} A${r1} ${r1} 0 ${large} 1 ${f(x1)} ${f(y1)} ` +
    `L${f(x2)} ${f(y2)} A${r0} ${r0} 0 ${large} 0 ${f(x3)} ${f(y3)} Z`
  );
}

export interface WheelSegment {
  index: number;
  path: string;
  /** Label centre point */
  x: number;
  y: number;
}

/** Evenly divide a ring into `count` segments (first centred at 12 o'clock), with an angular gap. */
export function wheelSegments(
  count: number,
  { cx = 100, cy = 100, inner = 40, outer = 96, gap = 0.04 } = {},
): WheelSegment[] {
  const step = (2 * Math.PI) / count;
  return Array.from({ length: count }, (_, i) => {
    const mid = i * step;
    const [x, y] = polar(cx, cy, (inner + outer) / 2, mid);
    return {
      index: i,
      path: annularSectorPath(
        cx,
        cy,
        inner,
        outer,
        mid - step / 2 + gap / 2,
        mid + step / 2 - gap / 2,
      ),
      x: f(x),
      y: f(y),
    };
  });
}

/** Rotate an array left by `k` (wraps; negative ok). Display-only reorderings. */
export function rotate<T>(items: readonly T[], k: number): T[] {
  const n = items.length;
  if (n === 0) return [];
  const s = ((k % n) + n) % n;
  return [...items.slice(s), ...items.slice(0, s)];
}

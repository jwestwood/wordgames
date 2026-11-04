/** Shared geometry for the Letter Wheel mark (64×64 user units). Colours via theme variables. */
const SEGMENTS = 6;
const point = (i: number, r: number, offset = 0) => {
  const a = ((i + offset) / SEGMENTS) * Math.PI * 2 - Math.PI / 2;
  return [32 + r * Math.cos(a), 32 + r * Math.sin(a)].map((n) => +n.toFixed(2));
};

export function WheelMark({ x = 0, y = 0, size = 64 }: { x?: number; y?: number; size?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 64})`}>
      <circle cx="32" cy="34" r="27" fill="var(--color-ink)" opacity="0.18" />
      <circle cx="32" cy="32" r="27" fill="var(--color-wood-dark)" />
      <circle cx="32" cy="32" r="23.5" fill="var(--color-wood)" />
      {Array.from({ length: SEGMENTS }, (_, i) => {
        const [x1, y1] = point(i, 11);
        const [x2, y2] = point(i, 23.5);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--color-wood-dark)"
            strokeWidth="2.2"
          />
        );
      })}
      {Array.from({ length: SEGMENTS }, (_, i) => {
        const [cx, cy] = point(i, 17.5, 0.5);
        return <circle key={i} cx={cx} cy={cy} r="2.3" fill="var(--color-paper-light)" />;
      })}
      <circle cx="32" cy="32" r="11.5" fill="var(--lw-accent, var(--color-red))" />
      <path
        d="M28 25.5V38.5H37.5"
        fill="none"
        stroke="var(--color-paper-light)"
        strokeWidth="4"
        strokeLinecap="square"
      />
    </g>
  );
}

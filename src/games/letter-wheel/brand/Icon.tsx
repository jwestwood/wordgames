import type { BrandMarkProps } from '@core/registry';
import { WheelMark } from './WheelMark';

/** Square Letter Wheel icon: segmented wheel on a tile, centre letter L. */
export function LetterWheelIcon({ size = 32, title, className }: BrandMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <rect x="1" y="1" width="62" height="62" rx="14" fill="var(--color-tile)" />
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="14"
        fill="none"
        stroke="var(--color-tile-edge)"
        strokeWidth="2"
      />
      <WheelMark x={2} y={2} size={60} />
    </svg>
  );
}

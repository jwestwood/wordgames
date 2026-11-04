import type { BrandMarkProps } from '@core/registry';
import { WheelMark } from './WheelMark';

/** Wide (4:1) Letter Wheel logo: mini wheel mark + Fraunces wordmark (serif fallback, fixed length). */
export function LetterWheelLogo({ size = 48, title = 'Letter Wheel', className }: BrandMarkProps) {
  return (
    <svg
      className={className}
      width={size * 4}
      height={size}
      viewBox="0 0 320 80"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <WheelMark x={2} y={4} size={72} />
      <text
        x="88"
        y="54"
        fontFamily="Fraunces, Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fontSize="38"
        fill="var(--color-ink)"
        textLength="226"
        lengthAdjust="spacingAndGlyphs"
      >
        Letter Wheel
      </text>
      <path
        d="M90 64 Q200 70 312 63"
        fill="none"
        stroke="var(--color-wood)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

function Icon({ size = '1.25em', children, ...p }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...p}
    >
      {children}
    </svg>
  );
}

export const IconX = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
export const IconBackspace = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" />
    <path d="M12 9l6 6M18 9l-6 6" />
  </Icon>
);
export const IconShuffle = (p: IconProps) => (
  <Icon {...p}>
    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </Icon>
);
export const IconCopy = (p: IconProps) => (
  <Icon {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Icon>
);
export const IconLink = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
  </Icon>
);
export const IconDice = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="8" cy="8" r="1.3" fill="currentColor" />
    <circle cx="16" cy="16" r="1.3" fill="currentColor" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    <circle cx="16" cy="8" r="1.3" fill="currentColor" />
    <circle cx="8" cy="16" r="1.3" fill="currentColor" />
  </Icon>
);
export const IconStar = ({ filled = true, ...p }: IconProps & { filled?: boolean }) => (
  <Icon strokeWidth={1.6} {...p}>
    <path
      d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"
      fill={filled ? 'currentColor' : 'none'}
    />
  </Icon>
);
export const IconClock = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);
export const IconTrash = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icon>
);
export const IconSpeaker = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9h4l5-4v14l-5-4H4z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
  </Icon>
);
export const IconSpeakerOff = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9h4l5-4v14l-5-4H4z" />
    <path d="M17 9l5 6M22 9l-5 6" />
  </Icon>
);
export const IconPalette = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.5-1.5-2-1.5-3.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4-4-7-9-7z" />
    <circle cx="7.5" cy="11" r="1.2" />
    <circle cx="10" cy="7" r="1.2" />
    <circle cx="15" cy="7" r="1.2" />
  </Icon>
);
export const IconPawn = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="6" r="3" />
    <path d="M9.5 10h5M10 10c0 3-1.5 5-3 7h10c-1.5-2-3-4-3-7M5 21h14v-2.5a1.5 1.5 0 0 0-1.5-1.5h-11A1.5 1.5 0 0 0 5 18.5z" />
  </Icon>
);
export const IconCog = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    <circle cx="12" cy="12" r="6.5" />
  </Icon>
);
export const IconHint = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 21h6" />
    <path d="M10 17h4" />
    <path d="M12 3a5 5 0 0 0-3 9c.4.4.7 1 .8 1.5h4.4c.1-.5.4-1.1.8-1.5a5 5 0 0 0-3-9z" />
  </Icon>
);

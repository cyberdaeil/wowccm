type P = { size?: number };
const base = (size = 20) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const PlayIcon = ({ size }: P) => (
  <svg {...base(size)} fill="currentColor" stroke="none">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
  </svg>
);
export const PauseIcon = ({ size }: P) => (
  <svg {...base(size)} fill="currentColor" stroke="none">
    <rect x="6" y="5" width="4" height="14" rx="1.2" />
    <rect x="14" y="5" width="4" height="14" rx="1.2" />
  </svg>
);
export const StopIcon = ({ size }: P) => (
  <svg {...base(size)} fill="currentColor" stroke="none">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);
export const VolLowIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M11 5 6.8 9H3v6h3.8L11 19V5Z" />
    <path d="M15 10a3 3 0 0 1 0 4" />
  </svg>
);
export const VolHighIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M11 5 6.8 9H3v6h3.8L11 19V5Z" />
    <path d="M15 9.5a4 4 0 0 1 0 5" />
    <path d="M17.5 7a7 7 0 0 1 0 10" />
  </svg>
);
export const MuteIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M11 5 6.8 9H3v6h3.8L11 19V5Z" />
    <path d="m22 9-6 6M16 9l6 6" />
  </svg>
);
export const MinusIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M5 12h14" />
  </svg>
);
export const CloseIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const ShrinkIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
  </svg>
);
export const ExpandIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);
export const PinIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M12 17v5M9 3h6l-1 6 4 4H6l4-4z" />
  </svg>
);

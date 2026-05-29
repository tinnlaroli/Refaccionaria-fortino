import type { ReactNode } from "react";

export type IconName =
  | "home"
  | "box"
  | "grid"
  | "layers"
  | "history"
  | "users"
  | "receipt"
  | "pos"
  | "chevron"
  | "alert"
  | "plus"
  | "arrow"
  | "chevron-left";

const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" />
    </>
  ),
  box: (
    <>
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
      <path d="m4 7 8 4 8-4M12 11v10" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3 4 8l8 5 8-5-8-5Z" />
      <path d="m4 12 8 5 8-5M4 16l8 5 8-5" />
    </>
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M4 19c0-2.5 2.2-4 5-4s5 1.5 5 4" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M15 19c.3-1.8 1.8-3 3.5-3 1.2 0 2.3.5 3 1.3" />
    </>
  ),
  receipt: (
    <>
      <path d="M7 4h10a1 1 0 0 1 1 1v14l-2-1.5L14 20l-2-1.5L10 20l-2-1.5L6 20V5a1 1 0 0 1 1-1Z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  pos: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M7 9h4M7 13h2" />
      <path d="M14 13h3" />
    </>
  ),
  chevron: <path d="m9 6 6 6-6 6" />,
  alert: (
    <>
      <path d="M12 4 3 19h18L12 4Z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
};

type Props = {
  name: IconName;
  size?: number;
  className?: string;
};

export function NavIcon({ name, size = 20, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

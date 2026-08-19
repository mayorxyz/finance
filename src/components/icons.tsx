import type { ReactNode } from "react";

const PATHS: Record<string, ReactNode> = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.2-3.2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronUp: <path d="M6 15l6-6 6 6" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  sortAsc: <path d="M12 19V5m0 0l-5 5m5-5l5 5" />,
  sortDesc: <path d="M12 5v14m0 0l-5-5m5 5l5-5" />,
  sortNeutral: <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />,
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  chartPulse: <path d="M4 19V5m0 14h16M7 15l3.5-4 2.5 2.5L17 8" />,
  listIcon: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 016.5 5h10A2.5 2.5 0 0119 7.5v9a2.5 2.5 0 01-2.5 2.5h-10A2.5 2.5 0 014 16.5v-9z" />
      <path d="M15 12.5h4v-3h-4a1.5 1.5 0 000 3z" />
    </>
  ),
  piggy: (
    <>
      <path d="M5.5 11.5a6 6 0 0111.6-1.6l2.4.6v3.4l-1.8.5a6 6 0 01-1.2 2.1v2h-2.4l-.6-1.2h-3l-.6 1.2H7.5v-2a6 6 0 01-2-4.5V13a2 2 0 010-1.5z" />
      <circle cx="15" cy="10.5" r="0.8" />
      <path d="M9.5 6.5c.7-.6 1.6-1 2.5-1" />
    </>
  ),
  trendLine: <path d="M4 16l4.5-5 3 3L20 6m0 0h-4.5M20 6v4.5" />,
  arrowUpRight: <path d="M7 17L17 7m0 0H9m8 0v8" />,
  arrowDownRight: <path d="M7 7l10 10m0 0V9m0 8H9" />,
  calendar: (
    <>
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M8 4v4M16 4v4M4 11h16" />
    </>
  ),
  tag: (
    <>
      <path d="M4 4h6.6a2 2 0 011.4.6l7.4 7.4a2 2 0 010 2.8l-4.6 4.6a2 2 0 01-2.8 0L4.6 12A2 2 0 014 10.6V4z" />
      <circle cx="8.5" cy="8.5" r="1" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: (
    <>
      <path d="M12 4L2.8 19.5h18.4L12 4z" />
      <path d="M12 10v4M12 16.8v.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 7.8v.01" />
    </>
  ),
  trash: <path d="M5 7h14M10 7V5h4v2m-8.5 0l.8 12h7.4l.8-12M10.5 11v6M13.5 11v6" />,
  refresh: <path d="M4.5 12a7.5 7.5 0 0112.8-5.3L20 9.5m0-5v5h-5m4.5 2.5a7.5 7.5 0 01-12.8 5.3L4 14.5m0 5v-5h5" />,
  download: <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" />,
  home: <path d="M4.5 10.5L12 4l7.5 6.5V19a1.5 1.5 0 01-1.5 1.5h-4V15h-4v5.5H6A1.5 1.5 0 014.5 19v-8.5z" />,
  cart: (
    <>
      <path d="M4 5h2.2l2 10.5h9.6l1.8-7.5H7" />
      <circle cx="9.5" cy="19" r="1.3" />
      <circle cx="16.5" cy="19" r="1.3" />
    </>
  ),
  cup: <path d="M5 8h11v6a5 5 0 01-5 5H10a5 5 0 01-5-5V8zm11 1.5h1.5a2.5 2.5 0 010 5H16M7 4.5v1M10.5 4v1.5M14 4.5v1" />,
  car: (
    <>
      <path d="M5 13l1.3-4.3A2 2 0 018.2 7h7.6a2 2 0 011.9 1.7L19 13m-14 0h14m-14 0a2 2 0 00-2 2v2.5h2.5M19 13a2 2 0 012 2v2.5h-2.5M6 17.5h12" />
      <circle cx="8" cy="15.5" r="0.8" />
      <circle cx="16" cy="15.5" r="0.8" />
    </>
  ),
  bolt: <path d="M13 3L5 13.5h5L10.5 21 19 10.5h-5.5L13 3z" />,
  ticket: (
    <>
      <path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v1.5a2.5 2.5 0 000 5V16a2 2 0 01-2 2H6a2 2 0 01-2-2v-1.5a2.5 2.5 0 000-5V8z" />
      <path d="M13.5 6v12" strokeDasharray="2.4 2.4" />
    </>
  ),
  bag: (
    <>
      <path d="M5.5 8h13l-.9 11a1.8 1.8 0 01-1.8 1.6H8.2a1.8 1.8 0 01-1.8-1.6L5.5 8z" />
      <path d="M9 10V6.8a3 3 0 016 0V10" />
    </>
  ),
  pulse: <path d="M3.5 12h4l2-5 3.5 10 2.5-5h5" />,
  arrowDown: <path d="M12 5v14m0 0l-5-5m5 5l5-5" />,
  coins: (
    <>
      <ellipse cx="12" cy="7" rx="7" ry="3" />
      <path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7" />
      <path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
    </>
  ),
};

export function Icon({
  name,
  className = "w-5 h-5",
  strokeWidth = 1.8,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name] ?? PATHS.info}
    </svg>
  );
}

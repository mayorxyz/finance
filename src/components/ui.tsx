import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAppDispatch, useAppSelector, dismissToast } from "../redux/store";
import type { Category, Toast } from "../types";
import { cx, fmtPct, prefersReducedMotion } from "../utils/format";
import { Icon } from "./icons";

/* ---------- number count-up ---------- */

export function useCountUp(value: number, duration = 950): number {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      prevRef.current = value;
      setDisplay(value);
      return;
    }
    const from = prevRef.current;
    if (from === value) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      prevRef.current = value;
    };
  }, [value, duration]);

  return display;
}

/* ---------- scroll reveal ---------- */

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cx(className, !seen ? "opacity-0" : "anim-enter")}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------- small display atoms ---------- */

export function TrendPill({ pct, className }: { pct: number; className?: string }) {
  const up = pct >= 0;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-semibold tabular-nums",
        up ? "bg-gain-soft text-gain" : "bg-loss-soft text-loss",
        className,
      )}
    >
      <Icon
        name={up ? "arrowUpRight" : "arrowDownRight"}
        className="w-3.5 h-3.5"
        strokeWidth={2.2}
      />
      {fmtPct(pct)}
    </span>
  );
}

export function Sparkline({
  data,
  color,
  className,
}: {
  data: number[];
  color: string;
  className?: string;
}) {
  const w = 96;
  const h = 32;
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => [
    pad + (i * (w - pad * 2)) / (data.length - 1),
    pad + (h - pad * 2) * (1 - (v - min) / (max - min || 1)),
  ]);
  const line = pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");
  const area = `M${pts[0][0]},${h} L${pts
    .map((p) => p.map((n) => n.toFixed(1)).join(","))
    .join(" L")} L${pts[pts.length - 1][0]},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none" aria-hidden="true">
      <path d={area} fill={color} opacity={0.12} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CategoryBadge({ category }: { category?: Category }) {
  if (!category) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        backgroundColor: `${category.color}14`,
        color: `color-mix(in srgb, ${category.color} 76%, #1A1F36)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </span>
  );
}

export function StatusPill({ status }: { status: "completed" | "pending" }) {
  const pending = status === "pending";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        pending ? "bg-gold-100 text-gold-700" : "bg-canvas text-soft",
      )}
    >
      <span
        className={cx(
          "h-1.5 w-1.5 rounded-full",
          pending ? "bg-gold-500" : "bg-gain",
        )}
      />
      {pending ? "Pending" : "Completed"}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-lg", className)} aria-hidden="true" />;
}

/* ---------- empty state ---------- */

export function EmptyState({
  title,
  hint,
  actionLabel,
  onAction,
}: {
  title: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon name="search" className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-soft">{hint}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ---------- toasts ---------- */

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const id = window.setTimeout(() => dispatch(dismissToast(toast.id)), 4200);
    return () => window.clearTimeout(id);
  }, [toast.id, dispatch]);

  const icon =
    toast.kind === "success" ? "check" : toast.kind === "error" ? "alert" : "info";
  const chip =
    toast.kind === "success"
      ? "bg-gain/15 text-gain"
      : toast.kind === "error"
        ? "bg-loss/15 text-loss"
        : "bg-gold-500/20 text-gold-500";

  return (
    <div
      className="pointer-events-auto flex items-center gap-3 rounded-xl bg-ink px-4 py-3 text-white shadow-lg"
      style={{ animation: "toast-in 0.3s cubic-bezier(0.22,1,0.36,1) both" }}
    >
      <span className={cx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", chip)}>
        <Icon name={icon} className="h-4 w-4" strokeWidth={2.2} />
      </span>
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dispatch(dismissToast(toast.id))}
        className="rounded-md p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <Icon name="close" className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}

export function ToastHost() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(92vw,370px)] flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

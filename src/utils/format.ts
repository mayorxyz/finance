import { format, parseISO } from "date-fns";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function fmtCurrency(n: number): string {
  return usd.format(n);
}

export function fmtCurrencyWhole(n: number): string {
  return usdWhole.format(n);
}

export function fmtCompact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function fmtSigned(type: "income" | "expense", amount: number): string {
  return type === "income" ? `+${usd.format(amount)}` : `\u2212${usd.format(amount)}`;
}

export function fmtPct(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function fmtDate(iso: string): string {
  return format(parseISO(iso), "MMM d");
}

export function fmtDateLong(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy");
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** Deterministic PRNG so demo data is stable across reloads. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

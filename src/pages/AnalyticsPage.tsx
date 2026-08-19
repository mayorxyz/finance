import { Suspense, lazy, useMemo } from "react";
import { useAppSelector } from "../redux/store";
import { cx, fmtCompact, fmtCurrencyWhole } from "../utils/format";
import { Icon } from "../components/icons";
import { Reveal, Skeleton } from "../components/ui";

const ChartsSection = lazy(() => import("../components/ChartsSection"));

function ChartsFallback() {
  return (
    <section aria-label="Analytics loading" className="grid gap-5 lg:grid-cols-2 lg:gap-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-2 h-3 w-1/4" />
          <Skeleton className="mt-5 h-[190px] w-full rounded-lg" />
        </div>
      ))}
    </section>
  );
}

interface Kpi {
  label: string;
  value: string;
  note: string;
  icon: string;
  tone: "brand" | "gain" | "loss" | "gold";
}

const TONES: Record<Kpi["tone"], string> = {
  brand: "bg-brand-50 text-brand-600",
  gain: "bg-gain-soft text-gain",
  loss: "bg-loss-soft text-loss",
  gold: "bg-gold-100 text-gold-700",
};

export default function AnalyticsPage() {
  const series = useAppSelector((s) => s.charts.data);

  const kpis = useMemo<Kpi[]>(() => {
    if (!series) return [];
    const { income, spending, netWorth } = series;
    const n = income.length || 1;
    const avgIncome = income.reduce((a, b) => a + b, 0) / n;
    const avgSpend = spending.reduce((a, b) => a + b, 0) / n;
    const rate = avgIncome > 0 ? ((avgIncome - avgSpend) / avgIncome) * 100 : 0;
    const assets = netWorth.assets;
    const liabs = netWorth.liabilities;
    const now = assets[assets.length - 1] - liabs[liabs.length - 1];
    const prev = assets[assets.length - 2] - liabs[liabs.length - 2];
    const delta = now - prev;
    return [
      {
        label: "Avg monthly income",
        value: fmtCurrencyWhole(avgIncome),
        note: `last ${n} months`,
        icon: "arrowDown",
        tone: "gain",
      },
      {
        label: "Avg monthly spend",
        value: fmtCurrencyWhole(avgSpend),
        note: `across 8 categories`,
        icon: "arrowUpRight",
        tone: "loss",
      },
      {
        label: "Savings rate",
        value: `${rate.toFixed(1)}%`,
        note: rate >= 20 ? "above the 20% benchmark" : "below the 20% benchmark",
        icon: "piggy",
        tone: rate >= 20 ? "brand" : "gold",
      },
      {
        label: "Net worth",
        value: fmtCompact(now),
        note: `${delta >= 0 ? "+" : "−"}${fmtCompact(Math.abs(delta))} this month`,
        icon: "trendLine",
        tone: delta >= 0 ? "gain" : "loss",
      },
    ];
  }, [series]);

  return (
    <div className="space-y-8">
      <Reveal>
        <header>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
            Performance
          </p>
          <h1 className="mt-1 text-[22px] font-extrabold tracking-tight text-ink md:text-2xl">
            Analytics
          </h1>
          <p className="mt-1 max-w-xl text-sm text-soft">
            Twelve months of cash flow, category allocation and portfolio growth — hover any
            chart for exact figures.
          </p>
        </header>
      </Reveal>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-line bg-surface p-4 shadow-sm">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="mt-3 h-6 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            ))
          : kpis.map((k, i) => (
              <Reveal key={k.label} delay={i * 70}>
                <div className="group h-full rounded-xl border border-line bg-surface p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-soft">
                      {k.label}
                    </p>
                    <span
                      className={cx(
                        "flex h-7 w-7 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
                        TONES[k.tone],
                      )}
                    >
                      <Icon name={k.icon} className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-[19px] font-bold leading-none tabular-nums text-ink md:text-[21px]">
                    {k.value}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-soft">{k.note}</p>
                </div>
              </Reveal>
            ))}
      </div>

      <Suspense fallback={<ChartsFallback />}>
        <ChartsSection />
      </Suspense>
    </div>
  );
}

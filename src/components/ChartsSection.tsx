import { memo, useMemo, type ReactNode } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
  type ScriptableContext,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useAppSelector } from "../redux/store";
import { cx, fmtCompact, fmtCurrency, fmtCurrencyWhole, prefersReducedMotion, todayISO } from "../utils/format";
import { Reveal, Skeleton } from "./ui";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip);
ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.font.size = 11;
ChartJS.defaults.color = "#6B7280";
if (prefersReducedMotion()) {
  ChartJS.defaults.animation = false;
}

const TOOLTIP = {
  backgroundColor: "#1A1F36",
  titleColor: "#F8FAFB",
  bodyColor: "#F8FAFB",
  bodyFont: { family: "'IBM Plex Mono', monospace", size: 12 },
  padding: 10,
  cornerRadius: 8,
  displayColors: true,
  boxWidth: 8,
  boxHeight: 8,
  boxPadding: 3,
};

const AXIS_GRID = { color: "rgba(229,231,235,0.8)" };

function ChartCard({
  title,
  caption,
  chip,
  chipTone = "neutral",
  children,
  delay = 0,
}: {
  title: string;
  caption: string;
  chip: string;
  chipTone?: "gain" | "loss" | "neutral" | "gold";
  children: ReactNode;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="flex h-full flex-col rounded-xl border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold tracking-tight text-ink">{title}</h3>
            <p className="mt-0.5 text-xs text-soft">{caption}</p>
          </div>
          <span
            className={cx(
              "shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums",
              chipTone === "gain" && "bg-gain-soft text-gain",
              chipTone === "loss" && "bg-loss-soft text-loss",
              chipTone === "gold" && "bg-gold-100 text-gold-700",
              chipTone === "neutral" && "bg-canvas text-soft",
            )}
          >
            {chip}
          </span>
        </div>
        <div className="mt-4 min-h-0 flex-1">{children}</div>
      </div>
    </Reveal>
  );
}

/* ---------- 1 · Spending by category (doughnut) ---------- */

const SpendingDoughnut = memo(function SpendingDoughnut({
  labels,
  values,
  colors,
}: {
  labels: string[];
  values: number[];
  colors: string[];
}) {
  const total = values.reduce((a, b) => a + b, 0);
  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      tooltip: {
        ...TOOLTIP,
        callbacks: {
          label: (item) => {
            const v = item.parsed ?? 0;
            return ` ${fmtCurrency(v)} · ${total ? Math.round((v / total) * 100) : 0}%`;
          },
        },
      },
    },
  };
  return (
    <div className="flex h-full flex-col gap-4 md:flex-row md:items-center">
      <div className="relative h-[190px] flex-1 md:h-full">
        <Doughnut
          data={{ labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: "#fff", hoverOffset: 6 }] }}
          options={options}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-soft">This month</span>
          <span className="font-mono text-lg font-bold tabular-nums text-ink">{fmtCompact(total)}</span>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 md:w-[46%] md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
        {labels.map((label, i) => (
          <li key={label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[4px]" style={{ backgroundColor: colors[i] }} />
            <span className="min-w-0 flex-1 truncate font-medium text-ink">{label}</span>
            <span className="font-mono font-semibold tabular-nums text-soft">
              {total ? Math.round((values[i] / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});

/* ---------- 2 · Income vs spending (line, gradient fill) ---------- */

const CashFlowLine = memo(function CashFlowLine({
  months,
  income,
  spending,
}: {
  months: string[];
  income: number[];
  spending: number[];
}) {
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      tooltip: {
        ...TOOLTIP,
        callbacks: { label: (item) => ` ${item.dataset.label}: ${fmtCurrencyWhole(item.parsed.y ?? 0)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: {
        grid: AXIS_GRID,
        border: { display: false },
        ticks: { callback: (v) => fmtCompact(Number(v)), maxTicksLimit: 5 },
      },
    },
  };

  return (
    <div className="h-[210px] md:h-full">
      <Line
        options={options}
        data={{
          labels: months,
          datasets: [
            {
              label: "Income",
              data: income,
              borderColor: "#0D7E6E",
              borderWidth: 2.5,
              tension: 0.4,
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointBackgroundColor: "#0D7E6E",
              backgroundColor: (ctx: ScriptableContext<"line">) => {
                const { ctx: c, chartArea } = ctx.chart;
                if (!chartArea) return "rgba(13,126,110,0.12)";
                const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                g.addColorStop(0, "rgba(13,126,110,0.22)");
                g.addColorStop(1, "rgba(13,126,110,0)");
                return g;
              },
            },
            {
              label: "Spending",
              data: spending,
              borderColor: "#DC2626",
              borderDash: [5, 5],
              borderWidth: 1.8,
              tension: 0.4,
              fill: false,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointBackgroundColor: "#DC2626",
            },
          ],
        }}
      />
    </div>
  );
});

/* ---------- 3 · Investment returns (signed bars) ---------- */

const InvestmentBar = memo(function InvestmentBar({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        ...TOOLTIP,
        callbacks: {
          label: (item) => {
            const v = item.parsed.y ?? 0;
            return ` ${v > 0 ? "+" : ""}${v.toFixed(1)}% YTD`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: {
        grid: AXIS_GRID,
        border: { display: false },
        ticks: { callback: (v) => `${v}%`, maxTicksLimit: 5 },
      },
    },
  };
  return (
    <div className="h-[210px] md:h-full">
      <Bar
        options={options}
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: values.map((v) => (v >= 0 ? "rgba(5,150,105,0.85)" : "rgba(220,38,38,0.8)")),
              hoverBackgroundColor: values.map((v) => (v >= 0 ? "#059669" : "#DC2626")),
              borderRadius: 6,
              maxBarThickness: 38,
            },
          ],
        }}
      />
    </div>
  );
});

/* ---------- 4 · Net worth (area) ---------- */

const NetWorthArea = memo(function NetWorthArea({
  months,
  assets,
  liabilities,
}: {
  months: string[];
  assets: number[];
  liabilities: number[];
}) {
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      tooltip: {
        ...TOOLTIP,
        callbacks: { label: (item) => ` ${item.dataset.label}: ${fmtCurrencyWhole(item.parsed.y ?? 0)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: {
        grid: AXIS_GRID,
        border: { display: false },
        ticks: { callback: (v) => fmtCompact(Number(v)), maxTicksLimit: 5 },
      },
    },
  };
  return (
    <div className="h-[210px] md:h-full">
      <Line
        options={options}
        data={{
          labels: months,
          datasets: [
            {
              label: "Assets",
              data: assets,
              borderColor: "#0D7E6E",
              borderWidth: 2.5,
              tension: 0.35,
              fill: true,
              backgroundColor: "rgba(13,126,110,0.14)",
              pointRadius: 0,
              pointHoverRadius: 4,
              pointBackgroundColor: "#0D7E6E",
            },
            {
              label: "Liabilities",
              data: liabilities,
              borderColor: "#DC2626",
              borderDash: [4, 4],
              borderWidth: 1.8,
              tension: 0.35,
              fill: false,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointBackgroundColor: "#DC2626",
            },
          ],
        }}
      />
    </div>
  );
});

/* ---------- section ---------- */

export default function ChartsSection() {
  const series = useAppSelector((s) => s.charts.data);
  const transactions = useAppSelector((s) => s.transactions);
  const categories = useAppSelector((s) => s.categories);

  const donut = useMemo(() => {
    const monthKey = todayISO().slice(0, 7);
    const sums = new Map<string, number>();
    for (const id of transactions.allIds) {
      const tx = transactions.byId[id];
      if (!tx || tx.type !== "expense" || !tx.date.startsWith(monthKey)) continue;
      sums.set(tx.categoryId, (sums.get(tx.categoryId) ?? 0) + tx.amount);
    }
    const entries = [...sums.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    return {
      labels: entries.map(([id]) => categories.byId[id]?.name ?? "Other"),
      values: entries.map(([, v]) => Math.round(v)),
      colors: entries.map(([id]) => categories.byId[id]?.color ?? "#94A3B8"),
    };
  }, [transactions, categories]);

  if (!series) {
    return (
      <section id="analytics" aria-label="Analytics" className="scroll-mt-24">
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-2 h-3 w-1/4" />
              <Skeleton className="mt-5 h-[190px] w-full rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const avgIncome = series.income.reduce((a, b) => a + b, 0) / series.income.length;
  const avgReturn =
    series.investmentReturns.reduce((a, b) => a + b.value, 0) / series.investmentReturns.length;
  const last = series.netWorth.assets.length - 1;
  const netDelta =
    series.netWorth.assets[last] -
    series.netWorth.liabilities[last] -
    (series.netWorth.assets[0] - series.netWorth.liabilities[0]);

  return (
    <section id="analytics" aria-labelledby="analytics-title" className="scroll-mt-24">
      <Reveal className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="analytics-title" className="text-xl font-extrabold tracking-tight text-ink sm:text-[22px]">
            Cash flow &amp; performance
          </h2>
          <p className="mt-1 text-sm text-soft">Twelve-month view across accounts and portfolios.</p>
        </div>
        <p className="font-mono text-xs font-medium text-soft">
          {series.months[0]} — {series.months[last]}
        </p>
      </Reveal>

      <div className="mt-5 grid gap-5 lg:grid-cols-2 lg:gap-6">
        <div className="md:h-[320px]">
          <ChartCard
            title="Spending by category"
            caption="Current month, all accounts"
            chip={fmtCompact(donut.values.reduce((a, b) => a + b, 0))}
            chipTone="neutral"
            delay={0}
          >
            <SpendingDoughnut labels={donut.labels} values={donut.values} colors={donut.colors} />
          </ChartCard>
        </div>
        <div className="md:h-[320px]">
          <ChartCard
            title="Income vs spending"
            caption="Monthly totals, trailing 12 months"
            chip={`avg ${fmtCompact(avgIncome)}/mo`}
            chipTone="gain"
            delay={70}
          >
            <CashFlowLine months={series.months} income={series.income} spending={series.spending} />
          </ChartCard>
        </div>
        <div className="md:h-[320px]">
          <ChartCard
            title="Investment returns"
            caption="Year-to-date by asset class"
            chip={`${avgReturn > 0 ? "+" : ""}${avgReturn.toFixed(1)}% avg`}
            chipTone={avgReturn >= 0 ? "gain" : "loss"}
            delay={140}
          >
            <InvestmentBar
              labels={series.investmentReturns.map((r) => r.label)}
              values={series.investmentReturns.map((r) => r.value)}
            />
          </ChartCard>
        </div>
        <div className="md:h-[320px]">
          <ChartCard
            title="Net worth trajectory"
            caption="Assets against liabilities"
            chip={`${netDelta >= 0 ? "+" : "\u2212"}${fmtCompact(Math.abs(netDelta))}`}
            chipTone={netDelta >= 0 ? "gain" : "loss"}
            delay={210}
          >
            <NetWorthArea
              months={series.netWorth.months}
              assets={series.netWorth.assets}
              liabilities={series.netWorth.liabilities}
            />
          </ChartCard>
        </div>
      </div>
    </section>
  );
}

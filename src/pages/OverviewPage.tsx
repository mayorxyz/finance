import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../redux/store";
import type { Transaction } from "../types";
import { cx, fmtCurrency, fmtDate, fmtSigned } from "../utils/format";
import { Icon } from "../components/icons";
import { BalanceSection } from "../components/BalanceSection";
import { QuickAddForm, GoalsSnapshot, TopCategoriesWidget, WidgetCard } from "../components/widgets";
import { Reveal, Skeleton } from "../components/ui";

function RecentActivity() {
  const tx = useAppSelector((s) => s.transactions);
  const categories = useAppSelector((s) => s.categories);

  const recent = useMemo(
    () =>
      tx.allIds
        .map((id) => tx.byId[id])
        .filter((t): t is Transaction => Boolean(t))
        .slice(0, 6),
    [tx],
  );

  return (
    <Reveal>
      <section
        aria-labelledby="recent-title"
        className="rounded-xl border border-line bg-surface shadow-sm"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 id="recent-title" className="text-[15px] font-bold tracking-tight text-ink">
              Recent activity
            </h2>
            <p className="mt-0.5 text-xs text-soft">The latest six ledger entries</p>
          </div>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-brand-700 transition hover:border-brand-200 hover:bg-brand-50 active:scale-[0.98]"
          >
            View all
            <Icon name="chevronRight" className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Link>
        </header>

        {tx.isLoading ? (
          <ul className="divide-y divide-line px-5">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-3 py-3.5">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-4 w-16" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((t) => {
              const cat = categories.byId[t.categoryId];
              return (
                <li key={t.id}>
                  <Link
                    to="/transactions"
                    className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-canvas"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: `${cat?.color ?? "#6B7280"}14`,
                        color: `color-mix(in srgb, ${cat?.color ?? "#6B7280"} 76%, #1A1F36)`,
                      }}
                    >
                      <Icon name={cat?.icon ?? "tag"} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {t.description}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] text-soft">
                        {fmtDate(t.date)} · {cat?.name ?? "Other"}
                        {t.status === "pending" && (
                          <span className="ml-1.5 rounded-full bg-gold-100 px-1.5 py-px text-[10px] font-bold text-gold-700">
                            Pending
                          </span>
                        )}
                      </span>
                    </span>
                    <span
                      className={cx(
                        "font-mono text-sm font-semibold tabular-nums",
                        t.type === "income" ? "text-gain" : "text-ink",
                      )}
                    >
                      {fmtSigned(t.type, t.amount)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Reveal>
  );
}

export default function OverviewPage() {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start xl:gap-6">
      <div className="min-w-0 space-y-8">
        <BalanceSection />
        <RecentActivity />

        {/* widgets flow into the column below xl */}
        <div className="grid gap-5 md:grid-cols-2 xl:hidden">
          <GoalsSnapshot />
          <TopCategoriesWidget />
        </div>
      </div>

      {/* right widget rail — desktop */}
      <aside
        aria-label="Widgets"
        className="thin-scroll sticky top-[84px] hidden max-h-[calc(100vh-100px)] space-y-5 overflow-y-auto pb-2 xl:block"
      >
        <WidgetCard id="quick-add-rail" title="Quick add" caption="Logs straight into your ledger">
          <QuickAddForm />
        </WidgetCard>
        <GoalsSnapshot />
        <TopCategoriesWidget />
      </aside>
    </div>
  );
}
